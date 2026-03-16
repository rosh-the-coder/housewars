"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { extractGameIdFromEmbedUrl } from "@/lib/gd";

type GameEmbedProps = {
  embedUrl: string;
  title: string;
  sessionGameId: string;
};

type GdEvent = {
  name?: string;
  [key: string]: unknown;
};

declare global {
  interface Window {
    GD_OPTIONS?: {
      gameId: string;
      onEvent?: (event: GdEvent) => void;
    };
  }
}

export function GameEmbed({ embedUrl, title, sessionGameId }: GameEmbedProps) {
  const router = useRouter();
  const gameId = useMemo(() => extractGameIdFromEmbedUrl(embedUrl), [embedUrl]);
  const sessionIdRef = useRef<string | null>(null);
  const isStartingRef = useRef(false);
  const isEndingRef = useRef(false);
  const beforeUnloadSenderRef = useRef<() => void>(() => {});

  const startSession = useCallback(async () => {
    if (!sessionGameId || sessionIdRef.current || isStartingRef.current) {
      return;
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start session");
    } finally {
      isStartingRef.current = false;
    }
  }, [sessionGameId]);

  const endSession = useCallback(
    async (source: "manual" | "beforeunload") => {
      const currentSessionId = sessionIdRef.current;

      if (!currentSessionId || isEndingRef.current) {
        if (source === "manual") {
          router.push("/games");
        }
        return;
      }

      if (source === "beforeunload") {
        beforeUnloadSenderRef.current();
        sessionIdRef.current = null;
        return;
      }

      isEndingRef.current = true;

      try {
        const response = await fetch("/api/sessions/end", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ session_id: currentSessionId }),
        });

        if (!response.ok) {
          const errorPayload = (await response.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(errorPayload.error ?? "Could not end game session");
        }

        const payload = (await response.json()) as {
          points_earned: number;
          house_color?: string;
        };

        toast.success(`+ ${payload.points_earned ?? 0} points earned`, {
          style: {
            border: `2px solid ${payload.house_color ?? "#DC2626"}`,
            color: payload.house_color ?? "#DC2626",
            fontWeight: 700,
          },
        });

        setTimeout(() => {
          router.push("/games");
          router.refresh();
        }, 2000);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to end session");
      } finally {
        sessionIdRef.current = null;
        isEndingRef.current = false;
      }
    },
    [router],
  );

  useEffect(() => {
    if (!gameId) {
      return;
    }

    beforeUnloadSenderRef.current = () => {
      const beaconSessionId = sessionIdRef.current;

      if (!beaconSessionId || isEndingRef.current) {
        return;
      }

      isEndingRef.current = true;
      const body = JSON.stringify({ session_id: beaconSessionId });
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/sessions/end", blob);
    };
  }, [gameId]);

  useEffect(() => {
    if (!gameId) {
      return;
    }

    window.GD_OPTIONS = {
      gameId,
      onEvent: async (event) => {
        if (event.name === "SDK_GAME_START") {
          console.log("GD: game started");
          await startSession();
        }

        if (event.name === "SDK_GAME_PAUSE") {
          console.log("GD: game paused");
        }
      },
    };
  }, [gameId, startSession]);

  useEffect(() => {
    const onBeforeUnload = () => {
      void endSession("beforeunload");
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [endSession]);

  if (!gameId) {
    return (
      <div className="grid h-[520px] place-items-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 px-6 text-center">
        <p className="max-w-md text-zinc-600">
          Invalid `embedUrl` for <strong>{title}</strong>. Add a valid GameDistribution URL with a
          game ID.
        </p>
      </div>
    );
  }

  return (
    <>
      <Script src="https://html5.gamedistribution.com/HostAPI.js" strategy="afterInteractive" />
      <div className="mb-3 flex items-center justify-end">
        <button
          type="button"
          onClick={() => void endSession("manual")}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Exit Game
        </button>
      </div>
      <iframe
        src={embedUrl}
        title={`${title} game`}
        className="h-[520px] w-full rounded-lg border border-zinc-300 bg-black"
        allow="autoplay; fullscreen"
        allowFullScreen
      />
    </>
  );
}
