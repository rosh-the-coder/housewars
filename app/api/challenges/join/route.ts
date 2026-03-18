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
    if (!profile.house_id) {
      return NextResponse.json({ error: "Please choose a house first" }, { status: 400 });
    }

    const entryCost = Math.max(0, Number(challenge.ct_entry_cost ?? 0));
    const currentCt = Number(profile.challenge_tokens ?? 0);
    if (currentCt < entryCost) {
      return NextResponse.json({ error: "Insufficient CT balance" }, { status: 400 });
    }

    const { error: tokenError } = await supabase
      .from("profiles")
      .update({ challenge_tokens: currentCt - entryCost })
      .eq("id", user.id);
    if (tokenError) {
      return NextResponse.json({ error: tokenError.message }, { status: 500 });
    }

    const { error: challengeUpdateError } = await supabase
      .from("challenges")
      .update({ ct_pool: Number(challenge.ct_pool ?? 0) + entryCost })
      .eq("id", challengeId);
    if (challengeUpdateError) {
      return NextResponse.json({ error: challengeUpdateError.message }, { status: 500 });
    }

    const { error: entryError } = await supabase.from("challenge_entries").insert({
      challenge_id: challengeId,
      user_id: user.id,
      house_id: profile.house_id,
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
