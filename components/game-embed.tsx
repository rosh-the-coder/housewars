"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type GameEmbedProps = {
  embedUrl: string;
  title: string;
  sessionGameId: string;
  challengeContext?: {
    id: string;
    title: string;
  } | null;
  user: {
    username: string;
    house: {
      name: string;
      hex_code: string;
    };
  };
  showExitButton?: boolean;
  iframeClassName?: string;
};

type HouseWarsGameOverMessage = {
  type: "HOUSEWARS_GAME_OVER";
  payload?: {
    metric_value?: number;
    metric_type?: string;
  };
};

type SessionEndPayload = {
  rank?: number | string | null;
  total_players?: number | null;
  gp_earned?: number;
  ct_earned?: number;
  weekly_gp_total?: number;
  ct_balance?: number;
  multiplier?: number;
  house_color?: string;
};

type ChallengeSubmitPayload = {
  rank?: number | null;
  total_players?: number | null;
  best_score?: number | null;
};

export function GameEmbed({
  embedUrl,
  title,
  sessionGameId,
  challengeContext = null,
  user,
  showExitButton = true,
  iframeClassName = "h-[520px] w-full rounded-lg border border-zinc-300 bg-black",
}: GameEmbedProps) {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const isStartingRef = useRef(false);
  const isEndingRef = useRef(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [result, setResult] = useState<{
    rank: number | string;
    totalPlayers: number;
    placementPoints: number;
    difficultyMultiplier: number;
    gpEarned: number;
    ctEarned: number;
    weeklyGpTotal: number;
    ctBalance: number;
    accentColor: string;
    challengeRank: number | null;
    challengeTotalPlayers: number;
    challengeBestScore: number;
  }>({
    rank: "-",
    totalPlayers: 0,
    placementPoints: 0,
    difficultyMultiplier: 1,
    gpEarned: 0,
    ctEarned: 0,
    weeklyGpTotal: 0,
    ctBalance: 0,
    accentColor: "#DC2626",
    challengeRank: null,
    challengeTotalPlayers: 0,
    challengeBestScore: 0,
  });
  const [dismissCountdown, setDismissCountdown] = useState(10);
  const [modalOpenedAtMs, setModalOpenedAtMs] = useState<number | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  const startSession = useCallback(async (): Promise<string | null> => {
    if (!sessionGameId || sessionIdRef.current || isStartingRef.current) {
      return sessionIdRef.current;
    }

    isStartingRef.current = true;

    try {
      const response = await fetch("/api/sessions/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ game_id: sessionGameId }),
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errorPayload.error ?? "Could not start game session");
      }

      const payload = (await response.json()) as { session_id: string };
      sessionIdRef.current = payload.session_id;
      return payload.session_id;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start session");
      return null;
    } finally {
      isStartingRef.current = false;
    }
  }, [sessionGameId]);

  const endSession = useCallback(async (metricValue: number, metricType: string) => {
    const currentSessionId = sessionIdRef.current;
    if (!currentSessionId || isEndingRef.current) return;

    isEndingRef.current = true;

    try {
      const response = await fetch("/api/sessions/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          session_id: currentSessionId,
          metric_value: metricValue,
          metric_type: metricType,
        }),
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errorPayload.error ?? "Could not end game session");
      }

      const payload = (await response.json()) as SessionEndPayload;
      let challengeStats: ChallengeSubmitPayload | null = null;
      if (challengeContext?.id) {
        const submitResponse = await fetch(`/api/challenges/${challengeContext.id}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ score: Math.max(0, Math.round(metricValue)) }),
        });
        if (submitResponse.ok) {
          challengeStats = (await submitResponse.json()) as ChallengeSubmitPayload;
        } else {
          const challengeError = (await submitResponse.json().catch(() => ({}))) as { error?: string };
          toast.error(challengeError.error ?? "Could not submit challenge score");
        }
      }

      setDismissCountdown(10);
      setModalOpenedAtMs(Date.now());
      setResult({
        rank: payload.rank ?? "-",
        totalPlayers: Number(payload.total_players ?? 0),
        placementPoints: Math.max(0, Math.round(metricValue)),
        difficultyMultiplier: Number(payload.multiplier ?? 1),
        gpEarned: Number(payload.gp_earned ?? 0),
        ctEarned: Number(payload.ct_earned ?? 0),
        weeklyGpTotal: Number(payload.weekly_gp_total ?? 0),
        ctBalance: Number(payload.ct_balance ?? 0),
        accentColor: payload.house_color ?? "#DC2626",
        challengeRank: Number(challengeStats?.rank ?? 0) || null,
        challengeTotalPlayers: Number(challengeStats?.total_players ?? 0),
        challengeBestScore: Number(challengeStats?.best_score ?? 0),
      });
      setIsResultModalOpen(true);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to end session");
    } finally {
      sessionIdRef.current = null;
      isEndingRef.current = false;
    }
  }, [challengeContext?.id, router]);

  const onFrameLoad = useCallback(async () => {
    const iframeWindow = iframeRef.current?.contentWindow;
    if (!iframeWindow) return;

    const sessionId = await startSession();
    if (!sessionId) return;

    iframeWindow.postMessage(
      {
        type: "HOUSEWARS_GAME_START",
        payload: {
          session_id: sessionId,
          player_name: user.username,
          house_name: user.house.name,
          house_color: user.house.hex_code,
        },
      },
      "*",
    );
  }, [startSession, user.house.hex_code, user.house.name, user.username]);

  useEffect(() => {
    const onMessage = (event: MessageEvent<unknown>) => {
      const iframeWindow = iframeRef.current?.contentWindow;
      if (!iframeWindow || event.source !== iframeWindow) return;
      if (!event.data || typeof event.data !== "object") return;

      const message = event.data as HouseWarsGameOverMessage;
      if (message.type !== "HOUSEWARS_GAME_OVER") return;

      const metricValue = Number(message.payload?.metric_value ?? 0);
      const metricType = (message.payload?.metric_type ?? "score").trim() || "score";
      void endSession(metricValue, metricType);
    };

    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, [endSession]);

  useEffect(() => {
    if (!isResultModalOpen || modalOpenedAtMs === null) return;

    const timer = window.setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - modalOpenedAtMs) / 1000);
      const remaining = Math.max(0, 10 - elapsedSeconds);
      setDismissCountdown(remaining);
      if (remaining === 0) {
        setIsResultModalOpen(false);
        router.push(challengeContext?.id ? "/challenges" : "/games");
        router.refresh();
      }
    }, 250);

    return () => {
      window.clearInterval(timer);
    };
  }, [challengeContext?.id, isResultModalOpen, modalOpenedAtMs, router]);

  if (!embedUrl) {
    return (
      <div className="grid h-[520px] place-items-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 px-6 text-center">
        <p className="max-w-md text-zinc-600">Invalid `embedUrl` for <strong>{title}</strong>.</p>
      </div>
    );
  }

  return (
    <>
      {showExitButton ? (
        <div className="mb-3 flex items-center justify-end">
          <button
            type="button"
            onClick={() => router.push(challengeContext?.id ? "/challenges" : "/games")}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Exit Game
          </button>
        </div>
      ) : null}
      <iframe
        key={iframeKey}
        ref={iframeRef}
        src={embedUrl}
        title={`${title} game`}
        className={iframeClassName}
        onLoad={() => void onFrameLoad()}
        allow="autoplay; fullscreen; gamepad"
        allowFullScreen
      />
      {isResultModalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div
            className="w-full max-w-xl border-[3px] border-[#0D0D0D] bg-[#1A1A1A] text-white shadow-2xl"
            style={{ borderTopColor: result.accentColor, borderTopWidth: "8px" }}
          >
            <div className="border-b-[3px] border-[#0D0D0D] px-5 py-4">
              <h3 className="text-3xl font-black uppercase tracking-[0.06em]">{title.toUpperCase()}</h3>
            </div>

            <div className="border-b-[3px] border-[#0D0D0D] px-5 py-3">
              <p className="text-sm font-semibold tracking-[0.08em] text-[#F5F5F0]">
                RANK #{result.rank} OF {result.totalPlayers} PLAYERS
              </p>
              {challengeContext?.id ? (
                <p className="mt-2 text-xs font-semibold tracking-[0.08em] text-[#00D4AA]">
                  CHALLENGE RANK #{result.challengeRank ?? "--"} OF {result.challengeTotalPlayers || "--"} | BEST{" "}
                  {result.challengeBestScore}
                </p>
              ) : null}
            </div>

            <div className="space-y-2 border-b-[3px] border-[#0D0D0D] px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-[0.08em] text-[#777777]">PLACEMENT:</p>
                <p className="text-sm font-bold">{result.placementPoints} pts</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-[0.08em] text-[#777777]">DIFFICULTY:</p>
                <p className="text-sm font-bold">× {result.difficultyMultiplier.toFixed(1)}</p>
              </div>
            </div>

            <div className="space-y-2 border-b-[3px] border-[#0D0D0D] px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-[0.08em] text-[#777777]">GLORY POINTS:</p>
                <p className="text-sm font-bold text-[#FFD700]">+{result.gpEarned.toFixed(1)} GP</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-[0.08em] text-[#777777]">TOKENS:</p>
                <p className="text-sm font-bold text-[#00D4AA]">+{result.ctEarned} CT</p>
              </div>
            </div>

            <div className="space-y-1 border-b-[3px] border-[#0D0D0D] px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold tracking-[0.08em] text-[#777777]">WEEKLY GP TOTAL:</p>
                <p className="text-sm font-bold text-[#F5F5F0]">{result.weeklyGpTotal.toFixed(1)} GP</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <p className="text-[10px] font-semibold tracking-[0.08em] text-[#777777]">
                AUTO LOBBY IN {dismissCountdown}s
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsResultModalOpen(false);
                    sessionIdRef.current = null;
                    setIframeKey((value) => value + 1);
                    setDismissCountdown(10);
                  }}
                  className="border-[3px] border-[#F5F5F0] px-4 py-2 text-sm font-semibold text-[#F5F5F0]"
                >
                  PLAY AGAIN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsResultModalOpen(false);
                    router.push(challengeContext?.id ? "/challenges" : "/games");
                    router.refresh();
                  }}
                  className="bg-[#F5F5F0] px-4 py-2 text-sm font-semibold text-[#111111]"
                >
                  {challengeContext?.id ? "CHALLENGES" : "LOBBY"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
