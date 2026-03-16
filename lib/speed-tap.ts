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

type SupabaseLike = {
  from: (table: string) => {
    select: (
      columns: string,
    ) => {
      eq: (
        column: string,
        value: string,
      ) => Promise<{ data: BasicGameRow[] | null; error: { message?: string } | null }>;
    };
    insert: (payload: Record<string, unknown>) => {
      select: (columns: string) => {
        single: <T>() => Promise<{ data: T | null; error: { message?: string } | null }>;
      };
    };
    update: (payload: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<{ error: { message?: string } | null }>;
    };
  };
};

export async function ensureSpeedTapGame(supabase: SupabaseLike): Promise<void> {
  const existing = await supabase
    .from("games")
    .select("id,name,thumbnail_url,embed_url,is_scored,is_active")
    .eq("embed_url", SPEED_TAP_EMBED_URL);

  const matches = existing.data ?? [];

  if (matches.length > 0) {
    const primary = matches.find((row) => row.is_active) ?? matches[0];

    await supabase
      .from("games")
      .update({
        name: SPEED_TAP_NAME,
        thumbnail_url: SPEED_TAP_THUMBNAIL,
        embed_url: SPEED_TAP_EMBED_URL,
        source: "custom",
        type: "scored",
        pts_per_minute: 0,
        is_scored: true,
        is_active: true,
      })
      .eq("id", primary.id);

    for (const duplicate of matches) {
      if (duplicate.id === primary.id) continue;
      await supabase.from("games").update({ is_active: false }).eq("id", duplicate.id);
    }

    return;
  }

  await supabase
    .from("games")
    .insert({
      name: SPEED_TAP_NAME,
      thumbnail_url: SPEED_TAP_THUMBNAIL,
      embed_url: SPEED_TAP_EMBED_URL,
      source: "custom",
      type: "scored",
      pts_per_minute: 0,
      is_scored: true,
      is_active: true,
    })
    .select("id")
    .single<{ id: string }>();
}
