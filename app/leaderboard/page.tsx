import Link from "next/link";
import { jetMono, oswald } from "@/lib/fonts";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type HouseRow = {
  id: string;
  name: string;
  hex_code: string | null;
  gp_weekly: number | null;
  gp_alltime: number | null;
};

type PlayerRow = {
  id: string;
  username: string | null;
  gp_weekly: number | null;
  gp_alltime: number | null;
  challenge_tokens: number | null;
  house:
    | {
        name: string;
        hex_code: string | null;
      }[]
    | {
        name: string;
        hex_code: string | null;
      }
    | null;
};

type LeaderboardPageProps = {
  searchParams: Promise<{ metric?: string }>;
};

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const { metric } = await searchParams;
  const selectedMetric = metric === "alltime" ? "alltime" : "weekly";
  const orderColumn = selectedMetric === "alltime" ? "gp_alltime" : "gp_weekly";
  const supabase = await createSupabaseServerClient();
  const [{ data: houses }, { data: players }] = await Promise.all([
    supabase
      .from("houses")
      .select("id,name,hex_code,gp_weekly,gp_alltime")
      .order("gp_weekly", { ascending: false })
      .limit(4),
    supabase
      .from("profiles")
      .select("id,username,gp_weekly,gp_alltime,challenge_tokens,house:houses(name,hex_code)")
      .order(orderColumn, { ascending: false })
      .limit(10),
  ]);

  const houseRows = (houses ?? []) as HouseRow[];
  const playerRows = (players ?? []) as PlayerRow[];
  const maxHouseGp = Math.max(...houseRows.map((house) => Number(house.gp_weekly ?? 0)), 1);
  const medalLeftBorder = ["#FFD700", "#C0C0C0", "#CD7F32"];

  return (
    <section className="min-h-screen bg-[#F5F5F0] px-4 py-10 text-[#0D0D0D] md:px-12">
      <div className="mx-auto max-w-[1440px] space-y-8">
        <header className="space-y-5">
          <div className="flex flex-wrap items-end gap-6">
            <h1 className={`${oswald.className} text-5xl uppercase leading-none md:text-7xl`}>
              Leaderboard
            </h1>
            <p className={`${jetMono.className} text-xs text-[#777777]`}>{"// season_rankings"}</p>
          </div>
          <div className="flex gap-0">
            <button
              type="button"
              className={`${jetMono.className} border-[3px] border-[#0D0D0D] bg-[#0D0D0D] px-6 py-2 text-xs font-semibold text-white`}
            >
              HOUSES
            </button>
            <button
              type="button"
              className={`${jetMono.className} border-y-[3px] border-r-[3px] border-[#0D0D0D] bg-transparent px-6 py-2 text-xs font-semibold`}
            >
              PLAYERS
            </button>
          </div>
        </header>

        <div className="space-y-2">
          {houseRows.map((house, index) => (
            <article
              key={house.id}
              className="relative h-[100px] overflow-hidden border-[3px] border-[#0D0D0D]"
            >
              <div
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${Math.max(35, Math.round((Number(house.gp_weekly ?? 0) / maxHouseGp) * 100))}%`,
                  background:
                    house.hex_code === "#DC2626"
                      ? "rgba(220, 38, 38, 0.2)"
                      : house.hex_code === "#2563EB"
                        ? "rgba(37, 99, 235, 0.2)"
                        : house.hex_code === "#16A34A"
                          ? "rgba(22, 163, 74, 0.2)"
                          : "rgba(202, 138, 4, 0.2)",
                }}
              />
              <div className="relative flex h-full items-center gap-5 px-6">
                <p className={`${oswald.className} w-[70px] text-5xl leading-none`}>
                  {String(index + 1).padStart(2, "0")}
                </p>
                <span className="h-12 w-12" style={{ background: house.hex_code ?? "#999999" }} />
                <p className={`${oswald.className} w-[220px] text-4xl leading-none`}>
                  {house.name.toUpperCase()}
                </p>
                <div className="h-px flex-1" />
                <div className="flex items-center gap-4">
                  <p className={`${jetMono.className} text-[11px] font-semibold text-[#FFD700]`}>
                    {Number(house.gp_weekly ?? 0).toLocaleString()} GP THIS WEEK
                  </p>
                  <p className={`${jetMono.className} text-[11px] font-semibold text-[#777777]`}>
                    {Number(house.gp_alltime ?? 0).toLocaleString()} GP ALL TIME
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="space-y-2">
          <p className={`${jetMono.className} text-xs text-[#777777]`}>{"// player_rankings"}</p>
          <div className="flex gap-0">
            <Link
              href="/leaderboard?metric=weekly"
              className={`${jetMono.className} border-[3px] border-[#0D0D0D] px-5 py-2 text-xs font-semibold ${
                selectedMetric === "weekly" ? "bg-[#0D0D0D] text-white" : "bg-transparent text-[#0D0D0D]"
              }`}
            >
              WEEKLY GP
            </Link>
            <Link
              href="/leaderboard?metric=alltime"
              className={`${jetMono.className} border-y-[3px] border-r-[3px] border-[#0D0D0D] px-5 py-2 text-xs font-semibold ${
                selectedMetric === "alltime" ? "bg-[#0D0D0D] text-white" : "bg-transparent text-[#0D0D0D]"
              }`}
            >
              ALL-TIME GP
            </Link>
          </div>
          <div className="overflow-x-auto border-[3px] border-[#0D0D0D]">
            <table className="w-full min-w-[900px] border-collapse">
              <thead className={`${jetMono.className} bg-[#0D0D0D] text-xs font-semibold text-white`}>
                <tr>
                  <th className="px-5 py-3 text-left">RANK</th>
                  <th className="px-5 py-3 text-left">PLAYER</th>
                  <th className="px-5 py-3 text-left">HOUSE</th>
                  <th className="px-5 py-3 text-right">CT</th>
                  <th className="px-5 py-3 text-right">GP</th>
                </tr>
              </thead>
              <tbody className={jetMono.className}>
                {playerRows.map((row, index) => {
                  const house = Array.isArray(row.house) ? row.house[0] : row.house;
                  return (
                  <tr
                    key={row.id}
                    className="border-b border-[#CCCCCC] text-[13px] leading-none even:bg-[#EBEBEB] odd:bg-[#F5F5F0]"
                    style={{
                      borderLeft: index < 3 ? `4px solid ${medalLeftBorder[index]}` : undefined,
                    }}
                  >
                    <td className="w-20 px-5 py-3 text-xs font-semibold">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="px-5 py-3">{row.username ?? "player"}</td>
                    <td className="w-[200px] px-5 py-3">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-2 w-2"
                          style={{ background: house?.hex_code ?? "#999999" }}
                        />
                        <span className="text-xs font-semibold">
                          {(house?.name ?? "house").toUpperCase()}
                        </span>
                      </span>
                    </td>
                    <td className="w-[120px] px-5 py-3 text-right font-semibold">
                      <span className="inline-flex items-center gap-1 rounded bg-[#0D0D0D] px-2 py-1 text-[11px] text-[#00D4AA]">
                        ◈ {Number(row.challenge_tokens ?? 0)}
                      </span>
                    </td>
                    <td className="w-[120px] px-5 py-3 text-right font-semibold">
                      {Number(selectedMetric === "alltime" ? row.gp_alltime ?? 0 : row.gp_weekly ?? 0).toLocaleString()}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
