/**
 * Fetch all NCAAB odds at once for batch prediction use.
 */

export interface MatchupOdds {
  spread: number; // Negative means top team favored
  moneyline: { top: number; bottom: number };
  bookmaker: string;
}

interface OddsApiGame {
  home_team: string;
  away_team: string;
  bookmakers?: {
    title: string;
    markets: {
      key: string;
      outcomes: { name: string; price: number; point?: number }[];
    }[];
  }[];
}

import { readFileSync, writeFileSync } from "fs";

const ODDS_CACHE_FILE = "/tmp/ncaab-odds-cache.json";
const FUTURES_CACHE_FILE = "/tmp/ncaab-futures-cache.json";

function saveCachedOddsToFile(data: OddsApiGame[]) {
  try { writeFileSync(ODDS_CACHE_FILE, JSON.stringify(data)); } catch {}
}

function loadCachedOddsFromFile(): OddsApiGame[] {
  try {
    const raw = readFileSync(ODDS_CACHE_FILE, "utf-8");
    const data = JSON.parse(raw);
    console.log(`Loaded ${data.length} cached odds from file`);
    return data;
  } catch { return []; }
}

function saveCachedFuturesToFile(data: Array<{ name: string; odds: number; impliedProb: number }>) {
  try { writeFileSync(FUTURES_CACHE_FILE, JSON.stringify(data)); } catch {}
}

function loadCachedFuturesFromFile(): Map<string, TeamFutures> {
  try {
    const raw = readFileSync(FUTURES_CACHE_FILE, "utf-8");
    const arr = JSON.parse(raw) as Array<{ name: string; odds: number; impliedProb: number }>;
    const map = new Map<string, TeamFutures>();
    for (const item of arr) {
      const norm = normalizeTeamName(item.name);
      map.set(norm, item);
    }
    console.log(`Loaded ${map.size} cached futures from file`);
    return map;
  } catch { return new Map(); }
}

// Cache all odds for 2 minutes (fresher during live games)
let oddsCache: { data: OddsApiGame[]; expiresAt: number } | null = null;
const ODDS_TTL = 2 * 60 * 1000;

/**
 * Convert American moneyline odds to implied win probability (0-1).
 * Negative ML (favorite): |ML| / (|ML| + 100)
 * Positive ML (underdog): 100 / (ML + 100)
 */
export function getImpliedProbability(ml: number): number {
  if (ml < 0) return Math.abs(ml) / (Math.abs(ml) + 100);
  if (ml > 0) return 100 / (ml + 100);
  return 0.5;
}

/**
 * Format moneyline for display.
 */
export function formatML(ml: number): string {
  return ml > 0 ? `+${ml}` : `${ml}`;
}

// ============ CHAMPIONSHIP FUTURES ============

export interface TeamFutures {
  name: string;       // Team name from odds API
  odds: number;       // American ML (e.g., +350)
  impliedProb: number; // 0-1
}

let futuresCache: { data: Map<string, TeamFutures>; expiresAt: number } | null = null;
const FUTURES_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Normalize team names to handle ESPN vs Odds API differences.
 * "Michigan St Spartans" and "Michigan State Spartans" both become "michigan state spartans"
 */
const TEAM_ALIASES: Record<string, string> = {
  "uconn": "connecticut",
  "lsu": "louisiana state",
  "smu": "southern methodist",
  "byu": "brigham young",
  "ucf": "central florida",
  "vcu": "virginia commonwealth",
  "ole miss": "mississippi",
  "umass": "massachusetts",
  "unlv": "nevada las vegas",
  "utep": "texas el paso",
  "unc": "north carolina",
  "pitt": "pittsburgh",
  "miami oh": "miami ohio",
  "miami fl": "miami florida",
  "liu": "long island university",
  "ndsu": "north dakota state",
  "etsu": "east tennessee state",
  "mtsu": "middle tennessee",
  "fiu": "florida international",
  "utsa": "texas san antonio",
  "niu": "northern illinois",
  "siu": "southern illinois",
  "wku": "western kentucky",
};

function normalizeTeamName(s: string): string {
  let name = s
    .toLowerCase()
    .replace(/\bst\.?\s/g, "state ")     // "St " or "St. " → "State "
    .replace(/\bmt\.?\s/g, "mount ")     // "Mt " → "Mount "
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Apply aliases
  for (const [alias, full] of Object.entries(TEAM_ALIASES)) {
    if (name === alias || name.startsWith(alias + " ")) {
      name = name.replace(alias, full);
      break;
    }
  }

  return name;
}

/**
 * Check if two team names refer to the same team.
 * Uses word overlap — if 2+ words match, it's the same team.
 */
export function teamsMatch(nameA: string, nameB: string): boolean {
  const a = normalizeTeamName(nameA);
  const b = normalizeTeamName(nameB);

  // Direct containment
  if (a.includes(b) || b.includes(a)) return true;

  // Word overlap
  const wordsA = a.split(" ");
  const wordsB = b.split(" ");
  let overlap = 0;
  for (const w of wordsA) {
    if (w.length >= 3 && wordsB.includes(w)) overlap++;
  }
  return overlap >= 2;
}

