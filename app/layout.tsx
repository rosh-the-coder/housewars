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
  let username: string | null = null;
  let houseName: string | null = null;
  let houseHex: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username,house:houses(name,hex_code)")
      .eq("id", user.id)
      .maybeSingle();

    username = (profile as { username?: string | null } | null)?.username ?? user.email?.split("@")[0] ?? null;
    const house = (profile as { house?: { name?: string | null; hex_code?: string | null } | null } | null)?.house;
    houseName = house?.name ?? null;
    houseHex = house?.hex_code ?? null;
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <RootNav isLoggedIn={isLoggedIn} username={username} houseName={houseName} houseHex={houseHex} />
        <main>{children}</main>
        <AppToaster />
      </body>
    </html>
  );
}
