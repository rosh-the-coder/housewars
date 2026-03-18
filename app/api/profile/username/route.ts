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
      return NextResponse.redirect(new URL("/login?error=Please log in first", request.url));
    }

    const formData = await request.formData();
    const username = String(formData.get("username") ?? "").trim();

    if (username.length < 3 || username.length > 24) {
      return NextResponse.redirect(new URL("/profile?error=Username must be 3-24 characters", request.url));
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.redirect(
        new URL("/profile?error=Username can only contain letters, numbers, and underscore", request.url),
      );
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ username })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.redirect(
        new URL(`/profile?error=${encodeURIComponent(updateError.message)}`, request.url),
      );
    }

    return NextResponse.redirect(new URL("/profile?success=Username updated", request.url));
  } catch (error) {
    return NextResponse.redirect(
      new URL(
        `/profile?error=${encodeURIComponent(error instanceof Error ? error.message : "Unexpected error")}`,
        request.url,
      ),
    );
  }
}
