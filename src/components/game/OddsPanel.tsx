"use client";

import useSWR from "swr";
import { GameOdds } from "@/types/odds";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface OddsPanelProps {
  eventId?: string;
  isDemo: boolean;
}

// Mock odds for demo mode
const MOCK_ODDS: GameOdds = {
  moneyline: { home: -180, away: +155 },
  spread: { home: -110, away: -110, homePoint: -3.5, awayPoint: 3.5 },
  total: { over: -110, under: -110, point: 145.5 },
  bookmaker: "DraftKings",
};

function formatOdds(price: number): string {
  return price > 0 ? `+${price}` : `${price}`;
}

function OddsCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-card p-3">
      <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text-dim">
        {title}
      </h4>
      {children}
    </div>
  );
}

export function OddsPanel({ isDemo }: OddsPanelProps) {
  const { data: odds } = useSWR<GameOdds>(
    isDemo ? null : `/api/odds?home=&away=`,
    fetcher,
    { refreshInterval: 60000 }
  );

  const displayOdds = isDemo ? MOCK_ODDS : odds;

  if (!displayOdds) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-accent">
          Live Odds
        </h3>
        <div className="rounded-lg border border-border-subtle bg-card p-4 text-center">
          <p className="text-xs text-text-dim">Odds unavailable</p>
          <p className="mt-1 text-[10px] text-text-dim">
            Configure ODDS_API_KEY for live odds
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wider text-accent">
        Live Odds
      </h3>
      <p className="text-[10px] text-text-dim">
        via {displayOdds.bookmaker}
      </p>

      <OddsCard title="Moneyline">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-xs text-text-primary">Home</span>
            <span className="text-xs font-bold text-white">
              {formatOdds(displayOdds.moneyline.home)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-text-primary">Away</span>
            <span className="text-xs font-bold text-white">
              {formatOdds(displayOdds.moneyline.away)}
            </span>
          </div>
        </div>
      </OddsCard>

      <OddsCard title="Spread">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-xs text-text-primary">
              Home {displayOdds.spread.homePoint > 0 ? "+" : ""}
              {displayOdds.spread.homePoint}
            </span>
            <span className="text-xs font-bold text-white">
              {formatOdds(displayOdds.spread.home)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-text-primary">
              Away {displayOdds.spread.awayPoint > 0 ? "+" : ""}
              {displayOdds.spread.awayPoint}
            </span>
            <span className="text-xs font-bold text-white">
              {formatOdds(displayOdds.spread.away)}
            </span>
          </div>
        </div>
      </OddsCard>

      <OddsCard title="Over/Under">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-xs text-text-primary">
              Over {displayOdds.total.point}
            </span>
            <span className="text-xs font-bold text-white">
              {formatOdds(displayOdds.total.over)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-text-primary">
              Under {displayOdds.total.point}
            </span>
            <span className="text-xs font-bold text-white">
              {formatOdds(displayOdds.total.under)}
            </span>
          </div>
        </div>
      </OddsCard>

      {/* Win Probability Bar */}
      <OddsCard title="Win Probability">
        {(() => {
          const homeML = displayOdds.moneyline.home;
          const awayML = displayOdds.moneyline.away;
          const homeProb =
            homeML < 0
              ? Math.abs(homeML) / (Math.abs(homeML) + 100)
              : 100 / (homeML + 100);
          const awayProb =
            awayML < 0
              ? Math.abs(awayML) / (Math.abs(awayML) + 100)
              : 100 / (awayML + 100);
          const total = homeProb + awayProb;
          const homePct = Math.round((homeProb / total) * 100);
          const awayPct = 100 - homePct;
          return (
            <div>
              <div className="flex justify-between text-[10px] text-text-dim mb-1">
                <span>Home {homePct}%</span>
                <span>Away {awayPct}%</span>
              </div>
              <div className="flex h-3 overflow-hidden rounded-full">
                <div
                  className="bg-accent transition-all"
                  style={{ width: `${homePct}%` }}
                />
                <div
                  className="bg-upcoming-blue transition-all"
                  style={{ width: `${awayPct}%` }}
                />
              </div>
            </div>
          );
        })()}
      </OddsCard>
    </div>
  );
}
