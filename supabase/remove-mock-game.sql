-- Hard-delete mock game: "Tsunami Brainrots Online"
-- Safe to run multiple times.

DO $$
DECLARE
  target_game_ids uuid[];
BEGIN
  SELECT coalesce(array_agg(id), '{}')
  INTO target_game_ids
  FROM games
  WHERE lower(name) IN (
    'tsunami brainrots online',
    'brainrots tsunami online'
  );

  IF array_length(target_game_ids, 1) IS NULL THEN
    RAISE NOTICE 'No mock game rows found.';
    RETURN;
  END IF;

  DELETE FROM challenge_entries
  WHERE challenge_id IN (
    SELECT id FROM challenges WHERE game_id = ANY(target_game_ids)
  );

  DELETE FROM challenges
  WHERE game_id = ANY(target_game_ids);

  DELETE FROM game_results
  WHERE game_id = ANY(target_game_ids);

  DELETE FROM game_sessions
  WHERE game_id = ANY(target_game_ids);

  DELETE FROM games
  WHERE id = ANY(target_game_ids);

  RAISE NOTICE 'Mock game and dependent rows removed.';
END $$;
