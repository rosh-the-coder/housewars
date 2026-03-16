"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type GameStartType = "HOUSEWARS_GAME_START";
type GameOverType = "HOUSEWARS_GAME_OVER";

export type HouseWarsPlayerInfo = {
  session_id: string;
  player_name: string;
  house_name: string;
  house_color: string;
};

type HouseWarsGameStartMessage = {
  type: GameStartType;
  payload?: Partial<HouseWarsPlayerInfo>;
} & Partial<HouseWarsPlayerInfo>;

type HouseWarsGameOverMessage = {
  type: GameOverType;
  payload: {
    metric_value: number;
    metric_type: string;
  };
};

export type UseHouseWarsSDKResult = {
  gameReady: boolean;
  playerInfo: HouseWarsPlayerInfo | null;
  elapsedMs: number;
  sendResult: (metricValue: number, metricType: string) => void;
};

function extractPlayerInfo(message: HouseWarsGameStartMessage): HouseWarsPlayerInfo | null {
  const raw = message.payload ?? message;
  const { session_id, player_name, house_name, house_color } = raw;

  if (!session_id || !player_name || !house_name || !house_color) {
    return null;
  }

  return { session_id, player_name, house_name, house_color };
}

export function useHouseWarsSDK(): UseHouseWarsSDKResult {
  const [gameReady, setGameReady] = useState(false);
  const [playerInfo, setPlayerInfo] = useState<HouseWarsPlayerInfo | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent<unknown>) => {
      if (!event.data || typeof event.data !== "object") return;

      const maybeMessage = event.data as HouseWarsGameStartMessage;
      if (maybeMessage.type !== "HOUSEWARS_GAME_START") return;

      const parsedPlayer = extractPlayerInfo(maybeMessage);
      if (!parsedPlayer) return;

      setPlayerInfo(parsedPlayer);
      setGameReady(true);
      startTimeRef.current = Date.now();
      setElapsedMs(0);
    };

    window.addEventListener("message", onMessage);

    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, []);

  useEffect(() => {
    if (!gameReady || !startTimeRef.current) return;

    const timer = window.setInterval(() => {
      if (!startTimeRef.current) return;
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 50);

    return () => window.clearInterval(timer);
  }, [gameReady]);

  const sendResult = useCallback((metricValue: number, metricType: string) => {
    const message: HouseWarsGameOverMessage = {
      type: "HOUSEWARS_GAME_OVER",
      payload: {
        metric_value: metricValue,
        metric_type: metricType,
      },
    };

    window.parent.postMessage(message, "*");
  }, []);

  return {
    gameReady,
    playerInfo,
    elapsedMs,
    sendResult,
  };
}
