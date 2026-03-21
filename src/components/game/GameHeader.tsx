"use client";

import { ESPNSummaryHeader } from "@/types/espn";

interface GameHeaderProps {
  header: ESPNSummaryHeader;
}

export function GameHeader({ header }: GameHeaderProps) {
  const comp = header?.competitions?.[0];
  if (!comp) return null;

  const status = comp.status;
  const competitors = comp.competitors || [];

  const away = competitors.find((c) => c.homeAway === "away");
  const home = competitors.find((c) => c.homeAway === "home");

  const isLive = status?.type?.state === "in";
  const isFinal = status?.type?.state === "post";

  return (
    <div className="rounded-xl border border-border-subtle bg-card p-4">
      <div className="flex items-center justify-between">
        {/* Away team */}
        <div className="flex-1 text-right">
          <p className="text-lg font-bold text-text-primary">
            {away?.id || "Away"}
          </p>
          <p className="text-3xl font-black tabular-nums text-white">
            {away?.score || "0"}
          </p>
        </div>

        {/* Center status */}
        <div className="mx-8 flex flex-col items-center">
          {isLive && (
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-live-red animate-pulse-live" />
              <span className="text-sm font-bold text-live-red">LIVE</span>
            </div>
          )}
          {isFinal && (
            <span className="text-sm font-bold text-final-green">FINAL</span>
          )}
          {!isLive && !isFinal && (
            <span className="text-sm font-bold text-upcoming-blue">
              {status?.type?.shortDetail || "Scheduled"}
            </span>
          )}
          {isLive && (
            <p className="mt-1 text-xs text-text-dim">
              {status?.type?.shortDetail}
            </p>
          )}
        </div>

        {/* Home team */}
        <div className="flex-1">
          <p className="text-lg font-bold text-text-primary">
            {home?.id || "Home"}
          </p>
          <p className="text-3xl font-black tabular-nums text-white">
            {home?.score || "0"}
          </p>
        </div>
      </div>
    </div>
  );
}
