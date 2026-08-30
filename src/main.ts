import Phaser from "phaser";
import { nextHazardLane, rankScores, speedForDistance, type ScoreEntry } from "./rules";

type MapKey = "manila" | "baguio" | "palawan";
const MAPS: Record<MapKey, { sky: number; verge: number; accent: number; name: string }> = {
  manila: { sky: 0x071126, verge: 0x17223a, accent: 0x40d9ff, name: "Metro Manila Night" },
  baguio: { sky: 0x93bfd0, verge: 0x1f5639, accent: 0xf4d35e, name: "Baguio Mountain Road" },
  palawan: { sky: 0xf29b68, verge: 0x177c87, accent: 0xffe082, name: "Palawan Coastal Highway" }
};
const laneX = [105, 195, 285, 375];

let selectedMap: MapKey = "manila";
let game: Phaser.Game | undefined;
let touchLeft = false;
let touchRight = false;

const menu = document.querySelector<HTMLElement>("#menu")!;
const shell = document.querySelector<HTMLElement>("#game-shell")!;
const dialog = document.querySelector<HTMLDialogElement>("#game-over")!;
const distanceNode = document.querySelector("#distance")!;
const scoreNode = document.querySelector("#score")!;
const speedNode = document.querySelector("#speed")!;
const leaderboard = document.querySelector<HTMLOListElement>("#leaderboard")!;

const scoreKey = () => `luzon-road-rush:scores:${selectedMap}`;
const loadScores = (): ScoreEntry[] => {
  try { return JSON.parse(localStorage.getItem(scoreKey()) || "[]"); } catch { return []; }
};
function showScores() {
  const scores = loadScores();
  leaderboard.innerHTML = scores.length
    ? scores.map(entry => `<li><b>${entry.score.toLocaleString()}</b> points · ${Math.floor(entry.distance)} m</li>`).join("")
    : "<li>No runs yet—set the first score.</li>";
}

class RoadScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private traffic!: Phaser.Physics.Arcade.Group;
  private hazards!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private road!: Phaser.GameObjects.Graphics;
  private distance = 0;
  private score = 0;
  private stripeOffset = 0;
  private ended = false;
  private slowUntil = 0;
  private trafficTimer = 0;
  private hazardTimer = 0;

  constructor() { super("road"); }

  create() {
    const map = MAPS[selectedMap];
    this.cameras.main.setBackgroundColor(map.sky);
    this.makeTextures(map.accent);
    this.road = this.add.graphics().setDepth(0);
    this.traffic = this.physics.add.group();
    this.hazards = this.physics.add.group();
    this.player = this.physics.add.sprite(240, 665, "player").setDepth(3);
    this.player.setCollideWorldBounds(true).setBodySize(34, 64);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.keys = this.input.keyboard!.addKeys("A,D") as Record<string, Phaser.Input.Keyboard.Key>;
    this.physics.add.overlap(this.player, this.traffic, () => this.finish());
    this.physics.add.overlap(this.player, this.hazards, (_player, hazard) => this.hitHazard(hazard as Phaser.Physics.Arcade.Sprite));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { touchLeft = false; touchRight = false; });
  }

  private makeTextures(accent: number) {
    const texture = (key: string, width: number, height: number, draw: (g: Phaser.GameObjects.Graphics) => void) => {
      if (this.textures.exists(key)) this.textures.remove(key);
      const g = this.add.graphics(); draw(g); g.generateTexture(key, width, height); g.destroy();
    };
    texture("player", 46, 82, g => { g.fillStyle(accent).fillRoundedRect(3, 3, 40, 76, 10); g.fillStyle(0x07111f).fillRoundedRect(9, 17, 28, 25, 5); g.fillStyle(0xffffff).fillRect(7, 4, 8, 5).fillRect(31, 4, 8, 5); });
    const trafficTexture = (key: string, color: number) => texture(key, 44, 78, g => { g.fillStyle(color).fillRoundedRect(2, 2, 40, 74, 9); g.fillStyle(0x17233c).fillRoundedRect(8, 36, 28, 24, 4); g.fillStyle(0xfff4c4).fillRect(6, 68, 8, 4).fillRect(30, 68, 8, 4); });
    trafficTexture("traffic-red", 0xff5d73);
    trafficTexture("traffic-blue", 0x4f8cff);
    trafficTexture("traffic-yellow", 0xffc857);
    texture("manhole", 52, 30, g => { g.fillStyle(0x14181e).fillEllipse(2, 2, 48, 26); g.lineStyle(3, 0x6d727c).strokeEllipse(5, 4, 42, 22); });
    texture("pothole", 58, 34, g => { g.fillStyle(0x08090b).fillEllipse(2, 3, 54, 28); g.fillStyle(0x34312e).fillCircle(17, 13, 5).fillCircle(39, 20, 6); });
  }

  private drawRoad() {
    const map = MAPS[selectedMap];
    this.road.clear().fillStyle(map.verge).fillRect(0, 0, 480, 734).fillStyle(0x2d3036).fillRect(55, 0, 370, 734);
    this.road.fillStyle(0xf4f4dd).fillRect(51, 0, 5, 734).fillRect(424, 0, 5, 734);
    this.road.fillStyle(0xf7edbd);
    for (const x of [150, 240, 330]) for (let y = -70 + this.stripeOffset; y < 760; y += 110) this.road.fillRect(x - 3, y, 6, 48);
    if (selectedMap === "manila") { this.road.fillStyle(0x45d8ff, .25).fillRect(8, 0, 12, 734).fillRect(460, 0, 12, 734); }
    if (selectedMap === "baguio") for (let y = -30 + this.stripeOffset; y < 760; y += 85) this.road.fillStyle(0x133b28).fillTriangle(8, y + 40, 34, y - 5, 51, y + 40);
    if (selectedMap === "palawan") this.road.fillStyle(0x58cbd4, .45).fillRect(0, 0, 42, 734);
  }

  update(time: number, delta: number) {
    if (this.ended) return;
    const normalSpeed = speedForDistance(this.distance);
    const speed = time < this.slowUntil ? normalSpeed * .72 : normalSpeed;
    this.distance += speed * (delta / 1000) * .42;
    this.score += speed * (delta / 1000);
    const pixelsPerSecond = speed * 12;
    this.stripeOffset = (this.stripeOffset + pixelsPerSecond * delta / 1000) % 110;
    this.drawRoad();

    const left = this.cursors.left.isDown || this.keys.A.isDown || touchLeft;
    const right = this.cursors.right.isDown || this.keys.D.isDown || touchRight;
    this.player.setVelocityX(left === right ? 0 : left ? -265 : 265);
    this.player.x = Phaser.Math.Clamp(this.player.x, 76, 404);

    this.trafficTimer += delta;
    this.hazardTimer += delta;
    if (this.trafficTimer >= 1450) { this.trafficTimer = 0; this.spawnTraffic(pixelsPerSecond); }
    if (this.hazardTimer >= 2300) { this.hazardTimer = 0; this.spawnHazard(pixelsPerSecond); }
    for (const item of [...this.traffic.getChildren(), ...this.hazards.getChildren()] as Phaser.Physics.Arcade.Sprite[]) {
      const cruiseFactor = item.getData("cruiseFactor") || 1;
      item.setVelocityY(pixelsPerSecond * cruiseFactor);
      const targetLane = item.getData("targetLane");
      if (typeof targetLane === "number") {
        const difference = laneX[targetLane] - item.x;
        item.setVelocityX(Math.abs(difference) < 3 ? 0 : Math.sign(difference) * 34);
        if (Math.abs(difference) < 3) item.x = laneX[targetLane];
      }
      if (item.y > 790) { if (item.getData("counted")) this.score += 25; item.destroy(); }
    }
    distanceNode.textContent = `${Math.floor(this.distance)} m`;
    scoreNode.textContent = Math.floor(this.score).toLocaleString();
    speedNode.textContent = speed.toFixed(1);
  }

  private safeLane(): number {
    let lane = nextHazardLane();
    const crowded = new Set([...this.traffic.getChildren(), ...this.hazards.getChildren()].filter((x: any) => x.y < 170).map((x: any) => x.getData("lane")));
    for (let tries = 0; tries < 4 && crowded.has(lane); tries++) lane = (lane + 1) % 4;
    return lane;
  }

  private spawnTraffic(speed: number) {
    const lane = this.safeLane();
    const colors = ["traffic-red", "traffic-blue", "traffic-yellow"];
    const car = this.traffic.create(laneX[lane], -60, Phaser.Utils.Array.GetRandom(colors)) as Phaser.Physics.Arcade.Sprite;
    const mayChangeLane = Math.random() < .28;
    const targetLane = mayChangeLane ? Phaser.Math.Clamp(lane + (Math.random() < .5 ? -1 : 1), 0, 3) : undefined;
    car.setData({ lane, targetLane, counted: true, cruiseFactor: Phaser.Math.FloatBetween(.72, .94) }).setVelocityY(speed).setBodySize(34, 62);
  }

  private spawnHazard(speed: number) {
    const lane = this.safeLane();
    const key = Math.random() < .5 ? "manhole" : "pothole";
    const hazard = this.hazards.create(laneX[lane], -30, key) as Phaser.Physics.Arcade.Sprite;
    hazard.setData({ lane, counted: true, type: key }).setVelocityY(speed).setBodySize(42, 22);
  }

  private hitHazard(hazard: Phaser.Physics.Arcade.Sprite) {
    this.slowUntil = this.time.now + (hazard.getData("type") === "pothole" ? 1300 : 750);
    this.score = Math.max(0, this.score - (hazard.getData("type") === "pothole" ? 75 : 35));
    this.cameras.main.shake(180, .009); hazard.destroy();
  }

  private finish() {
    if (this.ended) return;
    this.ended = true; this.physics.pause();
    const entry = { score: Math.floor(this.score), distance: Math.floor(this.distance), date: new Date().toISOString() };
    localStorage.setItem(scoreKey(), JSON.stringify(rankScores(loadScores(), entry)));
    document.querySelector("#final-distance")!.textContent = `${entry.distance} m`;
    document.querySelector("#final-score")!.textContent = entry.score.toLocaleString();
    dialog.showModal();
  }
}

