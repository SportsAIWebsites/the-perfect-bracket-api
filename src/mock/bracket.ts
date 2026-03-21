import {
  FullBracket,
  BracketMatchup,
  BracketRegion,
  Region,
  RoundName,
  BracketTeam,
} from "@/types/bracket";
import { getTeamBySeed } from "./teams";
import { REGIONS } from "@/lib/constants";

function team(region: Region, seed: number): BracketTeam {
  return getTeamBySeed(region, seed)!;
}

function matchup(
  region: Region,
  round: RoundName,
  position: number,
  topTeam: BracketTeam | null,
  bottomTeam: BracketTeam | null,
  opts: {
    status?: "final" | "in_progress" | "scheduled" | "tbd";
    topScore?: number;
    bottomScore?: number;
    winnerId?: string;
    prediction?: { winnerId: string; confidence: number; reasoning: string };
    displayClock?: string;
    period?: number;
    espnEventId?: string;
  } = {}
): BracketMatchup {
  return {
    id: `${region.toLowerCase()}-${round.toLowerCase()}-${position}`,
    espnEventId: opts.espnEventId,
    region,
    round,
    position,
    topTeam,
    bottomTeam,
    topScore: opts.topScore,
    bottomScore: opts.bottomScore,
    status: opts.status || "tbd",
    winnerId: opts.winnerId,
    prediction: opts.prediction
      ? { ...opts.prediction, generatedAt: new Date().toISOString() }
      : undefined,
    displayClock: opts.displayClock,
    period: opts.period,
  };
}

