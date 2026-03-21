export interface ESPNScoreboardResponse {
  events: ESPNEvent[];
}

export interface ESPNEvent {
  id: string;
  date: string;
  name: string;
  shortName: string;
  competitions: ESPNCompetition[];
  season: { year: number; type: number };
}

export interface ESPNCompetition {
  id: string;
  type?: { abbreviation: string };
  tournamentId?: string;
  competitors: ESPNCompetitor[];
  status: ESPNStatus;
  notes?: { headline?: string }[];
  venue?: { fullName: string; city: string; state: string };
  broadcasts?: { names: string[] }[];
}

export interface ESPNCompetitor {
  id: string;
  homeAway: "home" | "away";
  score?: string;
  winner?: boolean;
  curatedRank?: { current: number };
  team: ESPNTeamInfo;
  records?: { summary: string }[];
  linescores?: { displayValue: string }[];
  statistics?: { name: string; displayValue: string }[];
}

export interface ESPNTeamInfo {
  id: string;
  location: string;
  name: string;
  abbreviation: string;
  displayName: string;
  logo?: string;
}

export interface ESPNStatus {
  clock: number;
  displayClock: string;
  period: number;
  type: {
    id: string;
    name: string;
    state: "pre" | "in" | "post";
    completed: boolean;
    description: string;
    detail: string;
    shortDetail: string;
  };
}

// Summary / box score types
export interface ESPNSummaryResponse {
  boxscore: ESPNBoxscore;
  header: ESPNSummaryHeader;
}

export interface ESPNBoxscore {
  teams: ESPNBoxscoreTeam[];
  players: ESPNBoxscorePlayers[];
}

export interface ESPNBoxscoreTeam {
  team: ESPNTeamInfo;
  statistics: { name: string; displayValue: string }[];
}

export interface ESPNBoxscorePlayers {
  team: ESPNTeamInfo;
  statistics: {
    labels: string[];
    athletes: ESPNPlayerStats[];
    totals: string[];
  }[];
}

export interface ESPNPlayerStats {
  athlete: {
    displayName: string;
    jersey: string;
    position: { abbreviation: string };
    headshot?: { href: string };
  };
  starter: boolean;
  didNotPlay: boolean;
  stats: string[];
}

export interface ESPNSummaryHeader {
  competitions: {
    competitors: {
      id: string;
      homeAway: string;
      score: string;
      linescores?: { displayValue: string }[];
    }[];
    status: ESPNStatus;
  }[];
}