function startGame() {
  menu.hidden = true; shell.hidden = false; dialog.close();
  if (!game) game = new Phaser.Game({ type: Phaser.AUTO, width: 480, height: 734, parent: "game", backgroundColor: "#050812", physics: { default: "arcade", arcade: { debug: false } }, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY }, scene: RoadScene });
  else game.scene.start("road");
}

document.querySelectorAll<HTMLButtonElement>(".map").forEach(button => button.addEventListener("click", () => {
  selectedMap = button.dataset.map as MapKey;
  document.querySelectorAll(".map").forEach(x => x.classList.remove("active")); button.classList.add("active"); showScores();
}));
document.querySelector("#start")!.addEventListener("click", startGame);
document.querySelector("#again")!.addEventListener("click", startGame);
document.querySelector("#change-map")!.addEventListener("click", () => { dialog.close(); shell.hidden = true; menu.hidden = false; showScores(); });
document.querySelector("#pause")!.addEventListener("click", () => { if (!game) return; const scene = game.scene.getScene("road"); scene.scene.isPaused() ? scene.scene.resume() : scene.scene.pause(); });
for (const [id, setter] of [["#left", (v: boolean) => touchLeft = v], ["#right", (v: boolean) => touchRight = v]] as const) {
  const button = document.querySelector(id)!; button.addEventListener("pointerdown", () => setter(true)); button.addEventListener("pointerup", () => setter(false)); button.addEventListener("pointercancel", () => setter(false)); button.addEventListener("pointerleave", () => setter(false));
}
showScores();
