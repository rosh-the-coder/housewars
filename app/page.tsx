import Link from "next/link";
import { jetMono, oswald } from "@/lib/fonts";

const houseCards = [
  { name: "PHOENIX", color: "#DC2626", points: "12,450 PTS", members: "342 MEMBERS" },
  { name: "TSUNAMI", color: "#2563EB", points: "11,890 PTS", members: "318 MEMBERS" },
  { name: "VIPER", color: "#16A34A", points: "10,720 PTS", members: "295 MEMBERS" },
  { name: "THUNDER", color: "#CA8A04", points: "9,980 PTS", members: "287 MEMBERS" },
];

const topPlayers = [
  { rank: "#1", username: "xDarkSlayer", house: "PHOENIX", points: "4,892", color: "#DC2626" },
  { rank: "#2", username: "TidalCrusher", house: "TSUNAMI", points: "4,651", color: "#2563EB" },
  { rank: "#3", username: "VenomStrike99", house: "VIPER", points: "4,210", color: "#16A34A" },
  { rank: "#4", username: "BoltMaster", house: "THUNDER", points: "3,987", color: "#CA8A04" },
  { rank: "#5", username: "FlameRider", house: "PHOENIX", points: "3,745", color: "#DC2626" },
];

export default function Home() {
  return (
    <section className="bg-[#F5F5F0] text-[#111111]">
      <div className="px-4 py-14 md:px-10 md:py-16">
        <h1
          className={`${oswald.className} text-center text-4xl leading-[1.05] tracking-[0.06em] sm:text-6xl lg:text-8xl`}
        >
          <span className="block">PICK YOUR HOUSE.</span>
          <span className="block">EARN POINTS.</span>
          <span className="block text-[#DC2626]">DESTROY THE REST.</span>
        </h1>
      </div>

      <div className="grid gap-6 px-4 pb-10 md:grid-cols-2 md:px-10 xl:grid-cols-4">
        {houseCards.map((house) => (
          <article
            key={house.name}
            className="flex flex-col items-center gap-3 border-[3px] border-solid bg-[#F5F5F0] p-6 text-center"
            style={{ borderColor: house.color }}
          >
            <h2
              className={`${oswald.className} text-3xl leading-none tracking-[0.08em]`}
              style={{ color: house.color }}
            >
              {house.name}
            </h2>
            <p className={`${oswald.className} text-4xl leading-none`}>{house.points}</p>
            <p className={`${jetMono.className} text-xs font-semibold tracking-[0.08em] text-[#777777]`}>
              {house.members}
            </p>
          </article>
        ))}
      </div>

      <div className="px-4 pb-10 md:px-10">
        <div className="space-y-5 border-[3px] border-black p-5 md:p-8">
          <h2 className={`${oswald.className} text-3xl leading-none tracking-[0.08em] md:text-4xl`}>
            TOP PLAYERS
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse">
              <thead className={`${jetMono.className} bg-[#111111] text-[#F5F5F0]`}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-extrabold tracking-[0.08em]">RANK</th>
                  <th className="px-4 py-3 text-left text-xs font-extrabold tracking-[0.08em]">
                    USERNAME
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-extrabold tracking-[0.08em]">HOUSE</th>
                  <th className="px-4 py-3 text-right text-xs font-extrabold tracking-[0.08em]">POINTS</th>
                </tr>
              </thead>
              <tbody>
                {topPlayers.map((player) => (
                  <tr key={player.rank} className="border-t border-[#DDDDDD]">
                    <td className={`${jetMono.className} px-4 py-4 text-sm font-bold`}>{player.rank}</td>
                    <td className={`${jetMono.className} px-4 py-4 text-sm font-semibold`}>
                      {player.username}
                    </td>
                    <td className={`${jetMono.className} px-4 py-4 text-sm font-bold`} style={{ color: player.color }}>
                      {player.house}
                    </td>
                    <td className={`${jetMono.className} px-4 py-4 text-right text-sm font-bold`}>
                      {player.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <footer className="bg-[#111111] px-4 py-8 md:px-10">
        <div className="flex justify-center">
          <Link
            href="/signup"
            className={`${oswald.className} border-[3px] border-[#F5F5F0] px-8 py-4 text-center text-3xl leading-none tracking-[0.08em] text-[#F5F5F0] transition hover:bg-[#F5F5F0] hover:text-[#111111]`}
          >
            JOIN THE COMPETITION
          </Link>
        </div>
      </footer>
    </section>
  );
}
