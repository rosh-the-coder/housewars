import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function redirectWithMessage(request: Request, path: string, key: string, message: string) {
  const url = new URL(path, request.url);
  url.searchParams.set(key, message);
  return NextResponse.redirect(url);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      return redirectWithMessage(request, "/login", "error", "Email and password are required.");
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (/email not confirmed/i.test(error.message)) {
        const verifyUrl = new URL("/verify-email", request.url);
        verifyUrl.searchParams.set("email", email);
        verifyUrl.searchParams.set("info", "Verify your email ID first, then sign in.");
        return NextResponse.redirect(verifyUrl);
      }
      return redirectWithMessage(request, "/login", "error", error.message);
    }

    const welcomeSeen = Boolean(
      (data.user?.user_metadata as { welcome_seen?: boolean } | undefined)?.welcome_seen,
    );
    return NextResponse.redirect(new URL(welcomeSeen ? "/dashboard" : "/welcome", request.url));
  } catch (error) {
    return redirectWithMessage(
      request,
      "/login",
      "error",
      error instanceof Error ? error.message : "Unexpected login error",
    );
  }
}
