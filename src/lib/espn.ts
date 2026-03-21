import {
  ESPNScoreboardResponse,
  ESPNEvent,
  ESPNSummaryResponse,
} from "@/types/espn";

const ESPN_BASE =
  "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball";

export async function fetchTournamentScoreboard(): Promise<ESPNEvent[]> {
  try {
    const res = await fetch(`${ESPN_BASE}/scoreboard?groups=100&limit=100`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data: ESPNScoreboardResponse = await res.json();
    // Filter for tournament games
    return data.events.filter((event) => {
      const comp = event.competitions?.[0];
      return (
        comp?.tournamentId === "22" ||
        comp?.type?.abbreviation === "TRNMNT"
      );
    });
  } catch {
    return [];
  }
}

export async function fetchGameSummary(
  eventId: string
): Promise<ESPNSummaryResponse | null> {
  try {
    const res = await fetch(`${ESPN_BASE}/summary?event=${eventId}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Fetch the full tournament scoreboard across all dates
export async function fetchFullTournamentScoreboard(): Promise<ESPNEvent[]> {
  // ESPN requires a date range to return games from multiple days.
  // The tournament runs roughly March 16 - April 7.
  // Use a wide date range to capture all rounds.
  try {
    const res = await fetch(
      `${ESPN_BASE}/scoreboard?groups=100&limit=200&dates=20260316-20260408`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data: ESPNScoreboardResponse = await res.json();
    return data.events || [];
  } catch {
    return [];
  }
}
