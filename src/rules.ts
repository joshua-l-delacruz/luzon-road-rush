export const BASE_SPEED = 20;
export const SPEED_STEP = 5;
export const STEP_DISTANCE = 100;
export const STARTING_LIVES = 3;

export function speedForDistance(distance: number): number {
  const completedSteps = Math.floor(Math.max(0, distance) / STEP_DISTANCE);
  return BASE_SPEED + SPEED_STEP * completedSteps;
}

export function swerveChanceForSpeed(speed: number): number {
  return speed >= 50 ? 0.72 : 0.38;
}

export function livesAfterHazardHit(lives: number): number {
  return Math.max(0, Math.floor(lives) - 1);
}

export function formatLives(lives: number): string {
  const remaining = Math.max(0, Math.min(STARTING_LIVES, Math.floor(lives)));
  return Array.from({ length: STARTING_LIVES }, (_, index) => index < remaining ? "🚗" : "×").join(" ");
}

export function nextHazardLane(random = Math.random, laneCount = 4): number {
  const safeLaneCount = Math.max(1, Math.floor(laneCount));
  return Math.min(safeLaneCount - 1, Math.floor(random() * safeLaneCount));
}

export function sweptCollision(
  previousY: number,
  currentY: number,
  objectX: number,
  playerX: number,
  verticalRadius: number,
  horizontalRadius: number
): boolean {
  const top = Math.min(previousY, currentY);
  const bottom = Math.max(previousY, currentY);
  return top <= 665 + verticalRadius && bottom >= 665 - verticalRadius && Math.abs(objectX - playerX) <= horizontalRadius;
}

export type ScoreEntry = { score: number; distance: number; date: string };

export function rankScores(entries: ScoreEntry[], latest: ScoreEntry): ScoreEntry[] {
  return [...entries, latest].sort((a, b) => b.score - a.score).slice(0, 5);
}
