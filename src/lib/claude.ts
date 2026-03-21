import { BracketTeam } from "@/types/bracket";
import { TeamStats } from "./stats";
import { MatchupOdds } from "./odds";
import { SEED_WIN_RATES_R64 } from "./constants";

export function buildPredictionPrompt(
  topTeam: BracketTeam,
  bottomTeam: BracketTeam,
  round: string,
  region: string,
  topStats?: TeamStats | null,
  bottomStats?: TeamStats | null,
  odds?: MatchupOdds | null
): string {
  const topWinRate = SEED_WIN_RATES_R64[topTeam.seed] || 50;
  const bottomWinRate = SEED_WIN_RATES_R64[bottomTeam.seed] || 50;

  let prompt = `You are an expert NCAA Tournament analyst. Predict the winner of this March Madness matchup using ALL the data provided — team stats, seed history, and betting odds. Be decisive and specific.

MATCHUP: ${topTeam.name} (${topTeam.seed} seed, ${topTeam.record}) vs ${bottomTeam.name} (${bottomTeam.seed} seed, ${bottomTeam.record})
ROUND: ${round}
REGION: ${region}

HISTORICAL SEED DATA:
- ${topTeam.seed} seeds win ${topWinRate}% of first-round games historically
- ${bottomTeam.seed} seeds win ${bottomWinRate}% of first-round games historically`;

  // Add real team stats if available
  if (topStats) {
    prompt += `\n
${topTeam.name.toUpperCase()} STATS:
- PPG: ${topStats.ppg} | Opp PPG: ${topStats.oppPpg} | Diff: ${topStats.differential > 0 ? "+" : ""}${topStats.differential}
- Win%: ${(topStats.winPct * 100).toFixed(1)}% | Streak: ${topStats.streak > 0 ? `W${topStats.streak}` : `L${Math.abs(topStats.streak)}`}
- Home: ${topStats.homeRecord} | Away: ${topStats.awayRecord}`;
  }

  if (bottomStats) {
    prompt += `\n
${bottomTeam.name.toUpperCase()} STATS:
- PPG: ${bottomStats.ppg} | Opp PPG: ${bottomStats.oppPpg} | Diff: ${bottomStats.differential > 0 ? "+" : ""}${bottomStats.differential}
- Win%: ${(bottomStats.winPct * 100).toFixed(1)}% | Streak: ${bottomStats.streak > 0 ? `W${bottomStats.streak}` : `L${Math.abs(bottomStats.streak)}`}
- Home: ${bottomStats.homeRecord} | Away: ${bottomStats.awayRecord}`;
  }

  // Add betting odds if available
  if (odds) {
    const favoredTeam =
      odds.spread < 0 ? topTeam.name : bottomTeam.name;
    prompt += `\n
LIVE BETTING ODDS (${odds.bookmaker}):
- Spread: ${favoredTeam} favored by ${Math.abs(odds.spread)} points
- Moneyline: ${topTeam.name} ${odds.moneyline.top > 0 ? "+" : ""}${odds.moneyline.top} / ${bottomTeam.name} ${odds.moneyline.bottom > 0 ? "+" : ""}${odds.moneyline.bottom}
- Vegas implied probability heavily favors the moneyline favorite — weight this data strongly`;
  }

  prompt += `

ANALYSIS GUIDELINES:
- Compare point differentials and scoring margins
- Factor in defensive strength (opponent PPG)
- Consider momentum (current streak)
- If betting odds are provided, weight them heavily — they incorporate injury reports, matchup data, and public sentiment
- For later rounds, consider that surviving teams have tournament momentum

Respond with ONLY valid JSON (no markdown, no code blocks, no extra text):
{"winnerId": "top" or "bottom", "confidence": <number 50-99>, "reasoning": "<2-3 sentence analysis citing specific stats>"}`;

  return prompt;
}

export function buildLivePredictionPrompt(
  topTeam: BracketTeam,
  bottomTeam: BracketTeam,
  round: string,
  region: string,
  topScore: number,
  bottomScore: number,
  period: number,
  displayClock: string,
  topStats?: TeamStats | null,
  bottomStats?: TeamStats | null,
  odds?: MatchupOdds | null
): string {
  const scoreDiff = topScore - bottomScore;
  const leader = scoreDiff > 0 ? topTeam.name : bottomTeam.name;
  const margin = Math.abs(scoreDiff);

  let prompt = `You are an expert NCAA Tournament analyst. This game is LIVE — predict the winner based on the current score, momentum, and game context. Be decisive.

LIVE GAME: ${topTeam.name} (${topTeam.seed} seed) ${topScore} - ${bottomScore} ${bottomTeam.name} (${bottomTeam.seed} seed)
PERIOD: ${period === 1 ? "1st Half" : period === 2 ? "2nd Half" : `OT${period - 2}`} | CLOCK: ${displayClock}
${scoreDiff === 0 ? "TIED GAME" : `${leader} leads by ${margin}`}
ROUND: ${round}
REGION: ${region}`;

  if (topStats) {
    prompt += `\n${topTeam.name.toUpperCase()} SEASON: ${topStats.ppg} PPG, ${topStats.oppPpg} Opp PPG, ${(topStats.winPct * 100).toFixed(0)}% win rate`;
  }
  if (bottomStats) {
    prompt += `\n${bottomTeam.name.toUpperCase()} SEASON: ${bottomStats.ppg} PPG, ${bottomStats.oppPpg} Opp PPG, ${(bottomStats.winPct * 100).toFixed(0)}% win rate`;
  }
  if (odds) {
    prompt += `\nPRE-GAME ODDS: ${odds.moneyline.top > 0 ? "+" : ""}${odds.moneyline.top} / ${odds.moneyline.bottom > 0 ? "+" : ""}${odds.moneyline.bottom}`;
  }

  prompt += `

LIVE ANALYSIS GUIDELINES:
- A team leading by 10+ in the 2nd half has ~85-95% win probability
- A team leading by 5-9 in the 2nd half has ~70-85% win probability
- Close games (<5 points) in the 2nd half are near 50-50, edge to the better seed
- 1st half leads are less predictive — factor in team quality and comeback ability
- Consider pre-game odds as baseline, adjust based on current score and momentum
- Large leads by underdogs should still be respected but slightly discounted

Respond with ONLY valid JSON (no markdown, no code blocks, no extra text):
{"winnerId": "top" or "bottom", "confidence": <number 50-99>, "reasoning": "<2-3 sentence analysis of the live game state>"}`;

  return prompt;
}

export function buildGameAnalysisPrompt(
  gameContext: string,
  userMessage?: string
): string {
  let prompt = `You are Perfect Bracket AI, an elite college basketball analyst covering the NCAA Tournament. You're sharp, confident, and specific — always cite real numbers and matchup details. Keep responses to 2-4 sentences unless asked for more.

CURRENT GAME DATA:
${gameContext}`;

  if (userMessage) {
    prompt += `\n\nUser question: ${userMessage}`;
  } else {
    prompt += `\n\nGive a 3-sentence analysis of this matchup. Cover momentum, key matchup advantages, and one bold prediction.`;
  }

  return prompt;
}
