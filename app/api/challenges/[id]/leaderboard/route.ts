import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const challengeId = String(id ?? "").trim();
    if (!challengeId) {
      return NextResponse.json({ error: "Invalid challenge id" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("challenge_entries")
      .select("id,user_id,best_score,attempts,gp_awarded,rank,profile:profiles(username,house:houses(name,hex_code))")
      .eq("challenge_id", challengeId)
      .order("best_score", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const ranked = (data ?? []).map((row, idx) => {
      const parsed = row as {
        id?: string;
        user_id?: string;
        best_score?: number | null;
        attempts?: number | null;
        gp_awarded?: number | null;
        rank?: number | null;
        profile?:
          | {
              username?: string | null;
              house?: { name?: string | null; hex_code?: string | null } | { name?: string | null; hex_code?: string | null }[] | null;
            }
          | null;
      };
      const house = Array.isArray(parsed.profile?.house)
        ? parsed.profile?.house[0]
        : parsed.profile?.house;
      return {
        id: parsed.id ?? "",
        user_id: parsed.user_id ?? "",
        username: parsed.profile?.username ?? "player",
        house_name: house?.name ?? null,
        house_hex: house?.hex_code ?? null,
        best_score: Number(parsed.best_score ?? 0),
        attempts: Number(parsed.attempts ?? 0),
        gp_awarded: Number(parsed.gp_awarded ?? 0),
        rank: Number(parsed.rank ?? idx + 1),
      };
    });

    return NextResponse.json({ challenge_id: challengeId, leaderboard: ranked });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected leaderboard error" },
      { status: 500 },
    );
  }
}
