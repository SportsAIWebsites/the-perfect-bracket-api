import {
  FullBracket,
  BracketMatchup,
  BracketTeam,
  BracketRegion,
  Region,
  RoundName,
  GameStatus,
  FinalFour,
} from "@/types/bracket";
import { ESPNEvent, ESPNCompetitor } from "@/types/espn";
import {
  REGIONS,
  R64_SEED_MATCHUPS,
  HEADLINE_ROUND_MAP,
} from "./constants";

interface ParsedGame {
  region: Region | "Final Four" | "Championship";
  round: RoundName;
  event: ESPNEvent;
}

function parseHeadline(
  notes: { headline?: string }[] | undefined
): { region: Region | "Final Four" | "Championship"; round: RoundName } | null {
  if (!notes || notes.length === 0) return null;
  const headline = notes[0]?.headline || "";

  // Skip First Four / play-in games — they have "First Four" in the headline
  if (headline.includes("First Four")) return null;

  // Parse region and round FIRST — most games have a region
  // "Men's Basketball Championship - East Region - 1st Round"
  const regionMatch = headline.match(
    /(East|West|South|Midwest)\s*Region/i
  );
  if (regionMatch) {
    const region = regionMatch[1] as Region;
    for (const [key, roundName] of Object.entries(HEADLINE_ROUND_MAP)) {
      if (headline.includes(key)) {
        return { region, round: roundName };
      }
    }
    return null;
  }

  // No region — check for Final Four / Championship (national-level games)
  if (
    headline.includes("Final Four") ||
    headline.includes("National Semifinal")
  ) {
    return { region: "Final Four", round: "F4" };
  }
  if (
    headline.includes("National Championship") ||
    headline.includes("Championship Game")
  ) {
    return { region: "Championship", round: "CHAMPIONSHIP" };
  }

  return null;
}

function isPlaceholderTeam(comp: ESPNCompetitor): boolean {
  const id = parseInt(comp.team.id);
  return id < 0 || comp.team.abbreviation === "TBD" || comp.team.displayName === "TBD";
}

function competitorToTeam(comp: ESPNCompetitor): BracketTeam | null {
  if (isPlaceholderTeam(comp)) return null;
  return {
    teamId: comp.team.id,
    name: comp.team.displayName || `${comp.team.location} ${comp.team.name}`,
    abbreviation: comp.team.abbreviation,
    seed: comp.curatedRank?.current || 0,
    logoUrl: comp.team.logo || "",
    record: comp.records?.[0]?.summary || "",
  };
}

function eventToStatus(event: ESPNEvent): GameStatus {
  const state = event.competitions[0]?.status?.type?.state;
  if (state === "post") return "final";
  if (state === "in") return "in_progress";
  return "scheduled";
}

function eventToMatchup(
  event: ESPNEvent,
  region: Region,
  round: RoundName,
  position: number
): BracketMatchup {
  const comp = event.competitions[0];
  const competitors = comp.competitors;

  // ESPN lists competitors — find top seed (lower number) vs bottom seed
  const sorted = [...competitors].sort(
    (a, b) => (a.curatedRank?.current || 99) - (b.curatedRank?.current || 99)
  );

  const topComp = sorted[0];
  const bottomComp = sorted[1];
  const topTeam = competitorToTeam(topComp);
  const bottomTeam = bottomComp ? competitorToTeam(bottomComp) : null;


  // If both teams are placeholders, treat as TBD for propagation
  const hasRealTeams = topTeam !== null || bottomTeam !== null;
  const status = hasRealTeams ? eventToStatus(event) : "tbd";

  // Get scores from the ORIGINAL competitor objects that match each team
  // (not from sorted array positions, which may not match ESPN's score order)
  function getScoreForTeam(teamId: string | undefined): number | undefined {
    if (!teamId) return undefined;
    const comp = competitors.find((c) => c.team.id === teamId);
    return comp?.score ? parseInt(comp.score) : undefined;
  }

  const topScore = getScoreForTeam(topTeam?.teamId);
  const bottomScore = getScoreForTeam(bottomTeam?.teamId);

  let winnerId: string | undefined;
  if (status === "final" && topScore !== undefined && bottomScore !== undefined) {
    // Use ESPN's winner indicator if available, otherwise use score
    const espnWinner = competitors.find((c) => c.winner);
    if (espnWinner) {
      winnerId = espnWinner.team.id;
    } else {
      winnerId = topScore > bottomScore ? topTeam?.teamId : bottomTeam?.teamId;
    }
  }

  return {
    id: `${region.toLowerCase()}-${round.toLowerCase()}-${position}`,
    espnEventId: event.id,
    region,
    round,
    position,
    topTeam,
    bottomTeam,
    topScore,
    bottomScore,
    status,
    winnerId,
    scheduledAt: event.date,
    displayClock: comp.status?.displayClock,
    period: comp.status?.period,
  };
}

