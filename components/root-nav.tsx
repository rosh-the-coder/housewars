"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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

type RouteMeta = {
  label: string;
  accent: string;
  tone: "neutral" | "war";
};

function getRouteMeta(pathname: string, isLoggedIn: boolean): RouteMeta {
  if ((pathname === "/" || pathname === "/games") && isLoggedIn)
    return { label: "HOME", accent: "#FFD700", tone: "war" };
  if (pathname.startsWith("/games"))
    return { label: "GAMES", accent: "#00D4AA", tone: "neutral" };
  if (pathname.startsWith("/challenges"))
    return { label: "CHALLENGES", accent: "#FF6B35", tone: "neutral" };
  if (pathname.startsWith("/leaderboard"))
    return { label: "LEADERBOARD", accent: "#2563EB", tone: "neutral" };
  if (pathname.startsWith("/profile"))
    return { label: "PROFILE", accent: "#8B5CF6", tone: "neutral" };
  return { label: "HOME", accent: "#DC2626", tone: "neutral" };
}

const MIDDLE_LINKS = [
  { href: "/games", label: "HOME" },
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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

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

  const routeMeta = getRouteMeta(pathname, user.isLoggedIn);
  const navFill = routeMeta.tone === "war" ? "#DC2626" : "#F5F5F0";
  const navText = routeMeta.tone === "war" ? "#FFFFFF" : "#111111";
  const borderColor = routeMeta.tone === "war" ? "#0D0D0D" : "#000000";

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const showMiddleMenu = user.isLoggedIn;
  const displayUsername = (user.username ?? "").trim() || "player";
  const avatarLetter = displayUsername.charAt(0).toUpperCase();
  const gpWeeklyValue = Number(user.gp_weekly ?? 0).toLocaleString();
  const challengeTokenValue = Number(
    user.challenge_tokens ?? 0,
  ).toLocaleString();
  const avatarBg = routeMeta.tone === "war" ? "#F5F5F0" : "#111111";
  const avatarText = routeMeta.tone === "war" ? "#111111" : "#F5F5F0";

  const navLinkClass = (href: string) => {
    const active = isActive(href);
    return `${jetMono.className} border-b-[3px] px-1 py-1 text-[11px] font-semibold tracking-[0.08em] transition ${
      active ? "font-extrabold" : "opacity-80 hover:opacity-100"
    }`;
  };

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!profileMenuOpen) return;

    const onDocumentMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileMenuOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocumentMouseDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onDocumentMouseDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [profileMenuOpen]);

  return (
    <header
      className="sticky top-0 z-20 border-b-[3px]"
      style={{ borderColor, background: navFill }}
    >
      <nav className="mx-auto flex h-[72px] w-full items-center justify-between gap-3 px-3 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:px-8">
        <div className="flex min-w-0 items-center gap-3 md:justify-self-start">
          <Link
            href={user.isLoggedIn ? "/games" : "/"}
            className={`${inter.className} text-2xl font-black leading-none tracking-[0.08em] md:text-[28px]`}
            style={{ color: navText }}
          >
            HouseWars
          </Link>
        </div>

        {showMiddleMenu ? (
          <div
            className="hidden items-center gap-4 md:flex md:justify-self-center"
            style={{ color: navText }}
          >
            {MIDDLE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={navLinkClass(link.href)}
                style={{
                  borderColor: isActive(link.href) ? navText : "transparent",
                  color: navText,
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="flex items-center gap-1.5 md:justify-self-end md:gap-2">
          {user.isLoggedIn ? (
            <div className="flex items-center gap-1.5 px-1.5 py-1 sm:px-2">
              {showMiddleMenu && (
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((value) => !value)}
                  className={`${jetMono.className} rounded-none border-2 px-2 py-[3px] text-[11px] font-bold md:hidden`}
                  style={{ borderColor, color: navText }}
                  aria-label="Toggle menu"
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? "X" : "≡"}
                </button>
              )}

              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((value) => !value)}
                  className={`${jetMono.className} inline-flex items-center gap-1.5 rounded-none px-1.5 py-1 text-[11px] font-semibold sm:gap-2 sm:px-2.5 sm:py-1.5 sm:text-[12px]`}
                  style={{ borderColor, color: navText }}
                  aria-haspopup="menu"
                  aria-expanded={profileMenuOpen}
                  aria-label="Open account menu"
                >
                  <span
                    className={`${inter.className} inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black sm:h-6 sm:w-6`}
                    style={{
                      background: avatarBg,
                      color: avatarText,
                    }}
                  >
                    {avatarLetter}
                  </span>
                  <span className="hidden max-w-[110px] truncate sm:inline md:max-w-[140px]">
                    {displayUsername}
                  </span>
                  <span
                    className="text-[10px] sm:text-[11px]"
                    aria-hidden="true"
                  >
                    {profileMenuOpen ? "▲" : "▼"}
                  </span>
                </button>

                {profileMenuOpen ? (
                  <div
                    role="menu"
                    aria-label="Account menu"
                    className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-[240px] overflow-hidden border-[3px] border-[#111111] bg-[#F5F5F0] text-[#111111] shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
                    style={{
                      color: "#111111",
                    }}
                  >
                    <div
                      className={`${jetMono.className} space-y-2 border-b-2 border-[#111111] bg-white px-4 py-3`}
                    >
                      <p className="truncate text-[11px] font-bold tracking-[0.08em] text-[#111111]">
                        {displayUsername.toUpperCase()}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold">
                        <span className="border border-[#111111] px-2 py-1 text-center">
                          GP {gpWeeklyValue}
                        </span>
                        <span className="border border-[#111111] px-2 py-1 text-center">
                          CT {challengeTokenValue}
                        </span>
                      </div>
                    </div>
                    <Link
                      href="/games"
                      role="menuitem"
                      className={`${jetMono.className} block border-b-2 border-[#111111] px-4 py-2.5 text-[11px] font-semibold hover:bg-[#EBEBE7]`}
                      style={{ color: "#111111" }}
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      HOME
                    </Link>
                    <Link
                      href="/challenges"
                      role="menuitem"
                      className={`${jetMono.className} block border-b-2 border-[#111111] px-4 py-2.5 text-[11px] font-semibold hover:bg-[#EBEBE7]`}
                      style={{ color: "#111111" }}
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      CHALLENGES
                    </Link>
                    <Link
                      href="/leaderboard"
                      role="menuitem"
                      className={`${jetMono.className} block border-b-2 border-[#111111] px-4 py-2.5 text-[11px] font-semibold hover:bg-[#EBEBE7]`}
                      style={{ color: "#111111" }}
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      LEADERBOARD
                    </Link>
                    <Link
                      href="/profile"
                      role="menuitem"
                      className={`${jetMono.className} block border-b-2 border-[#111111] px-4 py-2.5 text-[11px] font-semibold hover:bg-[#EBEBE7]`}
                      style={{ color: "#111111" }}
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      PROFILE
                    </Link>
                    <form action="/api/auth/logout" method="post" className="bg-white">
                      <button
                        type="submit"
                        role="menuitem"
                        className={`${jetMono.className} block w-full px-4 py-2.5 text-left text-[11px] font-semibold text-[#DC2626] hover:bg-[#FEE2E2]`}
                        onClick={() => setProfileMenuOpen(false)}
                      >
                        LOGOUT
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            </div>
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
        <div
          className="border-t-[3px] px-4 py-3 md:hidden"
          style={{ borderColor, background: navFill }}
        >
          <div
            className={`${jetMono.className} flex flex-col gap-2 text-[11px] font-semibold tracking-[0.08em]`}
          >
            {MIDDLE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${navLinkClass(link.href)} w-fit`}
                style={{
                  borderColor: isActive(link.href) ? navText : "transparent",
                  color: navText,
                }}
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
