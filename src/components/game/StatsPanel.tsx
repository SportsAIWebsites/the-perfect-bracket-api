"use client";

import { useState } from "react";
import clsx from "clsx";
import { ESPNSummaryResponse } from "@/types/espn";

interface StatsPanelProps {
  summary: ESPNSummaryResponse | null;
  isDemo: boolean;
}

export function StatsPanel({ summary, isDemo }: StatsPanelProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (!summary?.boxscore?.players?.length) {
    return (
      <div className="rounded-xl border border-border-subtle bg-card p-6 text-center">
        <p className="text-sm text-text-dim">
          {isDemo
            ? "Select a live game from the bracket to view stats"
            : "Box score not yet available"}
        </p>
      </div>
    );
  }

  const teams = summary.boxscore.players;
  const teamStats = summary.boxscore.teams;
  const activeTeam = teams[activeTab];
  const stats = activeTeam?.statistics?.[0];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-accent">
        Box Score
      </h3>

      {/* Team tabs */}
      <div className="flex gap-1">
        {teams.map((t, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={clsx(
              "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
              activeTab === i
                ? "bg-accent text-white"
                : "bg-card text-text-dim hover:text-text-primary"
            )}
          >
            {t.team.displayName || t.team.abbreviation}
          </button>
        ))}
      </div>

      {/* Box score table */}
      {stats && (
        <div className="overflow-x-auto rounded-lg border border-border-subtle">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-base">
                <th className="sticky left-0 bg-bg-base px-2 py-1.5 text-left font-bold text-text-dim">
                  Player
                </th>
                {stats.labels.map((label) => (
                  <th
                    key={label}
                    className="px-2 py-1.5 text-right font-bold text-text-dim"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.athletes
                .filter((a) => !a.didNotPlay)
                .map((athlete, i) => (
                  <tr
                    key={i}
                    className={clsx(
                      "border-b border-border-subtle/50",
                      i % 2 === 0 ? "bg-card" : "bg-card-alt",
                      athlete.starter && "font-medium"
                    )}
                  >
                    <td className="sticky left-0 bg-inherit px-2 py-1.5 text-text-primary">
                      <div className="flex items-center gap-1">
                        <span className="text-text-dim text-[10px] w-4">
                          {athlete.athlete.jersey}
                        </span>
                        <span className="truncate max-w-[120px]">
                          {athlete.athlete.displayName}
                        </span>
                        <span className="text-[9px] text-text-dim">
                          {athlete.athlete.position?.abbreviation}
                        </span>
                      </div>
                    </td>
                    {athlete.stats.map((stat, j) => (
                      <td
                        key={j}
                        className="px-2 py-1.5 text-right tabular-nums text-text-secondary"
                      >
                        {stat}
                      </td>
                    ))}
                  </tr>
                ))}
              {/* Totals row */}
              {stats.totals && (
                <tr className="bg-bg-base font-bold">
                  <td className="sticky left-0 bg-bg-base px-2 py-1.5 text-text-primary">
                    TOTAL
                  </td>
                  {stats.totals.map((total, j) => (
                    <td
                      key={j}
                      className="px-2 py-1.5 text-right tabular-nums text-white"
                    >
                      {total}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Team Stats Comparison */}
      {teamStats?.length >= 2 && (
        <div className="rounded-lg border border-border-subtle bg-card p-3">
          <h4 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-text-dim">
            Team Stats
          </h4>
          <div className="space-y-2">
            {teamStats[0].statistics?.slice(0, 8).map((stat, i) => {
              const away = parseFloat(stat.displayValue) || 0;
              const home =
                parseFloat(teamStats[1].statistics?.[i]?.displayValue || "0") || 0;
              const max = Math.max(away, home, 1);

              return (
                <div key={stat.name} className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-text-secondary tabular-nums">
                      {stat.displayValue}
                    </span>
                    <span className="text-text-dim">{stat.name}</span>
                    <span className="text-text-secondary tabular-nums">
                      {teamStats[1].statistics?.[i]?.displayValue}
                    </span>
                  </div>
                  <div className="flex gap-0.5">
                    <div className="flex h-1.5 flex-1 justify-end overflow-hidden rounded-full bg-border-subtle/30">
                      <div
                        className="rounded-full bg-accent transition-all"
                        style={{ width: `${(away / max) * 100}%` }}
                      />
                    </div>
                    <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-border-subtle/30">
                      <div
                        className="rounded-full bg-upcoming-blue transition-all"
                        style={{ width: `${(home / max) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
