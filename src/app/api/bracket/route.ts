import { NextRequest, NextResponse } from "next/server";
import { FullBracket } from "@/types/bracket";
import { fetchFullTournamentScoreboard } from "@/lib/espn";
import { buildBracketFromESPN } from "@/lib/bracket-builder";
import { propagateBracket } from "@/lib/bracket-propagation";
import { runPredictionEngine } from "@/lib/prediction-engine";

// In-memory bracket cache — prevents concurrent engine runs from racing
let bracketCache: { data: FullBracket; expiresAt: number } | null = null;
let engineRunning = false;
const LIVE_BRACKET_TTL = 8 * 1000;   // 8 seconds when live games
const IDLE_BRACKET_TTL = 60 * 1000;  // 60 seconds when no live games

export async function GET(request: NextRequest) {
  const isDemo = request.nextUrl.searchParams.get("demo") === "true";

  if (isDemo) {
    const { mockBracket } = await import("@/mock/bracket");
    const propagated = propagateBracket(mockBracket);
    return NextResponse.json(propagated);
  }

  // Return cached bracket if fresh
  if (bracketCache && Date.now() < bracketCache.expiresAt) {
    return NextResponse.json(bracketCache.data);
  }

  // Prevent concurrent engine runs — return stale data while refreshing
  if (engineRunning && bracketCache) {
    return NextResponse.json(bracketCache.data);
  }

  try {
    engineRunning = true;
    const events = await fetchFullTournamentScoreboard();
    let bracket = buildBracketFromESPN(events);
    bracket = propagateBracket(bracket);
    bracket = await runPredictionEngine(bracket);

    // Use shorter cache when live games are happening
    const allMatchups = [
      ...["East", "West", "South", "Midwest"].flatMap((r) =>
        Object.values(bracket.regions[r as keyof typeof bracket.regions].rounds).flat()
      ),
      ...bracket.finalFour.semifinals,
      bracket.finalFour.championship,
    ];
    const hasLive = allMatchups.some((m) => m.status === "in_progress");
    const ttl = hasLive ? LIVE_BRACKET_TTL : IDLE_BRACKET_TTL;

    bracketCache = { data: bracket, expiresAt: Date.now() + ttl };
    engineRunning = false;

    return NextResponse.json(bracket);
  } catch (error) {
    engineRunning = false;
    console.error("Failed to build bracket:", error);

    // Return stale cache on error
    if (bracketCache) return NextResponse.json(bracketCache.data);

    return NextResponse.json(
      { error: "Failed to load bracket data" },
      { status: 500 }
    );
  }
}
