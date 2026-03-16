import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  username: string | null;
  total_points: number | null;
  house: {
    name: string;
    hex_code: string | null;
  } | null;
};

function getInitials(name: string) {
  const cleaned = name.trim();
  if (!cleaned) return "P";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Please log in first");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,username,total_points,house:houses(name,hex_code)")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (!profile) {
    redirect("/signup?error=Complete signup to create your profile");
  }

  const displayName = (profile.username ?? user.email?.split("@")[0] ?? "player").trim();
  const houseName = (profile.house?.name ?? "House").toUpperCase();
  const houseColor = profile.house?.hex_code ?? "#999999";
  const totalPoints = Number(profile.total_points ?? 0).toLocaleString();

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-black">Profile</h1>
        <p className="mt-2 text-zinc-600">Manage your player identity and stats.</p>
      </header>

      <article className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="mb-5 flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-zinc-100 text-xl font-bold">
            {getInitials(displayName)}
          </div>
          <div>
            <h2 className="text-xl font-bold">{displayName}</h2>
            <p className="text-sm text-zinc-600">Player ID: {profile.id}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 p-4">
            <p className="text-sm text-zinc-600">House</p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: houseColor }}
              />
              <p className="font-semibold">{houseName}</p>
            </div>
          </div>
          <div className="rounded-lg border border-zinc-200 p-4">
            <p className="text-sm text-zinc-600">Total points</p>
            <p className="mt-2 text-2xl font-black">{totalPoints}</p>
          </div>
        </div>
      </article>
    </section>
  );
}
