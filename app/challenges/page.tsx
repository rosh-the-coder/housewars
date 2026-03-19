import { redirect } from "next/navigation";
import { ChallengesPageClient } from "@/components/challenges-page-client";
import { slugify } from "@/lib/slug";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  challenge_tokens: number | null;
  house:
    | {
        hex_code: string | null;
      }[]
    | {
        hex_code: string | null;
      }
    | null;
};

type ActiveChallengeRow = {
  id: string;
  title: string;
  game_id: string;
  gp_reward: number | null;
  ct_entry_cost: number | null;
  min_participants: number | null;
  ends_at: string;
  status: string | null;
  game:
    | {
        name: string | null;
      }[]
    | {
        name: string | null;
      }
    | null;
};

type PastChallengeRow = {
  id: string;
  title: string;
  game_id: string;
  gp_reward: number | null;
  winner_id: string | null;
  status: string | null;
  ends_at: string | null;
  game:
    | {
        name: string | null;
      }[]
    | {
        name: string | null;
      }
    | null;
};

type ChallengeEntryRow = {
  challenge_id: string;
  user_id: string;
  rank: number | null;
  best_score: number | null;
  attempts: number | null;
};

export default async function ChallengesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Please log in first");
  }

  const nowIso = new Date().toISOString();
  const [{ data: profile }, { data: activeChallenges }, { data: pastChallenges }, { data: games }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id,challenge_tokens,house:houses(hex_code)")
        .eq("id", user.id)
        .maybeSingle<ProfileRow>(),
      supabase
        .from("challenges")
        .select("id,title,game_id,gp_reward,ct_entry_cost,min_participants,ends_at,status,game:games(name)")
        .eq("status", "open")
        .gt("ends_at", nowIso)
        .order("ends_at", { ascending: true }),
      supabase
        .from("challenges")
        .select("id,title,game_id,gp_reward,winner_id,status,ends_at,game:games(name)")
        .in("status", ["completed", "cancelled"])
        .order("ends_at", { ascending: false })
        .limit(25),
      supabase.from("games").select("id,name").eq("is_active", true).order("name", { ascending: true }),
    ]);

  if (!profile) {
    redirect("/signup?error=Complete signup to create your profile");
  }

  const activeRows = (activeChallenges ?? []) as ActiveChallengeRow[];
  const pastRows = (pastChallenges ?? []) as PastChallengeRow[];
  const activeIds = activeRows.map((row) => row.id);
  const pastIds = pastRows.map((row) => row.id);
  const allChallengeIds = Array.from(new Set([...activeIds, ...pastIds]));

  const { data: entries } =
    allChallengeIds.length > 0
      ? await supabase
          .from("challenge_entries")
          .select("challenge_id,user_id,rank,best_score,attempts")
          .in("challenge_id", allChallengeIds)
      : { data: [] };

  const entryRows = (entries ?? []) as ChallengeEntryRow[];
  const entriesByChallenge = new Map<string, ChallengeEntryRow[]>();
  for (const row of entryRows) {
    const current = entriesByChallenge.get(row.challenge_id) ?? [];
    current.push(row);
    entriesByChallenge.set(row.challenge_id, current);
  }

  const winnerIds = Array.from(new Set(pastRows.map((row) => row.winner_id).filter(Boolean))) as string[];
  const winnerProfiles =
    winnerIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id,username,house:houses(hex_code)")
          .in("id", winnerIds)
      : { data: [] };
  const winnerMap = new Map<string, { username: string; color: string | null }>();
  for (const row of winnerProfiles.data ?? []) {
    const profileRow = row as {
      id?: string;
      username?: string | null;
      house?: { hex_code?: string | null } | { hex_code?: string | null }[] | null;
    };
    const house = Array.isArray(profileRow.house) ? profileRow.house[0] : profileRow.house;
    if (profileRow.id) {
      winnerMap.set(profileRow.id, {
        username: profileRow.username ?? "winner",
        color: house?.hex_code ?? null,
      });
    }
  }

  const activeData = activeRows.map((row) => {
    const game = Array.isArray(row.game) ? row.game[0] : row.game;
    const challengeEntries = entriesByChallenge.get(row.id) ?? [];
    const userEntry = challengeEntries.find((entry) => entry.user_id === user.id);
    const rankedEntries = [...challengeEntries].sort(
      (a, b) => Number(b.best_score ?? 0) - Number(a.best_score ?? 0),
    );
    const joinedRank = userEntry
      ? rankedEntries.findIndex((entry) => entry.user_id === user.id) + 1
      : null;
    const attempts = Number(userEntry?.attempts ?? 0);
    const bestScore = Number(userEntry?.best_score ?? 0);

    return {
      id: row.id,
      title: row.title,
      gameName: (game?.name ?? "GAME").toUpperCase(),
      gameSlug: slugify(game?.name ?? "game"),
      gpReward: Number(row.gp_reward ?? 0),
      ctEntryCost: Number(row.ct_entry_cost ?? 0),
      participants: challengeEntries.length,
      minParticipants: Number(row.min_participants ?? 0),
      endsAt: row.ends_at,
      alreadyJoined: Boolean(userEntry),
      joinedRank,
      joinedBestScore: bestScore,
      joinedAttempts: attempts,
    };
  });

  const pastData = pastRows.map((row) => {
    const game = Array.isArray(row.game) ? row.game[0] : row.game;
    const winner = row.winner_id ? winnerMap.get(row.winner_id) : null;
    const participants = (entriesByChallenge.get(row.id) ?? []).length;
    return {
      id: row.id,
      title: row.title.toUpperCase(),
      gameName: (game?.name ?? "GAME").toUpperCase(),
      gpReward: Number(row.gp_reward ?? 0),
      winnerName: winner?.username ?? null,
      winnerColor: winner?.color ?? null,
      participants,
      date: row.ends_at ? new Date(row.ends_at).toISOString().slice(0, 10) : "--",
      status: ((row.status ?? "completed").toLowerCase() === "cancelled"
        ? "cancelled"
        : "completed") as "completed" | "cancelled",
    };
  });

  const gameOptions = (games ?? []).map((row) => {
    const game = row as { id?: string; name?: string | null };
    return { id: String(game.id ?? ""), name: String(game.name ?? "Game") };
  });
  const profileHouse = Array.isArray(profile.house) ? profile.house[0] : profile.house;

  return (
    <section className="min-h-screen bg-[#111111] px-4 py-10 text-white md:px-10 lg:px-16">
      <div className="mx-auto max-w-[1440px] space-y-8">
        <ChallengesPageClient
          challengeTokens={Number(profile.challenge_tokens ?? 0)}
          houseAccentColor={profileHouse?.hex_code ?? "#DC2626"}
          activeChallenges={activeData}
          pastChallenges={pastData}
          gameOptions={gameOptions}
        />
      </div>
    </section>
  );
}
