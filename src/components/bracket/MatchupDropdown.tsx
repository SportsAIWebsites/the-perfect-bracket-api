"use client";

import { useEffect, useState, useMemo } from "react";
import useSWR from "swr";
import clsx from "clsx";
import { BracketMatchup } from "@/types/bracket";
import { ESPNSummaryResponse } from "@/types/espn";
import { GameOdds } from "@/types/odds";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface MatchupDropdownProps {
  matchup: BracketMatchup;
  isDemo: boolean;
  onClose: () => void;
}

const DEMO_RECAPS: Record<string, string> = {
  final:
    "The higher seed dominated from the opening tip, building a double-digit lead by halftime behind efficient shooting and aggressive interior defense. The underdog mounted a late rally but couldn't overcome the deficit, falling short in the final minutes as key free throws sealed the result.",
  live: "This game has been a back-and-forth battle with neither team able to pull away. Watch for the pace to be the deciding factor down the stretch.",
};

/**
 * Generate realistic mock odds based on seed differential.
 * Calibrated to real NCAA tournament lines:
 * 1v16: ~-23.5, 1v8: ~-6.5, 4v5: ~-1.5, etc.
 */
function generateMockOdds(topSeed: number, bottomSeed: number): GameOdds {
  const seedDiff = bottomSeed - topSeed; // positive = top team is better
  // Realistic spread mapping — diminishing returns for large seed gaps
  // 1v16=~23, 1v8=~7, 2v15=~17, 4v5=~1.5, 5v12=~6
  const rawSpread = seedDiff * 1.5 + Math.sign(seedDiff) * Math.min(Math.abs(seedDiff), 8) * 0.3;
  const spread = -(Math.round(rawSpread * 2) / 2); // round to nearest 0.5, negative = top favored

  // Map spread to moneyline (realistic conversion)
  const absSpread = Math.abs(spread);
  let favML: number;
  let dogML: number;
  if (absSpread >= 20) {
    favML = -2500; dogML = 1200;
  } else if (absSpread >= 15) {
    favML = -800; dogML = 550;
  } else if (absSpread >= 10) {
    favML = -450; dogML = 340;
  } else if (absSpread >= 7) {
    favML = -280; dogML = 225;
  } else if (absSpread >= 5) {
    favML = -210; dogML = 175;
  } else if (absSpread >= 3) {
    favML = -155; dogML = 130;
  } else if (absSpread >= 1.5) {
    favML = -125; dogML = 105;
  } else {
    favML = -110; dogML = -110;
  }

  const topML = spread <= 0 ? favML : dogML;
  const bottomML = spread <= 0 ? dogML : favML;

  return {
    moneyline: { home: topML, away: bottomML },
    spread: {
      home: -110, away: -110,
      homePoint: spread,
      awayPoint: -spread,
    },
    total: { over: -110, under: -110, point: 145.5 },
    bookmaker: "DraftKings",
  };
}

