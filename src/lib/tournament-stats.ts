import { FullBracket, BracketMatchup, Region } from "@/types/bracket";

export interface UpsetEntry {
  matchup: BracketMatchup;
  seedDiff: number;
  winnerName: string;
  winnerSeed: number;
  loserName: string;
  loserSeed: number;
}

export interface CloseGameEntry {
  matchup: BracketMatchup;
  margin: number;
}

export interface HighScoringEntry {
  matchup: BracketMatchup;
  totalScore: number;
}

export interface TournamentStats {
  biggestUpsets: UpsetEntry[];
  closestGames: CloseGameEntry[];
  highestScoring: HighScoringEntry[];
}

const REGIONS: Region[] = ["East", "West", "South", "Midwest"];

function getAllFinalMatchups(bracket: FullBracket): BracketMatchup[] {
  const matchups: BracketMatchup[] = [];

  for (const region of REGIONS) {
    const rounds = bracket.regions[region]?.rounds;
    if (!rounds) continue;
    for (const roundMatchups of Object.values(rounds)) {
      for (const m of roundMatchups) {
        if (m.status === "final" && m.topTeam && m.bottomTeam && m.winnerId) {
          matchups.push(m);
        }
      }
    }
  }

  // Final four
  for (const semi of bracket.finalFour?.semifinals || []) {
    if (semi.status === "final" && semi.topTeam && semi.bottomTeam && semi.winnerId) {
      matchups.push(semi);
    }
  }
  const champ = bracket.finalFour?.championship;
  if (champ?.status === "final" && champ.topTeam && champ.bottomTeam && champ.winnerId) {
    matchups.push(champ);
  }

  return matchups;
}

export function computeTournamentStats(bracket: FullBracket): TournamentStats {
  const finals = getAllFinalMatchups(bracket);

  // Biggest upsets: winner has a higher (worse) seed than loser
  const upsets: UpsetEntry[] = [];
  for (const m of finals) {
    const winner = m.winnerId === m.topTeam!.teamId ? m.topTeam! : m.bottomTeam!;
    const loser = m.winnerId === m.topTeam!.teamId ? m.bottomTeam! : m.topTeam!;
    if (winner.seed > loser.seed) {
      upsets.push({
        matchup: m,
        seedDiff: winner.seed - loser.seed,
        winnerName: winner.abbreviation,
        winnerSeed: winner.seed,
        loserName: loser.abbreviation,
        loserSeed: loser.seed,
      });
    }
  }
  upsets.sort((a, b) => b.seedDiff - a.seedDiff);

  // Closest games: smallest score margin
  const closeGames: CloseGameEntry[] = finals
    .filter((m) => m.topScore !== undefined && m.bottomScore !== undefined)
    .map((m) => ({
      matchup: m,
      margin: Math.abs((m.topScore ?? 0) - (m.bottomScore ?? 0)),
    }))
    .sort((a, b) => a.margin - b.margin);

  // Highest scoring
  const highScoring: HighScoringEntry[] = finals
    .filter((m) => m.topScore !== undefined && m.bottomScore !== undefined)
    .map((m) => ({
      matchup: m,
      totalScore: (m.topScore ?? 0) + (m.bottomScore ?? 0),
    }))
    .sort((a, b) => b.totalScore - a.totalScore);

  return {
    biggestUpsets: upsets.slice(0, 5),
    closestGames: closeGames.slice(0, 5),
    highestScoring: highScoring.slice(0, 5),
  };
}
