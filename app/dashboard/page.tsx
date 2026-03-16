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
  total_points: number | null;
};

type ProfileRow = {
  id: string;
  username: string | null;
  house_id: string | null;
  total_points: number | null;
  house: {
    id: string;
    name: string;
    hex_code: string | null;
    total_points: number | null;
  } | null;
};

type GameRow = {
  id: string;
  name: string;
  is_scored: boolean;
  is_active: boolean;
};

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Please log in first");
  }

  const [{ data: profile }, { data: allProfiles }, { data: houses }, { data: games }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id,username,house_id,total_points,house:houses(id,name,hex_code,total_points)")
        .eq("id", user.id)
        .maybeSingle<ProfileRow>(),
      supabase.from("profiles").select("id,total_points").order("total_points", { ascending: false }),
      supabase
        .from("houses")
        .select("id,name,hex_code,total_points")
        .order("total_points", { ascending: false }),
      supabase
        .from("games")
        .select("id,name,is_scored,is_active")
        .eq("is_active", true)
        .order("name", { ascending: true }),
    ]);

  if (!profile) {
    redirect("/signup?error=Complete signup to create your profile");
  }

  const safeHouses = (houses ?? []) as HouseStanding[];
  const safeGames = (games ?? []) as GameRow[];
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
  const activeChallenges = 3;

  const maxHousePoints = Math.max(...safeHouses.map((house) => Number(house.total_points ?? 0)), 1);
  const houseBars = safeHouses.map((house) => ({
    label: house.name.slice(0, 3).toUpperCase(),
    value: Number(house.total_points ?? 0),
    color: house.hex_code ?? "#999999",
    height: Math.max(90, Math.round((Number(house.total_points ?? 0) / maxHousePoints) * 220)),
  }));

  const statCards = [
    { value: `#${currentHouseRank}`, label: "// HOUSE_RANK", color: profile.house?.hex_code ?? "#DC2626" },
    { value: `#${userRank}`, label: "// YOUR_RANK", color: "#FF6B35" },
    { value: String(activeChallenges), label: "// ACTIVE_CHALLENGES", color: "#00D4AA" },
  ];

  return (
    <section className="min-h-screen bg-[#1A1A1A] text-white">
      <div className="grid gap-0 lg:grid-cols-[1fr_280px]">
        <main className="space-y-8 p-4 md:p-8 md:px-10">
          <div className="grid gap-4 md:grid-cols-3 md:gap-6">
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
          </div>
        </main>

        <aside className="space-y-6 bg-[#212121] p-6 md:p-8 lg:min-h-[calc(100vh-68px)]">
          <h2 className={`${oswald.className} text-3xl uppercase leading-none`}>[ HOUSE_POINTS ]</h2>
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
