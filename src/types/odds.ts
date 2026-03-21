export interface OddsApiResponse {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsBookmaker[];
}

export interface OddsBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: OddsMarket[];
}

export interface OddsMarket {
  key: "h2h" | "spreads" | "totals";
  outcomes: OddsOutcome[];
}

export interface OddsOutcome {
  name: string;
  price: number;
  point?: number;
}

export interface GameOdds {
  moneyline: { home: number; away: number };
  spread: {
    home: number;
    away: number;
    homePoint: number;
    awayPoint: number;
  };
  total: { over: number; under: number; point: number };
  bookmaker: string;
}
