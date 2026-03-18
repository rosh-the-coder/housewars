"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { inter, jetMono } from "@/lib/fonts";
import { useUser } from "@/hooks/use-user";

type RootNavProps = {
  isLoggedIn: boolean;
  userId?: string | null;
  username?: string | null;
  houseName?: string | null;
  houseHex?: string | null;
  gpWeekly?: number;
  gpAlltime?: number;
  challengeTokens?: number;
};

function normalizeHouseName(name: string | null | undefined): string {
  const value = (name ?? "").toLowerCase();
  if (value.includes("red") || value.includes("phoenix")) return "RED HOUSE";
  if (value.includes("blue") || value.includes("tsunami")) return "BLUE HOUSE";
  if (value.includes("green") || value.includes("viper")) return "GREEN HOUSE";
  if (value.includes("yellow") || value.includes("thunder")) return "YELLOW HOUSE";
  return (name ?? "HOUSE").toUpperCase();
}

function formatGp(value: number): string {
  return Number(value ?? 0).toFixed(1);
}

const MIDDLE_LINKS = [
  { href: "/dashboard", label: "DASHBOARD" },
  { href: "/games", label: "GAMES" },
  { href: "/challenges", label: "CHALLENGES" },
  { href: "/leaderboard", label: "LEADERBOARD" },
];

export function RootNav({
  isLoggedIn,
  userId,
  username,
  houseName,
  houseHex,
  gpWeekly,
  gpAlltime,
  challengeTokens,
}: RootNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = useUser({
    isLoggedIn,
    userId: userId ?? null,
    initialUsername: username,
    initialHouseName: houseName,
    initialHouseHex: houseHex,
    initialGpWeekly: gpWeekly,
    initialGpAlltime: gpAlltime,
    initialChallengeTokens: challengeTokens,
  });

  if (pathname === "/welcome" || pathname === "/verify-email") {
    return null;
  }

  const isDashboard = pathname === "/dashboard";
  const navFill = isDashboard ? "#DC2626" : "#F5F5F0";
  const navText = isDashboard ? "#FFFFFF" : "#111111";
  const borderColor = isDashboard ? "#0D0D0D" : "#000000";

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navLinkClass = (href: string) =>
    `${isActive(href) ? "underline underline-offset-4 decoration-2" : "hover:underline"} ${isDashboard ? "text-white" : "text-[#111111]"}`;

  const showMiddleMenu = user.isLoggedIn && pathname !== "/";
  const displayUsername = (user.username ?? "").trim() || "player";
  const displayHouse = normalizeHouseName(user.houseName);
  const displayHouseColor = user.houseHex ?? "#DC2626";
  const logoutClass = isDashboard
    ? `${jetMono.className} rounded-none bg-[#0D0D0D] px-6 py-2 text-[13px] font-bold text-[#F5F5F0] transition hover:opacity-90`
    : `${jetMono.className} rounded-none bg-[#111111] px-6 py-2.5 text-[13px] font-bold text-[#F5F5F0] transition hover:opacity-90`;

  return (
    <header className="sticky top-0 z-20 border-b-[3px]" style={{ borderColor, background: navFill }}>
      <nav className="mx-auto flex h-[68px] w-full items-center justify-between gap-3 px-4 md:px-8">
        <Link href="/" className={`${inter.className} text-2xl font-black leading-none tracking-[0.08em] md:text-[28px]`} style={{ color: navText }}>
          HouseWars
        </Link>
        {showMiddleMenu ? (
          <div className={`${jetMono.className} hidden items-center gap-5 text-[11px] font-semibold tracking-[0.08em] md:flex`}>
            {MIDDLE_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={navLinkClass(link.href)}>
                {link.label}
              </Link>
            ))}
          </div>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-3">
          {user.isLoggedIn ? (
            <>
              {showMiddleMenu ? (
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((value) => !value)}
                  className={`${jetMono.className} rounded-none border-[3px] px-2.5 py-1 text-[12px] font-bold md:hidden`}
                  style={{ borderColor, color: navText }}
                  aria-label="Toggle menu"
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? "X" : "≡"}
                </button>
              ) : null}
              <div className="inline-flex items-center gap-1 rounded bg-[#111111] px-2 py-1 md:px-2.5">
                <span className="text-[12px] leading-none text-[#FFD700]">🏆</span>
                <span className={`${jetMono.className} text-[10px] font-semibold text-[#F5F5F0] md:text-[11px]`}>
                  {formatGp(user.gp_weekly)}
                  <span className="hidden md:inline"> GP</span>
                </span>
              </div>
              <div className="inline-flex items-center gap-1 rounded bg-[#111111] px-2 py-1 md:px-2.5">
                <span className="text-[12px] leading-none text-[#00D4AA]">◈</span>
                <span className={`${jetMono.className} text-[10px] font-semibold text-[#F5F5F0] md:text-[11px]`}>
                  {user.challenge_tokens}
                  <span className="hidden md:inline"> CT</span>
                </span>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <p className={`${jetMono.className} text-[12px] md:text-[13px]`} style={{ color: navText }}>
                  {displayUsername}
                </p>
                <div className="inline-flex items-center gap-1.5 rounded bg-[#0D0D0D] px-2.5 py-1">
                  <span className="h-2 w-2" style={{ background: displayHouseColor }} />
                  <span className={`${jetMono.className} text-[11px] font-semibold`} style={{ color: displayHouseColor }}>
                    {displayHouse}
                  </span>
                </div>
              </div>
              <form action="/api/auth/logout" method="post">
                <button type="submit" className={logoutClass}>
                  LOGOUT
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`${jetMono.className} rounded-none border-[3px] border-black px-6 py-2.5 text-[13px] font-bold text-black transition hover:bg-black hover:text-[#F5F5F0]`}
              >
                LOGIN NOW
              </Link>
              <Link
                href="/signup"
                className={`${jetMono.className} rounded-none bg-[#111111] px-6 py-2.5 text-[13px] font-bold text-[#F5F5F0] transition hover:opacity-90`}
              >
                SIGN UP
              </Link>
            </>
          )}
        </div>
      </nav>
      {showMiddleMenu && mobileMenuOpen ? (
        <div className="border-t-[3px] px-4 py-3 md:hidden" style={{ borderColor }}>
          <div className={`${jetMono.className} flex flex-col gap-2 text-[11px] font-semibold tracking-[0.08em]`}>
            {MIDDLE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={navLinkClass(link.href)}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}
