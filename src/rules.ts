export const BASE_SPEED = 20;
export const SPEED_STEP = 0.5;
export const STEP_DISTANCE = 100;

export function speedForDistance(distance: number): number {
  return BASE_SPEED + Math.floor(Math.max(0, distance) / STEP_DISTANCE) * SPEED_STEP;
}

export function nextHazardLane(random = Math.random, laneCount = 4): number {
  const safeLaneCount = Math.max(1, Math.floor(laneCount));
  return Math.min(safeLaneCount - 1, Math.floor(random() * safeLaneCount));
}

export type ScoreEntry = { score: number; distance: number; date: string };

export function rankScores(entries: ScoreEntry[], latest: ScoreEntry): ScoreEntry[] {
  return [...entries, latest].sort((a, b) => b.score - a.score).slice(0, 5);
}
