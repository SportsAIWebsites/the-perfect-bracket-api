import { Prediction } from "@/types/bracket";

interface CachedPrediction {
  prediction: Prediction;
  expiresAt: number;
}

const cache = new Map<string, CachedPrediction>();
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export function getCachedPrediction(matchupKey: string): Prediction | null {
  const cached = cache.get(matchupKey);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    cache.delete(matchupKey);
    return null;
  }
  return cached.prediction;
}

export function setCachedPrediction(
  matchupKey: string,
  prediction: Prediction,
  ttl: number = DEFAULT_TTL
): void {
  cache.set(matchupKey, {
    prediction,
    expiresAt: Date.now() + ttl,
  });
}

export function invalidatePrediction(matchupKey: string): void {
  cache.delete(matchupKey);
}

export function clearAllPredictions(): void {
  cache.clear();
}

export function makePredictionKey(
  topTeamId: string,
  bottomTeamId: string,
  round: string
): string {
  return `${topTeamId}-${bottomTeamId}-${round}`;
}
