import {
  FullBracket,
  BracketMatchup,
  BracketTeam,
} from "@/types/bracket";
import { R32_FEEDERS, S16_FEEDERS, FINAL_FOUR_MATCHUPS } from "./constants";

/**
 * Get the winner team from a matchup (actual or predicted)
 */
function getWinner(matchup: BracketMatchup): BracketTeam | null {
  if (matchup.status === "final" && matchup.winnerId) {
    if (matchup.topTeam?.teamId === matchup.winnerId) return matchup.topTeam;
    if (matchup.bottomTeam?.teamId === matchup.winnerId)
      return matchup.bottomTeam;
  }
  if (matchup.status === "in_progress") {
    // During live games, tentatively pick the leader
    if (
      matchup.topScore !== undefined &&
      matchup.bottomScore !== undefined
    ) {
      if (matchup.topScore > matchup.bottomScore) return matchup.topTeam;
      if (matchup.bottomScore > matchup.topScore) return matchup.bottomTeam;
    }
    return null;
  }
  if (matchup.prediction) {
    if (matchup.prediction.winnerId === matchup.topTeam?.teamId)
      return matchup.topTeam;
    if (matchup.prediction.winnerId === matchup.bottomTeam?.teamId)
      return matchup.bottomTeam;
  }
  return null;
}

/**
 * Propagate winners from earlier rounds into later rounds.
 * This fills in topTeam/bottomTeam for TBD matchups.
 */
export function propagateBracket(bracket: FullBracket): FullBracket {
  const b = structuredClone(bracket);

  for (const region of Object.values(b.regions)) {
    // R64 -> R32
    for (let i = 0; i < R32_FEEDERS.length; i++) {
      const [a, c] = R32_FEEDERS[i];
      const r32 = region.rounds.R32[i];
      if (r32 && r32.status === "tbd") {
        r32.topTeam = getWinner(region.rounds.R64[a]);
        r32.bottomTeam = getWinner(region.rounds.R64[c]);
      }
    }

    // R32 -> S16
    for (let i = 0; i < S16_FEEDERS.length; i++) {
      const [a, c] = S16_FEEDERS[i];
      const s16 = region.rounds.S16[i];
      if (s16 && s16.status === "tbd") {
        s16.topTeam = getWinner(region.rounds.R32[a]);
        s16.bottomTeam = getWinner(region.rounds.R32[c]);
      }
    }

    // S16 -> E8
    const e8 = region.rounds.E8[0];
    if (e8 && e8.status === "tbd") {
      e8.topTeam = getWinner(region.rounds.S16[0]);
      e8.bottomTeam = getWinner(region.rounds.S16[1]);
    }
  }

  // E8 -> Final Four
  for (let i = 0; i < FINAL_FOUR_MATCHUPS.length; i++) {
    const [regionA, regionB] = FINAL_FOUR_MATCHUPS[i];
    const semi = b.finalFour.semifinals[i];
    if (semi && semi.status === "tbd") {
      semi.topTeam = getWinner(b.regions[regionA].rounds.E8[0]);
      semi.bottomTeam = getWinner(b.regions[regionB].rounds.E8[0]);
    }
  }

  // Final Four -> Championship
  const champ = b.finalFour.championship;
  if (champ && champ.status === "tbd") {
    champ.topTeam = getWinner(b.finalFour.semifinals[0]);
    champ.bottomTeam = getWinner(b.finalFour.semifinals[1]);
  }

  return b;
}