// ============== EAST REGION ==============
// Real results from March 19-20, 2026
function buildEast(): BracketRegion {
  const r64: BracketMatchup[] = [
    // 1 Duke vs 16 Siena — FINAL: Duke 71-65
    matchup("East", "R64", 0, team("East", 1), team("East", 16), {
      status: "final", topScore: 71, bottomScore: 65,
      winnerId: "150", espnEventId: "401856478",
    }),
    // 8 Ohio State vs 9 TCU — FINAL: TCU 66-64
    matchup("East", "R64", 1, team("East", 8), team("East", 9), {
      status: "final", topScore: 64, bottomScore: 66,
      winnerId: "2628", espnEventId: "401856479",
    }),
    // 5 St. John's vs 12 Northern Iowa — FINAL: SJU 79-53
    matchup("East", "R64", 2, team("East", 5), team("East", 12), {
      status: "final", topScore: 79, bottomScore: 53,
      winnerId: "2599", espnEventId: "401856494",
    }),
    // 4 Kansas vs 13 Cal Baptist — FINAL: KU 68-60
    matchup("East", "R64", 3, team("East", 4), team("East", 13), {
      status: "final", topScore: 68, bottomScore: 60,
      winnerId: "2305", espnEventId: "401856495",
    }),
    // 6 Louisville vs 11 South Florida — FINAL: Louisville 83-79
    matchup("East", "R64", 4, team("East", 6), team("East", 11), {
      status: "final", topScore: 83, bottomScore: 79,
      winnerId: "97", espnEventId: "401856482",
    }),
    // 3 Michigan State vs 14 North Dakota State — FINAL: MSU 92-67
    matchup("East", "R64", 5, team("East", 3), team("East", 14), {
      status: "final", topScore: 92, bottomScore: 67,
      winnerId: "127", espnEventId: "401856483",
    }),
    // 7 UCLA vs 10 UCF — SCHEDULED tonight
    matchup("East", "R64", 6, team("East", 7), team("East", 10), {
      status: "scheduled", espnEventId: "401856496",
      prediction: {
        winnerId: "26", confidence: 55,
        reasoning: "A true toss-up. UCLA's experience edge and defensive versatility give them a slight advantage, but UCF's athleticism could spring the upset.",
      },
    }),
    // 2 UConn vs 15 Furman — SCHEDULED tonight
    matchup("East", "R64", 7, team("East", 2), team("East", 15), {
      status: "scheduled", espnEventId: "401856497",
      prediction: {
        winnerId: "41", confidence: 89,
        reasoning: "UConn's defending champion pedigree and elite depth make this a mismatch. Furman will compete but lacks the firepower to keep up for 40 minutes.",
      },
    }),
  ];

  // R32: Duke vs TCU scheduled tomorrow, Louisville vs MSU scheduled tomorrow
  const r32: BracketMatchup[] = [
    matchup("East", "R32", 0, team("East", 1), team("East", 9), {
      status: "scheduled", espnEventId: "401856530",
      prediction: {
        winnerId: "150", confidence: 80,
        reasoning: "Duke's 33-2 record speaks for itself. TCU's upset over Ohio State was impressive, but Duke's talent advantage is simply too much.",
      },
    }),
    matchup("East", "R32", 1, team("East", 5), team("East", 4), {
      status: "tbd",
      prediction: {
        winnerId: "2305", confidence: 68,
        reasoning: "Kansas' physicality and depth give them the edge in this matchup. St. John's perimeter game is dangerous but KU's interior defense should neutralize their attack.",
      },
    }),
    matchup("East", "R32", 2, team("East", 6), team("East", 3), {
      status: "scheduled", espnEventId: "401856531",
      prediction: {
        winnerId: "127", confidence: 65,
        reasoning: "Michigan State's dominant win over NDSU showed they're playing their best basketball. Louisville is tough but Izzo's tournament experience tips this.",
      },
    }),
    matchup("East", "R32", 3, team("East", 7), team("East", 2), {
      status: "tbd",
      prediction: {
        winnerId: "41", confidence: 74,
        reasoning: "UConn's championship pedigree and Dan Hurley's coaching give them a clear edge. UCLA is talented but UConn's defensive intensity should control the tempo.",
      },
    }),
  ];

  const s16: BracketMatchup[] = [
    matchup("East", "S16", 0, team("East", 1), team("East", 4), {
      status: "tbd",
      prediction: {
        winnerId: "150", confidence: 77,
        reasoning: "Duke's elite scoring depth and Cooper Flagg's two-way dominance make them the clear favorite. Kansas is dangerous but Duke's home-court-level crowd support in the East Region tips this.",
      },
    }),
    matchup("East", "S16", 1, team("East", 3), team("East", 2), {
      status: "tbd",
      prediction: {
        winnerId: "41", confidence: 62,
        reasoning: "UConn's championship DNA vs Michigan State's Izzo magic — a coin flip elevated by UConn's superior depth and shot-making ability.",
      },
    }),
  ];
  const e8: BracketMatchup[] = [
    matchup("East", "E8", 0, team("East", 1), team("East", 2), {
      status: "tbd",
      prediction: {
        winnerId: "150", confidence: 70,
        reasoning: "Duke's balanced attack and defensive versatility give them the edge over UConn in a heavyweight showdown. This is the game of the tournament.",
      },
    }),
  ];

  return { name: "East", rounds: { R64: r64, R32: r32, S16: s16, E8: e8 } };
}

