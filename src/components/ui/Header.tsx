"use client";

import { useIsDemo } from "@/hooks/useDemo";
import { DemoBadge } from "./LiveBadge";

export function Header() {
  const isDemo = useIsDemo();

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-bg-base/95 backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold md:text-2xl">
            <span className="text-accent">The Perfect</span>{" "}
            <span className="text-text-primary">Bracket</span>
          </h1>
          <span className="hidden text-xs font-medium text-text-dim md:inline">
            AI-Powered March Madness Predictions
          </span>
          {isDemo && <DemoBadge />}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-text-dim">
            Powered by Claude AI
          </span>
        </div>
      </div>
    </header>
  );
}
