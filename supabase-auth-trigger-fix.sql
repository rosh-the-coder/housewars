-- Run this in Supabase SQL Editor to fix:
-- "Database error saving new user"
--
-- Why this helps:
-- 1) Uses fully-qualified public schema references from auth trigger context
-- 2) Reads username/house_id from auth metadata when provided by signup form
-- 3) Handles username unique collisions safely

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.assign_house();

create or replace function public.assign_house()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_house_id uuid;
begin
  select h.id
    into v_house_id
  from public.houses h
  left join public.profiles p on p.house_id = h.id
  group by h.id
  order by count(p.id) asc, h.name asc
  limit 1;

  return v_house_id;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_house_id uuid;
  v_base_username text;
  v_username text;
  v_counter int := 0;
begin
  -- Prefer explicit house from signup metadata, fallback to balanced assignment.
  begin
    v_house_id := nullif(new.raw_user_meta_data ->> 'house_id', '')::uuid;
  exception
    when others then
      v_house_id := null;
  end;

  if v_house_id is null then
    v_house_id := public.assign_house();
  end if;

  -- Prefer explicit username from signup metadata.
  v_base_username := nullif(trim(new.raw_user_meta_data ->> 'username'), '');
  if v_base_username is null then
    v_base_username := split_part(new.email, '@', 1);
  end if;
  if v_base_username is null or v_base_username = '' then
    v_base_username := 'player';
  end if;

  -- Avoid unique collisions on profiles.username.
  loop
    if v_counter = 0 then
      v_username := v_base_username;
    else
      v_username := v_base_username || '_' || v_counter::text;
    end if;

    begin
      insert into public.profiles (id, username, house_id)
      values (new.id, v_username, v_house_id);
      exit;
    exception
      when unique_violation then
        v_counter := v_counter + 1;
        if v_counter > 10000 then
          raise exception 'Could not generate unique username for user %', new.id;
        end if;
    end;
  end loop;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
