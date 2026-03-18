import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppToaster } from "@/components/app-toaster";
import { RootNav } from "@/components/root-nav";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HouseWars",
  description: "Browser gaming competition website",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = Boolean(user);
  let userId: string | null = user?.id ?? null;
  let username: string | null = null;
  let houseName: string | null = null;
  let houseHex: string | null = null;
  let gpWeekly = 0;
  let gpAlltime = 0;
  let challengeTokens = 0;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id,username,gp_weekly,gp_alltime,challenge_tokens,house:houses(name,hex_code)")
      .eq("id", user.id)
      .maybeSingle();

    userId = (profile as { id?: string } | null)?.id ?? user.id;
    username = (profile as { username?: string | null } | null)?.username ?? user.email?.split("@")[0] ?? null;
    const house = (profile as { house?: { name?: string | null; hex_code?: string | null } | null } | null)?.house;
    houseName = house?.name ?? null;
    houseHex = house?.hex_code ?? null;
    gpWeekly = Number((profile as { gp_weekly?: number | null } | null)?.gp_weekly ?? 0);
    gpAlltime = Number((profile as { gp_alltime?: number | null } | null)?.gp_alltime ?? 0);
    challengeTokens = Number((profile as { challenge_tokens?: number | null } | null)?.challenge_tokens ?? 0);
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <RootNav
          isLoggedIn={isLoggedIn}
          userId={userId}
          username={username}
          houseName={houseName}
          houseHex={houseHex}
          gpWeekly={gpWeekly}
          gpAlltime={gpAlltime}
          challengeTokens={challengeTokens}
        />
        <main>{children}</main>
        <AppToaster />
      </body>
    </html>
  );
}
