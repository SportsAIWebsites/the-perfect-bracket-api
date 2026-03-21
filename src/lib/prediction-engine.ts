import {
  FullBracket,
  BracketMatchup,
  BracketTeam,
  Prediction,
  Region,
} from "@/types/bracket";
import {
  findMatchupOdds,
  MatchupOdds,
  getImpliedProbability,
  formatML,
  fetchChampionshipFutures,
  findTeamFutures,
  TeamFutures,
} from "./odds";
import {
  getCachedPrediction,
  setCachedPrediction,
  makePredictionKey,
} from "./prediction-cache";
import {
  R32_FEEDERS,
  S16_FEEDERS,
  FINAL_FOUR_MATCHUPS,
  SEED_WIN_RATES_R64,
} from "./constants";

/**
 * Get the winner of a matchup — actual result, live leader, or AI prediction.
 */
function getWinner(matchup: BracketMatchup): BracketTeam | null {
  if (matchup.status === "final" && matchup.winnerId) {
    if (matchup.topTeam?.teamId === matchup.winnerId) return matchup.topTeam;
    if (matchup.bottomTeam?.teamId === matchup.winnerId)
      return matchup.bottomTeam;
  }
  if (matchup.status === "in_progress") {
    if (
      matchup.topScore !== undefined &&
      matchup.bottomScore !== undefined
    ) {
      if (matchup.topScore > matchup.bottomScore) return matchup.topTeam;
      if (matchup.bottomScore > matchup.topScore) return matchup.bottomTeam;
    }
    return null;
  }
  if (matchup.prediction) {
    if (matchup.prediction.winnerId === matchup.topTeam?.teamId)
      return matchup.topTeam;
    if (matchup.prediction.winnerId === matchup.bottomTeam?.teamId)
      return matchup.bottomTeam;
  }
  return null;
}

/**
 * Predict a matchup using odds (no Claude API calls).
 * Priority: 1) Game-specific ML odds  2) Championship futures  3) Seed-based fallback
 */
const LIVE_CACHE_TTL = 30 * 1000;
const STANDARD_CACHE_TTL = 5 * 60 * 1000;

