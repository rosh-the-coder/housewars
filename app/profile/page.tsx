import { redirect } from "next/navigation";
import { ProfileView } from "@/components/profile-view";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  username: string | null;
  gp_alltime: number | null;
  gp_weekly: number | null;
  challenge_tokens: number | null;
  total_games_played: number | null;
  top10_finishes: number | null;
  weekly_wins: number | null;
  house:
    | {
        name: string | null;
        hex_code: string | null;
      }[]
    | {
        name: string | null;
        hex_code: string | null;
      }
    | null;
};

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Please log in first");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id,username,gp_alltime,gp_weekly,challenge_tokens,total_games_played,top10_finishes,weekly_wins,house:houses(name,hex_code)",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/signup?error=Complete signup to create your profile");
  }

  const [winsCountResult, recentResultsResult, challengeHistoryResult, badgeRowsResult] =
    await Promise.all([
      supabase
        .from("challenge_entries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .eq("rank", 1),
      supabase
        .from("game_results")
        .select("id,rank,total_players,gp_earned,ct_earned,created_at,game:games(name)")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("challenge_entries")
        .select("id,rank,gp_awarded,challenge:challenges(title,ended_at,game:games(name))")
        .eq("user_id", profile.id)
        .order("id", { ascending: false })
        .limit(5),
      supabase
        .from("user_badges")
        .select("id,badge:badges(name)")
        .eq("user_id", profile.id),
    ]);

  const house = Array.isArray(profile.house) ? profile.house[0] : profile.house;
  const username = profile.username ?? user.email?.split("@")[0] ?? "player";

  const recentResults = (recentResultsResult.data ?? []).map((row: any) => {
    const parsed = row as {
      id?: string;
      rank?: number | null;
      total_players?: number | null;
      gp_earned?: number | null;
      ct_earned?: number | null;
      created_at?: string | null;
      game?: { name?: string | null } | { name?: string | null }[] | null;
    };
    const game = Array.isArray(parsed.game) ? parsed.game[0] : parsed.game;
    return {
      id: String(parsed.id ?? `${parsed.created_at ?? "0"}-${game?.name ?? "game"}`),
      game: (game?.name ?? "GAME").toUpperCase(),
      rank: parsed.rank ?? null,
      totalPlayers: parsed.total_players ?? null,
      gpEarned: Number(parsed.gp_earned ?? 0),
      ctEarned: Number(parsed.ct_earned ?? 0),
      date: parsed.created_at ? new Date(parsed.created_at).toISOString().slice(0, 10) : "--",
    };
  });

  const challengeHistory = (challengeHistoryResult.data ?? []).map((row: any) => {
    const parsed = row as {
      id?: string;
      rank?: number | null;
      gp_awarded?: number | null;
      challenge?:
        | {
            title?: string | null;
            ended_at?: string | null;
            game?: { name?: string | null } | { name?: string | null }[] | null;
          }
        | {
            title?: string | null;
            ended_at?: string | null;
            game?: { name?: string | null } | { name?: string | null }[] | null;
          }[]
        | null;
    };
    const challenge = Array.isArray(parsed.challenge) ? parsed.challenge[0] : parsed.challenge;
    const game = Array.isArray(challenge?.game) ? challenge?.game[0] : challenge?.game;
    return {
      id: String(parsed.id ?? `${challenge?.ended_at ?? "0"}-${challenge?.title ?? "challenge"}`),
      title: (challenge?.title ?? "Challenge").toUpperCase(),
      game: (game?.name ?? "GAME").toUpperCase(),
      rank: parsed.rank ?? null,
      gpDelta: Number(parsed.gp_awarded ?? 0),
      date: challenge?.ended_at ? new Date(challenge.ended_at).toISOString().slice(0, 10) : "--",
    };
  });

  const badges = (badgeRowsResult.data ?? []).map((row: any) => {
    const parsed = row as {
      badge?: { name?: string | null } | { name?: string | null }[] | null;
    };
    const badge = Array.isArray(parsed.badge) ? parsed.badge[0] : parsed.badge;
    return String(badge?.name ?? "").trim();
  }).filter(Boolean);

  return (
    <ProfileView
      username={username}
      houseName={house?.name ?? "House"}
      houseHex={house?.hex_code ?? "#DC2626"}
      editable
      primaryStats={[
        { label: "ALL-TIME GP", value: Number(profile.gp_alltime ?? 0).toLocaleString(), color: "#FFD700" },
        { label: "WEEKLY GP", value: Number(profile.gp_weekly ?? 0).toLocaleString(), color: "#FFD700" },
        { label: "CT BALANCE", value: Number(profile.challenge_tokens ?? 0).toLocaleString(), color: "#00D4AA" },
        { label: "GAMES PLAYED", value: Number(profile.total_games_played ?? 0).toLocaleString() },
      ]}
      secondaryStats={[
        { label: "TOP 10 FINISHES", value: Number(profile.top10_finishes ?? 0).toLocaleString() },
        { label: "WEEKLY WINS", value: Number(profile.weekly_wins ?? 0).toLocaleString() },
        { label: "CHALLENGES WON", value: Number(winsCountResult.count ?? 0).toLocaleString() },
      ]}
      recentResults={recentResults}
      challengeHistory={challengeHistory}
      badges={badges}
    />
  );
}
