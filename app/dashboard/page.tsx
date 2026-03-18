import Link from "next/link";
import { redirect } from "next/navigation";
import { jetMono, oswald } from "@/lib/fonts";
import { slugify } from "@/lib/slug";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type HouseStanding = {
  id: string;
  name: string;
  hex_code: string | null;
  gp_weekly: number | null;
};

type ProfileRow = {
  id: string;
  username: string | null;
  house_id: string | null;
  gp_weekly: number | null;
  challenge_tokens: number | null;
  house: {
    id: string;
    name: string;
    hex_code: string | null;
    gp_weekly: number | null;
  } | null;
};

type GameRow = {
  id: string;
  name: string;
  is_scored: boolean;
  is_active: boolean;
};

type ChallengeEntryRow = {
  challenge_id: string;
  best_score: number | null;
  rank: number | null;
};

type ChallengeRow = {
  id: string;
  title: string;
  status: string | null;
  starts_at: string | null;
  ends_at: string | null;
};

function formatCountdown(endsAt: string | null): string {
  if (!endsAt) return "NO END DATE";
  const diffMs = new Date(endsAt).getTime() - Date.now();
  if (Number.isNaN(diffMs)) return "NO END DATE";
  if (diffMs <= 0) return "ENDED";

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}D ${hours}H`;
  if (hours > 0) return `${hours}H ${minutes}M`;
  return `${minutes}M`;
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Please log in first");
  }

  const [{ data: profile }, { data: allProfiles }, { data: houses }, { data: games }, { data: joinedEntries }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id,username,house_id,gp_weekly,challenge_tokens,house:houses(id,name,hex_code,gp_weekly)")
        .eq("id", user.id)
        .maybeSingle<ProfileRow>(),
      supabase.from("profiles").select("id,gp_weekly").order("gp_weekly", { ascending: false }),
      supabase
        .from("houses")
        .select("id,name,hex_code,gp_weekly")
        .order("gp_weekly", { ascending: false }),
      supabase
        .from("games")
        .select("id,name,is_scored,is_active")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase
        .from("challenge_entries")
        .select("challenge_id,best_score,rank")
        .eq("user_id", user.id)
        .order("id", { ascending: false }),
    ]);

  if (!profile) {
    redirect("/signup?error=Complete signup to create your profile");
  }

  const safeHouses = (houses ?? []) as HouseStanding[];
  const safeGames = (games ?? []) as GameRow[];
  const safeJoinedEntries = (joinedEntries ?? []) as ChallengeEntryRow[];
  const currentHouseRank =
    Math.max(
      1,
      safeHouses.findIndex((house) => house.id === profile.house_id) + 1,
    ) || 1;
  const userRank =
    Math.max(
      1,
      (allProfiles ?? []).findIndex((item) => item.id === user.id) + 1,
    ) || 1;
  const maxHouseGp = Math.max(...safeHouses.map((house) => Number(house.gp_weekly ?? 0)), 1);
  const houseBars = safeHouses.map((house) => ({
    label: house.name.slice(0, 3).toUpperCase(),
    value: Number(house.gp_weekly ?? 0),
    color: house.hex_code ?? "#999999",
    height: Math.max(90, Math.round((Number(house.gp_weekly ?? 0) / maxHouseGp) * 220)),
  }));

  const joinedChallengeIds = Array.from(new Set(safeJoinedEntries.map((entry) => entry.challenge_id)));
  const challengeCards: Array<{
    id: string;
    title: string;
    status: string;
    countdown: string;
    rank: number | null;
  }> = [];

  if (joinedChallengeIds.length > 0) {
    const { data: joinedChallenges } = await supabase
      .from("challenges")
      .select("id,title,status,starts_at,ends_at")
      .in("id", joinedChallengeIds)
      .order("ends_at", { ascending: true });

    const challengeRows = (joinedChallenges ?? []) as ChallengeRow[];
    const activeRows = challengeRows
      .filter((row) => {
        const status = (row.status ?? "").toLowerCase();
        return status !== "completed" && status !== "cancelled";
      })
      .slice(0, 2);

    const rankLookups = await Promise.all(
      activeRows.map(async (row) => {
        const userEntry = safeJoinedEntries.find((entry) => entry.challenge_id === row.id);
        if (userEntry?.rank && userEntry.rank > 0) {
          return { challengeId: row.id, rank: userEntry.rank };
        }

        const { data: challengeEntries } = await supabase
          .from("challenge_entries")
          .select("user_id,best_score")
          .eq("challenge_id", row.id)
          .order("best_score", { ascending: false });
        const ordered = challengeEntries ?? [];
        const index = ordered.findIndex((entry) => (entry as { user_id?: string }).user_id === user.id);
        return { challengeId: row.id, rank: index >= 0 ? index + 1 : null };
      }),
    );

    const rankByChallengeId = new Map(rankLookups.map((item) => [item.challengeId, item.rank]));
    for (const row of activeRows) {
      challengeCards.push({
        id: row.id,
        title: row.title,
        status: (row.status ?? "active").toUpperCase(),
        countdown: formatCountdown(row.ends_at),
        rank: rankByChallengeId.get(row.id) ?? null,
      });
    }
  }

  const statCards = [
    { value: `#${currentHouseRank}`, label: "// HOUSE_RANK", color: profile.house?.hex_code ?? "#DC2626" },
    { value: `#${userRank}`, label: "// YOUR_RANK", color: "#FF6B35" },
    { value: `${Number(profile.gp_weekly ?? 0).toLocaleString()} GP`, label: "// GP_THIS_WEEK", color: "#FFD700" },
    {
      value: `${Number(profile.challenge_tokens ?? 0).toLocaleString()} CT`,
      label: "// CHALLENGE_TOKENS",
      color: "#00D4AA",
    },
  ];

  return (
    <section className="min-h-screen bg-[#1A1A1A] text-white">
      <div className="grid gap-0 lg:grid-cols-[1fr_280px]">
        <main className="space-y-8 p-4 md:p-8 md:px-10">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 md:gap-6">
            {statCards.map((card) => (
              <article
                key={card.label}
                className="flex flex-col items-center gap-2 border-[4px] border-[#0D0D0D] bg-[#212121] px-4 py-6"
              >
                <p className={`${oswald.className} text-6xl leading-none`} style={{ color: card.color }}>
                  {card.value}
                </p>
                <p className={`${jetMono.className} text-[11px] font-semibold text-[#777777]`}>
                  {card.label}
                </p>
              </article>
            ))}
          </div>

          <h2 className={`${oswald.className} text-3xl uppercase leading-none`}>[ PLAY_GAMES ]</h2>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {safeGames.slice(0, 4).map((game) => (
                <article
                  key={game.id}
                  className="space-y-3 border-[3px] border-[#0D0D0D] bg-[#212121] p-5"
                >
                  <h3 className={`${oswald.className} text-xl uppercase leading-none text-white`}>
                    {game.name}
                  </h3>
                  <span className="inline-block bg-[#2D2D2D] px-2 py-1">
                    <span
                      className={`${jetMono.className} text-[10px] font-semibold`}
                      style={{ color: game.is_scored ? "#FF6B35" : "#00D4AA" }}
                    >
                      {game.is_scored ? "SCORED" : "TIMED"}
                    </span>
                  </span>
                  <Link
                    href={`/games/${slugify(game.name)}`}
                    className={`${jetMono.className} block bg-[#DC2626] py-2 text-center text-[11px] font-semibold text-[#0D0D0D]`}
                  >
                    PLAY
                  </Link>
                </article>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {safeGames.slice(4, 8).map((game) => (
                <article
                  key={game.id}
                  className="space-y-3 border-[3px] border-[#0D0D0D] bg-[#212121] p-5"
                >
                  <h3 className={`${oswald.className} text-xl uppercase leading-none text-white`}>
                    {game.name}
                  </h3>
                  <span className="inline-block bg-[#2D2D2D] px-2 py-1">
                    <span
                      className={`${jetMono.className} text-[10px] font-semibold`}
                      style={{ color: game.is_scored ? "#FF6B35" : "#00D4AA" }}
                    >
                      {game.is_scored ? "SCORED" : "TIMED"}
                    </span>
                  </span>
                  <Link
                    href={`/games/${slugify(game.name)}`}
                    className={`${jetMono.className} block bg-[#DC2626] py-2 text-center text-[11px] font-semibold text-[#0D0D0D]`}
                  >
                    PLAY
                  </Link>
                </article>
              ))}
            </div>

            <div className="space-y-3 border-[3px] border-[#0D0D0D] bg-[#212121] p-5">
              <div className="flex items-center justify-between">
                <h3 className={`${oswald.className} text-2xl uppercase leading-none text-white`}>
                  ACTIVE CHALLENGES
                </h3>
                <p className={`${jetMono.className} text-[10px] font-semibold tracking-[0.08em] text-[#777777]`}>
                  JOINED_BY_YOU
                </p>
              </div>

              {challengeCards.length === 0 ? (
                <p className={`${jetMono.className} text-xs font-semibold tracking-[0.06em] text-[#777777]`}>
                  NO ACTIVE JOINED CHALLENGES YET.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {challengeCards.map((challenge) => (
                    <article
                      key={challenge.id}
                      className="space-y-3 border-[3px] border-[#0D0D0D] bg-[#1A1A1A] p-4"
                    >
                      <h4 className={`${oswald.className} text-xl uppercase leading-none text-white`}>
                        {challenge.title}
                      </h4>
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={`${jetMono.className} inline-block bg-[#2D2D2D] px-2 py-1 text-[10px] font-semibold`}
                          style={{ color: "#00D4AA" }}
                        >
                          {challenge.status}
                        </span>
                        <span className={`${jetMono.className} text-[10px] font-semibold text-[#FFD700]`}>
                          ENDS IN {challenge.countdown}
                        </span>
                      </div>
                      <p className={`${jetMono.className} text-[11px] font-semibold text-[#F5F5F0]`}>
                        YOUR RANK: {challenge.rank ? `#${challenge.rank}` : "--"}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        <aside className="space-y-6 bg-[#212121] p-6 md:p-8 lg:min-h-[calc(100vh-68px)]">
          <h2 className={`${oswald.className} text-3xl uppercase leading-none`}>[ HOUSE_GP_WEEKLY ]</h2>
          <div className="flex h-[520px] items-end justify-between gap-3 px-1">
            {houseBars.map((bar) => (
              <div key={bar.label} className="flex h-full w-full flex-col items-center justify-end gap-2">
                <p className={`${jetMono.className} text-[10px] font-semibold text-white`}>{bar.value}</p>
                <div
                  className="w-full border-[3px] border-[#0D0D0D]"
                  style={{ height: `${bar.height}px`, background: bar.color }}
                />
                <p className={`${jetMono.className} text-[9px] font-semibold`} style={{ color: bar.color }}>
                  {bar.label}
                </p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
