"use client";

import { RoundName } from "@/types/bracket";
import { ROUND_NAMES } from "@/lib/constants";

export function RoundHeader({ round }: { round: RoundName }) {
  return (
    <div className="mb-2 text-center">
      <span className="text-[10px] font-bold uppercase tracking-wider text-text-dim">
        {ROUND_NAMES[round]}
      </span>
    </div>
  );
}
