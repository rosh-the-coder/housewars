export type Profile = {
  id: string;
  username: string | null;
  house_id: string | null;
  gp_weekly: number;
  gp_alltime: number;
  challenge_tokens: number;
  total_games_played: number;
  top10_finishes: number;
  weekly_wins: number;
  highest_single_score: number;
};

export type House = {
  id: string;
  name: string;
  color: string | null;
  hex_code: string | null;
  gp_weekly: number;
  gp_alltime: number;
};

export type Game = {
  id: string;
  name: string;
  thumbnail_url: string | null;
  embed_url: string;
  type: string;
  difficulty: string;
  difficulty_multiplier: number;
  ct_reward: number;
  is_scored: boolean;
  is_active: boolean;
};

export type GameSession = {
  id: string;
  user_id: string;
  game_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  raw_score: number | null;
  gp_earned: number | null;
  ct_earned: number | null;
};

export type Challenge = {
  id: string;
  creator_id: string;
  game_id: string;
  title: string;
  type: string;
  ct_entry_cost: number;
  ct_pool: number;
  gp_reward: number;
  min_participants: number;
  status: string;
  starts_at: string;
  ends_at: string;
  winner_id: string | null;
};

export type ChallengeEntry = {
  id: string;
  challenge_id: string;
  user_id: string;
  house_id: string;
  best_score: number;
  attempts: number;
  gp_awarded: number;
  rank: number | null;
};

export type CTTransaction = {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  reference_id: string | null;
  description: string | null;
  created_at: string;
};
