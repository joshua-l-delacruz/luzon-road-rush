import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { BASE_SPEED, livesAfterPotholeHit, nextHazardLane, rankScores, speedForDistance, STARTING_LIVES, swerveChanceForSpeed, sweptCollision } from "../src/rules";

describe("distance-only speed progression", () => {
  it("adds five speed units at each complete 100 m", () => {
    expect(speedForDistance(0)).toBe(BASE_SPEED);
    expect(speedForDistance(99.99)).toBe(20);
    expect(speedForDistance(100)).toBe(25);
    expect(speedForDistance(200)).toBe(30);
    expect(speedForDistance(300)).toBe(35);
    expect(speedForDistance(500)).toBe(45);
  });
});

it("makes swerving traffic more common at the 50 speed mark", () => {
  expect(swerveChanceForSpeed(49.99)).toBe(.38);
  expect(swerveChanceForSpeed(50)).toBe(.72);
  expect(swerveChanceForSpeed(75)).toBe(.72);
});

it("removes one life per pothole and stops at zero", () => {
  expect(STARTING_LIVES).toBe(3);
  expect(livesAfterPotholeHit(3)).toBe(2);
  expect(livesAfterPotholeHit(1)).toBe(0);
  expect(livesAfterPotholeHit(0)).toBe(0);
});

it("keeps randomized hazards inside the four road lanes", () => {
  expect(nextHazardLane(() => 0)).toBe(0);
  expect(nextHazardLane(() => 0.999)).toBe(3);
});

it("keeps randomized hazards inside a three-lane map", () => {
  expect(nextHazardLane(() => 0, 3)).toBe(0);
  expect(nextHazardLane(() => 0.999, 3)).toBe(2);
});

it("detects traffic that crosses the player between high-speed frames", () => {
  expect(sweptCollision(510, 820, 240, 240, 70, 36)).toBe(true);
  expect(sweptCollision(510, 820, 330, 240, 70, 36)).toBe(false);
  expect(sweptCollision(100, 300, 240, 240, 70, 36)).toBe(false);
});

it("keeps only the five highest local scores", () => {
  const entries = [1, 9, 3, 7, 5].map(score => ({ score, distance: score, date: "today" }));
  expect(rankScores(entries, { score: 8, distance: 8, date: "today" }).map(x => x.score)).toEqual([9,8,7,5,3]);
});

it("publishes custom-domain search, social, and browser security metadata", async () => {
  const page = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const robots = await readFile(new URL("../public/robots.txt", import.meta.url), "utf8");
  const sitemap = await readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8");
  expect(page).toMatch(/rel="canonical" href="https:\/\/roadrush\.joshuadelacruz\.solutions\//);
  expect(page).toMatch(/http-equiv="Content-Security-Policy"/);
  expect(page).toMatch(/property="og:title"/);
  expect(page).toMatch(/name="twitter:card"/);
  expect(page).toMatch(/href="https:\/\/joshuadelacruz\.solutions\/">← Main Portfolio<\/a>/);
  expect(robots).toMatch(/Sitemap: https:\/\/roadrush\.joshuadelacruz\.solutions\/sitemap\.xml/);
  expect(sitemap).toMatch(/<loc>https:\/\/roadrush\.joshuadelacruz\.solutions\/<\/loc>/);
});

it("ships project, gameplay, architecture, and security documentation", async () => {
  for (const path of ["../README.md", "../docs/GAMEPLAY.md", "../docs/ARCHITECTURE.md", "../docs/SECURITY.md", "../SECURITY.md", "../CONTRIBUTING.md"]) {
    expect((await readFile(new URL(path, import.meta.url), "utf8")).length).toBeGreaterThan(200);
  }
});

it("ships a safe-area-aware mobile playfield and touch controls", async () => {
  const page = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const styles = await readFile(new URL("../src/style.css", import.meta.url), "utf8");
  const game = await readFile(new URL("../src/main.ts", import.meta.url), "utf8");
  expect(page).toMatch(/class="playfield"/);
  expect(styles).toMatch(/100dvh/);
  expect(styles).toMatch(/safe-area-inset-bottom/);
  expect(styles).toMatch(/orientation:\s*landscape/);
  expect(game).toMatch(/CENTER_BOTH/);
  expect(game).toMatch(/setPointerCapture/);
  expect(page).toMatch(/id="lives">3<\/b>/);
});
