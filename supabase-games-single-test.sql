-- Activate one known-working GameDistribution game for testing.
-- Run in Supabase SQL editor.

begin;

-- Keep existing records, but disable them so only one card appears in /games.
update games
set is_active = false
where is_active = true;

-- Insert the test game (or update if already present by embed_url).
-- If your table has no unique constraint on embed_url, this still avoids duplicates.
delete from games
where embed_url = 'https://html5.gamedistribution.com/305d2a5605784aaf8587ffefc765e5cf/';

insert into games (
  name,
  thumbnail_url,
  embed_url,
  source,
  type,
  pts_per_minute,
  is_scored,
  is_active
) values (
  'Tsunami Brainrots Online',
  'https://img.gamedistribution.com/305d2a5605784aaf8587ffefc765e5cf-512x512.jpg',
  'https://html5.gamedistribution.com/305d2a5605784aaf8587ffefc765e5cf/',
  'gamedistribution',
  'timed',
  10,
  false,
  true
);

commit;
