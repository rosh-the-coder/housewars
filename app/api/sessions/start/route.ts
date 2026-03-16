import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { game_id: gameId } = (await request.json()) as { game_id?: string };

    if (!gameId) {
      return NextResponse.json({ error: "game_id is required" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("id,is_active")
      .eq("id", gameId)
      .maybeSingle();

    if (gameError || !game || !game.is_active) {
      return NextResponse.json({ error: "Invalid or inactive game_id" }, { status: 400 });
    }

    const { data: session, error: insertError } = await supabase
      .from("game_sessions")
      .insert({
        user_id: user.id,
        game_id: gameId,
      })
      .select("id")
      .single();

    if (insertError || !session) {
      return NextResponse.json(
        { error: insertError?.message ?? "Failed to create session" },
        { status: 500 },
      );
    }

    return NextResponse.json({ session_id: session.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500 },
    );
  }
}
