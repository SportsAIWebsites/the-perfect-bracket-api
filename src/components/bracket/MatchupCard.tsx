"use client";

import clsx from "clsx";
import { BracketMatchup } from "@/types/bracket";
import { PredictionBadge } from "./PredictionBadge";
import { MatchupDropdown } from "./MatchupDropdown";

interface MatchupCardProps {
  matchup: BracketMatchup;
  onClick?: () => void;
  isExpanded?: boolean;
  isDemo?: boolean;
  onClose?: () => void;
}

function TeamRow({
  team,
  score,
  isWinner,
  isPredictedWinner,
  isLive,
}: {
  team: { name: string; seed: number; abbreviation: string; logoUrl: string } | null;
  score?: number;
  isWinner: boolean;
  isPredictedWinner: boolean;
  isLive: boolean;
}) {
  if (!team) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1.5 text-text-dim">
        <span className="w-4 text-center text-[10px]">-</span>
        <span className="flex-1 truncate text-xs italic">—</span>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "flex items-center gap-1.5 px-2 py-1.5 transition-colors",
        isWinner && "bg-final-green/5",
        isPredictedWinner && "bg-accent/5"
      )}
    >
      <span
        className={clsx(
          "w-4 text-center text-[10px] font-semibold",
          isWinner ? "text-text-primary" : "text-text-dim"
        )}
      >
        {team.seed}
      </span>
      {team.logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={team.logoUrl}
          alt={team.abbreviation}
          className="h-4 w-4 object-contain"
          loading="lazy"
        />
      )}
      <span
        className={clsx(
          "flex-1 truncate text-xs font-medium",
          isWinner
            ? "text-white font-bold"
            : isPredictedWinner
              ? "text-accent font-semibold"
              : "text-text-primary"
        )}
      >
        {team.abbreviation}
      </span>
      {score !== undefined && (
        <span
          className={clsx(
            "text-xs font-bold tabular-nums",
            isWinner
              ? "text-white"
              : isLive
                ? "text-text-primary"
                : "text-text-secondary"
          )}
        >
          {score}
        </span>
      )}
    </div>
  );
}

export function MatchupCard({ matchup, onClick, isExpanded, isDemo, onClose }: MatchupCardProps) {
  const { topTeam, bottomTeam, topScore, bottomScore, status, winnerId, prediction } =
    matchup;

  const isLive = status === "in_progress";
  const isFinal = status === "final";
  const hasPrediction = !!prediction && !isFinal;

  const topIsWinner = isFinal && winnerId === topTeam?.teamId;
  const bottomIsWinner = isFinal && winnerId === bottomTeam?.teamId;
  const topIsPredicted =
    hasPrediction && prediction?.winnerId === topTeam?.teamId;
  const bottomIsPredicted =
    hasPrediction && prediction?.winnerId === bottomTeam?.teamId;

  return (
    <div className="relative">
      <div
        onClick={onClick}
        className={clsx(
          "w-[160px] rounded-lg border bg-card overflow-hidden cursor-pointer transition-all hover:scale-[1.02]",
          isLive && "border-live-red/40 shadow-[0_0_8px_rgba(239,68,68,0.15)]",
          hasPrediction && "border-accent/30 glow-accent",
          isFinal && "border-border-subtle",
          status === "tbd" && !topTeam && !bottomTeam && "border-border-subtle/50 opacity-50",
          !isLive && !hasPrediction && !isFinal && "border-border-subtle",
          isExpanded && "ring-1 ring-accent/50"
        )}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-2 py-0.5 bg-bg-base/50">
          {isLive && (
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-live-red animate-pulse-live" />
              <span className="text-[9px] font-bold uppercase text-live-red">
                {matchup.period === 1 ? "1st" : "2nd"} {matchup.displayClock}
              </span>
            </div>
          )}
          {isFinal && (
            <span className="text-[9px] font-bold uppercase text-final-green">
              Final
            </span>
          )}
          {hasPrediction && (
            <div className="flex items-center gap-1">
              <svg
                className="h-2 w-2 text-accent"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M8 0l2.5 5 5.5.8-4 3.9.9 5.3L8 12.5 3.1 15l.9-5.3-4-3.9L5.5 5z" />
              </svg>
              <span className="text-[9px] font-bold text-accent">AI PICK</span>
            </div>
          )}
          {(status === "scheduled" || status === "tbd") && !hasPrediction && topTeam && bottomTeam && (
            <span className="text-[9px] text-text-dim">Upcoming</span>
          )}
          {hasPrediction && prediction && (
            <PredictionBadge confidence={prediction.confidence} compact />
          )}
        </div>

        {/* Teams */}
        <TeamRow
          team={topTeam}
          score={topScore}
          isWinner={topIsWinner}
          isPredictedWinner={topIsPredicted}
          isLive={isLive}
        />
        <div className="h-px bg-border-subtle/50" />
        <TeamRow
          team={bottomTeam}
          score={bottomScore}
          isWinner={bottomIsWinner}
          isPredictedWinner={bottomIsPredicted}
          isLive={isLive}
        />
      </div>

      {/* Dropdown panel */}
      {isExpanded && (topTeam || bottomTeam) && (
        <div className="absolute z-50 left-0 top-full">
          <MatchupDropdown
            matchup={matchup}
            isDemo={isDemo ?? false}
            onClose={onClose ?? (() => {})}
          />
        </div>
      )}
    </div>
  );
}
