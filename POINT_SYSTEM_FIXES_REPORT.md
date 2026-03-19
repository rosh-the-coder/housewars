# HouseWars Point System Fixes Report

This report documents all the fixes made to the HouseWars point system.
Code changes have already been applied. **SQL changes listed below must be run
in the Supabase SQL Editor in order.**

---

## SQL Changes Required (Run in Supabase SQL Editor)

Run these in the exact order below. Each section corresponds to a code fix.

### 1. Add `pts_per_minute` column to `games` table

**Why:** `ct_reward` was being used both as the flat CT token reward AND as
the points-per-minute value for timed game GP calculation. These are two
different concepts. A new dedicated column separates them.

```sql
-- Fault 1: Separate ct_reward from pts_per_minute
ALTER TABLE games
ADD COLUMN IF NOT EXISTS pts_per_minute integer NOT NULL DEFAULT 0;

-- Set pts_per_minute for any existing timed games that were using ct_reward
-- for this purpose. Adjust values as needed for your games.
-- Example: UPDATE games SET pts_per_minute = 10 WHERE type = 'timed';
```

### 2. Create `increment_profile_points` RPC function

**Why:** The old code used a read-then-write pattern to update profile points.
If two game sessions ended at the same time, one update would be lost. This
RPC uses atomic `SET col = col + value` to prevent race conditions.

```sql
-- Fault 7: Atomic profile point increments
CREATE OR REPLACE FUNCTION increment_profile_points(
  p_user_id uuid,
  p_gp integer,
  p_ct integer
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE profiles
  SET gp_weekly = gp_weekly + p_gp,
      gp_alltime = gp_alltime + p_gp,
      challenge_tokens = challenge_tokens + p_ct
  WHERE id = p_user_id;
$$;
```

### 3. Create `increment_house_points` RPC function

**Why:** Same race condition issue as profiles. House GP totals need atomic
increments too.

```sql
-- Fault 7: Atomic house point increments
CREATE OR REPLACE FUNCTION increment_house_points(
  p_house_id uuid,
  p_gp integer
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE houses
  SET gp_weekly = gp_weekly + p_gp,
      gp_alltime = gp_alltime + p_gp
  WHERE id = p_house_id;
$$;
```

### 4. Create `increment_challenge_pool` RPC function

**Why:** The challenge join flow also had a read-then-write race condition
when adding CT to the challenge pool. This RPC does it atomically.

```sql
-- Fault 7: Atomic challenge pool increment
CREATE OR REPLACE FUNCTION increment_challenge_pool(
  p_challenge_id uuid,
  p_amount integer
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE challenges
  SET ct_pool = ct_pool + p_amount
  WHERE id = p_challenge_id;
$$;
```

### 5. Add weekly GP reset cron job

**Why:** `gp_weekly` exists on both `profiles` and `houses` but there was no
mechanism to reset it. Without this, "weekly" totals accumulate forever and
become identical to all-time totals.

**Prerequisites:** `pg_cron` and `pg_net` extensions must be enabled (they
likely already are since `schedule-resolve-challenges.sql` uses them).

```sql
-- Fault 13: Weekly GP reset every Monday at 00:00 UTC
SELECT cron.schedule(
  'reset-weekly-gp',
  '0 0 * * 1',  -- Every Monday at midnight UTC
  $$
    UPDATE profiles SET gp_weekly = 0;
    UPDATE houses SET gp_weekly = 0;
  $$
);
```

### 6. Reset all points for testing (optional)

**Why:** If you want a clean slate to test the new point system.

```sql
-- Optional: Reset all points for testing
UPDATE profiles SET gp_weekly = 0, gp_alltime = 0, challenge_tokens = 0;
UPDATE houses SET gp_weekly = 0, gp_alltime = 0;
DELETE FROM game_sessions;
DELETE FROM challenge_entries;
DELETE FROM challenges;
DELETE FROM ct_transactions;
DELETE FROM game_results;
```

---

## Code Changes Summary

All code changes are already applied in the codebase. Here's what was changed
and why:

### Fix 1 — Separate `ct_reward` from `pts_per_minute` (HIGH)

**Problem:** `game.ct_reward` was passed as `ptsPerMinute` to `resolveBasePoints`,
meaning the flat CT token reward was also controlling GP calculation for timed
games.

**Files changed:**
- `lib/database.types.ts` — added `pts_per_minute` to games Row/Insert/Update
- `lib/types.ts` — added `pts_per_minute` to Game type
- `app/api/sessions/end/route.ts` — selects `pts_per_minute`, uses it for
  `ptsPerMinute` param instead of `ct_reward`
- `lib/speed-tap.ts` — sets `pts_per_minute: 0` in insert/update
- `app/games/[slug]/page.tsx` — updated type and select query

### Fix 4 — Challenge scores use GP instead of raw metric (HIGH)