// ============== WEST REGION ==============
function buildWest(): BracketRegion {
  const r64: BracketMatchup[] = [
    // 1 Arizona vs 16 Long Island — FINAL: Arizona 92-58
    matchup("West", "R64", 0, team("West", 1), team("West", 16), {
      status: "final", topScore: 92, bottomScore: 58,
      winnerId: "12", espnEventId: "401856529",
    }),
    // 8 Villanova vs 9 Utah State — IN PROGRESS (halftime 39-37)
    matchup("West", "R64", 1, team("West", 8), team("West", 9), {
      status: "in_progress", topScore: 39, bottomScore: 37,
      displayClock: "0:00", period: 1, espnEventId: "401856528",
      prediction: {
        winnerId: "222", confidence: 58,
        reasoning: "Villanova leads by 2 at halftime. Their Big East experience and free throw shooting should close this out in the second half.",
      },
    }),
    // 5 Wisconsin vs 12 High Point — FINAL: High Point 83-82 (UPSET!)
    matchup("West", "R64", 2, team("West", 5), team("West", 12), {
      status: "final", topScore: 82, bottomScore: 83,
      winnerId: "2272", espnEventId: "401856480",
    }),
    // 4 Arkansas vs 13 Hawai'i — FINAL: Arkansas 97-78
    matchup("West", "R64", 3, team("West", 4), team("West", 13), {
      status: "final", topScore: 97, bottomScore: 78,
      winnerId: "8", espnEventId: "401856481",
    }),
    // 6 BYU vs 11 Texas — FINAL: Texas 79-71 (UPSET!)
    matchup("West", "R64", 4, team("West", 6), team("West", 11), {
      status: "final", topScore: 71, bottomScore: 79,
      winnerId: "251", espnEventId: "401856484",
    }),
    // 3 Gonzaga vs 14 Kennesaw State — FINAL: Gonzaga 73-64
    matchup("West", "R64", 5, team("West", 3), team("West", 14), {
      status: "final", topScore: 73, bottomScore: 64,
      winnerId: "2250", espnEventId: "401856485",
    }),
    // 7 Miami vs 10 Missouri — SCHEDULED tonight
    matchup("West", "R64", 6, team("West", 7), team("West", 10), {
      status: "scheduled", espnEventId: "401856518",
      prediction: {
        winnerId: "2390", confidence: 60,
        reasoning: "Miami's 25-8 record and ACC tournament experience give them the edge. Missouri's inconsistency on the road could be their downfall.",
      },
    }),
    // 2 Purdue vs 15 Queens — SCHEDULED tonight
    matchup("West", "R64", 7, team("West", 2), team("West", 15), {
      status: "scheduled", espnEventId: "401856519",
      prediction: {
        winnerId: "2509", confidence: 92,
        reasoning: "Purdue's size advantage and Zach Edey-era legacy of elite frontcourt play should dominate. Queens is making their first tournament appearance.",
      },
    }),
  ];

  // R32
  const r32: BracketMatchup[] = [
    matchup("West", "R32", 0, team("West", 1), team("West", 8), {
      status: "tbd",
      prediction: {
        winnerId: "12", confidence: 87,
        reasoning: "Arizona demolished LIU by 34 and Villanova has looked shaky. The Wildcats' elite athleticism and depth are simply overwhelming.",
      },
    }),
    matchup("West", "R32", 1, team("West", 12), team("West", 4), {
      status: "scheduled", espnEventId: "401856536",
      prediction: {
        winnerId: "8", confidence: 68,
        reasoning: "Arkansas's depth and athleticism should be too much for Cinderella High Point, despite their upset magic against Wisconsin.",
      },
    }),
    matchup("West", "R32", 2, team("West", 11), team("West", 3), {
      status: "scheduled", espnEventId: "401856537",
      prediction: {
        winnerId: "2250", confidence: 63,
        reasoning: "Gonzaga's offensive efficiency is elite. Texas pulled an upset but Gonzaga's experience and home-region advantage (Portland) tips this.",
      },
    }),
    matchup("West", "R32", 3, team("West", 7), team("West", 2), {
      status: "tbd",
      prediction: {
        winnerId: "2509", confidence: 75,
        reasoning: "Purdue's size and rebounding dominance should control this game. Miami's guard play is solid but they lack the frontcourt firepower to compete.",
      },
    }),
  ];

  const s16: BracketMatchup[] = [
    matchup("West", "S16", 0, team("West", 1), team("West", 4), {
      status: "tbd",
      prediction: {
        winnerId: "12", confidence: 72,
        reasoning: "Arizona's speed and defensive pressure should overwhelm Arkansas. The Wildcats' ability to push tempo creates problems for any opponent.",
      },
    }),
    matchup("West", "S16", 1, team("West", 3), team("West", 2), {
      status: "tbd",
      prediction: {
        winnerId: "2250", confidence: 58,
        reasoning: "Gonzaga's elite offense vs Purdue's elite defense — a classic styles clash. Gonzaga's tournament experience and shot-making ability give them a razor-thin edge.",
      },
    }),
  ];
  const e8: BracketMatchup[] = [
    matchup("West", "E8", 0, team("West", 1), team("West", 3), {
      status: "tbd",
      prediction: {
        winnerId: "12", confidence: 65,
        reasoning: "Arizona's complete roster and defensive versatility make them the slight favorite. Gonzaga's offense can beat anyone but Arizona's athleticism is a tough matchup.",
      },
    }),
  ];

  return { name: "West", rounds: { R64: r64, R32: r32, S16: s16, E8: e8 } };
}

