import { describe, expect, it } from "vitest";
import { BASE_SPEED, nextHazardLane, rankScores, speedForDistance } from "../src/rules";

describe("distance-only speed progression", () => {
  it("adds half the base speed at each complete 100 m", () => {
    expect(speedForDistance(0)).toBe(BASE_SPEED);
    expect(speedForDistance(99.99)).toBe(20);
    expect(speedForDistance(100)).toBe(30);
    expect(speedForDistance(200)).toBe(40);
    expect(speedForDistance(300)).toBe(50);
    expect(speedForDistance(500)).toBe(70);
  });
});

it("keeps randomized hazards inside the four road lanes", () => {
  expect(nextHazardLane(() => 0)).toBe(0);
  expect(nextHazardLane(() => 0.999)).toBe(3);
});

it("keeps randomized hazards inside a three-lane map", () => {
  expect(nextHazardLane(() => 0, 3)).toBe(0);
  expect(nextHazardLane(() => 0.999, 3)).toBe(2);
});

it("keeps only the five highest local scores", () => {
  const entries = [1, 9, 3, 7, 5].map(score => ({ score, distance: score, date: "today" }));
  expect(rankScores(entries, { score: 8, distance: 8, date: "today" }).map(x => x.score)).toEqual([9,8,7,5,3]);
});
