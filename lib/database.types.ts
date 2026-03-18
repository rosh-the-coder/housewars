export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
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
        Insert: {
          id: string;
          username?: string | null;
          house_id?: string | null;
          gp_weekly?: number;
          gp_alltime?: number;
          challenge_tokens?: number;
          total_games_played?: number;
          top10_finishes?: number;
          weekly_wins?: number;
          highest_single_score?: number;
        };
        Update: {
          id?: string;
          username?: string | null;
          house_id?: string | null;
          gp_weekly?: number;
          gp_alltime?: number;
          challenge_tokens?: number;
          total_games_played?: number;
          top10_finishes?: number;
          weekly_wins?: number;
          highest_single_score?: number;
        };
      };
      houses: {
        Row: {
          id: string;
          name: string;
          color: string | null;
          hex_code: string | null;
          gp_weekly: number;
          gp_alltime: number;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string | null;
          hex_code?: string | null;
          gp_weekly?: number;
          gp_alltime?: number;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string | null;
          hex_code?: string | null;
          gp_weekly?: number;
          gp_alltime?: number;
        };
      };
      games: {
        Row: {
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
        Insert: {
          id?: string;
          name: string;
          thumbnail_url?: string | null;
          embed_url: string;
          type: string;
          difficulty?: string;
          difficulty_multiplier?: number;
          ct_reward?: number;
          is_scored?: boolean;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          thumbnail_url?: string | null;
          embed_url?: string;
          type?: string;
          difficulty?: string;
          difficulty_multiplier?: number;
          ct_reward?: number;
          is_scored?: boolean;
          is_active?: boolean;
        };
      };
      game_sessions: {
        Row: {
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
        Insert: {
          id?: string;
          user_id: string;
          game_id: string;
          started_at?: string;
          ended_at?: string | null;
          duration_seconds?: number | null;
          raw_score?: number | null;
          gp_earned?: number | null;
          ct_earned?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_id?: string;
          started_at?: string;
          ended_at?: string | null;
          duration_seconds?: number | null;
          raw_score?: number | null;
          gp_earned?: number | null;
          ct_earned?: number | null;
        };
      };
      challenges: {
        Row: {
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
        Insert: {
          id?: string;
          creator_id: string;
          game_id: string;
          title: string;
          type: string;
          ct_entry_cost?: number;
          ct_pool?: number;
          gp_reward?: number;
          min_participants?: number;
          status?: string;
          starts_at: string;
          ends_at: string;
          winner_id?: string | null;
        };
        Update: {
          id?: string;
          creator_id?: string;
          game_id?: string;
          title?: string;
          type?: string;
          ct_entry_cost?: number;
          ct_pool?: number;
          gp_reward?: number;
          min_participants?: number;
          status?: string;
          starts_at?: string;
          ends_at?: string;
          winner_id?: string | null;
        };
      };
      challenge_entries: {
        Row: {
          id: string;
          challenge_id: string;
          user_id: string;
          house_id: string;
          best_score: number;
          attempts: number;
          gp_awarded: number;
          rank: number | null;
        };
        Insert: {
          id?: string;
          challenge_id: string;
          user_id: string;
          house_id: string;
          best_score?: number;
          attempts?: number;
          gp_awarded?: number;
          rank?: number | null;
        };
        Update: {
          id?: string;
          challenge_id?: string;
          user_id?: string;
          house_id?: string;
          best_score?: number;
          attempts?: number;
          gp_awarded?: number;
          rank?: number | null;
        };
      };
      game_results: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          rank: number | null;
          total_players: number | null;
          gp_earned: number;
          ct_earned: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_id: string;
          rank?: number | null;
          total_players?: number | null;
          gp_earned?: number;
          ct_earned?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_id?: string;
          rank?: number | null;
          total_players?: number | null;
          gp_earned?: number;
          ct_earned?: number;
          created_at?: string;
        };
      };
      badges: {
        Row: {
          id: string;
          name: string;
        };
        Insert: {
          id?: string;
          name: string;
        };
        Update: {
          id?: string;
          name?: string;
        };
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          badge_id?: string;
          created_at?: string;
        };
      };
      ct_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          type: string;
          reference_id: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          type: string;
          reference_id?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          type?: string;
          reference_id?: string | null;
          description?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
