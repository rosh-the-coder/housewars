"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type UseUserInput = {
  isLoggedIn: boolean;
  userId: string | null;
  initialUsername?: string | null;
  initialHouseName?: string | null;
  initialHouseHex?: string | null;
  initialGpWeekly?: number;
  initialGpAlltime?: number;
  initialChallengeTokens?: number;
};

type UseUserResult = {
  isLoggedIn: boolean;
  id: string | null;
  username: string | null;
  houseName: string | null;
  houseHex: string | null;
  gp_weekly: number;
  gp_alltime: number;
  challenge_tokens: number;
};

type ProfileWithHouse = {
  id: string;
  username: string | null;
  gp_weekly: number | null;
  gp_alltime: number | null;
  challenge_tokens: number | null;
  house:
    | {
        name: string | null;
        hex_code: string | null;
      }
    | {
        name: string | null;
        hex_code: string | null;
      }[]
    | null;
};

export function useUser(input: UseUserInput): UseUserResult {
  const [state, setState] = useState<UseUserResult>({
    isLoggedIn: input.isLoggedIn,
    id: input.userId,
    username: input.initialUsername ?? null,
    houseName: input.initialHouseName ?? null,
    houseHex: input.initialHouseHex ?? null,
    gp_weekly: Number(input.initialGpWeekly ?? 0),
    gp_alltime: Number(input.initialGpAlltime ?? 0),
    challenge_tokens: Number(input.initialChallengeTokens ?? 0),
  });

  const userId = input.userId;
  const isLoggedIn = input.isLoggedIn && Boolean(userId);

  useEffect(() => {
    if (!isLoggedIn || !userId) return;

    const supabase = createSupabaseBrowserClient();

    const applyProfile = (profile: ProfileWithHouse) => {
      const house = Array.isArray(profile.house) ? profile.house[0] : profile.house;
      setState((prev) => ({
        ...prev,
        username: profile.username ?? prev.username,
        houseName: house?.name ?? prev.houseName,
        houseHex: house?.hex_code ?? prev.houseHex,
        gp_weekly: Number(profile.gp_weekly ?? 0),
        gp_alltime: Number(profile.gp_alltime ?? 0),
        challenge_tokens: Number(profile.challenge_tokens ?? 0),
      }));
    };

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,username,gp_weekly,gp_alltime,challenge_tokens,house:houses(name,hex_code)")
        .eq("id", userId)
        .maybeSingle<ProfileWithHouse>();
      if (data) applyProfile(data);
    };

    void fetchProfile();

    const channel = supabase
      .channel(`profile-live-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        () => {
          void fetchProfile();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [isLoggedIn, userId]);

  return useMemo(
    () => ({
      ...state,
      isLoggedIn: input.isLoggedIn,
      id: input.userId ?? state.id,
    }),
    [input.isLoggedIn, input.userId, state],
  );
}