async function predictMatchup(
  matchup: BracketMatchup,
  oddsMap: Map<string, MatchupOdds>,
  futuresMap: Map<string, TeamFutures>
): Promise<Prediction | null> {
  if (!matchup.topTeam || !matchup.bottomTeam) return null;
  if (matchup.status === "final") return null;

  const isLive = matchup.status === "in_progress";
  const topScore = matchup.topScore ?? 0;
  const bottomScore = matchup.bottomScore ?? 0;

  const scoreBucket = isLive
    ? `-live-${Math.floor(topScore / 5) * 5}-${Math.floor(bottomScore / 5) * 5}-p${matchup.period || 1}`
    : "";
  const cacheKey = makePredictionKey(
    matchup.topTeam.teamId,
    matchup.bottomTeam.teamId,
    matchup.round
  ) + scoreBucket;

  const cached = getCachedPrediction(cacheKey);
  if (cached) return cached;

  // Try pre-fetched odds first, then look up on-the-fly
  const oddsKey = `${matchup.topTeam.teamId}-${matchup.bottomTeam.teamId}`;
  let odds = oddsMap.get(oddsKey) || null;
  if (!odds) {
    odds = await findMatchupOdds(matchup.topTeam.name, matchup.bottomTeam.name);
    if (odds) {
      oddsMap.set(oddsKey, odds); // cache for future use
    }
  }

  let prediction: Prediction | null = null;

  // === PRIORITY 1: Game-specific ML odds ===
  if (odds) {
    const topML = odds.moneyline.top;
    const bottomML = odds.moneyline.bottom;
    const topIsFavorite = topML < bottomML;
    const winnerId = topIsFavorite ? matchup.topTeam.teamId : matchup.bottomTeam.teamId;
    const favoriteML = topIsFavorite ? topML : bottomML;
    const underdogML = topIsFavorite ? bottomML : topML;
    const favoriteName = topIsFavorite ? matchup.topTeam.name : matchup.bottomTeam.name;
    const underdogName = topIsFavorite ? matchup.bottomTeam.name : matchup.topTeam.name;
    const impliedProb = getImpliedProbability(favoriteML);
    const confidence = Math.min(99, Math.max(50, Math.round(impliedProb * 100)));

    let reasoning: string;
    if (isLive) {
      const leader = topScore > bottomScore ? matchup.topTeam.name : matchup.bottomTeam.name;
      const margin = Math.abs(topScore - bottomScore);
      reasoning = `${leader} leads by ${margin}. Live ML: ${favoriteName} ${formatML(favoriteML)} (${confidence}% implied).`;
    } else {
      reasoning = `${favoriteName} favored at ${formatML(favoriteML)} (${confidence}%) vs ${underdogName} ${formatML(underdogML)}. Spread: ${Math.abs(odds.spread).toFixed(1)} pts via ${odds.bookmaker}.`;
    }

    prediction = { winnerId, confidence, reasoning, generatedAt: new Date().toISOString() };
  }

  // === PRIORITY 1.5: Live game without ML — use score margin ===
  if (!prediction && isLive) {
    const margin = topScore - bottomScore;
    const isSecondHalf = (matchup.period || 1) >= 2;
    const topLeads = margin > 0;
    const absMargin = Math.abs(margin);

    let confidence: number;
    if (isSecondHalf) {
      if (absMargin >= 15) confidence = 85;
      else if (absMargin >= 10) confidence = 78;
      else if (absMargin >= 5) confidence = 68;
      else confidence = 55;
    } else {
      // First half — leads are less predictive
      if (absMargin >= 15) confidence = 72;
      else if (absMargin >= 10) confidence = 65;
      else if (absMargin >= 5) confidence = 58;
      else confidence = 52;
    }

    const leaderId = topLeads ? matchup.topTeam.teamId : matchup.bottomTeam.teamId;
    const leaderName = topLeads ? matchup.topTeam.name : matchup.bottomTeam.name;
    const trailerName = topLeads ? matchup.bottomTeam.name : matchup.topTeam.name;
    const half = isSecondHalf ? "2nd half" : "1st half";

    prediction = {
      winnerId: margin === 0 ? matchup.topTeam.teamId : leaderId, // tied → higher seed
      confidence,
      reasoning: margin === 0
        ? `Tied ${topScore}-${bottomScore} in the ${half}. Too close to call.`
        : `${leaderName} leads ${trailerName} by ${absMargin} in the ${half}. ${confidence}% win probability based on score margin.`,
      generatedAt: new Date().toISOString(),
    };
  }

  // === PRIORITY 2: Championship futures odds ===
  if (!prediction && futuresMap.size > 0) {
    const topFutures = findTeamFutures(matchup.topTeam.name, futuresMap);
    const bottomFutures = findTeamFutures(matchup.bottomTeam.name, futuresMap);

    if (topFutures && bottomFutures) {
      // Better futures (higher implied prob) = wins
      const topIsBetter = topFutures.impliedProb > bottomFutures.impliedProb;
      const winnerId = topIsBetter ? matchup.topTeam.teamId : matchup.bottomTeam.teamId;
      const winnerFutures = topIsBetter ? topFutures : bottomFutures;
      const loserFutures = topIsBetter ? bottomFutures : topFutures;
      const winnerName = topIsBetter ? matchup.topTeam.name : matchup.bottomTeam.name;
      const loserName = topIsBetter ? matchup.bottomTeam.name : matchup.topTeam.name;
      const winnerSeed = topIsBetter ? matchup.topTeam.seed : matchup.bottomTeam.seed;
      const loserSeed = topIsBetter ? matchup.bottomTeam.seed : matchup.topTeam.seed;

      // Futures reflect tournament win probability, not single-game.
      // Use ratio + seed gap for more realistic head-to-head confidence.
      const rawRatio = winnerFutures.impliedProb / (winnerFutures.impliedProb + loserFutures.impliedProb);
      const seedGap = Math.abs(winnerSeed - loserSeed);
      const seedBonus = Math.min(10, Math.round(seedGap * 0.7)); // 0-10 pts based on seed diff
      const confidence = Math.min(88, Math.max(52, Math.round(50 + (rawRatio - 0.5) * 46 + seedBonus)));

      const reasoning = `${winnerName} has better championship odds (${formatML(winnerFutures.odds)}) vs ${loserName} (${formatML(loserFutures.odds)}). Seed matchup: ${winnerSeed} vs ${loserSeed}. ${confidence}% projected edge.`;

      prediction = { winnerId, confidence, reasoning, generatedAt: new Date().toISOString() };
    } else if (topFutures && !bottomFutures) {
      // One team has futures, the other doesn't — use seed gap for confidence
      const seedGap = Math.abs(matchup.topTeam.seed - matchup.bottomTeam.seed);
      const confidence = Math.min(80, Math.max(65, 65 + Math.round(seedGap * 1.0)));
      prediction = {
        winnerId: matchup.topTeam.teamId,
        confidence,
        reasoning: `${matchup.topTeam.name} (${formatML(topFutures.odds)} championship odds) is a clear favorite. ${matchup.bottomTeam.name} has no championship futures — heavy underdog.`,
        generatedAt: new Date().toISOString(),
      };
    } else if (!topFutures && bottomFutures) {
      const seedGap = Math.abs(matchup.topTeam.seed - matchup.bottomTeam.seed);
      const confidence = Math.min(80, Math.max(65, 65 + Math.round(seedGap * 1.0)));
      prediction = {
        winnerId: matchup.bottomTeam.teamId,
        confidence,
        reasoning: `${matchup.bottomTeam.name} (${formatML(bottomFutures.odds)} championship odds) is a clear favorite. ${matchup.topTeam.name} has no championship futures — heavy underdog.`,
        generatedAt: new Date().toISOString(),
      };
    }
  }

  // === PRIORITY 3: Seed-based fallback ===
  if (!prediction) {
    const topSeed = matchup.topTeam.seed;
    const bottomSeed = matchup.bottomTeam.seed;
    const topIsBetter = topSeed < bottomSeed;
    const winnerId = topIsBetter ? matchup.topTeam.teamId : matchup.bottomTeam.teamId;
    const winnerName = topIsBetter ? matchup.topTeam.name : matchup.bottomTeam.name;
    const winRate = SEED_WIN_RATES_R64[topIsBetter ? topSeed : bottomSeed] || 60;
    const confidence = Math.min(99, Math.max(50, Math.round(winRate)));

    prediction = {
      winnerId,
      confidence,
      reasoning: `${winnerName} (${topIsBetter ? topSeed : bottomSeed} seed) is the higher seed. Historical win rate: ${winRate}%.`,
      generatedAt: new Date().toISOString(),
    };
  }

  setCachedPrediction(cacheKey, prediction, isLive ? LIVE_CACHE_TTL : STANDARD_CACHE_TTL);
  return prediction;
}

