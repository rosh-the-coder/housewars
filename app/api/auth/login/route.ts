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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return redirectWithMessage(request, "/login", "error", error.message);
    }

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    return redirectWithMessage(
      request,
      "/login",
      "error",
      error instanceof Error ? error.message : "Unexpected login error",
    );
  }
}
