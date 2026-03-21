"use client";

import { GameStatus } from "@/types/bracket";

export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-live-red/20 px-2 py-0.5 text-[10px] font-bold uppercase text-live-red">
      <span className="h-1.5 w-1.5 rounded-full bg-live-red animate-pulse-live" />
      Live
    </span>
  );
}

export function FinalBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-final-green/20 px-2 py-0.5 text-[10px] font-bold uppercase text-final-green">
      Final
    </span>
  );
}

export function ScheduledBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-upcoming-blue/20 px-2 py-0.5 text-[10px] font-bold uppercase text-upcoming-blue">
      Upcoming
    </span>
  );
}

export function PredictedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase text-accent">
      <svg className="h-2.5 w-2.5" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0l2.5 5 5.5.8-4 3.9.9 5.3L8 12.5 3.1 15l.9-5.3-4-3.9L5.5 5z" />
      </svg>
      AI Pick
    </span>
  );
}

export function DemoBadge() {
  return (
    <span className="inline-flex items-center rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase text-accent">
      Demo
    </span>
  );
}

export function GameStatusBadge({ status }: { status: GameStatus }) {
  switch (status) {
    case "in_progress":
      return <LiveBadge />;
    case "final":
      return <FinalBadge />;
    case "scheduled":
      return <ScheduledBadge />;
    default:
      return null;
  }
}
