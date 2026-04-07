import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;
  const { error } = await supabase.auth.updateUser({
    data: {
      ...metadata,
      welcome_seen: true,
      welcome_seen_at: new Date().toISOString(),
    },
  });

  if (error) {
    return NextResponse.redirect(new URL("/games?error=Could not complete welcome flow", request.url));
  }

  return NextResponse.redirect(new URL("/games", request.url));
}
