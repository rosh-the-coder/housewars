import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { AppToaster } from "@/components/app-toaster";
import { jetMono, oswald } from "@/lib/fonts";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="sticky top-0 z-20 border-b-[3px] border-black bg-[#F5F5F0]">
          <nav className="mx-auto flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-10">
            <Link href="/" className={`${oswald.className} text-2xl leading-none tracking-[0.08em] md:text-3xl`}>
              HouseWars
            </Link>
            <div className={`${jetMono.className} flex items-center gap-3 text-xs font-semibold`}>
              <Link href="/dashboard" className="hover:underline">
                DASHBOARD
              </Link>
              <Link href="/games" className="hover:underline">
                GAMES
              </Link>
              <Link href="/leaderboard" className="hover:underline">
                LEADERBOARD
              </Link>
              <Link href="/challenges" className="hover:underline">
                CHALLENGES
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className={`${jetMono.className} rounded-none border-[3px] border-black px-4 py-2 text-xs font-semibold text-black transition hover:bg-black hover:text-[#F5F5F0]`}
              >
                Bypass Login
              </Link>
              <Link
                href="/signup"
                className={`${jetMono.className} rounded-none bg-[#111111] px-4 py-2 text-xs font-semibold text-[#F5F5F0] transition hover:opacity-90`}
              >
                Signup
              </Link>
            </div>
          </nav>
        </header>
        <main>{children}</main>
        <AppToaster />
      </body>
    </html>
  );
}
