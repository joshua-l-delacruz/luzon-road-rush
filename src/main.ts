import Phaser from "phaser";
import { formatLives, livesAfterPotholeHit, nextHazardLane, rankScores, speedForDistance, STARTING_LIVES, swerveChanceForSpeed, sweptCollision, type ScoreEntry } from "./rules";

type MapKey = "manila" | "baguio" | "palawan";
const MAPS: Record<MapKey, { sky: number; verge: number; accent: number; name: string; lanes: number }> = {
  manila: { sky: 0x071126, verge: 0x17223a, accent: 0x40d9ff, name: "Metro Manila Night", lanes: 4 },
  baguio: { sky: 0x93bfd0, verge: 0x1f5639, accent: 0xf4d35e, name: "Baguio Mountain Road", lanes: 3 },
  palawan: { sky: 0xf29b68, verge: 0x177c87, accent: 0xffe082, name: "Palawan Coastal Highway", lanes: 3 }
};
const ROAD_LEFT = 55;
const ROAD_WIDTH = 370;
const laneCenters = (count: number) => Array.from({ length: count }, (_, index) => ROAD_LEFT + ROAD_WIDTH * ((index + .5) / count));
const laneDividers = (count: number) => Array.from({ length: count - 1 }, (_, index) => ROAD_LEFT + ROAD_WIDTH * ((index + 1) / count));

let selectedMap: MapKey = "manila";
let game: Phaser.Game | undefined;
let touchLeft = false;
let touchRight = false;

