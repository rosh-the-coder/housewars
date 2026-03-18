export const SPEED_TAP_NAME = "Speed Tap";
export const SPEED_TAP_EMBED_URL = "/games/speed-tap/index.html";
export const SPEED_TAP_THUMBNAIL = null;

type BasicGameRow = {
  id: string;
  name: string;
  thumbnail_url: string | null;
  embed_url: string;
  is_scored: boolean;
  is_active: boolean;
};

type GamesTableApi = {
  select: (columns: string) => {
    eq: (column: string, value: string) => PromiseLike<unknown>;
  };
  insert: (payload: Record<string, unknown>) => {
    select: (columns: string) => {
      single: <T>() => PromiseLike<{ data: T | null; error: { message?: string } | null }>;
    };
  };
  update: (payload: Record<string, unknown>) => {
    eq: (column: string, value: string) => PromiseLike<unknown>;
  };
};

type MinimalSupabase = {
  from: (table: string) => unknown;
};

export async function ensureSpeedTapGame(supabase: MinimalSupabase): Promise<void> {
  const games = supabase.from("games") as GamesTableApi;
  const existing = (await games
    .select("id,name,thumbnail_url,embed_url,is_scored,is_active")
    .eq("embed_url", SPEED_TAP_EMBED_URL)) as {
    data: BasicGameRow[] | null;
    error: { message?: string } | null;
  };

  const matches = existing.data ?? [];

  if (matches.length > 0) {
    const primary = matches.find((row) => row.is_active) ?? matches[0];

    await games
      .update({
        name: SPEED_TAP_NAME,
        thumbnail_url: SPEED_TAP_THUMBNAIL,
        embed_url: SPEED_TAP_EMBED_URL,
        type: "scored",
        difficulty: "medium",
        difficulty_multiplier: 1.0,
        ct_reward: 25,
        is_scored: true,
        is_active: true,
      })
      .eq("id", primary.id);

    for (const duplicate of matches) {
      if (duplicate.id === primary.id) continue;
      await games.update({ is_active: false }).eq("id", duplicate.id);
    }

    return;
  }

  await games
    .insert({
      name: SPEED_TAP_NAME,
      thumbnail_url: SPEED_TAP_THUMBNAIL,
      embed_url: SPEED_TAP_EMBED_URL,
      type: "scored",
      difficulty: "medium",
      difficulty_multiplier: 1.0,
      ct_reward: 25,
      is_scored: true,
      is_active: true,
    })
    .select("id")
    .single<{ id: string }>();
}
