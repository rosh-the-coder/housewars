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
    const username = String(formData.get("username") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirm_password") ?? "");

    if (!username || !email || !password) {
      return redirectWithMessage(request, "/signup", "error", "Please fill all required fields.");
    }
    if (password !== confirmPassword) {
      return redirectWithMessage(request, "/signup", "error", "Password and confirm password must match.");
    }
    if (password.length < 6) {
      return redirectWithMessage(request, "/signup", "error", "Password must be at least 6 characters.");
    }

    const supabase = await createSupabaseServerClient();

    let { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    // Retry without metadata when Supabase returns a generic DB save error.
    if (
      signUpError &&
      /database error saving new user/i.test(signUpError.message)
    ) {
      const retry = await supabase.auth.signUp({ email, password });
      signUpData = retry.data;
      signUpError = retry.error;
    }

    if (signUpError) {
      return redirectWithMessage(request, "/signup", "error", signUpError.message);
    }

    if (!signUpData.user?.id) {
      return redirectWithMessage(
        request,
        "/signup",
        "info",
        "Check your email to confirm signup, then log in.",
      );
    }

    const url = new URL("/verify-email", request.url);
    url.searchParams.set("email", email);
    url.searchParams.set("success", "Account created. Verify your email ID before signing in.");
    return NextResponse.redirect(url);
  } catch (error) {
    return redirectWithMessage(
      request,
      "/signup",
      "error",
      error instanceof Error ? error.message : "Unexpected signup error",
    );
  }
}
