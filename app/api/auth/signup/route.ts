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
    let houseId = String(formData.get("house_id") ?? "").trim();

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

    if (!houseId) {
      const { data: firstHouse } = await supabase
        .from("houses")
        .select("id")
        .order("name", { ascending: true })
        .limit(1)
        .maybeSingle();
      houseId = firstHouse?.id ?? "";
    }

    if (!houseId) {
      return redirectWithMessage(request, "/signup", "error", "No houses available to assign.");
    }

    let { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, house_id: houseId },
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

    const userId = signUpData.user?.id;
    if (!userId) {
      return redirectWithMessage(
        request,
        "/signup",
        "info",
        "Check your email to confirm signup, then log in.",
      );
    }

    // Some projects create profiles via DB trigger on auth.users insert.
    // Only run fallback upsert when a session is present.
    if (signUpData.session) {
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: userId,
          username,
          house_id: houseId,
        },
        { onConflict: "id" },
      );

      if (profileError) {
        return redirectWithMessage(request, "/signup", "error", profileError.message);
      }
    }

    return redirectWithMessage(
      request,
      "/login",
      "success",
      "Account created. You can now log in and play.",
    );
  } catch (error) {
    return redirectWithMessage(
      request,
      "/signup",
      "error",
      error instanceof Error ? error.message : "Unexpected signup error",
    );
  }
}
