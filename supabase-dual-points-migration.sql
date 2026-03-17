-- Dual points migration:
-- CP = house competitive points
-- CT = player individual points

alter table public.games
  add column if not exists difficulty_multiplier numeric(6,2) not null default 1.00;

alter table public.profiles
  add column if not exists ct_total integer not null default 0;

alter table public.houses
  add column if not exists cp_total integer not null default 0;

alter table public.game_sessions
  add column if not exists base_points integer,
  add column if not exists ct_earned integer,
  add column if not exists cp_earned integer,
  add column if not exists difficulty_multiplier_snapshot numeric(6,2);

-- Conservative backfill:
-- start CP/CT from legacy total_points and mirror existing sessions into CT.
update public.profiles
set ct_total = coalesce(total_points, 0)
where ct_total is distinct from coalesce(total_points, 0);

update public.houses
set cp_total = coalesce(total_points, 0)
where cp_total is distinct from coalesce(total_points, 0);

update public.game_sessions
set
  base_points = coalesce(base_points, points_earned, 0),
  ct_earned = coalesce(ct_earned, points_earned, 0),
  cp_earned = coalesce(cp_earned, points_earned, 0),
  difficulty_multiplier_snapshot = coalesce(difficulty_multiplier_snapshot, 1.00)
where
  base_points is null
  or ct_earned is null
  or cp_earned is null
  or difficulty_multiplier_snapshot is null;

drop function if exists public.award_dual_points(uuid, uuid, integer, numeric, integer, integer);
create or replace function public.award_dual_points(
  p_user_id uuid,
  p_house_id uuid,
  p_base_points integer,
  p_multiplier numeric,
  p_ct_points integer,
  p_cp_points integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ct integer := greatest(coalesce(p_ct_points, 0), 0);
  v_cp integer := greatest(coalesce(p_cp_points, 0), 0);
begin
  update public.profiles
  set
    ct_total = coalesce(ct_total, 0) + v_ct,
    total_points = coalesce(total_points, 0) + v_ct
  where id = p_user_id;

  if not found then
    raise exception 'Profile not found for user_id: %', p_user_id;
  end if;

  update public.houses
  set
    cp_total = coalesce(cp_total, 0) + v_cp,
    total_points = coalesce(total_points, 0) + v_cp
  where id = p_house_id;

  if not found then
    raise exception 'House not found for house_id: %', p_house_id;
  end if;
end;
$$;

-- Keep legacy app paths functional while migrating callers.
drop function if exists public.award_points(uuid, uuid, integer);
create or replace function public.award_points(
  p_user_id uuid,
  p_house_id uuid,
  p_points integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points integer := greatest(coalesce(p_points, 0), 0);
begin
  perform public.award_dual_points(
    p_user_id,
    p_house_id,
    v_points,
    1.00,
    v_points,
    v_points
  );
end;
$$;
