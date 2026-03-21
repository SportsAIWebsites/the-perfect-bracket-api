"use client";

import { Fragment, useState } from "react";
import { BracketRegion, RoundName } from "@/types/bracket";
import { MatchupCard } from "./MatchupCard";
import { ROUND_NAMES } from "@/lib/constants";

interface RegionBracketStripProps {
  region: BracketRegion;
  reverse?: boolean;
  isDemo?: boolean;
}

const ROUNDS: RoundName[] = ["R64", "R32", "S16", "E8"];
const BRACKET_HEIGHT = 700;
const CONNECTOR_W = 28;

/**
 * Draws bracket connector lines between two feeder games and one output game.
 * Non-flip (left→right): feeders on left, output on right
 * Flip (right→left): feeders on right, output on left
 */
function BracketConnector({
  height,
  flip,
}: {
  height: number;
  flip: boolean;
}) {
  return (
    <div className="flex items-center" style={{ height, width: CONNECTOR_W }}>
      {flip ? (
        <>
          {/* Horizontal line going left (to next round) */}
          <div className="h-px flex-1 bg-border-subtle/60" />
          {/* Bracket shape opening right (toward feeders) */}
          <div className="flex flex-1 flex-col" style={{ height }}>
            <div className="flex-1 border-l border-t border-border-subtle/60" />
            <div className="flex-1 border-b border-l border-border-subtle/60" />
          </div>
        </>
      ) : (
        <>
          {/* Bracket shape opening left (toward feeders) */}
          <div className="flex flex-1 flex-col" style={{ height }}>
            <div className="flex-1 border-r border-t border-border-subtle/60" />
            <div className="flex-1 border-b border-r border-border-subtle/60" />
          </div>
          {/* Horizontal line going right (to next round) */}
          <div className="h-px flex-1 bg-border-subtle/60" />
        </>
      )}
    </div>
  );
}

export function RegionBracketStrip({
  region,
  reverse = false,
  isDemo = false,
}: RegionBracketStripProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Reverse: show E8 → S16 → R32 → R64 (left to right)
  // Normal: show R64 → R32 → S16 → E8 (left to right)
  const roundsOrder = reverse ? [...ROUNDS].reverse() : ROUNDS;

  // Connector configs between adjacent columns
  // Each connector joins pairs from the feeder round into the next round
  const connectorConfigs = reverse
    ? [
        { count: 1, height: BRACKET_HEIGHT / 2 }, // E8←S16
        { count: 2, height: BRACKET_HEIGHT / 4 }, // S16←R32
        { count: 4, height: BRACKET_HEIGHT / 8 }, // R32←R64
      ]
    : [
        { count: 4, height: BRACKET_HEIGHT / 8 }, // R64→R32
        { count: 2, height: BRACKET_HEIGHT / 4 }, // R32→S16
        { count: 1, height: BRACKET_HEIGHT / 2 }, // S16→E8
      ];

  return (
    <div className="flex flex-col">
      <h3 className="mb-2 text-center text-sm font-bold uppercase tracking-wider text-accent">
        {region.name}
      </h3>

      {/* Round headers */}
      <div className="flex mb-1">
        {roundsOrder.map((round, i) => (
          <Fragment key={round}>
            <div className="w-[160px] text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-dim">
                {ROUND_NAMES[round]}
              </span>
            </div>
            {i < roundsOrder.length - 1 && (
              <div style={{ width: CONNECTOR_W }} />
            )}
          </Fragment>
        ))}
      </div>

      {/* Bracket body — fixed height, each column uses justify-around */}
      <div className="flex" style={{ height: BRACKET_HEIGHT }}>
        {roundsOrder.flatMap((round, roundIdx) => {
          const matchups =
            region.rounds[round as keyof typeof region.rounds] || [];
          const elements: React.ReactNode[] = [];

          // Round column
          elements.push(
            <div
              key={round}
              className="flex h-full w-[160px] flex-col justify-around"
            >
              {matchups.map((matchup) => (
                <MatchupCard
                  key={matchup.id}
                  matchup={matchup}
                  isExpanded={expandedId === matchup.id}
                  isDemo={isDemo}
                  onClick={() =>
                    setExpandedId((prev) =>
                      prev === matchup.id ? null : matchup.id
                    )
                  }
                  onClose={() => setExpandedId(null)}
                />
              ))}
            </div>
          );

          // Connector column (between this round and the next)
          if (roundIdx < roundsOrder.length - 1) {
            const config = connectorConfigs[roundIdx];
            elements.push(
              <div
                key={`conn-${roundIdx}`}
                className="flex h-full flex-col justify-around"
                style={{ width: CONNECTOR_W }}
              >
                {Array.from({ length: config.count }).map((_, i) => (
                  <BracketConnector
                    key={i}
                    height={config.height}
                    flip={reverse}
                  />
                ))}
              </div>
            );
          }

          return elements;
        })}
      </div>
    </div>
  );
}
