import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return NextResponse.json({ error: "ADMIN_EMAIL is not configured" }, { status: 500 });
    }
    if ((user.email ?? "").toLowerCase() !== adminEmail.toLowerCase()) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
        { status: 500 },
      );
    }

    const triggerResponse = await fetch(`${supabaseUrl}/functions/v1/resolve-challenges`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ triggered_by: user.email }),
      cache: "no-store",
    });

    const payload = await triggerResponse.json().catch(() => ({}));
    if (!triggerResponse.ok) {
      return NextResponse.json(
        { error: (payload as { error?: string }).error ?? "Failed to trigger resolve-challenges" },
        { status: triggerResponse.status },
      );
    }

    return NextResponse.json({
      ok: true,
      triggered_by: user.email,
      result: payload,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error triggering resolver" },
      { status: 500 },
    );
  }
}
