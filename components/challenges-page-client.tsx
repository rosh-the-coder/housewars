"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { inter, jetMono } from "@/lib/fonts";

type ActiveChallenge = {
  id: string;
  title: string;
  gameName: string;
  gameSlug: string;
  gpReward: number;
  ctEntryCost: number;
  participants: number;
  minParticipants: number;
  endsAt: string;
  alreadyJoined: boolean;
  joinedRank: number | null;
  joinedBestScore: number;
  joinedAttempts: number;
};

type PastChallenge = {
  id: string;
  title: string;
  gameName: string;
  gpReward: number;
  winnerName: string | null;
  winnerColor: string | null;
  participants: number;
  date: string;
  status: "completed" | "cancelled";
};

type GameOption = {
  id: string;
  name: string;
};

type Props = {
  challengeTokens: number;
  houseAccentColor: string;
  activeChallenges: ActiveChallenge[];
  pastChallenges: PastChallenge[];
  gameOptions: GameOption[];
};

function formatCountdownFromDiff(diffMs: number): string {
  if (diffMs <= 0) return "ENDED";
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function ChallengeCountdown({ endsAt }: { endsAt: string }) {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const diffMs = new Date(endsAt).getTime() - Date.now();
      setTimeLeft(formatCountdownFromDiff(diffMs));
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [endsAt]);

  return <span>{timeLeft || "--:--:--"}</span>;
}

