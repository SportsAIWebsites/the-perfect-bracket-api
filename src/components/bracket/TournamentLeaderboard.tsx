"use client";

import { useMemo } from "react";
import { FullBracket } from "@/types/bracket";
import {
  computeTournamentStats,
  UpsetEntry,
  CloseGameEntry,
  HighScoringEntry,
} from "@/lib/tournament-stats";

interface TournamentLeaderboardProps {
  bracket: FullBracket;
  onClose: () => void;
}

function UpsetRow({ entry }: { entry: UpsetEntry }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-bg-base px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-accent">
          {entry.winnerSeed}
        </span>
        <span className="text-sm font-semibold text-text-primary">{entry.winnerName}</span>
        <span className="text-xs text-text-dim">def.</span>
        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-text-dim">
          {entry.loserSeed}
        </span>
        <span className="text-sm text-text-dim">{entry.loserName}</span>
      </div>
      <span className="text-xs font-bold text-accent">+{entry.seedDiff}</span>
    </div>
  );
}

function CloseGameRow({ entry }: { entry: CloseGameEntry }) {
  const m = entry.matchup;
  return (
    <div className="flex items-center justify-between rounded-lg bg-bg-base px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-text-primary">
          {m.topTeam?.abbreviation}
        </span>
        <span className="text-xs text-text-dim">
          {m.topScore}-{m.bottomScore}
        </span>
        <span className="text-sm font-semibold text-text-primary">
          {m.bottomTeam?.abbreviation}
        </span>
      </div>
      <span className="text-xs font-bold text-accent">{entry.margin}pt</span>
    </div>
  );
}

function HighScoringRow({ entry }: { entry: HighScoringEntry }) {
  const m = entry.matchup;
  return (
    <div className="flex items-center justify-between rounded-lg bg-bg-base px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-text-primary">
          {m.topTeam?.abbreviation}
        </span>
        <span className="text-xs text-text-dim">
          {m.topScore}-{m.bottomScore}
        </span>
        <span className="text-sm font-semibold text-text-primary">
          {m.bottomTeam?.abbreviation}
        </span>
      </div>
      <span className="text-xs font-bold text-accent">{entry.totalScore}pts</span>
    </div>
  );
}

export function TournamentLeaderboard({ bracket, onClose }: TournamentLeaderboardProps) {
  const stats = useMemo(() => computeTournamentStats(bracket), [bracket]);

  const hasData =
    stats.biggestUpsets.length > 0 ||
    stats.closestGames.length > 0 ||
    stats.highestScoring.length > 0;

  return (
    <div className="flex h-full w-[280px] shrink-0 flex-col border-l border-border-subtle bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-accent">
          Leaderboard
        </h2>
        <button
          onClick={onClose}
          className="text-text-dim transition-colors hover:text-text-primary"
          aria-label="Close leaderboard"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {!hasData ? (
          <p className="text-center text-xs text-text-dim">
            No completed games yet. Stats will appear as games finish.
          </p>
        ) : (
          <div className="space-y-6">
            {/* Biggest Upsets */}
            {stats.biggestUpsets.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-text-dim">
                  Biggest Upsets
                </h3>
                <div className="space-y-1.5">
                  {stats.biggestUpsets.map((entry, i) => (
                    <UpsetRow key={i} entry={entry} />
                  ))}
                </div>
              </div>
            )}

            {/* Closest Games */}
            {stats.closestGames.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-text-dim">
                  Closest Games
                </h3>
                <div className="space-y-1.5">
                  {stats.closestGames.map((entry, i) => (
                    <CloseGameRow key={i} entry={entry} />
                  ))}
                </div>
              </div>
            )}

            {/* Highest Scoring */}
            {stats.highestScoring.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-text-dim">
                  Highest Scoring
                </h3>
                <div className="space-y-1.5">
                  {stats.highestScoring.map((entry, i) => (
                    <HighScoringRow key={i} entry={entry} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
