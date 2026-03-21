"use client";

import useSWR from "swr";
import Link from "next/link";
import { useIsDemo } from "@/hooks/useDemo";
import { GameHeader } from "./GameHeader";
import { StatsPanel } from "./StatsPanel";
import { AIPanel } from "./AIPanel";
import { OddsPanel } from "./OddsPanel";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface GameDashboardProps {
  eventId: string;
}

export function GameDashboard({ eventId }: GameDashboardProps) {
  const isDemo = useIsDemo();

  const { data: gameData, isLoading } = useSWR(
    isDemo ? null : `/api/game/${eventId}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="mt-4 text-sm text-text-secondary">Loading game data...</p>
      </div>
    );
  }

  const summary = gameData;

  return (
    <div className="px-4 py-4">
      {/* Back to bracket */}
      <Link
        href={isDemo ? "/?demo=true" : "/"}
        className="mb-4 inline-flex items-center gap-1 text-sm text-text-dim hover:text-accent transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Bracket
      </Link>

      {/* Game Header */}
      {summary?.header && <GameHeader header={summary.header} />}

      {/* Three-column layout */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[280px_1fr_320px]">
        {/* Left: Odds */}
        <OddsPanel eventId={eventId} isDemo={isDemo} />

        {/* Center: Stats */}
        <StatsPanel summary={summary} isDemo={isDemo} />

        {/* Right: AI Analysis */}
        <AIPanel eventId={eventId} summary={summary} isDemo={isDemo} />
      </div>
    </div>
  );
}
