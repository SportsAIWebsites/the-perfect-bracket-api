"use client";

import { useState } from "react";
import { FinalFour } from "@/types/bracket";
import { MatchupCard } from "./MatchupCard";

interface FinalFourCenterProps {
  finalFour: FinalFour;
  onMatchupClick?: (matchupId: string) => void;
  isDemo?: boolean;
}

export function FinalFourCenter({
  finalFour,
  isDemo = false,
}: FinalFourCenterProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Final Four label */}
      <div className="text-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-dim">
          Final Four
        </span>
      </div>

      {/* Semi 1 */}
      <MatchupCard
        matchup={finalFour.semifinals[0]}
        isExpanded={expandedId === finalFour.semifinals[0].id}
        isDemo={isDemo}
        onClick={() => toggle(finalFour.semifinals[0].id)}
        onClose={() => setExpandedId(null)}
      />

      {/* Championship */}
      <div className="text-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
          Championship
        </span>
      </div>
      <MatchupCard
        matchup={finalFour.championship}
        isExpanded={expandedId === finalFour.championship.id}
        isDemo={isDemo}
        onClick={() => toggle(finalFour.championship.id)}
        onClose={() => setExpandedId(null)}
      />

      {/* Predicted Champion */}
      {finalFour.championship.prediction && (
        <div className="mt-2 rounded-lg border border-accent/30 bg-accent/5 px-4 py-2 text-center glow-accent-strong">
          <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
            Predicted Champion
          </span>
          <div className="mt-1 text-lg font-bold text-white">
            {finalFour.championship.prediction.winnerId ===
            finalFour.championship.topTeam?.teamId
              ? finalFour.championship.topTeam?.name
              : finalFour.championship.bottomTeam?.name}
          </div>
        </div>
      )}

      {/* Semi 2 */}
      <div className="text-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-dim">
          Final Four
        </span>
      </div>
      <MatchupCard
        matchup={finalFour.semifinals[1]}
        isExpanded={expandedId === finalFour.semifinals[1].id}
        isDemo={isDemo}
        onClick={() => toggle(finalFour.semifinals[1].id)}
        onClose={() => setExpandedId(null)}
      />
    </div>
  );
}
