"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { inter, jetMono } from "@/lib/fonts";

type ActiveChallenge = {
  id: string;
  title: string;
  gameName: string;
  gpReward: number;
  ctEntryCost: number;
  participants: number;
  minParticipants: number;
  endsAt: string;
  alreadyJoined: boolean;
  joinedRank: number | null;
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
  activeChallenges: ActiveChallenge[];
  pastChallenges: PastChallenge[];
  gameOptions: GameOption[];
};

function formatCountdown(endsAt: string): string {
  const diffMs = new Date(endsAt).getTime() - Date.now();
  if (diffMs <= 0) return "ENDED";
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function ChallengesPageClient({
  challengeTokens,
  activeChallenges,
  pastChallenges,
  gameOptions,
}: Props) {
  const router = useRouter();
  const [nowTick, setNowTick] = useState(Date.now());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isJoiningId, setIsJoiningId] = useState<string | null>(null);

  const [gameId, setGameId] = useState(gameOptions[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [ctEntryCost, setCtEntryCost] = useState(5);
  const [gpReward, setGpReward] = useState(25);
  const [durationHours, setDurationHours] = useState(24);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

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
      router.refresh();
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
            YOUR TOKENS: {challengeTokens} CT
          </p>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        {activeChallenges.map((challenge) => {
          const ended = new Date(challenge.endsAt).getTime() <= nowTick;
          const insufficientCt = challengeTokens < challenge.ctEntryCost;
          const joinDisabled = ended || insufficientCt || challenge.alreadyJoined;
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
                    {formatCountdown(challenge.endsAt)}
                  </p>
                </div>
              </div>
              <div className="border-t-[3px] border-black p-4">
                {challenge.alreadyJoined ? (
                  <p className={`${jetMono.className} text-sm font-bold text-[#00D4AA]`}>
                    YOUR CURRENT RANK: {challenge.joinedRank ? `#${challenge.joinedRank}` : "--"}
                  </p>
                ) : (
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
                    {ended ? "CHALLENGE ENDED" : insufficientCt ? "INSUFFICIENT CT" : "JOIN"}
                  </button>
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
          Past Challenges
        </h2>
        <div className="overflow-x-auto border-[3px] border-black">
          <table className="w-full min-w-[980px] border-collapse">
            <thead className={`${inter.className} bg-white text-[12px] font-extrabold text-black`}>
              <tr>
                <th className="px-5 py-3 text-left">TITLE</th>
                <th className="px-5 py-3 text-left">GAME</th>
                <th className="px-5 py-3 text-left">GP REWARD</th>
                <th className="px-5 py-3 text-left">WINNER</th>
                <th className="px-5 py-3 text-left">PARTICIPANTS</th>
                <th className="px-5 py-3 text-left">DATE</th>
              </tr>
            </thead>
            <tbody>
              {pastChallenges.map((row, idx) => (
                <tr
                  key={row.id}
                  className="h-11 border-t border-[#333333]"
                  style={{ background: idx % 2 === 0 ? "#222222" : "#1A1A1A" }}
                >
                  <td className={`${inter.className} px-5 text-sm font-semibold text-white`}>{row.title}</td>
                  <td className={`${inter.className} px-5 text-sm font-semibold text-[#999999]`}>{row.gameName}</td>
                  <td className={`${jetMono.className} px-5 text-sm font-semibold text-[#CA8A04]`}>
                    {row.gpReward}
                  </td>
                  <td
                    className={`${inter.className} px-5 text-sm font-bold`}
                    style={{ color: row.winnerColor ?? "#999999" }}
                  >
                    {row.status === "cancelled"
                      ? "CANCELLED - CT REFUNDED"
                      : (row.winnerName ?? "PENDING")}
                  </td>
                  <td className={`${jetMono.className} px-5 text-sm text-[#999999]`}>{row.participants}</td>
                  <td className={`${jetMono.className} px-5 text-sm text-[#999999]`}>{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
