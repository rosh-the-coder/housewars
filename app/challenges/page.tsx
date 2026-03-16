import { inter, jetMono } from "@/lib/fonts";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type HouseRow = {
  id: string;
  name: string;
  hex_code: string | null;
  total_points: number | null;
};

type GameRow = {
  id: string;
  name: string;
};

type SessionRow = {
  user_id: string;
  game_id: string;
  points_earned: number | null;
  ended_at: string | null;
};

type ProfileRow = {
  id: string;
  username: string | null;
  house:
    | {
        name: string;
        hex_code: string | null;
      }
    | {
        name: string;
        hex_code: string | null;
      }[]
    | null;
};

type LiveCard = {
  id: string;
  leftHouse: { name: string; color: string; score: string };
  rightHouse: { name: string; color: string; score: string };
  game: string;
  wager: string;
  timer: string;
  timerColor: string;
};

type PastRow = {
  matchup: string;
  game: string;
  wager: string;
  winner: string;
  winnerColor: string;
  date: string;
};

function toHouseName(name: string | null | undefined) {
  return (name ?? "HOUSE").toUpperCase();
}

export default async function ChallengesPage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: houses }, { data: games }, { data: sessions }] = await Promise.all([
    supabase
      .from("houses")
      .select("id,name,hex_code,total_points")
      .order("total_points", { ascending: false })
      .limit(4),
    supabase.from("games").select("id,name").eq("is_active", true).order("name", { ascending: true }),
    supabase
      .from("game_sessions")
      .select("user_id,game_id,points_earned,ended_at")
      .not("ended_at", "is", null)
      .order("ended_at", { ascending: false })
      .limit(8),
  ]);

  const safeHouses = (houses ?? []) as HouseRow[];
  const safeGames = (games ?? []) as GameRow[];
  const safeSessions = (sessions ?? []) as SessionRow[];

  const userIds = Array.from(new Set(safeSessions.map((session) => session.user_id)));
  const gameById = new Map(safeGames.map((game) => [game.id, game.name]));
  const profileById = new Map<string, ProfileRow>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,username,house:houses(name,hex_code)")
      .in("id", userIds);

    for (const profile of (profiles ?? []) as ProfileRow[]) {
      profileById.set(profile.id, profile);
    }
  }

  const liveChallenges: LiveCard[] = [];
  for (let idx = 0; idx < safeHouses.length; idx += 2) {
    const left = safeHouses[idx];
    const right = safeHouses[idx + 1];
    if (!left || !right) continue;

    const leftPoints = Number(left.total_points ?? 0);
    const rightPoints = Number(right.total_points ?? 0);
    const gameName = safeGames[Math.floor(idx / 2)]?.name ?? "SEASON MATCH";
    const wagerPoints = Math.max(100, Math.abs(leftPoints - rightPoints));

    liveChallenges.push({
      id: `live-${left.id}-${right.id}`,
      leftHouse: {
        name: toHouseName(left.name),
        color: left.hex_code ?? "#777777",
        score: leftPoints.toLocaleString(),
      },
      rightHouse: {
        name: toHouseName(right.name),
        color: right.hex_code ?? "#777777",
        score: rightPoints.toLocaleString(),
      },
      game: gameName.toUpperCase(),
      wager: `WAGER: ${wagerPoints.toLocaleString()} PTS`,
      timer: "LIVE NOW",
      timerColor: left.hex_code ?? "#FFFFFF",
    });
  }

  const pastChallenges: PastRow[] = safeSessions.map((session) => {
    const profile = profileById.get(session.user_id);
    const house = Array.isArray(profile?.house) ? profile.house[0] : profile?.house;
    const winnerName = (profile?.username ?? "player").toUpperCase();
    const houseName = toHouseName(house?.name);
    const points = Math.max(0, Number(session.points_earned ?? 0));
    const endedDate = session.ended_at ? new Date(session.ended_at) : null;

    return {
      matchup: `${houseName} vs HOUSEWARS`,
      game: (gameById.get(session.game_id) ?? "UNKNOWN GAME").toUpperCase(),
      wager: `${points.toLocaleString()} PTS`,
      winner: winnerName,
      winnerColor: house?.hex_code ?? "#FFFFFF",
      date: endedDate ? endedDate.toISOString().slice(0, 10) : "N/A",
    };
  });

  return (
    <section className="min-h-screen bg-[#111111] px-4 py-10 text-white md:px-10 lg:px-16">
      <div className="mx-auto max-w-[1440px] space-y-8">
        <header className="flex items-center gap-4">
          <h1 className={`${inter.className} text-4xl font-black uppercase tracking-[0.08em] md:text-5xl`}>
            Challenges
          </h1>
          <div className="h-1 flex-1 bg-white" />
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          {liveChallenges.length === 0 ? (
            <article className="lg:col-span-2 border-4 border-black bg-[#1A1A1A] p-6 text-center">
              <p className={`${inter.className} text-sm font-semibold tracking-[0.08em] text-[#999999]`}>
                No house standings found yet.
              </p>
            </article>
          ) : (
            liveChallenges.map((challenge) => (
            <article key={challenge.id} className="border-4 border-black bg-[#1A1A1A]">
              <div className="flex items-center justify-center gap-4 p-5">
                <div className="px-4 py-2" style={{ background: challenge.leftHouse.color }}>
                  <p className={`${inter.className} text-lg font-extrabold`}>{challenge.leftHouse.name}</p>
                </div>
                <p className={`${inter.className} text-3xl font-black text-[#999999]`}>VS</p>
                <div className="px-4 py-2" style={{ background: challenge.rightHouse.color }}>
                  <p className={`${inter.className} text-lg font-extrabold`}>{challenge.rightHouse.name}</p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 px-6 pb-6">
                <p className={`${inter.className} text-sm font-bold tracking-[0.08em] text-[#999999]`}>
                  {challenge.game}
                </p>
                <div className="bg-[#CA8A04] px-5 py-2">
                  <p className={`${inter.className} text-sm font-extrabold text-black`}>{challenge.wager}</p>
                </div>
                <div className="border-2 border-[#999999] bg-black px-6 py-2">
                  <p
                    className={`${jetMono.className} text-4xl font-bold tracking-[0.16em]`}
                    style={{ color: challenge.timerColor }}
                  >
                    {challenge.timer}
                  </p>
                </div>
                <p className={`${inter.className} text-[10px] font-semibold tracking-[0.2em] text-[#999999]`}>
                  TIME REMAINING
                </p>
              </div>

              <div className="flex">
                <div
                  className="flex flex-1 flex-col items-center gap-1 py-4"
                  style={{ background: challenge.leftHouse.color }}
                >
                  <p className={`${jetMono.className} text-4xl font-extrabold leading-none`}>
                    {challenge.leftHouse.score}
                  </p>
                  <p className={`${inter.className} text-[10px] font-bold tracking-[0.08em] text-white/85`}>
                    {challenge.leftHouse.name}
                  </p>
                </div>
                <div className="w-1 bg-black" />
                <div
                  className="flex flex-1 flex-col items-center gap-1 py-4"
                  style={{ background: challenge.rightHouse.color }}
                >
                  <p className={`${jetMono.className} text-4xl font-extrabold leading-none`}>
                    {challenge.rightHouse.score}
                  </p>
                  <p className={`${inter.className} text-[10px] font-bold tracking-[0.08em] text-white/85`}>
                    {challenge.rightHouse.name}
                  </p>
                </div>
              </div>
            </article>
            ))
          )}
        </div>

        <button
          type="button"
          className={`${inter.className} w-full border-4 border-white bg-black py-5 text-xl font-black tracking-[0.18em] uppercase`}
        >
          Create Challenge
        </button>

        <div className="space-y-4">
          <h2 className={`${inter.className} text-2xl font-black uppercase tracking-[0.08em]`}>
            Past Challenges
          </h2>
          <div className="overflow-x-auto border-[3px] border-black">
            <table className="w-full min-w-[980px] border-collapse">
              <thead className={`${inter.className} bg-white text-[12px] font-extrabold text-black`}>
                <tr>
                  <th className="px-5 py-3 text-left">MATCHUP</th>
                  <th className="px-5 py-3 text-left">GAME</th>
                  <th className="px-5 py-3 text-left">WAGER</th>
                  <th className="px-5 py-3 text-left">WINNER</th>
                  <th className="px-5 py-3 text-left">DATE</th>
                </tr>
              </thead>
              <tbody>
                {pastChallenges.length === 0 ? (
                  <tr className="h-14 border-t border-[#333333] bg-[#1A1A1A]">
                    <td
                      colSpan={5}
                      className={`${inter.className} px-5 text-center text-sm font-semibold text-[#999999]`}
                    >
                      No completed game sessions yet.
                    </td>
                  </tr>
                ) : (
                  pastChallenges.map((row, idx) => (
                    <tr
                      key={`${row.matchup}-${row.game}-${row.date}-${idx}`}
                      className="h-11 border-t border-[#333333]"
                      style={{ background: idx % 2 === 0 ? "#222222" : "#1A1A1A" }}
                    >
                      <td className={`${inter.className} px-5 text-sm font-semibold text-white`}>
                        {row.matchup}
                      </td>
                      <td className={`${inter.className} px-5 text-sm font-semibold text-[#999999]`}>
                        {row.game}
                      </td>
                      <td className={`${jetMono.className} px-5 text-sm font-semibold text-[#CA8A04]`}>
                        {row.wager}
                      </td>
                      <td
                        className={`${inter.className} px-5 text-sm font-bold`}
                        style={{ color: row.winnerColor }}
                      >
                        {row.winner}
                      </td>
                      <td className={`${jetMono.className} px-5 text-sm text-[#999999]`}>{row.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