/**
 * Predict a batch of matchups.
 */
async function predictBatch(
  matchups: BracketMatchup[],
  oddsMap: Map<string, MatchupOdds>,
  futuresMap: Map<string, TeamFutures>
): Promise<void> {
  const needsPrediction = matchups.filter(
    (m) =>
      m.topTeam &&
      m.bottomTeam &&
      m.status !== "final" &&
      (m.status === "in_progress" || !m.prediction)
  );

  for (const m of needsPrediction) {
    const pred = await predictMatchup(m, oddsMap, futuresMap);
    if (pred) {
      m.prediction = pred;
    }
  }
}

/**
 * Propagate winners from a completed/predicted round into the next round.
 */
function propagateRoundWinners(
  bracket: FullBracket,
  region: Region,
  fromRound: "R64" | "R32" | "S16",
  feeders: [number, number][],
  toRound: "R32" | "S16" | "E8"
): void {
  const fromMatchups = bracket.regions[region].rounds[fromRound];
  const toMatchups = bracket.regions[region].rounds[toRound];

  for (let i = 0; i < feeders.length; i++) {
    const [a, b] = feeders[i];
    const target = toMatchups[i];
    if (!target) continue;

    // Don't overwrite teams for games that already have real data from ESPN
    // (live or final games have correct teams from the event data)
    if (target.status === "in_progress" || target.status === "final") continue;

    const topWinner = getWinner(fromMatchups[a]);
    const bottomWinner = getWinner(fromMatchups[b]);

    if (topWinner) target.topTeam = topWinner;
    if (bottomWinner) target.bottomTeam = bottomWinner;
  }
}

/**
 * Fetch odds for all matchups that need predictions.
 */
async function fetchMatchupOdds(
  matchups: BracketMatchup[]
): Promise<Map<string, MatchupOdds>> {
  const oddsMap = new Map<string, MatchupOdds>();

  const needsOdds = matchups.filter(
    (m) =>
      m.topTeam &&
      m.bottomTeam &&
      m.status !== "final" &&
      m.status !== "in_progress"
  );

  // Fetch odds in parallel (limited batches)
  const BATCH = 6;
  for (let i = 0; i < needsOdds.length; i += BATCH) {
    const batch = needsOdds.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((m) => findMatchupOdds(m.topTeam!.name, m.bottomTeam!.name))
    );
    batch.forEach((m, idx) => {
      if (results[idx]) {
        const key = `${m.topTeam!.teamId}-${m.bottomTeam!.teamId}`;
        oddsMap.set(key, results[idx]!);
      }
    });
  }

  return oddsMap;
}

