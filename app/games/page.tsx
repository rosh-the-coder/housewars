import Link from "next/link";
import { redirect } from "next/navigation";
import { jetMono, oswald } from "@/lib/fonts";
import { ensureSpeedTapGame, SPEED_TAP_EMBED_URL } from "@/lib/speed-tap";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

export const dynamic = "force-dynamic";

type DbGame = {
  id: string;
  name: string;
  thumbnail_url: string | null;
  embed_url: string;
  is_scored: boolean;
  is_active: boolean;
};

const GAME_THUMBNAIL_V1: Record<string, string> = {
  "Speed Tap": "/thumbnails/Speed%20Tap%201.png",
  "Word Scramble": "/thumbnails/Word%20Scramble%201.jpeg",
  "Memory Grid": "/thumbnails/Memory%20Grid%201.jpeg",
  "Math Blitz": "/thumbnails/Math%20Blitz%201.jpeg",
  "Colour Reflex": "/thumbnails/Colour%20Reflex%201.png",
  "Tile Flood": "/thumbnails/Tile%20Flood%201.jpeg",
};

export default async function GamesLobbyPage() {
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
    .select("id,name,thumbnail_url,embed_url,is_scored,is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const games = ((data ?? []) as DbGame[]).sort((a, b) => {
    const aIsLocalSpeedTap = a.embed_url === SPEED_TAP_EMBED_URL;
    const bIsLocalSpeedTap = b.embed_url === SPEED_TAP_EMBED_URL;
    if (aIsLocalSpeedTap && !bIsLocalSpeedTap) return -1;
    if (!aIsLocalSpeedTap && bIsLocalSpeedTap) return 1;
    return a.name.localeCompare(b.name);
  });

  const scoredGames = games.filter((game) => game.is_scored).length;
  const timedGames = games.filter((game) => !game.is_scored).length;

  return (
    <section className="min-h-screen bg-[#F5F5F0] px-4 py-10 text-[#0D0D0D] md:px-12">
      <div className="mx-auto max-w-[1440px] space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className={`${oswald.className} text-5xl uppercase leading-none md:text-6xl`}>
            Game Lobby
          </h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={`${jetMono.className} rounded-full border-[3px] border-[#0D0D0D] bg-[#0D0D0D] px-6 py-2 text-[11px] font-semibold text-white`}
            >
              ALL ({games.length})
            </button>
            <button
              type="button"
              className={`${jetMono.className} rounded-full border-[3px] border-[#0D0D0D] bg-[#F5F5F0] px-6 py-2 text-[11px] font-semibold`}
            >
              SCORED ({scoredGames})
            </button>
            <button
              type="button"
              className={`${jetMono.className} rounded-full border-[3px] border-[#0D0D0D] bg-[#F5F5F0] px-6 py-2 text-[11px] font-semibold`}
            >
              TIMED ({timedGames})
            </button>
          </div>
        </header>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {games.length === 0 ? (
          <article className="col-span-full border-[3px] border-[#0D0D0D] bg-white p-6 text-center">
            <p className={`${jetMono.className} text-sm font-semibold text-[#0D0D0D]`}>
              No active games found in Supabase. Add rows to `games` with `is_active = true`.
            </p>
          </article>
        ) : (
          games.map((game) => {
            const thumbnailSrc = GAME_THUMBNAIL_V1[game.name] ?? game.thumbnail_url;

            return (
              <article
                key={game.id}
                className="group relative overflow-hidden border-[3px] border-[#0D0D0D] bg-[#F5F5F0] transition-all duration-200 hover:-translate-y-1 hover:shadow-[8px_8px_0_#0D0D0D]"
              >
                <div className="relative h-40 w-full overflow-hidden bg-[#1A1A1A]">
                  {thumbnailSrc ? (
                    <img
                      src={thumbnailSrc}
                      alt={`${game.name} thumbnail`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : null}
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-tr from-black/15 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                </div>
                <div className="space-y-2 p-4">
                  <h2
                    className={`${oswald.className} text-3xl uppercase leading-none transition-transform duration-200 group-hover:translate-x-1`}
                  >
                    {game.name}
                  </h2>
                  <span
                    className={`${jetMono.className} inline-block px-2.5 py-1 text-[11px] font-semibold transition-transform duration-200 group-hover:-translate-y-0.5`}
                    style={{ background: game.is_scored ? "#FF6B35" : "#00D4AA" }}
                  >
                    {game.is_scored ? "SCORED" : "TIMED"}
                  </span>
                </div>
                <div className="bg-[#0D0D0D] px-3 py-3 text-center">
                  <Link
                    href={`/games/${slugify(game.name)}`}
                    className={`${jetMono.className} inline-block text-xs font-semibold tracking-[0.04em] text-white transition-all duration-200 group-hover:translate-x-1 group-hover:underline`}
                  >
                    PLAY NOW →
                  </Link>
                </div>
              </article>
            );
          })
        )}
        </div>
      </div>
    </section>
  );
}
