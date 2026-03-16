import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SessionRow = {
  id: string;
  user_id: string;
  game_id: string;
  started_at: string;
  ended_at: string | null;
  raw_score: number | null;
  points_earned: number | null;
};

type GameRow = {
  id: string;
  is_scored: boolean;
  pts_per_minute: number | null;
};

async function resolveHouseInfo(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, userId: string) {
  const profileAttempt = await supabase
    .from("profiles")
    .select("house_id, house:houses(hex_code)")
    .eq("id", userId)
    .maybeSingle();

  if (!profileAttempt.error && profileAttempt.data?.house_id) {
    return {
      houseId: profileAttempt.data.house_id as string,
      houseColor:
        (profileAttempt.data.house as { hex_code?: string } | null)?.hex_code ??
        "#DC2626",
    };
  }

  return { houseId: null, houseColor: "#DC2626" };
}

export async function POST(request: Request) {
  try {
    const { session_id: sessionId } = (await request.json()) as { session_id?: string };

    if (!sessionId) {
      return NextResponse.json({ error: "session_id is required" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: session, error: sessionError } = await supabase
      .from("game_sessions")
      .select("id,user_id,game_id,started_at,ended_at,raw_score,points_earned")
      .eq("id", sessionId)
      .single<SessionRow>();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: sessionError?.message ?? "Session not found" },
        { status: 404 },
      );
    }

    if (session.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (session.ended_at) {
      return NextResponse.json({
        points_earned: session.points_earned ?? 0,
        house_color: "#DC2626",
        already_ended: true,
      });
    }

    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("id,is_scored,pts_per_minute")
      .eq("id", session.game_id)
      .single<GameRow>();

    if (gameError || !game) {
      return NextResponse.json(
        { error: gameError?.message ?? "Game not found for session" },
        { status: 500 },
      );
    }

    const durationSeconds = Math.max(
      0,
      Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000),
    );

    const rawScore = Number(session.raw_score ?? 0);
    const pointsEarned = game.is_scored
      ? Math.min(Math.floor(rawScore / 10), 500)
      : Math.floor(durationSeconds / 60) * Number(game.pts_per_minute ?? 0);

    const { error: updateError } = await supabase
      .from("game_sessions")
      .update({
        ended_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
        points_earned: pointsEarned,
      })
      .eq("id", session.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const { houseId, houseColor } = await resolveHouseInfo(supabase, user.id);

    if (!houseId) {
      return NextResponse.json(
        { error: "Could not resolve house_id for current user" },
        { status: 500 },
      );
    }

    const { error: awardError } = await supabase.rpc("award_points", {
      p_user_id: user.id,
      p_house_id: houseId,
      p_points: pointsEarned,
    });

    if (awardError) {
      return NextResponse.json({ error: awardError.message }, { status: 500 });
    }

    revalidatePath("/dashboard");
    revalidatePath("/leaderboard");

    return NextResponse.json({
      points_earned: pointsEarned,
      house_color: houseColor,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500 },
    );
  }
}
