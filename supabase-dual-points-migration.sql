-- GP/CT schema alignment migration.
-- GP = gameplay score
-- CT = challenge tokens

alter table public.games
  add column if not exists difficulty text not null default 'medium',
  add column if not exists ct_reward integer not null default 0,
  add column if not exists difficulty_multiplier numeric(6,2) not null default 1.00;

alter table public.profiles
  add column if not exists gp_weekly integer not null default 0,
  add column if not exists gp_alltime integer not null default 0,
  add column if not exists challenge_tokens integer not null default 0,
  add column if not exists total_games_played integer not null default 0,
  add column if not exists top10_finishes integer not null default 0,
  add column if not exists weekly_wins integer not null default 0,
  add column if not exists highest_single_score integer not null default 0;

alter table public.houses
  add column if not exists color text,
  add column if not exists gp_weekly integer not null default 0,
  add column if not exists gp_alltime integer not null default 0;

alter table public.game_sessions
  add column if not exists gp_earned integer,
  add column if not exists ct_earned integer;

update public.game_sessions
set
  gp_earned = coalesce(gp_earned, 0),
  ct_earned = coalesce(ct_earned, 0)
where gp_earned is null or ct_earned is null;

create or replace function public.award_gp_and_ct(
  p_user_id uuid,
  p_house_id uuid,
  p_gp integer,
  p_ct integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_gp integer := greatest(coalesce(p_gp, 0), 0);
  v_ct integer := greatest(coalesce(p_ct, 0), 0);
begin
  update public.profiles
  set
    gp_weekly = coalesce(gp_weekly, 0) + v_gp,
    gp_alltime = coalesce(gp_alltime, 0) + v_gp,
    challenge_tokens = coalesce(challenge_tokens, 0) + v_ct
  where id = p_user_id;

  if not found then
    raise exception 'Profile not found for user_id: %', p_user_id;
  end if;

  update public.houses
  set
    gp_weekly = coalesce(gp_weekly, 0) + v_gp,
    gp_alltime = coalesce(gp_alltime, 0) + v_gp
  where id = p_house_id;

  if not found then
    raise exception 'House not found for house_id: %', p_house_id;
  end if;
end;
$$;
