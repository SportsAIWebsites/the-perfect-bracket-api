import { NextRequest, NextResponse } from "next/server";
import { FullBracket } from "@/types/bracket";
import { fetchFullTournamentScoreboard } from "@/lib/espn";
import { buildBracketFromESPN } from "@/lib/bracket-builder";
import { propagateBracket } from "@/lib/bracket-propagation";
import { runPredictionEngine } from "@/lib/prediction-engine";

// Context-aware prediction overrides — real-world factors the prediction engine can't see
function applyContextualOverrides(bracket: FullBracket): FullBracket {
  const overrides: Record<string, { winnerId: string; confidence: number; reasoning: string }> = {
    "south-e8-0": {
      winnerId: "248", confidence: 58,
      reasoning: "Houston is playing on their home court in Houston. The home-court advantage in a virtual home game is massive — Houston's defense and crowd energy give them the edge over Florida.",
    },
    "midwest-e8-0": {
      winnerId: "66", confidence: 55,
      reasoning: "Michigan's 6th man LJ Caison is injured, significantly hurting their bench production. Iowa State's depth and defensive intensity exploit Michigan's lack of bench scoring.",
    },
  };

  // Apply regional E8 overrides
  for (const [matchupId, pred] of Object.entries(overrides)) {
    const [regionKey, round, posStr] = matchupId.split("-");
    const regionName = regionKey.charAt(0).toUpperCase() + regionKey.slice(1);
    const pos = parseInt(posStr);
    const region = bracket.regions[regionName as keyof typeof bracket.regions];
    if (region) {
      const roundKey = round.toUpperCase();
      const matchups = region.rounds[roundKey as keyof typeof region.rounds];
      if (matchups && matchups[pos]) {
        matchups[pos].prediction = { ...pred, generatedAt: new Date().toISOString() };
      }
    }
  }

  // Override Final Four
  if (bracket.finalFour.semifinals[0]) {
    bracket.finalFour.semifinals[0].prediction = {
      winnerId: "12", confidence: 56,
      reasoning: "Arizona's size and versatility overwhelm Duke. Caleb Love and the Wildcats prove too much in the Final Four.",
      generatedAt: new Date().toISOString(),
    };
  }
  if (bracket.finalFour.semifinals[1]) {
    bracket.finalFour.semifinals[1].prediction = {
      winnerId: "248", confidence: 57,
      reasoning: "Houston's elite defense stifles Iowa State's offense in a low-scoring grind. Playing near home, the Cougars feed off the crowd energy.",
      generatedAt: new Date().toISOString(),
    };
  }

  // Override Championship — Arizona wins it all
  bracket.finalFour.championship.prediction = {
    winnerId: "12", confidence: 54,
    reasoning: "Arizona's balanced scoring and tournament experience carry them to the national championship. Their frontcourt dominance proves the difference against Houston's gritty defense.",
    generatedAt: new Date().toISOString(),
  };

  return bracket;
}

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
    bracket = applyContextualOverrides(bracket);

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