// ============== SOUTH REGION ==============
function buildSouth(): BracketRegion {
  const r64: BracketMatchup[] = [
    // 1 Florida vs 16 Prairie View A&M — SCHEDULED tonight
    matchup("South", "R64", 0, team("South", 1), team("South", 16), {
      status: "scheduled", espnEventId: "401856523",
      prediction: {
        winnerId: "57", confidence: 97,
        reasoning: "Florida as a 1-seed should cruise. Prairie View came through the First Four but faces a massive talent gap against the Gators.",
      },
    }),
    // 8 Clemson vs 9 Iowa — FINAL: Iowa 67-58
    matchup("South", "R64", 1, team("South", 8), team("South", 9), {
      status: "final", topScore: 58, bottomScore: 67,
      winnerId: "2294", espnEventId: "401856522",
    }),
    // 5 Vanderbilt vs 12 McNeese — FINAL: Vanderbilt 78-68
    matchup("South", "R64", 2, team("South", 5), team("South", 12), {
      status: "final", topScore: 78, bottomScore: 68,
      winnerId: "238", espnEventId: "401856488",
    }),
    // 4 Nebraska vs 13 Troy — FINAL: Nebraska 76-47
    matchup("South", "R64", 3, team("South", 4), team("South", 13), {
      status: "final", topScore: 76, bottomScore: 47,
      winnerId: "158", espnEventId: "401856489",
    }),
    // 6 North Carolina vs 11 VCU — FINAL: VCU 82-78 (UPSET!)
    matchup("South", "R64", 4, team("South", 6), team("South", 11), {
      status: "final", topScore: 78, bottomScore: 82,
      winnerId: "2670", espnEventId: "401856490",
    }),
    // 3 Illinois vs 14 Penn — FINAL: Illinois 105-70
    matchup("South", "R64", 5, team("South", 3), team("South", 14), {
      status: "final", topScore: 105, bottomScore: 70,
      winnerId: "356", espnEventId: "401856491",
    }),
    // 7 Saint Mary's vs 10 Texas A&M — FINAL: Texas A&M 63-50
    matchup("South", "R64", 6, team("South", 7), team("South", 10), {
      status: "final", topScore: 50, bottomScore: 63,
      winnerId: "245", espnEventId: "401856492",
    }),
    // 2 Houston vs 15 Idaho — FINAL: Houston 78-47
    matchup("South", "R64", 7, team("South", 2), team("South", 15), {
      status: "final", topScore: 78, bottomScore: 47,
      winnerId: "248", espnEventId: "401856493",
    }),
  ];

  // R32
  const r32: BracketMatchup[] = [
    matchup("South", "R32", 0, team("South", 1), team("South", 9), {
      status: "tbd",
      prediction: {
        winnerId: "57", confidence: 82,
        reasoning: "Florida's 26-7 record and dominant 1-seed performance should carry them. Iowa's upset win over Clemson shows fight, but the talent gap against Florida is significant.",
      },
    }),
    matchup("South", "R32", 1, team("South", 5), team("South", 4), {
      status: "scheduled", espnEventId: "401856534",
      prediction: {
        winnerId: "238", confidence: 55,
        reasoning: "Vanderbilt's guard play and experience give them a slight edge in what should be a physical, grinding matchup against Nebraska.",
      },
    }),
    matchup("South", "R32", 2, team("South", 11), team("South", 3), {
      status: "scheduled", espnEventId: "401856533",
      prediction: {
        winnerId: "356", confidence: 67,
        reasoning: "Illinois dropped 105 in their opener and looks like the most complete team in the region. VCU's Cinderella run faces a steep challenge.",
      },
    }),
    matchup("South", "R32", 3, team("South", 10), team("South", 2), {
      status: "scheduled", espnEventId: "401856535",
      prediction: {
        winnerId: "248", confidence: 74,
        reasoning: "Houston's suffocating defense held Idaho to 47 points. Texas A&M is a tougher test but the Cougars' defensive identity should prevail.",
      },
    }),
  ];

  const s16: BracketMatchup[] = [
    matchup("South", "S16", 0, team("South", 1), team("South", 5), {
      status: "tbd",
      prediction: {
        winnerId: "57", confidence: 78,
        reasoning: "Florida's complete roster and 1-seed pedigree make them the clear favorite. Vanderbilt will compete but lacks the depth for a full 40-minute battle.",
      },
    }),
    matchup("South", "S16", 1, team("South", 3), team("South", 2), {
      status: "tbd",
      prediction: {
        winnerId: "248", confidence: 60,
        reasoning: "Houston's elite defense vs Illinois' explosive offense — a fascinating clash. Houston's ability to grind games out gives them the edge in a close one.",
      },
    }),
  ];
  const e8: BracketMatchup[] = [
    matchup("South", "E8", 0, team("South", 1), team("South", 2), {
      status: "tbd",
      prediction: {
        winnerId: "57", confidence: 63,
        reasoning: "Florida's offensive balance and home-region advantage push them past Houston's elite defense. A classic 1 vs 2 seed battle that could go either way.",
      },
    }),
  ];

  return { name: "South", rounds: { R64: r64, R32: r32, S16: s16, E8: e8 } };
}

