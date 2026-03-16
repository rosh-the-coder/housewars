import { inter, jetMono } from "@/lib/fonts";

const liveChallenges = [
  {
    id: "c-live-1",
    leftHouse: { name: "PHOENIX", color: "#DC2626", score: "1,240" },
    rightHouse: { name: "TSUNAMI", color: "#2563EB", score: "980" },
    game: "TRIVIA SIEGE",
    wager: "WAGER: 500 PTS",
    timer: "02:47:13",
    timerColor: "#DC2626",
  },
  {
    id: "c-live-2",
    leftHouse: { name: "VIPER", color: "#16A34A", score: "2,100" },
    rightHouse: { name: "THUNDER", color: "#CA8A04", score: "1,870" },
    game: "SPEED TYPE",
    wager: "WAGER: 750 PTS",
    timer: "05:12:38",
    timerColor: "#16A34A",
  },
];

const pastChallenges = [
  { matchup: "PHOENIX vs TSUNAMI", game: "MATH BLITZ", wager: "300 PTS", winner: "PHOENIX", winnerColor: "#DC2626", date: "2026-03-14" },
  { matchup: "VIPER vs PHOENIX", game: "WORD CLASH", wager: "500 PTS", winner: "VIPER", winnerColor: "#16A34A", date: "2026-03-12" },
  { matchup: "THUNDER vs TSUNAMI", game: "CODE BREAK", wager: "200 PTS", winner: "TSUNAMI", winnerColor: "#2563EB", date: "2026-03-10" },
  { matchup: "PHOENIX vs VIPER", game: "MEMORY GRID", wager: "400 PTS", winner: "PHOENIX", winnerColor: "#DC2626", date: "2026-03-08" },
  { matchup: "TSUNAMI vs THUNDER", game: "REFLEX TEST", wager: "600 PTS", winner: "THUNDER", winnerColor: "#CA8A04", date: "2026-03-05" },
];

export default function ChallengesPage() {
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
          {liveChallenges.map((challenge) => (
            <article key={challenge.id} className="border-[4px] border-black bg-[#1A1A1A]">
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
          ))}
        </div>

        <button
          type="button"
          className={`${inter.className} w-full border-[4px] border-white bg-black py-5 text-xl font-black tracking-[0.18em] uppercase`}
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
                {pastChallenges.map((row, idx) => (
                  <tr
                    key={row.matchup}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