**Problem:** `GameEmbed` submitted the raw `metricValue` (e.g. reaction time
in ms) as the challenge score, but challenges rank by `best_score DESC`
(higher = better). For time-based games lower is better, so rankings were
backwards.

**Files changed:**
- `components/game-embed.tsx` — now submits `payload.gp_earned` as the
  challenge score instead of raw `metricValue`. Also fixed `placementPoints`
  display in the result modal.

### Fix 7 — Atomic point increments (HIGH)

**Problem:** Read-then-write pattern on profile/house updates caused lost
updates when two sessions ended simultaneously.

**Files changed:**
- `app/api/sessions/end/route.ts` — replaced read+write with
  `increment_profile_points` and `increment_house_points` RPCs
- `app/api/challenges/join/route.ts` — replaced read+write with
  `increment_profile_points` (negative CT) and `increment_challenge_pool` RPCs

### Fix 3 — Best score display uses GP consistently (MEDIUM)

**Problem:** Game page "YOUR BEST SCORE" used `ct_earned ?? gp_earned` for
Speed Tap (always showing 25, the flat CT reward) and `raw_score` for other
games. Inconsistent and wrong.

**Files changed:**
- `app/games/[slug]/page.tsx` — now always uses `gp_earned` for best score
  display. Label changed to "YOUR BEST GP".

### Fix 11 — Result modal shows actual weekly total and CT balance (MEDIUM)

**Problem:** The result modal displayed `weeklyGpTotal` and `ctBalance` but
the API never returned them, so they always showed 0.

**Files changed:**
- `app/api/sessions/end/route.ts` — now returns `weekly_gp_total`,
  `ct_balance`, and `total_players` in the response after the atomic updates.

### Fix 13 — Weekly GP reset (MEDIUM)

**Problem:** No mechanism to reset `gp_weekly` back to 0. Weekly totals
accumulated forever.

**Files changed:** None (SQL-only — see section 5 above).

### Fix 12 — Leaderboard metric toggle works for houses too (MEDIUM)

**Problem:** House ranking always sorted by `gp_weekly` even when "ALL-TIME"
was selected. The HOUSES/PLAYERS tabs were static buttons that did nothing.

**Files changed:**
- `app/leaderboard/page.tsx` — houses now sort by the selected metric column.
  Bar widths and GP highlight colors reflect the active metric. Replaced
  static HOUSES/PLAYERS buttons with the WEEKLY/ALL-TIME toggle links. Removed
  duplicate toggle from the player section.

### Fix 5 — Challenge GP reward capped at 10x entry cost (LOW)

**Problem:** Challenge creators could set arbitrary GP rewards (e.g. 1000 GP
for 5 CT entry), breaking the economy.

**Files changed:**
- `app/api/challenges/create/route.ts` — `gpReward` capped to
  `ctEntryCost * 10`
- `components/challenges-page-client.tsx` — shows cap info in create modal,
  enforces max on the input

### Fix 6 — Challenge creator auto-joins (LOW)

**Problem:** The creator paid CT to create a challenge but wasn't automatically
entered as a participant. They'd have to join separately (potentially paying
again).

**Files changed:**
- `app/api/challenges/create/route.ts` — after the `create_challenge` RPC,
  automatically inserts a `challenge_entries` row for the creator

### Fix 8 — `resolveCpFromBase` now used (LOW)

**Problem:** The function existed in `lib/points.ts` but was never called. The
session end route did the same calculation inline.

**Files changed:**
- `app/api/sessions/end/route.ts` — now uses `resolveCpFromBase(basePoints,
  multiplier)` instead of inline `Math.max(0, Math.round(basePoints *
  multiplier))`

### Fix 9 — Game page house leaderboard uses `houses` table (LOW)

**Problem:** The game page manually aggregated GP from all game sessions to
build a per-game house leaderboard. This was expensive and produced numbers
inconsistent with the official `houses` table totals.

**Files changed:**
- `app/games/[slug]/page.tsx` — replaced session aggregation with a simple
  query: `SELECT ... FROM houses ORDER BY gp_alltime DESC LIMIT 4`

### Fix 10 — Removed fake "House Bonus" UI text (LOW)

**Problem:** The game page showed "HOUSE BONUS ACTIVE — TOP 10% EARNS DOUBLE"
but no backend logic existed to implement this. It was misleading.

**Files changed:**
- `app/games/[slug]/page.tsx` — removed the house bonus section

### Fix 2 — `rawScore` stores actual metric value (LOW)

**Problem:** For time-metric games, `rawScore` was set to `pointsFromMetric *
10` — an artificial number designed to round-trip through `rawScore / 10`.
The actual metric value (reaction time) was lost.

**Files changed:**
- `lib/points.ts` — `rawScore` now stores `Math.round(metricNum)` (the actual
  metric value) for all metric types, including time-based games