export function MatchupDropdown({
  matchup,
  isDemo,
  onClose,
}: MatchupDropdownProps) {
  const { topTeam, bottomTeam, status, topScore, bottomScore, prediction } =
    matchup;

  const isFinal = status === "final";
  const isLive = status === "in_progress";
  const isScheduled = status === "scheduled" || status === "tbd";

  // Fetch live odds for all games with both teams
  const oddsQuery =
    !isDemo && topTeam && bottomTeam
      ? `/api/odds?home=${encodeURIComponent(topTeam.name)}&away=${encodeURIComponent(bottomTeam.name)}`
      : null;
  const { data: oddsData } = useSWR<GameOdds>(oddsQuery, fetcher, {
    refreshInterval: isLive ? 30000 : 0,
  });

  // Fetch ESPN game data for live/final games
  const { data: gameData } = useSWR<ESPNSummaryResponse>(
    !isDemo && matchup.espnEventId && (isFinal || isLive)
      ? `/api/game/${matchup.espnEventId}`
      : null,
    fetcher,
    { refreshInterval: isLive ? 15000 : 0 }
  );

  // Demo mock odds
  const demoOdds = useMemo(() => {
    if (!isDemo || !topTeam || !bottomTeam) return null;
    return generateMockOdds(topTeam.seed, bottomTeam.seed);
  }, [isDemo, topTeam, bottomTeam]);

  // Validate odds data has expected shape (API may return error objects)
  const validOddsData = oddsData?.moneyline ? oddsData : null;
  const displayOdds = validOddsData || demoOdds;

  // AI recap for final games
  const [recap, setRecap] = useState("");
  const [recapLoading, setRecapLoading] = useState(false);

  useEffect(() => {
    if (!isFinal) return;
    if (isDemo) {
      setRecap(DEMO_RECAPS.final);
      return;
    }
    if (!gameData) return;

    setRecapLoading(true);
    const context = buildStatsContext(gameData);
    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameContext: `Game Status: Final\n${context}` }),
    })
      .then(async (res) => {
        if (!res.body) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let text = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value);
          setRecap(text);
        }
      })
      .finally(() => setRecapLoading(false));
  }, [isFinal, isDemo, gameData]);

  // Extract key stats from boxscore
  const teamStats = gameData?.boxscore?.teams || [];
  const stat = (teamIdx: number, name: string) => {
    const s = teamStats[teamIdx]?.statistics?.find((s) => s.name === name);
    return s?.displayValue || "-";
  };

  const topAbbr = topTeam?.abbreviation || "—";
  const bottomAbbr = bottomTeam?.abbreviation || "—";

  return (
    <div className="mt-1 w-[300px] rounded-lg border border-accent/30 bg-card overflow-hidden animate-in slide-in-from-top-2 shadow-lg shadow-black/40">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-accent/10 px-3 py-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
          {isFinal ? "Final" : isLive ? "Live" : "Preview"}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-text-dim hover:text-white transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-3 space-y-2.5">
        {/* Score display for live/final */}
        {(isFinal || isLive) && topTeam && bottomTeam && (
          <div className="space-y-1">
            <ScoreRow
              team={topTeam}
              score={topScore ?? 0}
              isWinner={isFinal && matchup.winnerId === topTeam.teamId}
            />
            <ScoreRow
              team={bottomTeam}
              score={bottomScore ?? 0}
              isWinner={isFinal && matchup.winnerId === bottomTeam.teamId}
            />
            {isLive && (
              <div className="flex items-center gap-1 justify-center">
                <span className="h-1.5 w-1.5 rounded-full bg-live-red animate-pulse-live" />
                <span className="text-[9px] text-live-red font-bold">
                  {matchup.period === 1 ? "1st" : "2nd"} {matchup.displayClock}
                </span>
              </div>
            )}
          </div>
        )}

        {/* AI Prediction */}
        {prediction && (
          <div className="rounded-md bg-accent/5 border border-accent/20 p-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold uppercase text-accent">
                AI Prediction
              </span>
              <span
                className={clsx(
                  "text-[10px] font-bold",
                  prediction.confidence >= 70 ? "text-final-green" : "text-accent"
                )}
              >
                {prediction.confidence}%
              </span>
            </div>
            <p className="text-[10px] leading-relaxed text-text-secondary">
              {prediction.reasoning || "Analysis pending..."}
            </p>
          </div>
        )}

        {/* Key Stats (live/final with boxscore data) */}
        {(isFinal || isLive) && teamStats.length >= 2 && (
          <div className="space-y-1">
            <span className="text-[9px] font-bold uppercase text-text-dim">
              Key Stats
            </span>
            {/* Team labels */}
            <div className="grid grid-cols-[1fr_40px_1fr] gap-1 text-[10px]">
              <span className="text-right font-bold text-white">{topAbbr}</span>
              <span className="text-center text-text-dim">Stat</span>
              <span className="text-left font-bold text-white">{bottomAbbr}</span>
            </div>
            <StatRow label="FG%" a={stat(0, "fieldGoalPct")} b={stat(1, "fieldGoalPct")} />
            <StatRow label="REB" a={stat(0, "rebounds")} b={stat(1, "rebounds")} />
            <StatRow label="AST" a={stat(0, "assists")} b={stat(1, "assists")} />
            <StatRow label="TO" a={stat(0, "turnovers")} b={stat(1, "turnovers")} inverse />
            <StatRow label="STL" a={stat(0, "steals")} b={stat(1, "steals")} />
            <StatRow label="BLK" a={stat(0, "blocks")} b={stat(1, "blocks")} />
          </div>
        )}

        {/* Loading skeleton for stats */}
        {(isFinal || isLive) && !isDemo && teamStats.length < 2 && matchup.espnEventId && (
          <div className="space-y-1">
            <span className="text-[9px] font-bold uppercase text-text-dim">
              Key Stats
            </span>
            <div className="space-y-1.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-3 rounded bg-white/5 animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {/* Season stats for scheduled games */}
        {isScheduled && topTeam && bottomTeam && (
          <div className="space-y-1">
            <span className="text-[9px] font-bold uppercase text-text-dim">
              Season Comparison
            </span>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="space-y-0.5">
                <p className="font-bold text-white truncate">{topTeam.abbreviation}</p>
                <p className="text-text-secondary">
                  <span className="text-text-dim">Seed:</span> {topTeam.seed}
                </p>
                <p className="text-text-secondary">
                  <span className="text-text-dim">Record:</span> {topTeam.record}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-white truncate">{bottomTeam.abbreviation}</p>
                <p className="text-text-secondary">
                  <span className="text-text-dim">Seed:</span> {bottomTeam.seed}
                </p>
                <p className="text-text-secondary">
                  <span className="text-text-dim">Record:</span> {bottomTeam.record}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Betting lines (all game states) */}
        {topTeam && bottomTeam && (
          <div className="space-y-1">
            <span className="text-[9px] font-bold uppercase text-text-dim">
              {isFinal ? "Closing Lines" : "Betting Lines"}
              {displayOdds?.bookmaker && (
                <span className="text-text-dim font-normal"> via {displayOdds.bookmaker}</span>
              )}
            </span>
            {displayOdds ? (
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-text-dim">Spread</span>
                  <div className="flex gap-2">
                    <span className="text-white font-bold">
                      {topAbbr} {displayOdds.spread.homePoint > 0 ? "+" : ""}{displayOdds.spread.homePoint}
                    </span>
                    <span className="text-text-secondary">/</span>
                    <span className="text-white font-bold">
                      {bottomAbbr} {displayOdds.spread.awayPoint > 0 ? "+" : ""}{displayOdds.spread.awayPoint}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim">Moneyline</span>
                  <div className="flex gap-2">
                    <span className="text-white font-bold">
                      {topAbbr} {displayOdds.moneyline.home > 0 ? "+" : ""}{displayOdds.moneyline.home}
                    </span>
                    <span className="text-text-secondary">/</span>
                    <span className="text-white font-bold">
                      {bottomAbbr} {displayOdds.moneyline.away > 0 ? "+" : ""}{displayOdds.moneyline.away}
                    </span>
                  </div>
                </div>
                {displayOdds.total.point > 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-dim">O/U</span>
                    <span className="text-white font-bold">{displayOdds.total.point}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-text-dim">
                Loading odds...
              </p>
            )}
          </div>
        )}

        {/* AI Game Recap (final only) */}
        {isFinal && (
          <div className="space-y-1">
            <span className="text-[9px] font-bold uppercase text-text-dim">
              AI Recap
            </span>
            {recap ? (
              <p className="text-[10px] leading-relaxed text-text-secondary">
                {recap}
                {recapLoading && (
                  <span className="inline-block w-1 h-2.5 bg-accent ml-0.5 animate-pulse-live" />
                )}
              </p>
            ) : (
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 animate-spin rounded-full border border-accent border-t-transparent" />
                <span className="text-[10px] text-text-dim">Generating recap...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreRow({
  team,
  score,
  isWinner,
}: {
  team: { name: string; abbreviation: string; seed: number; logoUrl: string };
  score: number;
  isWinner: boolean;
}) {
  return (
    <div className={clsx("flex items-center gap-2 px-1 py-0.5 rounded", isWinner && "bg-final-green/5")}>
      <span className="text-[10px] text-text-dim w-3 text-center">{team.seed}</span>
      {team.logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={team.logoUrl} alt={team.abbreviation} className="h-4 w-4 object-contain" />
      )}
      <span className={clsx("flex-1 text-xs font-medium truncate", isWinner ? "text-white font-bold" : "text-text-primary")}>
        {team.abbreviation}
      </span>
      <span className={clsx("text-sm font-bold tabular-nums", isWinner ? "text-white" : "text-text-secondary")}>
        {score}
      </span>
    </div>
  );
}

function StatRow({ label, a, b, inverse = false }: { label: string; a: string; b: string; inverse?: boolean }) {
  // Determine which side "wins" this stat (higher is better, unless inverse like turnovers)
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  const validComparison = !isNaN(numA) && !isNaN(numB);
  const aWins = validComparison && (inverse ? numA < numB : numA > numB);
  const bWins = validComparison && (inverse ? numB < numA : numB > numA);

  return (
    <div className="grid grid-cols-[1fr_40px_1fr] gap-1 text-[10px]">
      <span className={clsx("text-right font-bold tabular-nums", aWins ? "text-final-green" : "text-white")}>
        {a}
      </span>
      <span className="text-center text-text-dim">{label}</span>
      <span className={clsx("text-left font-bold tabular-nums", bWins ? "text-final-green" : "text-white")}>
        {b}
      </span>
    </div>
  );
}

function buildStatsContext(data: ESPNSummaryResponse): string {
  try {
    const teams = data.boxscore?.teams || [];
    let context = "";
    for (const team of teams) {
      context += `${team.team.displayName}: `;
      context += team.statistics?.map((s) => `${s.name}: ${s.displayValue}`).join(", ");
      context += "\n";
    }
    return context;
  } catch {
    return "Stats unavailable.";
  }
}
