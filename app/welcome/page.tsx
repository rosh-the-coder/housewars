import { redirect } from "next/navigation";
import { inter, oswald } from "@/lib/fonts";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  house: {
    name: string;
    hex_code: string | null;
  } | null;
};

function getHouseDisplay(name: string | null | undefined, fallbackHex: string | null | undefined) {
  const value = (name ?? "").toLowerCase();
  if (value.includes("red") || value.includes("phoenix")) {
    return { name: "PHOENIX", color: "#DC2626" };
  }
  if (value.includes("blue") || value.includes("tsunami")) {
    return { name: "TSUNAMI", color: "#2563EB" };
  }
  if (value.includes("green") || value.includes("viper")) {
    return { name: "VIPER", color: "#16A34A" };
  }
  if (value.includes("yellow") || value.includes("thunder")) {
    return { name: "THUNDER", color: "#CA8A04" };
  }
  return {
    name: (name ?? "HOUSE").toUpperCase(),
    color: fallbackHex ?? "#111111",
  };
}

export default async function WelcomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const welcomeSeen = Boolean(
    (user.user_metadata as { welcome_seen?: boolean } | undefined)?.welcome_seen,
  );
  if (welcomeSeen) {
    redirect("/games");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,house:houses(name,hex_code)")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.house) {
    redirect("/games");
  }

  const house = getHouseDisplay(profile.house.name, profile.house.hex_code);

  return (
    <section
      className={`${inter.className} flex min-h-screen items-center justify-center px-6 py-10 text-white`}
      style={{ background: house.color }}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 text-center">
        <p className="text-xs font-bold tracking-[0.28em] text-white/80">HOUSE ASSIGNMENT COMPLETE</p>
        <h1 className={`${oswald.className} text-6xl leading-none tracking-[0.08em] md:text-8xl`}>{house.name}</h1>
        <p className={`${oswald.className} max-w-4xl text-3xl leading-tight tracking-[0.04em] text-black md:text-5xl`}>
          YOU HAVE BEEN ASSIGNED TO {house.name}
        </p>
        <form action="/api/auth/complete-welcome" method="post">
          <button
            type="submit"
            className={`${oswald.className} mt-3 inline-flex border-[3px] border-black bg-[#111111] px-10 py-4 text-xl tracking-[0.12em] text-[#F5F5F0] transition hover:opacity-90`}
          >
            ENTER THE WAR
          </button>
        </form>
      </div>
    </section>
  );
}
