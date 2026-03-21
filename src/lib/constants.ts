import { Region, RoundName } from "@/types/bracket";

export const REGIONS: Region[] = ["East", "West", "South", "Midwest"];

export const ROUND_NAMES: Record<RoundName, string> = {
  R64: "Round of 64",
  R32: "Round of 32",
  S16: "Sweet 16",
  E8: "Elite Eight",
  F4: "Final Four",
  CHAMPIONSHIP: "Championship",
};

export const ROUND_ORDER: RoundName[] = [
  "R64",
  "R32",
  "S16",
  "E8",
  "F4",
  "CHAMPIONSHIP",
];

// Standard NCAA bracket seed positions within a region's R64
// Index = bracket position, value = [topSeed, bottomSeed]
export const R64_SEED_MATCHUPS: [number, number][] = [
  [1, 16],
  [8, 9],
  [5, 12],
  [4, 13],
  [6, 11],
  [3, 14],
  [7, 10],
  [2, 15],
];

// Map seed number to bracket position in R64
export function seedToPosition(seed: number): number {
  for (let i = 0; i < R64_SEED_MATCHUPS.length; i++) {
    if (
      R64_SEED_MATCHUPS[i][0] === seed ||
      R64_SEED_MATCHUPS[i][1] === seed
    ) {
      return i;
    }
  }
  return -1;
}

// R32 matchup pairs: which R64 positions feed into each R32 position
export const R32_FEEDERS: [number, number][] = [
  [0, 1],
  [2, 3],
  [4, 5],
  [6, 7],
];

// S16 matchup pairs: which R32 positions feed into each S16 position
export const S16_FEEDERS: [number, number][] = [
  [0, 1],
  [2, 3],
];

// E8: which S16 positions feed in
export const E8_FEEDERS: [number, number][] = [[0, 1]];

// Final Four pairing: which regions play each other
export const FINAL_FOUR_MATCHUPS: [Region, Region][] = [
  ["East", "West"],
  ["South", "Midwest"],
];

// ESPN headline to round mapping
export const HEADLINE_ROUND_MAP: Record<string, RoundName> = {
  "1st Round": "R64",
  "First Round": "R64",
  "Round of 64": "R64",
  "2nd Round": "R32",
  "Second Round": "R32",
  "Round of 32": "R32",
  "Sweet 16": "S16",
  "Elite Eight": "E8",
  "Elite 8": "E8",
  "Final Four": "F4",
  "National Championship": "CHAMPIONSHIP",
  Championship: "CHAMPIONSHIP",
};

// Historical seed win rates (for AI context)
export const SEED_WIN_RATES_R64: Record<number, number> = {
  1: 99.4,
  2: 94.2,
  3: 85.0,
  4: 80.0,
  5: 64.7,
  6: 63.2,
  7: 61.2,
  8: 50.0,
  9: 50.0,
  10: 38.8,
  11: 36.8,
  12: 35.3,
  13: 20.0,
  14: 15.0,
  15: 5.8,
  16: 0.6,
};