// ============== MIDWEST REGION ==============
function buildMidwest(): BracketRegion {
  const r64: BracketMatchup[] = [
    // 1 Michigan vs 16 Howard — FINAL: Michigan 101-80
    matchup("Midwest", "R64", 0, team("Midwest", 1), team("Midwest", 16), {
      status: "final", topScore: 101, bottomScore: 80,
      winnerId: "130", espnEventId: "401856486",
    }),
    // 8 Georgia vs 9 Saint Louis — FINAL: Saint Louis 102-77
    matchup("Midwest", "R64", 1, team("Midwest", 8), team("Midwest", 9), {
      status: "final", topScore: 77, bottomScore: 102,
      winnerId: "139", espnEventId: "401856487",
    }),
    // 5 Texas Tech vs 12 Akron — FINAL: Texas Tech 91-71
    matchup("Midwest", "R64", 2, team("Midwest", 5), team("Midwest", 12), {
      status: "final", topScore: 91, bottomScore: 71,
      winnerId: "2641", espnEventId: "401856520",
    }),
    // 4 Alabama vs 13 Hofstra — IN PROGRESS (87-69, late 2nd half)
    matchup("Midwest", "R64", 3, team("Midwest", 4), team("Midwest", 13), {
      status: "in_progress", topScore: 87, bottomScore: 69,
      displayClock: "1:47", period: 2, espnEventId: "401856521",
      prediction: {
        winnerId: "333", confidence: 96,
        reasoning: "Alabama leads by 18 with under 2 minutes left. This one is effectively over — the Crimson Tide's offensive firepower was too much for Hofstra.",
      },
    }),
    // 6 Tennessee vs 11 Miami (OH) — IN PROGRESS (48-28, 2nd half)
    matchup("Midwest", "R64", 4, team("Midwest", 6), team("Midwest", 11), {
      status: "in_progress", topScore: 48, bottomScore: 28,
      displayClock: "18:00", period: 2, espnEventId: "401856527",
      prediction: {
        winnerId: "2633", confidence: 94,
        reasoning: "Tennessee leads by 20 entering the second half. Their suffocating defense has completely shut down Miami (OH)'s offense.",
      },
    }),
    // 3 Virginia vs 14 Wright State — FINAL: Virginia 82-73
    matchup("Midwest", "R64", 5, team("Midwest", 3), team("Midwest", 14), {
      status: "final", topScore: 82, bottomScore: 73,
      winnerId: "258", espnEventId: "401856526",
    }),
    // 7 Kentucky vs 10 Santa Clara — FINAL: Kentucky 89-84
    matchup("Midwest", "R64", 6, team("Midwest", 7), team("Midwest", 10), {
      status: "final", topScore: 89, bottomScore: 84,
      winnerId: "96", espnEventId: "401856525",
    }),
    // 2 Iowa State vs 15 Tennessee State — FINAL: Iowa State 108-74
    matchup("Midwest", "R64", 7, team("Midwest", 2), team("Midwest", 15), {
      status: "final", topScore: 108, bottomScore: 74,
      winnerId: "66", espnEventId: "401856524",
    }),
  ];

  // R32
  const r32: BracketMatchup[] = [
    matchup("Midwest", "R32", 0, team("Midwest", 1), team("Midwest", 9), {
      status: "scheduled", espnEventId: "401856532",
      prediction: {
        winnerId: "130", confidence: 72,
        reasoning: "Michigan's 32-3 record is the best in the field. Saint Louis shocked Georgia but Michigan's depth and home-state crowd support should carry them.",
      },
    }),
    matchup("Midwest", "R32", 1, team("Midwest", 5), team("Midwest", 4), {
      status: "tbd",
      prediction: {
        winnerId: "333", confidence: 64,
        reasoning: "Alabama's athleticism and scoring punch give them the edge. Texas Tech is tough defensively but Bama's transition game should create separation.",
      },
    }),
    matchup("Midwest", "R32", 2, team("Midwest", 6), team("Midwest", 3), {
      status: "tbd",
      prediction: {
        winnerId: "2633", confidence: 57,
        reasoning: "Tennessee's defense has been elite and they look dominant. Virginia's methodical pace could keep it close but the Vols' athleticism should prevail.",
      },
    }),
    matchup("Midwest", "R32", 3, team("Midwest", 7), team("Midwest", 2), {
      status: "tbd",
      prediction: {
        winnerId: "66", confidence: 68,
        reasoning: "Iowa State's 108-point explosion showed they're firing on all cylinders. Kentucky's close win over Santa Clara raises questions about their consistency.",
      },
    }),
  ];

  const s16: BracketMatchup[] = [
    matchup("Midwest", "S16", 0, team("Midwest", 1), team("Midwest", 4), {
      status: "tbd",
      prediction: {
        winnerId: "130", confidence: 71,
        reasoning: "Michigan's 32-3 record and balanced scoring make them the favorite. Alabama is explosive but the Wolverines' discipline and depth should control the game.",
      },
    }),
    matchup("Midwest", "S16", 1, team("Midwest", 6), team("Midwest", 2), {
      status: "tbd",
      prediction: {
        winnerId: "66", confidence: 59,
        reasoning: "Iowa State's offensive explosion and Big 12 tournament pedigree give them the edge. Tennessee's defense makes this close but ISU's 3-point shooting opens it up.",
      },
    }),
  ];
  const e8: BracketMatchup[] = [
    matchup("Midwest", "E8", 0, team("Midwest", 1), team("Midwest", 2), {
      status: "tbd",
      prediction: {
        winnerId: "130", confidence: 67,
        reasoning: "Michigan's complete roster and dominant regular season make them the pick. Iowa State is dangerous but Michigan's depth and coaching edge carry them to the Final Four.",
      },
    }),
  ];

  return { name: "Midwest", rounds: { R64: r64, R32: r32, S16: s16, E8: e8 } };
}

