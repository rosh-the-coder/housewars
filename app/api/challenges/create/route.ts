import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      game_id?: string;
      title?: string;
      ct_entry_cost?: number;
      gp_reward?: number;
      duration_hours?: number;
    };

    const gameId = String(body.game_id ?? "").trim();
    const title = String(body.title ?? "").trim();
    const ctEntryCost = Math.max(5, Math.floor(Number(body.ct_entry_cost ?? 5)));
    const gpReward = Math.max(25, Math.floor(Number(body.gp_reward ?? 25)));
    const durationHoursRaw = Math.floor(Number(body.duration_hours ?? 24));
    const durationHours = [12, 24, 48].includes(durationHoursRaw) ? durationHoursRaw : 24;

    if (!gameId || !title) {
      return NextResponse.json({ error: "game_id and title are required" }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("challenge_tokens")
      .eq("id", user.id)
      .single();
    if (profileError || !profile) {
      return NextResponse.json({ error: profileError?.message ?? "Profile not found" }, { status: 400 });
    }
    if (Number(profile.challenge_tokens ?? 0) < ctEntryCost) {
      return NextResponse.json({ error: "Insufficient CT balance" }, { status: 400 });
    }

    const rpcResult = await supabase.rpc("create_challenge", {
      p_creator_id: user.id,
      p_game_id: gameId,
      p_title: title,
      p_ct_entry_cost: ctEntryCost,
      p_gp_reward: gpReward,
      p_hours: durationHours,
    });
    if (rpcResult.error) {
      return NextResponse.json({ error: rpcResult.error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, challenge: rpcResult.data ?? null });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error creating challenge" },
      { status: 500 },
    );
  }
}
