import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { resolveBasePoints, resolveCpFromBase } from "@/lib/points";
import { slugify } from "@/lib/slug";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SessionRow = {
  id: string;
  user_id: string;
  game_id: string;
  started_at: string;
  ended_at: string | null;
  raw_score: number | null;
  gp_earned: number | null;
  ct_earned: number | null;
};

type GameRow = {
  id: string;
  name: string;
  is_scored: boolean;
  ct_reward: number | null;
  pts_per_minute: number | null;
  difficulty_multiplier: number | null;
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
    const {
      session_id: sessionId,
      metric_value: metricValueInput,
      metric_type: metricTypeInput,
    } = (await request.json()) as {
      session_id?: string;
      metric_value?: number;
      metric_type?: string;
    };

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
      .select("id,user_id,game_id,started_at,ended_at,raw_score,gp_earned,ct_earned")
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
        gp_earned: session.gp_earned ?? 0,
        ct_earned: session.ct_earned ?? 0,
        house_color: "#DC2626",
        already_ended: true,
      });
    }

    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("id,name,is_scored,ct_reward,pts_per_minute,difficulty_multiplier")
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

    const metricType = String(metricTypeInput ?? "").trim().toLowerCase();
    const { basePoints, rawScore } = resolveBasePoints({
      metricValue: metricValueInput,
      metricType,
      fallbackRawScore: Number(session.raw_score ?? 0),
      isScored: game.is_scored,
      durationSeconds,
      ptsPerMinute: Number(game.pts_per_minute ?? 0),
    });
    const multiplier = Number(game.difficulty_multiplier ?? 1);
    const gpEarned = resolveCpFromBase(basePoints, multiplier);
    const ctEarned = Math.max(0, Math.round(game.ct_reward ?? 0));

    const { error: updateError } = await supabase
      .from("game_sessions")
      .update({
        ended_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
        raw_score: rawScore,
        gp_earned: gpEarned,
        ct_earned: ctEarned,
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

    const { error: profileAwardError } = await supabase.rpc("increment_profile_points", {
      p_user_id: user.id,
      p_gp: gpEarned,
      p_ct: ctEarned,
    });
    if (profileAwardError) {
      return NextResponse.json({ error: profileAwardError.message }, { status: 500 });
    }

    const { error: houseAwardError } = await supabase.rpc("increment_house_points", {
      p_house_id: houseId,
      p_gp: gpEarned,
    });
    if (houseAwardError) {
      return NextResponse.json({ error: houseAwardError.message }, { status: 500 });
    }

    const [profileResult, rankAttempt] = await Promise.all([
      supabase
        .from("profiles")
        .select("gp_weekly,challenge_tokens")
        .eq("id", user.id)
        .single(),
      supabase
        .from("profiles")
        .select("id,gp_alltime")
        .order("gp_alltime", { ascending: false }),
    ]);

    const updatedProfile = profileResult.data as {
      gp_weekly?: number;
      challenge_tokens?: number;
    } | null;

    const rank =
      (rankAttempt.data ?? []).findIndex(
        (row) => (row as { id?: string }).id === user.id,
      ) + 1;

    revalidatePath("/dashboard");
    revalidatePath("/games");
    revalidatePath(`/games/${slugify(game.name)}`);
    revalidatePath("/leaderboard");

    return NextResponse.json({
      gp_earned: gpEarned,
      ct_earned: ctEarned,
      multiplier,
      rank: rank > 0 ? rank : null,
      total_players: (rankAttempt.data ?? []).length,
      weekly_gp_total: Number(updatedProfile?.gp_weekly ?? 0),
      ct_balance: Number(updatedProfile?.challenge_tokens ?? 0),
      house_color: houseColor,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500 },
    );
  }
}