/**
 * Fetch championship winner futures odds.
 * Returns a Map keyed by normalized team name.
 */
export async function fetchChampionshipFutures(): Promise<Map<string, TeamFutures>> {
  if (futuresCache && Date.now() < futuresCache.expiresAt) return futuresCache.data;

  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey || apiKey === "your_key_here") return loadCachedFuturesFromFile();

  try {
    const res = await fetch(
      `https://api.the-odds-api.com/v4/sports/basketball_ncaab_championship_winner/odds?apiKey=${apiKey}&regions=us&markets=outrights&oddsFormat=american`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      console.warn(`Futures API returned ${res.status}, using file cache`);
      return loadCachedFuturesFromFile();
    }

    const data = await res.json();
    const map = new Map<string, TeamFutures>();

    if (Array.isArray(data) && data.length > 0) {
      const event = data[0];
      const book = event.bookmakers?.[0];
      const market = book?.markets?.find((m: { key: string }) => m.key === "outrights");
      if (market?.outcomes) {
        for (const outcome of market.outcomes) {
          const norm = normalizeTeamName(outcome.name);
          map.set(norm, {
            name: outcome.name,
            odds: outcome.price,
            impliedProb: getImpliedProbability(outcome.price),
          });
        }
      }
    }

    console.log(`Fetched championship futures for ${map.size} teams`);
    futuresCache = { data: map, expiresAt: Date.now() + FUTURES_TTL };
    saveCachedFuturesToFile(Array.from(map.values()));
    return map;
  } catch (error) {
    console.error("Failed to fetch championship futures, using file cache:", error);
    return loadCachedFuturesFromFile();
  }
}

/**
 * Find a team's championship futures odds by fuzzy matching their name.
 */
export function findTeamFutures(
  teamName: string,
  futuresMap: Map<string, TeamFutures>
): TeamFutures | null {
  const entries = Array.from(futuresMap.entries());

  // Try matching using teamsMatch against the original name stored in the futures
  for (let i = 0; i < entries.length; i++) {
    const [, value] = entries[i];
    if (teamsMatch(teamName, value.name)) return value;
  }

  return null;
}

// ============ GAME-SPECIFIC ODDS ============

async function fetchAllNcaabOdds(): Promise<OddsApiGame[]> {
  if (oddsCache && Date.now() < oddsCache.expiresAt) return oddsCache.data;

  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey || apiKey === "your_key_here") return loadCachedOddsFromFile();

  try {
    const res = await fetch(
      `https://api.the-odds-api.com/v4/sports/basketball_ncaab/odds?apiKey=${apiKey}&regions=us&markets=h2h,spreads&oddsFormat=american`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      console.warn(`Odds API returned ${res.status}, using file cache`);
      return loadCachedOddsFromFile();
    }

    const data = await res.json();
    oddsCache = { data, expiresAt: Date.now() + ODDS_TTL };
    saveCachedOddsToFile(data);
    return data;
  } catch (error) {
    console.error("Failed to fetch odds, using file cache:", error);
    return loadCachedOddsFromFile();
  }
}

/**
 * Find odds for a specific matchup by team names.
 * Returns null if no odds found.
 */
export async function findMatchupOdds(
  topTeamName: string,
  bottomTeamName: string
): Promise<MatchupOdds | null> {
  const games = await fetchAllNcaabOdds();
  if (!games.length) return null;

  // Match using smart team name comparison
  const game = games.find((g) => {
    const topMatchesHome = teamsMatch(topTeamName, g.home_team);
    const topMatchesAway = teamsMatch(topTeamName, g.away_team);
    const bottomMatchesHome = teamsMatch(bottomTeamName, g.home_team);
    const bottomMatchesAway = teamsMatch(bottomTeamName, g.away_team);
    return (
      (topMatchesHome && bottomMatchesAway) ||
      (topMatchesAway && bottomMatchesHome)
    );
  });

  if (!game?.bookmakers?.length) return null;

  const book = game.bookmakers[0];
  const h2h = book.markets.find((m) => m.key === "h2h");
  const spreads = book.markets.find((m) => m.key === "spreads");

  if (!h2h) return null;

  // Figure out which odds API team maps to our top/bottom team
  const topIsHome = teamsMatch(topTeamName, game.home_team);

  const homeML =
    h2h.outcomes.find((o) => o.name === game.home_team)?.price || 0;
  const awayML =
    h2h.outcomes.find((o) => o.name === game.away_team)?.price || 0;
  const homeSpread =
    spreads?.outcomes.find((o) => o.name === game.home_team)?.point || 0;

  return {
    spread: topIsHome ? homeSpread : -homeSpread,
    moneyline: {
      top: topIsHome ? homeML : awayML,
      bottom: topIsHome ? awayML : homeML,
    },
    bookmaker: book.title,
  };
}
