import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const challengeId = String(id ?? "").trim();
    if (!challengeId) {
      return NextResponse.json({ error: "Invalid challenge id" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const db = supabase as any;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { score?: number };
    const submittedScore = Math.max(0, Math.round(Number(body.score ?? 0)));

    const { data: challenge, error: challengeError } = await db
      .from("challenges")
      .select("id,status,ends_at")
      .eq("id", challengeId)
      .maybeSingle();
    if (challengeError || !challenge) {
      return NextResponse.json(
        { error: challengeError?.message ?? "Challenge not found" },
        { status: 404 },
      );
    }

    const challengeRow = challenge as { id?: string; status?: string | null; ends_at?: string | null };
    const challengeStatus = String(challengeRow.status ?? "").toLowerCase();
    if (challengeStatus === "cancelled" || challengeStatus === "completed") {
      return NextResponse.json({ error: "Challenge has ended" }, { status: 400 });
    }
    if (challengeRow.ends_at && new Date(challengeRow.ends_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: "Challenge has ended" }, { status: 400 });
    }

    const { data: entry, error: entryError } = await db
      .from("challenge_entries")
      .select("id,best_score,attempts")
      .eq("challenge_id", challengeId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (entryError || !entry) {
      return NextResponse.json(
        { error: entryError?.message ?? "You have not joined this challenge" },
        { status: 404 },
      );
    }

    const entryRow = entry as { id: string; best_score?: number | null; attempts?: number | null };
    const previousBest = Number(entryRow.best_score ?? 0);
    const nextBest = Math.max(previousBest, submittedScore);
    const nextAttempts = Number(entryRow.attempts ?? 0) + 1;
    const didImprove = nextBest > previousBest;

    const { error: updateError } = await db
      .from("challenge_entries")
      .update({
        attempts: nextAttempts,
        best_score: didImprove ? nextBest : previousBest,
      })
      .eq("id", entryRow.id);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const { data: rankedRows, error: rankError } = await db
      .from("challenge_entries")
      .select("id,user_id,best_score")
      .eq("challenge_id", challengeId)
      .order("best_score", { ascending: false });
    if (rankError) {
      return NextResponse.json({ error: rankError.message }, { status: 500 });
    }

    const ordered = rankedRows ?? [];
    const rankIndex = ordered.findIndex((row: { user_id?: string }) => row.user_id === user.id);
    const rank = rankIndex >= 0 ? rankIndex + 1 : null;
    const totalPlayers = ordered.length;

    if (rank) {
      await db
        .from("challenge_entries")
        .update({ rank })
        .eq("id", entryRow.id);
    }

    revalidatePath("/challenges");
    revalidatePath("/games");

    return NextResponse.json({
      challenge_id: challengeId,
      rank,
      total_players: totalPlayers,
      best_score: didImprove ? nextBest : previousBest,
      attempts: nextAttempts,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected challenge submit error" },
      { status: 500 },
    );
  }
}