function createEmptyMatchup(
  region: Region,
  round: RoundName,
  position: number
): BracketMatchup {
  return {
    id: `${region.toLowerCase()}-${round.toLowerCase()}-${position}`,
    region,
    round,
    position,
    topTeam: null,
    bottomTeam: null,
    status: "tbd",
  };
}

export function buildBracketFromESPN(events: ESPNEvent[]): FullBracket {
  // Parse all events to identify region and round
  const parsed: ParsedGame[] = [];
  for (const event of events) {
    const comp = event.competitions?.[0];
    if (!comp) continue;
    const info = parseHeadline(comp.notes);
    if (info) {
      parsed.push({ region: info.region, round: info.round, event });
    }
  }

  // Build region brackets
  const regions: Record<Region, BracketRegion> = {} as Record<
    Region,
    BracketRegion
  >;

  for (const region of REGIONS) {
    const regionGames = parsed.filter((p) => p.region === region);

    // R64: 8 games
    const r64Games = regionGames.filter((g) => g.round === "R64");
    const r64: BracketMatchup[] = [];
    for (let pos = 0; pos < 8; pos++) {
      const [topSeed, bottomSeed] = R64_SEED_MATCHUPS[pos];
      // Find game matching these seeds
      const game = r64Games.find((g) => {
        const seeds = g.event.competitions[0].competitors.map(
          (c) => c.curatedRank?.current || 0
        );
        return seeds.includes(topSeed) && seeds.includes(bottomSeed);
      });
      if (game) {
        r64.push(eventToMatchup(game.event, region, "R64", pos));
      } else {
        r64.push(createEmptyMatchup(region, "R64", pos));
      }
    }

    // R32: 4 games
    const r32Games = regionGames.filter((g) => g.round === "R32");
    const r32: BracketMatchup[] = [];
    for (let pos = 0; pos < 4; pos++) {
      // Try to find matching game by looking at team seeds
      const expectedSeeds = [
        R64_SEED_MATCHUPS[pos * 2],
        R64_SEED_MATCHUPS[pos * 2 + 1],
      ].flat();
      const game = r32Games.find((g) => {
        const seeds = g.event.competitions[0].competitors.map(
          (c) => c.curatedRank?.current || 0
        );
        return seeds.some((s) => expectedSeeds.includes(s));
      });
      if (game) {
        r32.push(eventToMatchup(game.event, region, "R32", pos));
      } else {
        r32.push(createEmptyMatchup(region, "R32", pos));
      }
    }

    // S16: 2 games
    const s16Games = regionGames.filter((g) => g.round === "S16");
    const s16: BracketMatchup[] = [];
    for (let pos = 0; pos < 2; pos++) {
      if (s16Games[pos]) {
        s16.push(eventToMatchup(s16Games[pos].event, region, "S16", pos));
      } else {
        s16.push(createEmptyMatchup(region, "S16", pos));
      }
    }

    // E8: 1 game
    const e8Games = regionGames.filter((g) => g.round === "E8");
    const e8: BracketMatchup[] = [];
    if (e8Games[0]) {
      e8.push(eventToMatchup(e8Games[0].event, region, "E8", 0));
    } else {
      e8.push(createEmptyMatchup(region, "E8", 0));
    }

    regions[region] = {
      name: region,
      rounds: { R64: r64, R32: r32, S16: s16, E8: e8 },
    };
  }

  // Final Four
  const f4Games = parsed.filter((p) => p.round === "F4");
  const champGames = parsed.filter((p) => p.round === "CHAMPIONSHIP");

  const semi1 = f4Games[0]
    ? eventToMatchup(f4Games[0].event, "East", "F4", 0)
    : createEmptyMatchup("East", "F4", 0);
  semi1.id = "f4-0";

  const semi2 = f4Games[1]
    ? eventToMatchup(f4Games[1].event, "South", "F4", 1)
    : createEmptyMatchup("South", "F4", 1);
  semi2.id = "f4-1";

  const championship = champGames[0]
    ? eventToMatchup(champGames[0].event, "East", "CHAMPIONSHIP", 0)
    : createEmptyMatchup("East", "CHAMPIONSHIP", 0);
  championship.id = "championship";

  const finalFour: FinalFour = {
    semifinals: [semi1, semi2],
    championship,
  };

  return {
    regions,
    finalFour,
    lastUpdated: new Date().toISOString(),
  };
}
