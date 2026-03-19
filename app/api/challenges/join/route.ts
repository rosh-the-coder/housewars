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

    const body = (await request.json()) as { challenge_id?: string };
    const challengeId = String(body.challenge_id ?? "").trim();
    if (!challengeId) {
      return NextResponse.json({ error: "challenge_id is required" }, { status: 400 });
    }

    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .select("id,status,ends_at,ct_entry_cost,ct_pool")
      .eq("id", challengeId)
      .single();
    if (challengeError || !challenge) {
      return NextResponse.json({ error: challengeError?.message ?? "Challenge not found" }, { status: 404 });
    }

    if ((challenge.status ?? "").toLowerCase() !== "open") {
      return NextResponse.json({ error: "Challenge is not open" }, { status: 400 });
    }
    if (new Date(String(challenge.ends_at)).getTime() <= Date.now()) {
      return NextResponse.json({ error: "Challenge already ended" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("challenge_entries")
      .select("id")
      .eq("challenge_id", challengeId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({ error: "You already joined this challenge" }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("house_id,challenge_tokens")
      .eq("id", user.id)
      .single();
    if (profileError || !profile) {
      return NextResponse.json({ error: profileError?.message ?? "Profile not found" }, { status: 404 });
    }
    if (!(profile as { house_id?: string }).house_id) {
      return NextResponse.json({ error: "Please choose a house first" }, { status: 400 });
    }

    const entryCost = Math.max(0, Number((challenge as { ct_entry_cost?: number }).ct_entry_cost ?? 0));
    const currentCt = Number((profile as { challenge_tokens?: number }).challenge_tokens ?? 0);
    if (currentCt < entryCost) {
      return NextResponse.json({ error: "Insufficient CT balance" }, { status: 400 });
    }

    const { error: deductError } = await supabase.rpc("increment_profile_points", {
      p_user_id: user.id,
      p_gp: 0,
      p_ct: -entryCost,
    });
    if (deductError) {
      return NextResponse.json({ error: deductError.message }, { status: 500 });
    }

    const { error: poolError } = await supabase.rpc("increment_challenge_pool", {
      p_challenge_id: challengeId,
      p_amount: entryCost,
    });
    if (poolError) {
      return NextResponse.json({ error: poolError.message }, { status: 500 });
    }

    const { error: entryError } = await supabase.from("challenge_entries").insert({
      challenge_id: challengeId,
      user_id: user.id,
      house_id: (profile as { house_id: string }).house_id,
      best_score: 0,
      attempts: 0,
      gp_awarded: 0,
      rank: null,
    });
    if (entryError) {
      return NextResponse.json({ error: entryError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error joining challenge" },
      { status: 500 },
    );
  }
}
