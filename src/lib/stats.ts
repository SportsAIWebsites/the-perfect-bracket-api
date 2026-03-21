/**
 * Fetch real-time team stats from ESPN for use in predictions.
 */

const ESPN_BASE =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball";

export interface TeamStats {
  ppg: number; // Points per game
  oppPpg: number; // Opponent points per game
  differential: number; // Point differential per game
  winPct: number; // Win percentage (0-1)
  streak: number; // Current win/loss streak
  homeRecord: string;
  awayRecord: string;
}

interface ESPNRecordItem {
  description?: string;
  summary?: string;
  stats?: { name: string; value: number }[];
}

interface ESPNTeamResponse {
  team?: {
    record?: {
      items?: ESPNRecordItem[];
    };
  };
}

// In-memory cache for team stats (30 min TTL)
const statsCache = new Map<string, { stats: TeamStats; expiresAt: number }>();
const STATS_TTL = 30 * 60 * 1000;

function getStat(
  stats: { name: string; value: number }[] | undefined,
  name: string
): number {
  return stats?.find((s) => s.name === name)?.value ?? 0;
}

export async function fetchTeamStats(
  teamId: string
): Promise<TeamStats | null> {
  // Check cache
  const cached = statsCache.get(teamId);
  if (cached && Date.now() < cached.expiresAt) return cached.stats;

  try {
    const res = await fetch(`${ESPN_BASE}/teams/${teamId}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;

    const data: ESPNTeamResponse = await res.json();
    const items = data.team?.record?.items || [];

    const overall = items.find((i) => i.description === "Overall Record");
    const home = items.find((i) => i.description === "Home Record");
    const away = items.find((i) => i.description === "Away Record");

    const stats: TeamStats = {
      ppg: Math.round(getStat(overall?.stats, "avgPointsFor") * 10) / 10,
      oppPpg:
        Math.round(getStat(overall?.stats, "avgPointsAgainst") * 10) / 10,
      differential:
        Math.round(getStat(overall?.stats, "differential") * 10) / 10,
      winPct:
        Math.round(getStat(overall?.stats, "winPercent") * 1000) / 1000,
      streak: getStat(overall?.stats, "streak"),
      homeRecord: home?.summary || "N/A",
      awayRecord: away?.summary || "N/A",
    };

    statsCache.set(teamId, { stats, expiresAt: Date.now() + STATS_TTL });
    return stats;
  } catch (error) {
    console.error(`Failed to fetch stats for team ${teamId}:`, error);
    return null;
  }
}

/**
 * Fetch stats for multiple teams in parallel with concurrency limit.
 */
export async function fetchBulkTeamStats(
  teamIds: string[]
): Promise<Map<string, TeamStats>> {
  const results = new Map<string, TeamStats>();
  const BATCH_SIZE = 8;

  const uniqueIds = Array.from(new Set(teamIds));

  for (let i = 0; i < uniqueIds.length; i += BATCH_SIZE) {
    const batch = uniqueIds.slice(i, i + BATCH_SIZE);
    const statsList = await Promise.all(batch.map(fetchTeamStats));
    batch.forEach((id, idx) => {
      if (statsList[idx]) results.set(id, statsList[idx]!);
    });
  }

  return results;
}
