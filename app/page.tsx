import Link from "next/link";
import { redirect } from "next/navigation";
import { jetMono, oswald } from "@/lib/fonts";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type HouseRow = {
  id: string;
  name: string;
  hex_code: string | null;
  gp_alltime: number | null;
};

type PublicProfileCountRow = {
  id: string;
  house_id: string | null;
};

type PublicPlayerRow = {
  id: string;
  username: string | null;
  gp_alltime: number | null;
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

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/games");
  }

  const [{ data: houses }, { data: profiles }, { data: topPlayers }] = await Promise.all([
    supabase
      .from("houses")
      .select("id,name,hex_code,gp_alltime")
      .order("gp_alltime", { ascending: false })
      .limit(4),
    supabase.from("profiles").select("id,house_id"),
    supabase
      .from("profiles")
      .select("id,username,gp_alltime,house:houses(name,hex_code)")
      .order("gp_alltime", { ascending: false })
      .limit(5),
  ]);

  const houseRows = (houses ?? []) as HouseRow[];
  const profileRows = (profiles ?? []) as PublicProfileCountRow[];
  const topPlayerRows = (topPlayers ?? []) as PublicPlayerRow[];
  const membersByHouseId = new Map<string, number>();
  for (const profile of profileRows) {
    if (!profile.house_id) continue;
    membersByHouseId.set(profile.house_id, (membersByHouseId.get(profile.house_id) ?? 0) + 1);
  }

  return (
    <section className="bg-[#F5F5F0] text-[#111111]">
      <div className="px-4 py-14 md:px-10 md:py-16">
        <h1
          className={`${oswald.className} text-center text-4xl leading-[1.05] tracking-[0.06em] sm:text-6xl lg:text-8xl`}
        >
          <span className="block">PICK YOUR HOUSE.</span>
          <span className="block">EARN GP.</span>
          <span className="block text-[#DC2626]">DESTROY THE REST.</span>
        </h1>
      </div>

      <div className="grid gap-6 px-4 pb-10 md:grid-cols-2 md:px-10 xl:grid-cols-4">
        {houseRows.map((house) => (
          <article
            key={house.id}
            className="flex flex-col items-center gap-3 border-[3px] border-solid bg-[#F5F5F0] p-6 text-center"
            style={{ borderColor: house.hex_code ?? "#111111" }}
          >
            <h2
              className={`${oswald.className} text-3xl leading-none tracking-[0.08em]`}
              style={{ color: house.hex_code ?? "#111111" }}
            >
              {house.name.toUpperCase()}
            </h2>
            <p className={`${oswald.className} text-4xl leading-none`}>
              {Number(house.gp_alltime ?? 0).toLocaleString()} GP
            </p>
            <p className={`${jetMono.className} text-xs font-semibold tracking-[0.08em] text-[#777777]`}>
              {Number(membersByHouseId.get(house.id) ?? 0).toLocaleString()} MEMBERS
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
                  <th className="px-4 py-3 text-right text-xs font-extrabold tracking-[0.08em]">GP</th>
                </tr>
              </thead>
              <tbody>
                {topPlayerRows.map((player, index) => {
                  const house = Array.isArray(player.house) ? player.house[0] : player.house;
                  return (
                  <tr key={player.id} className="border-t border-[#DDDDDD]">
                    <td className={`${jetMono.className} px-4 py-4 text-sm font-bold`}>#{index + 1}</td>
                    <td className={`${jetMono.className} px-4 py-4 text-sm font-semibold`}>
                      {player.username ?? "player"}
                    </td>
                    <td
                      className={`${jetMono.className} px-4 py-4 text-sm font-bold`}
                      style={{ color: house?.hex_code ?? "#111111" }}
                    >
                      {(house?.name ?? "HOUSE").toUpperCase()}
                    </td>
                    <td className={`${jetMono.className} px-4 py-4 text-right text-sm font-bold`}>
                      {Number(player.gp_alltime ?? 0).toLocaleString()}
                    </td>
                  </tr>
                  );
                })}
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
