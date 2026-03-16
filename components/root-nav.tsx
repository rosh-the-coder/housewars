"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { inter, jetMono } from "@/lib/fonts";

type RootNavProps = {
  isLoggedIn: boolean;
  username?: string | null;
  houseName?: string | null;
  houseHex?: string | null;
};

function normalizeHouseName(name: string | null | undefined): string {
  const value = (name ?? "").toLowerCase();
  if (value.includes("red") || value.includes("phoenix")) return "RED HOUSE";
  if (value.includes("blue") || value.includes("tsunami")) return "BLUE HOUSE";
  if (value.includes("green") || value.includes("viper")) return "GREEN HOUSE";
  if (value.includes("yellow") || value.includes("thunder")) return "YELLOW HOUSE";
  return (name ?? "HOUSE").toUpperCase();
}

export function RootNav({ isLoggedIn, username, houseName, houseHex }: RootNavProps) {
  const pathname = usePathname();
  if (pathname === "/welcome") {
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

  const showMiddleMenu = isLoggedIn && pathname !== "/";
  const displayUsername = (username ?? "").trim() || "player";
  const displayHouse = normalizeHouseName(houseName);
  const displayHouseColor = houseHex ?? "#DC2626";
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
            <Link href="/dashboard" className={navLinkClass("/dashboard")}>
              DASHBOARD
            </Link>
            <Link href="/games" className={navLinkClass("/games")}>
              GAMES
            </Link>
            <Link href="/leaderboard" className={navLinkClass("/leaderboard")}>
              LEADERBOARD
            </Link>
            <Link href="/challenges" className={navLinkClass("/challenges")}>
              CHALLENGES
            </Link>
          </div>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              <div className="hidden items-center gap-3 md:flex">
                <p className={`${jetMono.className} text-[13px]`} style={{ color: navText }}>
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
    </header>
  );
}
