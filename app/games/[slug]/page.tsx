import { IBM_Plex_Mono, Playfair_Display, Space_Grotesk } from "next/font/google";
import { notFound, redirect } from "next/navigation";
import { GameEmbed } from "@/components/game-embed";
import { slugify } from "@/lib/slug";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["700"] });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["600", "700"] });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"] });

type GamePageProps = {
  params: Promise<{ slug: string }>;
};

type DbGame = {
  id: string;
  name: string;
  source: string | null;
  type: string | null;
  embed_url: string;
  thumbnail_url: string | null;
  pts_per_minute: number | null;
  is_scored: boolean;
  is_active: boolean;
};

type SessionRow = {
  user_id: string;
  raw_score: number | null;
  points_earned: number | null;
};

type ProfileRow = {
  id: string;
  username: string | null;
  house_id: string | null;
  house: {
    name: string;
    hex_code: string | null;
  } | null;
};

function normalizeHouseName(name: string | null | undefined): string {
  const value = (name ?? "").toLowerCase();
  if (value.includes("red") || value.includes("phoenix")) return "PHOENIX";
  if (value.includes("blue") || value.includes("tsunami")) return "TSUNAMI";
  if (value.includes("green") || value.includes("viper")) return "VIPER";
  if (value.includes("yellow") || value.includes("thunder")) return "THUNDER";
  return (name ?? "HOUSE").toUpperCase();
}

function getHouseColor(name: string | null | undefined, fallback?: string | null): string {
  const normalized = normalizeHouseName(name);
  if (normalized === "PHOENIX") return "#DC2626";
  if (normalized === "TSUNAMI") return "#2563EB";
  if (normalized === "VIPER") return "#16A34A";
  if (normalized === "THUNDER") return "#CA8A04";
  return fallback ?? "#777777";
}

function getDifficulty(ptsPerMinute: number | null) {
  const ppm = ptsPerMinute ?? 10;
  if (ppm <= 9) return { label: "EASY", color: "#16A34A" };
  if (ppm <= 11) return { label: "MEDIUM", color: "#FFD700" };
  return { label: "HARD", color: "#DC2626" };
}

