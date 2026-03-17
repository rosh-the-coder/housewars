"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type GameEmbedProps = {
  embedUrl: string;
  title: string;
  sessionGameId: string;
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
  points_earned?: number;
  ct_earned?: number;
  cp_earned?: number;
  rank?: number | string | null;
  house_color?: string;
};

export function GameEmbed({
  embedUrl,
  title,
  sessionGameId,
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
  const [result, setResult] = useState<{ ct: number; cp: number; rank: string | number }>({
    ct: 0,
    cp: 0,
    rank: "-",
  });
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
      setResult({
        ct: Number(payload.ct_earned ?? payload.points_earned ?? 0),
        cp: Number(payload.cp_earned ?? payload.points_earned ?? 0),
        rank: payload.rank ?? "-",
      });
      setIsResultModalOpen(true);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to end session");
    } finally {
      sessionIdRef.current = null;
      isEndingRef.current = false;
    }
  }, [router]);

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
            onClick={() => router.push("/games")}
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
          <div className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-950 p-6 text-white shadow-2xl">
            <h3 className="text-xl font-bold">Run Complete</h3>
            <p className="mt-2 text-zinc-300">Session submitted successfully.</p>
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-400">Rank</p>
                <p className="mt-1 text-2xl font-bold">{result.rank}</p>
              </div>
              <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-400">CT Earned</p>
                <p className="mt-1 text-2xl font-bold">{result.ct}</p>
              </div>
              <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-400">CP Contributed</p>
                <p className="mt-1 text-2xl font-bold">{result.cp}</p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsResultModalOpen(false);
                  sessionIdRef.current = null;
                  setIframeKey((value) => value + 1);
                }}
                className="rounded-md border border-zinc-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Play Again
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsResultModalOpen(false);
                  router.push("/games");
                  router.refresh();
                }}
                className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-black"
              >
                Back to Games
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