export function ChallengesPageClient({
  challengeTokens,
  houseAccentColor,
  activeChallenges,
  pastChallenges,
  gameOptions,
}: Props) {
  const router = useRouter();
  const [localCtBalance, setLocalCtBalance] = useState(challengeTokens);
  const [localActiveChallenges, setLocalActiveChallenges] = useState(activeChallenges);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoiningId, setIsJoiningId] = useState<string | null>(null);

  const [gameId, setGameId] = useState(gameOptions[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [ctEntryCost, setCtEntryCost] = useState(5);
  const [gpReward, setGpReward] = useState(25);
  const [durationHours, setDurationHours] = useState(24);

  useEffect(() => {
    setLocalCtBalance(challengeTokens);
    setLocalActiveChallenges(activeChallenges);
  }, [activeChallenges, challengeTokens]);

  const onJoin = async (challengeId: string) => {
    setIsJoiningId(challengeId);
    try {
      const response = await fetch("/api/challenges/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ challenge_id: challengeId }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Could not join challenge");
      }
      const joinedChallenge = localActiveChallenges.find((item) => item.id === challengeId);
      setLocalCtBalance((value) => Math.max(0, value - Number(joinedChallenge?.ctEntryCost ?? 0)));
      setLocalActiveChallenges((current) =>
        current.map((challenge) => {
          if (challenge.id !== challengeId) return challenge;
          return {
            ...challenge,
            alreadyJoined: true,
            joinedAttempts: 0,
            joinedBestScore: 0,
            joinedRank: null,
            participants: challenge.participants + 1,
          };
        }),
      );
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not join challenge");
    } finally {
      setIsJoiningId(null);
    }
  };

  const onCreate = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/challenges/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          game_id: gameId,
          title,
          ct_entry_cost: ctEntryCost,
          gp_reward: gpReward,
          duration_hours: durationHours,
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Could not create challenge");
      }
      setIsCreateOpen(false);
      setTitle("");
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Could not create challenge");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header className="flex items-center gap-4">
        <h1 className={`${inter.className} text-4xl font-black uppercase tracking-[0.08em] md:text-5xl`}>
          Challenges
        </h1>
        <div className="h-1 flex-1 bg-white" />
        <div className="border-[3px] border-[#00D4AA] bg-[#0D0D0D] px-4 py-2">
          <p className={`${jetMono.className} text-xs font-semibold tracking-[0.08em] text-[#00D4AA]`}>
            YOUR TOKENS: {localCtBalance} CT
          </p>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        {localActiveChallenges.map((challenge) => {
          const insufficientCt = localCtBalance < challenge.ctEntryCost;
          const joinDisabled = insufficientCt || challenge.alreadyJoined;
          const hasPlayed = challenge.joinedAttempts > 0;
          return (
            <article key={challenge.id} className="border-[4px] border-black bg-[#1A1A1A]">
              <div className="border-b-[3px] border-black px-5 py-4">
                <p className={`${inter.className} text-lg font-extrabold uppercase`}>{challenge.gameName}</p>
              </div>
              <div className="space-y-3 px-6 py-5">
                <p className={`${inter.className} text-sm font-semibold uppercase text-[#999999]`}>
                  {challenge.title}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`${jetMono.className} text-sm font-bold text-[#FFD700]`}>
                    GP REWARD: {challenge.gpReward}
                  </span>
                  <span className={`${jetMono.className} text-sm font-bold text-[#00D4AA]`}>
                    ENTRY: {challenge.ctEntryCost} CT
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`${jetMono.className} text-xs font-semibold text-[#999999]`}>
                    PARTICIPANTS: {challenge.participants}
                  </span>
                  <span className={`${jetMono.className} text-xs font-semibold text-[#999999]`}>
                    MIN REQUIRED: {challenge.minParticipants}
                  </span>
                </div>
                <div className="border-2 border-[#999999] bg-black px-4 py-2">
                  <p className={`${jetMono.className} text-3xl font-bold tracking-[0.16em] text-[#DC2626]`}>
                    <ChallengeCountdown endsAt={challenge.endsAt} />
                  </p>
                </div>
              </div>
              <div className="border-t-[3px] border-black p-4">
                {!challenge.alreadyJoined ? (
                  <button
                    type="button"
                    onClick={() => void onJoin(challenge.id)}
                    disabled={joinDisabled || isJoiningId === challenge.id}
                    className={`${inter.className} w-full border-[3px] border-white py-3 text-sm font-black tracking-[0.12em] uppercase ${
                      joinDisabled || isJoiningId === challenge.id
                        ? "cursor-not-allowed bg-[#2A2A2A] text-[#777777]"
                        : "bg-black text-white hover:bg-white hover:text-black"
                    }`}
                  >
                    {insufficientCt ? "INSUFFICIENT CT" : "JOIN"}
                  </button>
                ) : !hasPlayed ? (
                  <div className="space-y-3">
                    <p className={`${jetMono.className} text-sm font-bold text-[#00D4AA]`}>
                      You&apos;re in - play the game to submit your score
                    </p>
                    <Link
                      href={`/games/${challenge.gameSlug}?challenge_id=${challenge.id}`}
                      className={`${inter.className} block w-full border-[3px] py-3 text-center text-sm font-black tracking-[0.12em] uppercase text-black`}
                      style={{ background: houseAccentColor, borderColor: houseAccentColor }}
                    >
                      PLAY NOW →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className={`${jetMono.className} text-sm font-bold text-[#00D4AA]`}>
                      YOUR RANK: #{challenge.joinedRank ?? "--"} of {challenge.participants} players
                    </p>
                    <p className={`${jetMono.className} text-sm font-bold text-[#FFD700]`}>
                      BEST SCORE: {challenge.joinedBestScore}
                    </p>
                    <Link
                      href={`/games/${challenge.gameSlug}?challenge_id=${challenge.id}`}
                      className={`${inter.className} block w-full border-[3px] border-white py-3 text-center text-sm font-black tracking-[0.12em] uppercase text-white hover:bg-white hover:text-black`}
                    >
                      PLAY AGAIN
                    </Link>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setIsCreateOpen(true)}
        className={`${inter.className} w-full border-[4px] border-white bg-black py-5 text-xl font-black tracking-[0.18em] uppercase`}
      >
        Create Challenge
      </button>

      <div className="space-y-4">
        <h2 className={`${inter.className} text-2xl font-black uppercase tracking-[0.08em]`}>
          Ended Challenges
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {pastChallenges.map((row) => (
            <article key={row.id} className="border-[4px] border-black bg-[#1A1A1A]">
              <div className="border-b-[3px] border-black px-5 py-4">
                <p className={`${inter.className} text-lg font-extrabold uppercase`}>{row.gameName}</p>
              </div>
              <div className="space-y-3 px-6 py-5">
                <p className={`${inter.className} text-sm font-semibold uppercase text-[#999999]`}>
                  {row.title}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`${jetMono.className} text-sm font-bold text-[#FFD700]`}>
                    GP REWARD: {row.gpReward}
                  </span>
                  <span className={`${jetMono.className} text-xs font-semibold text-[#999999]`}>
                    PARTICIPANTS: {row.participants}
                  </span>
                </div>
                {row.status === "cancelled" ? (
                  <p className={`${jetMono.className} text-sm font-bold text-[#F59E0B]`}>
                    CANCELLED - CT REFUNDED
                  </p>
                ) : (
                  <p className={`${jetMono.className} text-sm font-bold`} style={{ color: row.winnerColor ?? "#999999" }}>
                    WINNER: {row.winnerName ?? "PENDING"}
                  </p>
                )}
                <p className={`${jetMono.className} text-xs font-semibold text-[#999999]`}>
                  ENDED: {row.date}
                </p>
              </div>
              <div className="border-t-[3px] border-black p-4">
                <p className={`${jetMono.className} text-xs font-semibold text-[#777777]`}>
                  NO ACTIONS AVAILABLE
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>

      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-lg border-[4px] border-black bg-[#1A1A1A] p-5">
            <h3 className={`${inter.className} mb-4 text-2xl font-black uppercase tracking-[0.08em]`}>
              Create Challenge
            </h3>
            <div className="space-y-3">
              <label className={`${jetMono.className} block text-xs font-semibold text-[#999999]`}>
                GAME
                <select
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  className="mt-1 w-full border-[3px] border-black bg-[#111111] px-3 py-2 text-white"
                >
                  {gameOptions.map((game) => (
                    <option key={game.id} value={game.id}>
                      {game.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className={`${jetMono.className} block text-xs font-semibold text-[#999999]`}>
                TITLE
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full border-[3px] border-black bg-[#111111] px-3 py-2 text-white"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className={`${jetMono.className} block text-xs font-semibold text-[#999999]`}>
                  CT ENTRY COST
                  <input
                    type="number"
                    min={5}
                    value={ctEntryCost}
                    onChange={(e) => setCtEntryCost(Math.max(5, Number(e.target.value || 5)))}
                    className="mt-1 w-full border-[3px] border-black bg-[#111111] px-3 py-2 text-white"
                  />
                </label>
                <label className={`${jetMono.className} block text-xs font-semibold text-[#999999]`}>
                  GP REWARD
                  <input
                    type="number"
                    min={25}
                    value={gpReward}
                    onChange={(e) => setGpReward(Math.max(25, Number(e.target.value || 25)))}
                    className="mt-1 w-full border-[3px] border-black bg-[#111111] px-3 py-2 text-white"
                  />
                </label>
              </div>

              <div className="space-y-1">
                <p className={`${jetMono.className} text-xs font-semibold text-[#999999]`}>DURATION</p>
                <div className="flex gap-2">
                  {[12, 24, 48].map((hours) => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => setDurationHours(hours)}
                      className={`${jetMono.className} border-[3px] px-3 py-2 text-xs font-semibold ${
                        durationHours === hours
                          ? "border-white bg-white text-black"
                          : "border-black bg-[#111111] text-white"
                      }`}
                    >
                      {hours}H
                    </button>
                  ))}
                </div>
              </div>

              <p className={`${jetMono.className} text-xs font-semibold text-[#00D4AA]`}>
                You will spend {ctEntryCost} CT to create this
              </p>
            </div>

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className={`${jetMono.className} border-[3px] border-[#777777] px-4 py-2 text-xs font-semibold text-[#F5F5F0]`}
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => void onCreate()}
                disabled={isSubmitting || !title.trim() || !gameId}
                className={`${jetMono.className} border-[3px] border-[#F5F5F0] bg-[#F5F5F0] px-4 py-2 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60`}
              >
                CONFIRM
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
