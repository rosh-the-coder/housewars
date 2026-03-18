import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ChallengeRow = {
  id: string;
  title: string;
  status: string;
  winner_id: string | null;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async () => {
  try {
    const nowIso = new Date().toISOString();
    const { data: candidates, error: listError } = await admin
      .from("challenges")
      .select("id,title,status,winner_id")
      .eq("status", "open")
      .lt("ends_at", nowIso);

    if (listError) {
      return new Response(JSON.stringify({ error: listError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const rows = (candidates ?? []) as ChallengeRow[];
    const details: Array<{
      challenge_id: string;
      title: string;
      status: string;
      winner_id: string | null;
    }> = [];
    let resolved = 0;
    let cancelled = 0;

    for (const row of rows) {
      const { error: resolveError } = await admin.rpc("resolve_challenge", {
        challenge_id: row.id,
      });

      if (resolveError) {
        details.push({
          challenge_id: row.id,
          title: row.title,
          status: `error: ${resolveError.message}`,
          winner_id: null,
        });
        continue;
      }

      const { data: updated, error: updatedError } = await admin
        .from("challenges")
        .select("id,title,status,winner_id")
        .eq("id", row.id)
        .single<ChallengeRow>();

      if (updatedError || !updated) {
        details.push({
          challenge_id: row.id,
          title: row.title,
          status: `error: ${updatedError?.message ?? "could not read updated challenge"}`,
          winner_id: null,
        });
        continue;
      }

      if (updated.status === "completed") resolved += 1;
      if (updated.status === "cancelled") cancelled += 1;

      details.push({
        challenge_id: updated.id,
        title: updated.title,
        status: updated.status,
        winner_id: updated.winner_id,
      });
    }

    return new Response(
      JSON.stringify({
        scanned: rows.length,
        resolved,
        cancelled,
        results: details,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unexpected error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