/**
 * Run the full prediction engine across the entire bracket.
 * Uses odds only (no Claude API calls) — instant and free.
 * 1. Fetches game-specific ML odds
 * 2. Fetches championship futures odds
 * 3. Processes rounds sequentially: R64 → R32 → S16 → E8 → F4 → Championship
 * 4. Propagates predicted winners to fill future rounds
 */
export async function runPredictionEngine(
  bracket: FullBracket
): Promise<FullBracket> {
  const b = structuredClone(bracket);
  const regions: Region[] = ["East", "West", "South", "Midwest"];

  // Step 1: Collect all matchups for odds lookup
  const allMatchups = [
    ...regions.flatMap((r) =>
      Object.values(b.regions[r].rounds).flat() as BracketMatchup[]
    ),
    ...b.finalFour.semifinals,
    b.finalFour.championship,
  ];

  // Step 2: Fetch game-specific odds + championship futures in parallel
  console.log("Fetching odds and futures...");
  const [oddsMap, futuresMap] = await Promise.all([
    fetchMatchupOdds(allMatchups),
    fetchChampionshipFutures(),
  ]);
  console.log(`Found game odds for ${oddsMap.size} matchups, futures for ${futuresMap.size} teams`);

  // Step 3: Process rounds sequentially (instant — no API calls)

  // --- Round of 64 ---
  console.log("Predicting Round of 64...");
  const r64Matchups = regions.flatMap((r) => b.regions[r].rounds.R64);
  await predictBatch(r64Matchups, oddsMap, futuresMap);

  for (const region of regions) {
    propagateRoundWinners(b, region, "R64", R32_FEEDERS, "R32");
  }

  // --- Round of 32 ---
  console.log("Predicting Round of 32...");
  const r32Matchups = regions.flatMap((r) => b.regions[r].rounds.R32);
  await predictBatch(r32Matchups, oddsMap, futuresMap);

  for (const region of regions) {
    propagateRoundWinners(b, region, "R32", S16_FEEDERS, "S16");
  }

  // --- Sweet 16 ---
  console.log("Predicting Sweet 16...");
  const s16Matchups = regions.flatMap((r) => b.regions[r].rounds.S16);
  await predictBatch(s16Matchups, oddsMap, futuresMap);

  for (const region of regions) {
    const s16 = b.regions[region].rounds.S16;
    const e8 = b.regions[region].rounds.E8[0];
    if (e8) {
      const topW = getWinner(s16[0]);
      const bottomW = getWinner(s16[1]);
      if (topW) e8.topTeam = topW;
      if (bottomW) e8.bottomTeam = bottomW;
    }
  }

  // --- Elite 8 ---
  console.log("Predicting Elite 8...");
  const e8Matchups = regions.flatMap((r) => b.regions[r].rounds.E8);
  await predictBatch(e8Matchups, oddsMap, futuresMap);

  for (let i = 0; i < FINAL_FOUR_MATCHUPS.length; i++) {
    const [regionA, regionB] = FINAL_FOUR_MATCHUPS[i];
    const semi = b.finalFour.semifinals[i];
    if (semi) {
      const topW = getWinner(b.regions[regionA].rounds.E8[0]);
      const bottomW = getWinner(b.regions[regionB].rounds.E8[0]);
      if (topW) semi.topTeam = topW;
      if (bottomW) semi.bottomTeam = bottomW;
    }
  }

  // --- Final Four ---
  console.log("Predicting Final Four...");
  await predictBatch([...b.finalFour.semifinals], oddsMap, futuresMap);

  const champ = b.finalFour.championship;
  if (champ) {
    const topW = getWinner(b.finalFour.semifinals[0]);
    const bottomW = getWinner(b.finalFour.semifinals[1]);
    if (topW) champ.topTeam = topW;
    if (bottomW) champ.bottomTeam = bottomW;
  }

  // --- Championship ---
  console.log("Predicting Championship...");
  await predictBatch([b.finalFour.championship], oddsMap, futuresMap);

  console.log("Prediction engine complete!");
  return b;
}
