import { IBM_Plex_Mono, Playfair_Display, Space_Grotesk } from "next/font/google";
import { notFound, redirect } from "next/navigation";
import { GameEmbed } from "@/components/game-embed";
import { ensureSpeedTapGame, SPEED_TAP_EMBED_URL } from "@/lib/speed-tap";
import { slugify } from "@/lib/slug";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["700"] });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["600", "700"] });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["500", "700"] });

type GamePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ challenge_id?: string }>;
};

type DbGame = {
  id: string;
  name: string;
  type: string | null;
  difficulty: string | null;
  embed_url: string;
  thumbnail_url: string | null;
  ct_reward: number | null;
  pts_per_minute: number | null;
  difficulty_multiplier: number | null;
  is_scored: boolean;
  is_active: boolean;
};

type SessionRow = {
  user_id: string;
  raw_score: number | null;
  gp_earned: number | null;
  ct_earned: number | null;
};

type ProfileRow = {
  id: string;
  username: string | null;
  house_id: string | null;
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

function getDifficulty(difficulty: string | null) {
  const value = (difficulty ?? "").toLowerCase();
  if (value === "easy") return { label: "EASY", color: "#16A34A" };
  if (value === "hard") return { label: "HARD", color: "#DC2626" };
  return { label: "MEDIUM", color: "#FFD700" };
}

function toLocaleScore(value: number): string {
  return value.toLocaleString("en-US");
}

export default async function GamePage({ params, searchParams }: GamePageProps) {
  const { slug } = await params;
  const { challenge_id: challengeIdRaw } = await searchParams;
  const challengeId = String(challengeIdRaw ?? "").trim();
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Please log in first");
  }

  await ensureSpeedTapGame(supabase);

  const { data } = await supabase
    .from("games")
    .select("id,name,type,difficulty,embed_url,thumbnail_url,ct_reward,pts_per_minute,difficulty_multiplier,is_scored,is_active")
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
    .maybeSingle();
  const userProfile = profileAttempt.data;
  const currentHouse = Array.isArray(userProfile?.house) ? userProfile?.house[0] : userProfile?.house;
  const userName = (userProfile?.username ?? user.email?.split("@")[0] ?? "player").toUpperCase();
  const sdkPlayerName = userProfile?.username ?? user.email?.split("@")[0] ?? "player";
  const userHouseName = normalizeHouseName(currentHouse?.name);
  const userHouseColor = getHouseColor(currentHouse?.name, currentHouse?.hex_code);

  const isSpeedTap = game.embed_url === SPEED_TAP_EMBED_URL;
  const speedTapGameIds = games
    .filter((row) => row.embed_url === SPEED_TAP_EMBED_URL)
    .map((row) => row.id);
  const sessionGameIds = isSpeedTap
    ? Array.from(new Set([game.id, ...speedTapGameIds]))
    : [game.id];

  const sessionsAttempt = await supabase
    .from("game_sessions")
    .select("user_id,raw_score,gp_earned,ct_earned")
    .in("game_id", sessionGameIds)
    .not("ended_at", "is", null);
  const sessions = (sessionsAttempt.data ?? []) as SessionRow[];

  const userBestScore = sessions
    .filter((row) => row.user_id === user.id)
    .reduce(
      (max, row) => Math.max(max, Number(row.gp_earned ?? 0)),
      0,
    );

  const { data: houseRows } = await supabase
    .from("houses")
    .select("id,name,hex_code,gp_weekly")
    .order("gp_weekly", { ascending: false })
    .limit(4);

  const leaderboard = ((houseRows ?? []) as { id: string; name: string; hex_code: string | null; gp_weekly: number | null }[])
    .map((h) => ({
      houseName: normalizeHouseName(h.name),
      color: h.hex_code ?? getHouseColor(h.name, null),
      gp_weekly: Number(h.gp_weekly ?? 0),
    }))
    .slice(0, 3);

  const difficulty = getDifficulty(game.difficulty);
  const multiplierLabel = Number(game.difficulty_multiplier ?? 1).toFixed(2);
  const gpRewardModel = isSpeedTap
    ? `CT 100 / 250 / 500 | GP x${multiplierLabel}`
    : `CT ${game.ct_reward ?? 0} | GP x${multiplierLabel}`;
  const gameType = (game.type ?? "timed").toUpperCase();
  const category = (game.type ?? "web").toUpperCase();
  const howToPlay = isSpeedTap
    ? [
        "WAIT FOR GAME START THEN PICK EASY / MEDIUM / HARD",
        "CLICK ONLY YOUR HOUSE-COLOR TARGET BALL",
        "MEDIUM ADDS DECOYS + MOVEMENT, HARD FAILS ON WRONG TAP",
        "FASTER REACTION + HIGHER DIFFICULTY = MORE CT",
      ]
    : [
        "CLICK PLAY NOW TO START YOUR RUN",
        game.is_scored
          ? "SCORE AS HIGH AS POSSIBLE BEFORE EXITING"
          : `EARN GP USING DIFFICULTY MULTIPLIER (CT BONUS ${game.ct_reward ?? 0})`,
        "YOUR GP ADDS TO BOTH PLAYER AND HOUSE RANKINGS",
        "LEAVE THE GAME PAGE TO LOCK IN YOUR SESSION SCORE",
      ];

  let challengeContext: { id: string; title: string } | null = null;
  if (challengeId) {
    const [challengeAttempt, entryAttempt] = await Promise.all([
      supabase
        .from("challenges")
        .select("id,title,status,ends_at,game_id")
        .eq("id", challengeId)
        .maybeSingle(),
      supabase
        .from("challenge_entries")
        .select("id")
        .eq("challenge_id", challengeId)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    const challenge = challengeAttempt.data as
      | {
          id?: string;
          title?: string | null;
          status?: string | null;
          ends_at?: string | null;
          game_id?: string | null;
        }
      | null;
    const isOpen = (challenge?.status ?? "").toLowerCase() === "open";
    const matchesGame = String(challenge?.game_id ?? "") === game.id;
    if (challenge?.id && entryAttempt.data?.id && isOpen && matchesGame) {
      challengeContext = {
        id: challenge.id,
        title: String(challenge.title ?? "Challenge"),
      };
    }
  }

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
              {challengeContext ? (
                <div className="border-b-[3px] border-[#111111] px-5 py-3" style={{ background: userHouseColor }}>
                  <p className={`${plexMono.className} text-xs font-bold tracking-[0.08em] text-white`}>
                    CHALLENGE ACTIVE - {challengeContext.title} | Your best score counts
                  </p>
                </div>
              ) : null}
              <div id="game-preview" className="bg-[#111111] p-0">
                <GameEmbed
                  embedUrl={game.embed_url}
                  title={game.name}
                  sessionGameId={game.id}
                  challengeContext={challengeContext}
                  user={{
                    username: sdkPlayerName,
                    house: {
                      name: currentHouse?.name ?? userHouseName,
                      hex_code: currentHouse?.hex_code ?? userHouseColor,
                    },
                  }}
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
              {howToPlay.map((text, idx) => (
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
              <p className={`${plexMono.className} text-[10px] font-semibold tracking-[0.18em] text-[#777777]`}>REWARD MODEL</p>
              <p className={`${spaceGrotesk.className} text-[42px] leading-none font-bold tracking-[-0.03em] text-[#FFD700]`}>
                {gpRewardModel}
              </p>
              {isSpeedTap ? (
                <p className={`${plexMono.className} text-[10px] font-semibold tracking-[0.08em] text-[#777777]`}>
                  EASY / MEDIUM / HARD
                </p>
              ) : null}
            </div>

            <div className="space-y-2 border-b-[3px] border-[#111111] px-5 py-5">
              <p className={`${plexMono.className} text-[10px] font-semibold tracking-[0.18em] text-[#777777]`}>
                YOUR BEST GP
              </p>
              <p className={`${spaceGrotesk.className} text-[36px] leading-none font-bold text-[#111111]`}>
                {toLocaleScore(userBestScore)}
              </p>
              <p className={`${plexMono.className} text-[10px] font-semibold tracking-[0.08em] text-[#777777]`}>
                PERSONAL RECORD - KEEP PUSHING
              </p>
            </div>

            <div className="flex h-10 items-center justify-between border-b-2 border-[#DDDDDD] px-5">
              <p className={`${plexMono.className} text-[10px] font-semibold tracking-[0.18em] text-[#777777]`}>HOUSE LEADERBOARD</p>
              <p className={`${plexMono.className} text-[10px] font-semibold tracking-[0.08em] text-[#777777]`}>WEEKLY GP</p>
            </div>

            {leaderboard.map((row, idx) => (
              <div key={row.houseName} className={`flex h-12 items-center justify-between px-5 ${idx < 2 ? "border-b-2 border-[#EEEEEE]" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3" style={{ background: row.color }} />
                  <span className={`${plexMono.className} text-[11px] font-bold tracking-[0.08em] text-[#777777]`}>{`0${idx + 1}`}</span>
                  <span className={`${plexMono.className} text-xs font-bold tracking-[0.08em] text-[#111111]`}>{row.houseName}</span>
                </div>
                <span className={`${spaceGrotesk.className} text-sm font-bold text-[#111111]`}>
                  {toLocaleScore(row.gp_weekly)}
                </span>
              </div>
            ))}
          </aside>
        </div>

      </div>
    </section>
  );
}
