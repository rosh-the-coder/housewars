# Games-First Points Report

Scope: gameplay points + non-challenge leaderboard behavior only.

## 1) Active Game Inventory and Scoring Inputs

Current active game payloads send `HOUSEWARS_GAME_OVER` with `metric_type` + `metric_value`.

| Game | Metric Type | Input Shape | GP Base Logic | CT Logic |
| --- | --- | --- | --- | --- |
| Speed Tap | `time_easy`, `time_medium`, `time_hard`, with optional `_fail` | Avg reaction time in ms | `resolveTimeMetricPoints()` cap by difficulty, lower ms = more points, fail penalty | Flat `ct_reward` |
| Memory Grid | `time` | Total run time in ms | Same time-based path in `resolveTimeMetricPoints()` (default cap) | Flat `ct_reward` |
| Math Blitz | `score` | Correct answers count | `min(floor(score/10), 500)` then difficulty multiplier | Flat `ct_reward` |
| Colour Reflex | `score` | Final score integer | `min(floor(score/10), 500)` then difficulty multiplier | Flat `ct_reward` |
| Tile Flood | `score` | Final score integer | `min(floor(score/10), 500)` then difficulty multiplier | Flat `ct_reward` |
| Word Scramble | `score` | Final score integer | `min(floor(score/10), 500)` then difficulty multiplier | Flat `ct_reward` |

Timed non-score fallback (for `is_scored = false`) remains:

- `basePoints = floor(durationSeconds / 60) * pts_per_minute`

## 2) GP/CT Formula (Runtime)

Session end flow in `app/api/sessions/end/route.ts`:

1. Resolve `basePoints` in `lib/points.ts`
2. Resolve GP with multiplier:
   - `gp_earned = round(max(0, basePoints) * max(0, difficulty_multiplier))`
3. Resolve CT:
   - `ct_earned = round(max(0, ct_reward))`
4. Persist session end values, then atomically increment:
   - profile GP/CT via `increment_profile_points`
   - house GP via `increment_house_points`

## 3) Data Write Pipeline Integrity (Games Only)

Confirmed write path after this implementation:

- `game_sessions`: ended row stores `duration_seconds`, `raw_score`, `gp_earned`, `ct_earned`
- `profiles`: `gp_weekly`, `gp_alltime`, `challenge_tokens` incremented atomically
- `houses`: `gp_weekly`, `gp_alltime` incremented atomically
- `game_results`: now inserted per ended session with `gp_earned`, `ct_earned`, and per-game placement snapshot (`rank`, `total_players`)

## 4) Non-Challenge Leaderboard Semantics

### Alignment decisions implemented

- Session result modal rank now defaults to **weekly player rank**, with all-time rank shown as secondary context.
- Session end payload now includes:
  - `weekly_rank`, `weekly_total_players`
  - `alltime_rank`, `alltime_total_players`
  - `rank`/`total_players` kept for compatibility and mapped to weekly values.
- Game detail sidebar house leaderboard now uses **weekly GP** label + values (instead of mismatched all-time values under ambiguous label).

## 5) Defects Fixed (Priority)

1. High - Session rank semantics mismatch:
   - Result modal implied one rank context while weekly totals were shown.
   - Fixed by explicit weekly primary rank + all-time secondary rank.
2. High - Missing games-only result persistence:
   - `game_results` was not written in session end flow.
   - Fixed by inserting per-ended-session summary row.
3. Medium - Mock/test game behavior leaked into active lobby ordering:
   - Games list had dedicated test embed URL prioritization.
   - Fixed by removing test-game sorting special case.
4. Medium - Inconsistent house ranking context in game detail page:
   - Label/value context implied current flow but used all-time totals.
   - Fixed to weekly GP label + weekly data.

## 6) Minimal Forward Fix Sequence (Challenges Deferred)

1. Keep scoring deterministic by documenting valid `metric_type` values for every active game.
2. Backfill/repair historical `game_results` if analytics history is required (not needed for runtime correctness).
3. Add optional DB cleanup script to hard-delete known mock game rows (`Tsunami Brainrots Online`) and dependent sessions/results in production data.