const menu = document.querySelector<HTMLElement>("#menu")!;
const shell = document.querySelector<HTMLElement>("#game-shell")!;
const dialog = document.querySelector<HTMLDialogElement>("#game-over")!;
const pauseMenu = document.querySelector<HTMLDialogElement>("#pause-menu")!;
const distanceNode = document.querySelector("#distance")!;
const scoreNode = document.querySelector("#score")!;
const speedNode = document.querySelector("#speed")!;
const livesNode = document.querySelector("#lives")!;
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
  private lives = STARTING_LIVES;
  private stripeOffset = 0;
  private ended = false;
  private slowUntil = 0;
  private trafficTimer = 0;
  private hazardTimer = 0;
  private hazardSequence = 0;

  constructor() { super("road"); }

  private updateLivesDisplay() {
    livesNode.textContent = formatLives(this.lives);
    livesNode.setAttribute("aria-label", `${this.lives} ${this.lives === 1 ? "life" : "lives"} remaining`);
  }

  create() {
    // Phaser reuses this Scene instance after a run. Reset all per-run state
    // before recreating its objects so "Race again" starts a clean game.
    this.distance = 0;
    this.score = 0;
    this.lives = STARTING_LIVES;
    this.stripeOffset = 0;
    this.ended = false;
    this.slowUntil = 0;
    this.trafficTimer = 0;
    this.hazardTimer = 0;
    this.hazardSequence = 0;
    this.physics.resume();
    distanceNode.textContent = "0 m";
    scoreNode.textContent = "0";
    speedNode.textContent = speedForDistance(0).toFixed(1);
    this.updateLivesDisplay();

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
    this.physics.add.overlap(this.traffic, this.hazards, (traffic, hazard) => {
      const car = traffic as Phaser.Physics.Arcade.Sprite;
      const roadHazard = hazard as Phaser.Physics.Arcade.Sprite;
      if (roadHazard.getData("type") !== "manhole") return;
      const hazardId = roadHazard.getData("hazardId");
      if (car.getData("lastManhole") === hazardId) return;
      car.setData("lastManhole", hazardId);
      car.setData("slowUntil", this.time.now + 1600);
      car.setTint(0xffa0a0);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { touchLeft = false; touchRight = false; });
  }

  private makeTextures(accent: number) {
    const texture = (key: string, width: number, height: number, draw: (g: Phaser.GameObjects.Graphics) => void) => {
      if (this.textures.exists(key)) this.textures.remove(key);
      const g = this.add.graphics(); draw(g); g.generateTexture(key, width, height); g.destroy();
    };
    texture("player", 46, 82, g => { g.fillStyle(accent).fillRoundedRect(3, 3, 40, 76, 10); g.fillStyle(0x07111f).fillRoundedRect(9, 17, 28, 25, 5); g.fillStyle(0xffffff).fillRect(7, 4, 8, 5).fillRect(31, 4, 8, 5); });
    const trafficTexture = (key: string, color: number) => texture(key, 44, 78, g => { g.fillStyle(color).fillRoundedRect(2, 2, 40, 74, 9); g.fillStyle(0xfff4c4).fillRect(6, 5, 8, 4).fillRect(30, 5, 8, 4); g.fillStyle(0x17233c).fillRoundedRect(8, 17, 28, 24, 4); g.fillStyle(0xc92135).fillRect(6, 69, 8, 4).fillRect(30, 69, 8, 4); });
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
    for (const x of laneDividers(map.lanes)) for (let y = -70 + this.stripeOffset; y < 760; y += 110) this.road.fillRect(x - 3, y, 6, 48);
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
    if (this.trafficTimer >= 1450) { this.trafficTimer = 0; this.spawnTraffic(pixelsPerSecond, normalSpeed); }
    if (this.hazardTimer >= 2300) { this.hazardTimer = 0; this.spawnHazard(pixelsPerSecond); }
    for (const item of [...this.traffic.getChildren(), ...this.hazards.getChildren()] as Phaser.Physics.Arcade.Sprite[]) {
      const isTraffic = item.getData("kind") === "traffic";
      const previousY = item.getData("previousY") ?? item.y;
      const crossedPlayer = sweptCollision(previousY, item.y, item.x, this.player.x, isTraffic ? 70 : 52, isTraffic ? 36 : 40);
      if (crossedPlayer) {
        if (isTraffic) {
          this.finish();
          return;
        }
        this.hitHazard(item);
        continue;
      }
      item.setData("previousY", item.y);
      const cruiseFactor = item.getData("cruiseFactor") || 1;
      const isSlowed = isTraffic && time < (item.getData("slowUntil") || 0);
      item.setVelocityY(pixelsPerSecond * cruiseFactor * (isSlowed ? .22 : 1));
      if (isSlowed) {
        item.setAngle(Math.sin(time / 75) * 5);
        item.setVelocityX(Math.sin(time / 90) * 34);
      } else if (isTraffic) {
        item.clearTint();
        item.setAngle(0);
      }
      if (isTraffic && !isSlowed && item.getData("swerves")) {
        const phase = item.getData("swervePhase") || 0;
        item.setVelocityX(Math.sin(time / 480 + phase) * item.getData("swerveSpeed"));
        item.x = Phaser.Math.Clamp(item.x, 75, 405);
      }
      if (item.y > 790) { if (item.getData("counted")) this.score += 25; item.destroy(); }
    }
    distanceNode.textContent = `${Math.floor(this.distance)} m`;
    scoreNode.textContent = Math.floor(this.score).toLocaleString();
    speedNode.textContent = speed.toFixed(1);
  }

  private safeLane(): number {
    const laneCount = MAPS[selectedMap].lanes;
    let lane = nextHazardLane(Math.random, laneCount);
    const crowded = new Set([...this.traffic.getChildren(), ...this.hazards.getChildren()].filter((x: any) => x.y < 170).map((x: any) => x.getData("lane")));
    for (let tries = 0; tries < laneCount && crowded.has(lane); tries++) lane = (lane + 1) % laneCount;
    return lane;
  }

  private spawnTraffic(speed: number, roadSpeed: number) {
    const lane = this.safeLane();
    const lanes = laneCenters(MAPS[selectedMap].lanes);
    const colors = ["traffic-red", "traffic-blue", "traffic-yellow"];
    const car = this.traffic.create(lanes[lane], -60, Phaser.Utils.Array.GetRandom(colors)) as Phaser.Physics.Arcade.Sprite;
    const swerves = Math.random() < swerveChanceForSpeed(roadSpeed);
    car.setData({
      kind: "traffic", lane, counted: true,
      cruiseFactor: swerves ? Phaser.Math.FloatBetween(.98, 1.16) : Phaser.Math.FloatBetween(.72, .94),
      swerves,
      swerveSpeed: Phaser.Math.FloatBetween(115, 155),
      swervePhase: Phaser.Math.FloatBetween(0, Math.PI * 2),
      slowUntil: 0,
      previousY: -60
    }).setDepth(2).setVelocityY(speed).setBodySize(34, 62);
  }

  private spawnHazard(speed: number) {
    const lane = this.safeLane();
    const lanes = laneCenters(MAPS[selectedMap].lanes);
    const key = Math.random() < .5 ? "manhole" : "pothole";
    const hazard = this.hazards.create(lanes[lane], -30, key) as Phaser.Physics.Arcade.Sprite;
    hazard.setData({ lane, counted: true, type: key, hazardId: ++this.hazardSequence, previousY: -30 }).setDepth(1).setVelocityY(speed).setBodySize(42, 22);
  }

  private hitHazard(hazard: Phaser.Physics.Arcade.Sprite) {
    const isPothole = hazard.getData("type") === "pothole";
    this.slowUntil = this.time.now + (isPothole ? 1300 : 750);
    this.score = Math.max(0, this.score - (isPothole ? 75 : 35));
    if (isPothole) {
      this.lives = livesAfterPotholeHit(this.lives);
      this.updateLivesDisplay();
    }
    this.cameras.main.shake(180, .009);
    hazard.destroy();
    if (isPothole && this.lives === 0) this.finish();
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
  menu.hidden = true;
  shell.hidden = false;
  shell.classList.remove("game-shell-concealed");
  if (dialog.open) dialog.close();
  if (pauseMenu.open) pauseMenu.close();
  requestAnimationFrame(() => {
    if (!game) {
      game = new Phaser.Game({ type: Phaser.AUTO, width: 480, height: 734, parent: "game", backgroundColor: "#050812", physics: { default: "arcade", arcade: { debug: false } }, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: RoadScene });
      return;
    }
    game.scale.refresh();
    game.scene.start("road");
  });
}

function returnToMapSelection() {
  if (game) game.scene.stop("road");
  if (dialog.open) dialog.close();
  if (pauseMenu.open) pauseMenu.close();
  // Do not use display:none after Phaser has created its canvas. A zero-sized
  // parent can collapse the renderer when a different map starts.
  shell.hidden = false;
  shell.classList.add("game-shell-concealed");
  menu.hidden = false;
  showScores();
}

document.querySelectorAll<HTMLButtonElement>(".map").forEach(button => button.addEventListener("click", () => {
  selectedMap = button.dataset.map as MapKey;
  document.querySelectorAll(".map").forEach(x => x.classList.remove("active")); button.classList.add("active"); showScores();
}));
document.querySelector("#start")!.addEventListener("click", startGame);
document.querySelector("#again")!.addEventListener("click", startGame);
document.querySelector("#change-map")!.addEventListener("click", returnToMapSelection);
document.querySelector("#pause")!.addEventListener("click", () => {
  if (!game) return;
  game.scene.pause("road");
  pauseMenu.showModal();
});
document.querySelector("#resume")!.addEventListener("click", () => {
  if (!game) return;
  game.scene.resume("road");
  pauseMenu.close();
});
document.querySelector("#exit-game")!.addEventListener("click", returnToMapSelection);
for (const [id, setter] of [["#left", (v: boolean) => touchLeft = v], ["#right", (v: boolean) => touchRight = v]] as const) {
  const button = document.querySelector<HTMLButtonElement>(id)!;
  button.addEventListener("pointerdown", event => { event.preventDefault(); button.setPointerCapture(event.pointerId); setter(true); });
  button.addEventListener("pointerup", event => { if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId); setter(false); });
  button.addEventListener("pointercancel", () => setter(false));
  button.addEventListener("lostpointercapture", () => setter(false));
}
window.addEventListener("blur", () => { touchLeft = false; touchRight = false; });
document.addEventListener("visibilitychange", () => { if (document.hidden) { touchLeft = false; touchRight = false; } });
showScores();
