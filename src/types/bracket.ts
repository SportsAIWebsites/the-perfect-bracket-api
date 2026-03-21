export type Region = "East" | "West" | "South" | "Midwest";
export type RoundName = "R64" | "R32" | "S16" | "E8" | "F4" | "CHAMPIONSHIP";
export type GameStatus = "final" | "in_progress" | "scheduled" | "tbd";

export interface BracketTeam {
  teamId: string;
  name: string;
  abbreviation: string;
  seed: number;
  logoUrl: string;
  record: string;
}

export interface Prediction {
  winnerId: string;
  confidence: number; // 0-100
  reasoning: string;
  generatedAt: string;
}

export interface BracketMatchup {
  id: string; // e.g., "east-r64-0"
  espnEventId?: string;
  region: Region;
  round: RoundName;
  position: number; // 0-based within round+region
  topTeam: BracketTeam | null;
  bottomTeam: BracketTeam | null;
  topScore?: number;
  bottomScore?: number;
  status: GameStatus;
  winnerId?: string;
  prediction?: Prediction;
  scheduledAt?: string;
  displayClock?: string;
  period?: number;
}

export interface RegionRounds {
  R64: BracketMatchup[];
  R32: BracketMatchup[];
  S16: BracketMatchup[];
  E8: BracketMatchup[];
}

export interface BracketRegion {
  name: Region;
  rounds: RegionRounds;
}

export interface FinalFour {
  semifinals: [BracketMatchup, BracketMatchup];
  championship: BracketMatchup;
}

export interface FullBracket {
  regions: Record<Region, BracketRegion>;
  finalFour: FinalFour;
  lastUpdated: string;
}
