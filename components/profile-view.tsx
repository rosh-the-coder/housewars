import { inter, jetMono, oswald } from "@/lib/fonts";

type StatBlock = {
  label: string;
  value: string;
  color?: string;
};

type RecentGameResult = {
  id: string;
  game: string;
  rank: number | null;
  totalPlayers: number | null;
  gpEarned: number;
  ctEarned: number;
  date: string;
};

type ChallengeHistoryRow = {
  id: string;
  title: string;
  game: string;
  rank: number | null;
  gpDelta: number;
  date: string;
};

type ProfileViewProps = {
  username: string;
  houseName: string;
  houseHex: string;
  editable: boolean;
  primaryStats: StatBlock[];
  secondaryStats: StatBlock[];
  recentResults: RecentGameResult[];
  challengeHistory: ChallengeHistoryRow[];
  badges: string[];
};

export function ProfileView({
  username,
  houseName,
  houseHex,
  editable,
  primaryStats,
  secondaryStats,
  recentResults,
  challengeHistory,
  badges,
}: ProfileViewProps) {
  return (
    <section className="min-h-screen bg-[#1A1A1A] px-4 py-10 text-white md:px-10">
      <div className="mx-auto max-w-[1440px] space-y-6">
        <header className="space-y-5 border-[3px] border-[#0D0D0D] bg-[#212121] p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <p className={`${jetMono.className} text-[11px] font-semibold tracking-[0.08em] text-[#777777]`}>PROFILE OVERVIEW</p>
              <h1 className={`${oswald.className} text-5xl uppercase leading-none md:text-6xl`}>{username}</h1>
              <div className="inline-flex items-center gap-2 rounded bg-[#0D0D0D] px-3 py-1">
                <span className="h-2.5 w-2.5" style={{ background: houseHex }} />
                <span className={`${jetMono.className} text-[11px] font-semibold`} style={{ color: houseHex }}>
                  {houseName.toUpperCase()}
                </span>
              </div>
            </div>
            {editable ? (
              <form action="/api/profile/username" method="post" className="flex w-full max-w-md items-center gap-2">
                <input
                  name="username"
                  defaultValue={username}
                  minLength={3}
                  maxLength={24}
                  required
                  className={`${jetMono.className} w-full border-[3px] border-[#0D0D0D] bg-[#1A1A1A] px-3 py-2 text-sm text-white`}
                />
                <button
                  type="submit"
                  className={`${jetMono.className} border-[3px] border-[#0D0D0D] bg-[#DC2626] px-4 py-2 text-xs font-semibold text-[#0D0D0D]`}
                >
                  SAVE
                </button>
              </form>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {primaryStats.map((stat) => (
              <article key={stat.label} className="border-[3px] border-[#0D0D0D] bg-[#1A1A1A] px-4 py-5">
                <p className={`${oswald.className} text-4xl leading-none md:text-5xl`} style={{ color: stat.color ?? "#F5F5F0" }}>
                  {stat.value}
                </p>
                <p className={`${jetMono.className} mt-2 text-[11px] font-semibold text-[#777777]`}>{stat.label}</p>
              </article>
            ))}
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <section className="space-y-3 border-[3px] border-[#0D0D0D] bg-[#212121] p-5">
              <h2 className={`${inter.className} text-2xl font-black uppercase tracking-[0.08em]`}>Recent Game Results</h2>
              <div className="overflow-x-auto border-[3px] border-[#0D0D0D]">
                <table className="w-full min-w-[680px] border-collapse">
                  <thead className={`${jetMono.className} bg-[#0D0D0D] text-xs font-semibold text-white`}>
                    <tr>
                      <th className="px-4 py-3 text-left">GAME</th>
                      <th className="px-4 py-3 text-left">RANK</th>
                      <th className="px-4 py-3 text-right">GP EARNED</th>
                      <th className="px-4 py-3 text-right">CT EARNED</th>
                      <th className="px-4 py-3 text-right">DATE</th>
                    </tr>
                  </thead>
                  <tbody className={jetMono.className}>
                    {recentResults.length === 0 ? (
                      <tr className="border-t border-[#333333]">
                        <td className="px-4 py-4 text-xs text-[#777777]" colSpan={5}>
                          NO RECENT GAME RESULTS.
                        </td>
                      </tr>
                    ) : (
                      recentResults.map((row, idx) => (
                        <tr
                          key={row.id}
                          className="border-t border-[#333333]"
                          style={{ background: idx % 2 === 0 ? "#1A1A1A" : "#242424" }}
                        >
                          <td className="px-4 py-3 text-xs font-semibold text-white">{row.game}</td>
                          <td className="px-4 py-3 text-xs text-[#DDDDDD]">
                            {row.rank ? `#${row.rank} of ${row.totalPlayers ?? "-"}` : "--"}
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-semibold text-[#FFD700]">
                            {row.gpEarned.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-xs font-semibold text-[#00D4AA]">
                            {row.ctEarned.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-[#999999]">{row.date}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-3 border-[3px] border-[#0D0D0D] bg-[#212121] p-5">
              <h2 className={`${inter.className} text-2xl font-black uppercase tracking-[0.08em]`}>Challenges History</h2>
              <div className="overflow-x-auto border-[3px] border-[#0D0D0D]">
                <table className="w-full min-w-[640px] border-collapse">
                  <thead className={`${jetMono.className} bg-[#0D0D0D] text-xs font-semibold text-white`}>
                    <tr>
                      <th className="px-4 py-3 text-left">TITLE</th>
                      <th className="px-4 py-3 text-left">GAME</th>
                      <th className="px-4 py-3 text-left">RANK</th>
                      <th className="px-4 py-3 text-right">GP DELTA</th>
                      <th className="px-4 py-3 text-right">DATE</th>
                    </tr>
                  </thead>
                  <tbody className={jetMono.className}>
                    {challengeHistory.length === 0 ? (
                      <tr className="border-t border-[#333333]">
                        <td className="px-4 py-4 text-xs text-[#777777]" colSpan={5}>
                          NO CHALLENGE HISTORY.
                        </td>
                      </tr>
                    ) : (
                      challengeHistory.map((row, idx) => (
                        <tr
                          key={row.id}
                          className="border-t border-[#333333]"
                          style={{ background: idx % 2 === 0 ? "#1A1A1A" : "#242424" }}
                        >
                          <td className="px-4 py-3 text-xs font-semibold text-white">{row.title}</td>
                          <td className="px-4 py-3 text-xs text-[#DDDDDD]">{row.game}</td>
                          <td className="px-4 py-3 text-xs text-[#DDDDDD]">{row.rank ? `#${row.rank}` : "--"}</td>
                          <td
                            className={`${jetMono.className} px-4 py-3 text-right text-xs font-semibold`}
                            style={{ color: row.gpDelta >= 0 ? "#FFD700" : "#FF6B35" }}
                          >
                            {row.gpDelta >= 0 ? "+" : ""}
                            {row.gpDelta.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-xs text-[#999999]">{row.date}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="space-y-4 border-[3px] border-[#0D0D0D] bg-[#212121] p-5">
              <h2 className={`${inter.className} text-2xl font-black uppercase tracking-[0.08em]`}>Performance Snapshot</h2>
              <div className="grid gap-3">
                {secondaryStats.map((stat) => (
                  <article key={stat.label} className="border-[3px] border-[#0D0D0D] bg-[#1A1A1A] px-4 py-4">
                    <p className={`${oswald.className} text-4xl leading-none`} style={{ color: stat.color ?? "#F5F5F0" }}>
                      {stat.value}
                    </p>
                    <p className={`${jetMono.className} mt-2 text-[11px] font-semibold text-[#777777]`}>{stat.label}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="space-y-3 border-[3px] border-[#0D0D0D] bg-[#212121] p-5">
              <h2 className={`${inter.className} text-2xl font-black uppercase tracking-[0.08em]`}>Badges</h2>
              <div className="flex flex-wrap gap-2">
                {badges.length === 0 ? (
                  <p className={`${jetMono.className} text-xs font-semibold text-[#777777]`}>NO BADGES YET.</p>
                ) : (
                  badges.map((badge) => (
                    <span
                      key={badge}
                      className={`${jetMono.className} inline-flex border-[3px] border-[#0D0D0D] bg-[#1A1A1A] px-3 py-1 text-[11px] font-semibold text-[#F5F5F0]`}
                    >
                      {badge.toUpperCase()}
                    </span>
                  ))
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}