function toLocaleScore(value: number): string {
  return value.toLocaleString("en-US");
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Please log in first");
  }

  const { data } = await supabase
    .from("games")
    .select("id,name,source,type,embed_url,thumbnail_url,pts_per_minute,is_scored,is_active")
    .eq("is_active", true);
  const games = (data ?? []) as DbGame[];
  const game = games.find((item) => slugify(item.name) === slug);

  if (!game) {
    notFound();
  }

  const profileAttempt = await supabase
    .from("profiles")
    .select("id,username,house_id,house:houses(name,hex_code)")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();
  const userProfile = profileAttempt.data;
  const userName = (userProfile?.username ?? user.email?.split("@")[0] ?? "player").toUpperCase();
  const userHouseName = normalizeHouseName(userProfile?.house?.name);
  const userHouseColor = getHouseColor(userProfile?.house?.name, userProfile?.house?.hex_code);

  const sessionsAttempt = await supabase
    .from("game_sessions")
    .select("user_id,raw_score,points_earned")
    .eq("game_id", game.id)
    .not("ended_at", "is", null);
  const sessions = (sessionsAttempt.data ?? []) as SessionRow[];

  const userBestScore = sessions
    .filter((row) => row.user_id === user.id)
    .reduce((max, row) => Math.max(max, Number(row.raw_score ?? 0)), 0);

  const userIds = Array.from(new Set(sessions.map((row) => row.user_id)));
  const profilesById = new Map<string, ProfileRow>();

  if (userIds.length > 0) {
    const profileRows = await supabase
      .from("profiles")
      .select("id,username,house_id,house:houses(name,hex_code)")
      .in("id", userIds);
    for (const row of (profileRows.data ?? []) as ProfileRow[]) {
      profilesById.set(row.id, row);
    }
  }

  const houseTotals = new Map<string, { houseName: string; color: string; points: number }>();
  for (const row of sessions) {
    const profile = profilesById.get(row.user_id);
    const houseName = normalizeHouseName(profile?.house?.name);
    const key = houseName;
    const current = houseTotals.get(key) ?? {
      houseName,
      color: getHouseColor(profile?.house?.name, profile?.house?.hex_code),
      points: 0,
    };
    current.points += Number(row.points_earned ?? 0);
    houseTotals.set(key, current);
  }

  const leaderboard = Array.from(houseTotals.values())
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  while (leaderboard.length < 3) {
    const fallbackOrder = ["PHOENIX", "TSUNAMI", "VIPER"];
    const houseName = fallbackOrder[leaderboard.length];
    leaderboard.push({
      houseName,
      color: getHouseColor(houseName, null),
      points: 0,
    });
  }

  const difficulty = getDifficulty(game.pts_per_minute);
  const pointsReward = `${(game.pts_per_minute ?? 10) * 15} PTS`;
  const gameType = (game.type ?? "timed").toUpperCase();
  const category = game.source?.toUpperCase() === "GAMEDISTRIBUTION" ? "ARCADE" : (game.source ?? "WEB").toUpperCase();

  return (
    <section className="min-h-screen bg-[#F5F5F0]">
      <div className="flex h-16 w-full items-center justify-between bg-[#111111] px-5 md:px-10">
        <div className="flex items-center gap-6">
          <p className={`${playfair.className} text-[22px] font-bold text-white`}>HOUSEWARS</p>
          <p className={`${plexMono.className} text-[11px] font-semibold tracking-[0.18em] text-[#777777]`}>
            GAMES / {game.name.toUpperCase()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className={`${plexMono.className} text-[11px] font-semibold tracking-[0.08em] text-white`}>{userName}</p>
          <span
            className={`${plexMono.className} inline-flex h-7 items-center px-3 text-[10px] font-semibold tracking-[0.08em] text-white`}
            style={{ background: userHouseColor }}
          >
            {userHouseName}
          </span>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-5 py-8 md:px-10">
        <div className="flex flex-col gap-8 xl:flex-row">
          <div className="w-full space-y-6 xl:w-[calc(100%-480px)]">
            <h1 className={`${spaceGrotesk.className} text-5xl font-bold tracking-[-0.03em] text-[#111111] md:text-6xl`}>
              {game.name.toUpperCase()}
            </h1>

            <div className="overflow-hidden border-[3px] border-[#111111]">
              <div id="game-preview" className="bg-[#111111] p-0">
                <GameEmbed
                  embedUrl={game.embed_url}
                  title={game.name}
                  sessionGameId={game.id}
                  showExitButton={false}
                  iframeClassName="h-[495px] w-full border-0 bg-black"
                />
              </div>
            </div>

            <div className="grid h-16 grid-cols-3 overflow-hidden border-[3px] border-[#111111]">
              <div className="border-r-[3px] border-[#111111] px-4 py-2">
                <p className={`${plexMono.className} text-[10px] font-semibold tracking-[0.18em] text-[#777777]`}>TYPE</p>
                <p className={`${spaceGrotesk.className} text-sm font-bold tracking-[0.08em] text-[#111111]`}>{gameType}</p>
              </div>
              <div className="border-r-[3px] border-[#111111] px-4 py-2">
                <p className={`${plexMono.className} text-[10px] font-semibold tracking-[0.18em] text-[#777777]`}>CATEGORY</p>
                <p className={`${spaceGrotesk.className} text-sm font-bold tracking-[0.08em] text-[#111111]`}>{category}</p>
              </div>
              <div className="px-4 py-2">
                <p className={`${plexMono.className} text-[10px] font-semibold tracking-[0.18em] text-[#777777]`}>DIFFICULTY</p>
                <p className={`${spaceGrotesk.className} text-sm font-bold tracking-[0.08em]`} style={{ color: difficulty.color }}>
                  {difficulty.label}
                </p>
              </div>
            </div>

            <div className="overflow-hidden border-[3px] border-[#111111]">
              <div className="flex h-12 items-center bg-[#111111] px-5">
                <p className={`${spaceGrotesk.className} text-[13px] font-bold tracking-[0.16em] text-white`}>HOW TO PLAY</p>
              </div>
              {[
                "CLICK PLAY NOW TO START YOUR RUN",
                game.is_scored
                  ? "SCORE AS HIGH AS POSSIBLE BEFORE EXITING"
                  : `EARN ${game.pts_per_minute ?? 10} POINTS PER MINUTE SURVIVED`,
                "SESSION POINTS ARE ADDED TO YOUR HOUSE TOTAL",
                "LEAVE THE GAME PAGE TO LOCK IN YOUR SESSION SCORE",
              ].map((text, idx) => (
                <div
                  key={text}
                  className={`flex h-[52px] items-center gap-4 px-5 ${idx < 3 ? "border-b-2 border-[#DDDDDD]" : ""}`}
                >
                  <span className={`${plexMono.className} text-base font-bold text-[#FFD700]`}>{`0${idx + 1}`}</span>
                  <p className={`${plexMono.className} text-xs font-semibold tracking-[0.08em] text-[#111111]`}>{text}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="w-full overflow-hidden border-[3px] border-[#111111] xl:w-[448px]">
            <div className="flex h-12 items-center bg-[#111111] px-5">
              <p className={`${spaceGrotesk.className} text-[13px] font-bold tracking-[0.16em] text-white`}>GAME INFO</p>
            </div>

            <div className="space-y-2 border-b-[3px] border-[#111111] px-5 py-5">
              <p className={`${plexMono.className} text-[10px] font-semibold tracking-[0.18em] text-[#777777]`}>POINTS REWARD</p>
              <p className={`${spaceGrotesk.className} text-[42px] leading-none font-bold tracking-[-0.03em] text-[#FFD700]`}>
                {pointsReward}
              </p>
            </div>

            <div className="space-y-2 border-b-[3px] border-[#111111] px-5 py-5">
              <p className={`${plexMono.className} text-[10px] font-semibold tracking-[0.18em] text-[#777777]`}>YOUR BEST SCORE</p>
              <p className={`${spaceGrotesk.className} text-[36px] leading-none font-bold text-[#111111]`}>
                {toLocaleScore(userBestScore)}
              </p>
              <p className={`${plexMono.className} text-[10px] font-semibold tracking-[0.08em] text-[#777777]`}>
                PERSONAL RECORD - KEEP PUSHING
              </p>
            </div>

            <div className="space-y-2 border-b-[3px] border-[#333333] bg-[#111111] px-5 py-5">
              <p className={`${plexMono.className} text-[10px] font-semibold tracking-[0.18em] text-[#FFD700]`}>HOUSE BONUS ACTIVE</p>
              <p className={`${plexMono.className} text-xs font-semibold tracking-[0.08em] text-white`}>
                TOP 10% EARNS DOUBLE FOR {userHouseName}
              </p>
            </div>

            <div className="flex h-10 items-center justify-between border-b-2 border-[#DDDDDD] px-5">
              <p className={`${plexMono.className} text-[10px] font-semibold tracking-[0.18em] text-[#777777]`}>HOUSE LEADERBOARD</p>
              <p className={`${plexMono.className} text-[10px] font-semibold tracking-[0.08em] text-[#777777]`}>THIS GAME</p>
            </div>

            {leaderboard.map((row, idx) => (
              <div key={row.houseName} className={`flex h-12 items-center justify-between px-5 ${idx < 2 ? "border-b-2 border-[#EEEEEE]" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3" style={{ background: row.color }} />
                  <span className={`${plexMono.className} text-[11px] font-bold tracking-[0.08em] text-[#777777]`}>{`0${idx + 1}`}</span>
                  <span className={`${plexMono.className} text-xs font-bold tracking-[0.08em] text-[#111111]`}>{row.houseName}</span>
                </div>
                <span className={`${spaceGrotesk.className} text-sm font-bold text-[#111111]`}>{toLocaleScore(row.points)}</span>
              </div>
            ))}
          </aside>
        </div>

      </div>
    </section>
  );
}