// Build the full demo bracket
function buildDemoBracket(): FullBracket {
  const regions = {
    East: buildEast(),
    West: buildWest(),
    South: buildSouth(),
    Midwest: buildMidwest(),
  };

  // Propagate predictions into later rounds
  // S16 predictions based on likely R32 winners
  for (const region of REGIONS) {
    const r = regions[region];

    // Fill S16 with predicted R32 winners
    const r32Winners: (BracketTeam | null)[] = r.rounds.R32.map((m) => {
      if (m.winnerId) {
        return m.topTeam?.teamId === m.winnerId ? m.topTeam : m.bottomTeam;
      }
      if (m.prediction) {
        return m.topTeam?.teamId === m.prediction.winnerId ? m.topTeam : m.bottomTeam;
      }
      // For TBD with no prediction, try to pick from feeders
      return null;
    });

    if (r32Winners[0] && r32Winners[1]) {
      r.rounds.S16[0].topTeam = r32Winners[0];
      r.rounds.S16[0].bottomTeam = r32Winners[1];
      const fav = r32Winners[0].seed < r32Winners[1].seed ? r32Winners[0] : r32Winners[1];
      r.rounds.S16[0].prediction = {
        winnerId: fav.teamId,
        confidence: 62,
        reasoning: `${fav.name} (${fav.seed} seed) has the talent and experience to advance to the Elite Eight.`,
        generatedAt: new Date().toISOString(),
      };
    }
    if (r32Winners[2] && r32Winners[3]) {
      r.rounds.S16[1].topTeam = r32Winners[2];
      r.rounds.S16[1].bottomTeam = r32Winners[3];
      const fav = r32Winners[2].seed < r32Winners[3].seed ? r32Winners[2] : r32Winners[3];
      r.rounds.S16[1].prediction = {
        winnerId: fav.teamId,
        confidence: 58,
        reasoning: `${fav.name} should edge out a competitive Sweet 16 matchup with their superior depth and defensive identity.`,
        generatedAt: new Date().toISOString(),
      };
    }
  }

  // E8 picks: region 1-seeds favored
  for (const region of REGIONS) {
    const r = regions[region];
    const s16_0_winner = r.rounds.S16[0].prediction
      ? (r.rounds.S16[0].topTeam?.teamId === r.rounds.S16[0].prediction.winnerId ? r.rounds.S16[0].topTeam : r.rounds.S16[0].bottomTeam)
      : null;
    const s16_1_winner = r.rounds.S16[1].prediction
      ? (r.rounds.S16[1].topTeam?.teamId === r.rounds.S16[1].prediction.winnerId ? r.rounds.S16[1].topTeam : r.rounds.S16[1].bottomTeam)
      : null;

    if (s16_0_winner && s16_1_winner) {
      r.rounds.E8[0].topTeam = s16_0_winner;
      r.rounds.E8[0].bottomTeam = s16_1_winner;
      const fav = s16_0_winner.seed < s16_1_winner.seed ? s16_0_winner : s16_1_winner;
      r.rounds.E8[0].prediction = {
        winnerId: fav.teamId,
        confidence: 57,
        reasoning: `${fav.name} has the complete package to win their region. Elite on both ends of the floor.`,
        generatedAt: new Date().toISOString(),
      };
    }
  }

  // Final Four: East (Duke) vs West (Arizona), South (Florida) vs Midwest (Michigan)
  const semi1: BracketMatchup = {
    id: "f4-0",
    region: "East",
    round: "F4",
    position: 0,
    topTeam: team("East", 1), // Duke
    bottomTeam: team("West", 1), // Arizona
    status: "tbd",
    prediction: {
      winnerId: "150", // Duke
      confidence: 54,
      reasoning: "Two 33-2 juggernauts collide. Duke's guard play and Coach K's tournament DNA give them the narrowest of edges over Arizona's balanced attack.",
      generatedAt: new Date().toISOString(),
    },
  };

  const semi2: BracketMatchup = {
    id: "f4-1",
    region: "South",
    round: "F4",
    position: 1,
    topTeam: team("South", 1), // Florida
    bottomTeam: team("Midwest", 1), // Michigan
    status: "tbd",
    prediction: {
      winnerId: "130", // Michigan
      confidence: 56,
      reasoning: "Michigan's 32-3 record and offensive firepower (101 points in R64) make them the pick. Florida's defensive intensity keeps it close, but the Wolverines have more weapons.",
      generatedAt: new Date().toISOString(),
    },
  };

  const championship: BracketMatchup = {
    id: "championship",
    region: "East",
    round: "CHAMPIONSHIP",
    position: 0,
    topTeam: team("East", 1), // Duke
    bottomTeam: team("Midwest", 1), // Michigan
    status: "tbd",
    prediction: {
      winnerId: "150", // Duke
      confidence: 52,
      reasoning: "In the ultimate showdown, Duke's 33-2 Blue Devils edge Michigan's 32-3 Wolverines. Two elite programs, but Duke's defensive versatility and clutch shooting make the difference in a classic title game.",
      generatedAt: new Date().toISOString(),
    },
  };

  return {
    regions,
    finalFour: { semifinals: [semi1, semi2], championship },
    lastUpdated: new Date().toISOString(),
  };
}

export const mockBracket: FullBracket = buildDemoBracket();
