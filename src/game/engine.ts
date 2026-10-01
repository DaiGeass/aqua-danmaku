import { Sfx } from "./audio";
import {
  buildCharShots,
  buildSprites,
  gel,
  HUES,
  makeShotArt,
  PALETTES,
  SIZES,
  WHITE,
  type Spr,
  type Sprites,
} from "./sprites";
import { bossFrames, charFrames, enemyFrames, itemFrames, type Enemy3D, type Frames, type ItemFrames } from "./models3d";
import { bossT, charT, spellT, stageT, tr, type Lang } from "./i18n";
import { BOMBS, CHARS, DIFFS, type BombDef, type CharDef, type DiffDef } from "./config";

export const W = 480;
export const H = 640;
const TAU = Math.PI * 2;
const UP = -Math.PI / 2;
const PLAYER_R = 3;
const GRAZE_R = 15;
const MAX_BULLETS = 1100;
const MAX_PARTS = 650;
const MAX_SHOTS = 260;
const HUD_H = 44;
const FONT =
  '"Trebuchet MS","Segoe UI","Hiragino Sans","Yu Gothic UI","Meiryo","Noto Sans JP","Noto Sans SC","Noto Sans Hebrew","Noto Sans Arabic",sans-serif';

export type GameState = "menu" | "playing" | "paused" | "over";
export interface GameResult {
  score: number;
  stage: number;
  graze: number;
  diff: number;
  char: number;
}
export interface GameCallbacks {
  onState: (s: GameState) => void;
  onOver: (r: GameResult) => void;
}

// ---------- data ----------
interface Bullet {
  x: number; y: number; vx: number; vy: number;
  ang: number; spd: number; acc: number; turn: number; maxSpd: number;
  r: number; size: number; hue: number; grazed: boolean; age: number;
}
interface ShotOpt {
  p?: number; home?: boolean; amp?: number; ph?: number;
  sp?: number; sn?: number; ss?: number; ch?: number; sc?: number;
}
interface Shot {
  x: number; y: number; vx: number; vy: number; spd: number; dmg: number; kind: number;
  pierce: number; last: object | null; age: number; amp: number; ph: number; home: boolean;
  splitAt: number; splitN: number; spread: number; chain: number; sc: number;
}
interface Particle {
  x: number; y: number; vx: number; vy: number; life: number; max: number;
  size: number; hue: number; kind: number; drag: number; grav: number;
}
interface Item { x: number; y: number; vx: number; vy: number; kind: number; t: number }
interface Popup { x: number; y: number; text: string; life: number; max: number; size: number; color: string }
interface Enemy {
  kind: number; x: number; y: number; t: number; hp: number; maxHp: number; r: number;
  hue: number; fireT: number; fireT2: number; flash: number; sx: number; sy: number;
  dir: number; stopY: number; spin: number; vx: number; vy: number; fl: number;
  fr: Frames | null; body: Spr | null;
}
interface Boss {
  kind: number; x: number; y: number; tx: number; ty: number; hp: number; maxHp: number; phase: number;
  phaseT: number; t: number; inv: number; tm: number[]; spin: number; dir: number;
  moveT: number; flash: number; cnt: number;
}
interface Banner { title: string; sub: string; t: number; max: number; spell: boolean }

class Pool<T> {
  items: T[] = [];
  n = 0;
  constructor(private make: () => T) {}
  spawn(): T {
    if (this.n === this.items.length) this.items.push(this.make());
    return this.items[this.n++];
  }
  kill(i: number) {
    const last = this.n - 1;
    const t = this.items[i];
    this.items[i] = this.items[last];
    this.items[last] = t;
    this.n--;
  }
  clear() { this.n = 0; }
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const wrapAng = (d: number) => ((((d + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
const hueIdx = (deg: number) => {
  let best = 0, bd = 999;
  for (let i = 0; i < HUES.length; i++) {
    const d = Math.abs(wrapAng(((deg - HUES[i]) * Math.PI) / 180));
    if (d < bd) { bd = d; best = i; }
  }
  return best;
};

// ---------- stage tables ----------
interface StageDef { pal: number; waves: number[]; eh: [number, number, number]; boss: number; bossHue: number }
const STAGES: StageDef[] = [
  { pal: 0, waves: [0, 1, 0, 1, 3], eh: [340, 25, 280], boss: 0, bossHue: 185 },
  { pal: 1, waves: [0, 3, 5, 12, 3, 2], eh: [15, 50, 330], boss: 1, bossHue: 130 },
  { pal: 2, waves: [3, 5, 4, 7, 12, 2], eh: [185, 130, 50], boss: 2, bossHue: 280 },
  { pal: 3, waves: [1, 7, 6, 8, 12, 2], eh: [330, 285, 50], boss: 3, bossHue: 165 },
  { pal: 4, waves: [8, 9, 3, 12, 4, 2], eh: [200, 215, 265], boss: 4, bossHue: 200 },
  { pal: 5, waves: [12, 1, 9, 10, 7, 2], eh: [300, 130, 50], boss: 5, bossHue: 300 },
  { pal: 6, waves: [10, 6, 8, 11, 12, 2], eh: [48, 215, 280], boss: 6, bossHue: 55 },
  { pal: 7, waves: [9, 11, 10, 6, 7, 2], eh: [265, 200, 330], boss: 7, bossHue: 250 },
];
const ALL_WAVES = [0, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 2];
const BH = [
  [0, 1, 2, 6], [1, 2, 0, 6], [2, 1, 0, 4], [0, 2, 4, 1],
  [4, 5, 2, 6], [6, 0, 1, 4], [2, 3, 4, 6], [6, 4, 0, 2],
];

const ENEMY = [
  { hp: 12, r: 14, score: 500, gems: 2, slot: 0, leave: 5.2 }, // 0 jelly
  { hp: 4, r: 10, score: 200, gems: 1, slot: 1, leave: 99 }, // 1 fairy
  { hp: 90, r: 24, score: 3000, gems: 10, slot: 2, leave: 11 }, // 2 big
  { hp: 9, r: 12, score: 400, gems: 2, slot: 0, leave: 3.0 }, // 3 crystal
  { hp: 34, r: 17, score: 900, gems: 4, slot: 1, leave: 8 }, // 4 urchin
  { hp: 6, r: 11, score: 300, gems: 1, slot: 0, leave: 0.9 }, // 5 swooper
  { hp: 64, r: 20, score: 1800, gems: 8, slot: 2, leave: 9 }, // 6 turret
  { hp: 16, r: 14, score: 600, gems: 2, slot: 1, leave: 99 }, // 7 star
  { hp: 40, r: 20, score: 1100, gems: 5, slot: 2, leave: 99 }, // 8 manta
  { hp: 22, r: 16, score: 700, gems: 4, slot: 0, leave: 7 }, // 9 mine
  { hp: 14, r: 13, score: 650, gems: 3, slot: 1, leave: 1.6 }, // 10 lancer
  { hp: 130, r: 22, score: 3500, gems: 12, slot: 2, leave: 14 }, // 11 tower
  { hp: 8, r: 9, score: 350, gems: 2, slot: 0, leave: 99 }, // 12 firefly
];
const E3D: Record<number, Enemy3D> = { 3: "crystal", 4: "urchin", 6: "turret", 7: "star", 8: "manta", 9: "mine", 11: "tower" };

const OPT_CH = CHARS.map((c) => c.options);

/**
 * Shot art slots. Player shots use index = character (0..CHARS.length-1).
 * Bomb shots use CHARS.length + bombIndex * 4 + shape, so every bomb gets its
 * own tinted drop/orb/star/bolt set and adding a bomb never shifts art.
 */
const BOMB_STRIDE = 4;
const BS = { orb: 0, drop: 1, star: 2, bolt: 3 } as const;
/** Index into the shot-art table for a bomb's shots of a given shape. */
const bombArt = (bombIdx: number, shape: number) => CHARS.length + bombIdx * BOMB_STRIDE + shape;
/** Hue used for each bomb's shot art. */
const BOMB_HUE: Record<string, number> = {
  splash: 190, spiral: 110, hearts: 335, rain: 48, shards: 200, bloom: 300, storm: 60, void: 265,
  orbit: 280, waves: 205, flare: 25, blizzard: 195, inferno: 8, gale: 150, mist: 225, nova: 315,
};

export class Game {
  state: GameState = "menu";
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private container: HTMLElement;
  private cb: GameCallbacks;
  private sfx = new Sfx();
  private spr: Sprites;
  private itemFr: ItemFrames;
  private charFr: Frames[] = [];
  private bossFr: Frames | null = null;
  /** Flat shot-art table: player characters first, then 4 shapes per bomb. */
  private shotArt: Spr[] = [];
  /** Whether a shot-art slot rotates along its velocity. */
  private shotRot: boolean[] = [];
  private scale = 1;
  private dpr = 1;
  private raf = 0;
  private lastT = 0;
  private time = 0;
  private ro: ResizeObserver;
  private lang: Lang = "en";
  private cfg = { char: 0, diff: 1 };

  private keys = new Set<string>();
  private activePtr: number | null = null;
  private lastPX = 0;
  private lastPY = 0;
  private touchDX = 0;
  private touchDY = 0;
  /** on-screen focus button (touch) mirrors holding Shift */
  private touchFocus = false;

  private bullets = new Pool<Bullet>(() => ({
    x: 0, y: 0, vx: 0, vy: 0, ang: 0, spd: 0, acc: 0, turn: 0, maxSpd: 0, r: 0, size: 0, hue: 0, grazed: false, age: 0,
  }));
  private shots = new Pool<Shot>(() => ({
    x: 0, y: 0, vx: 0, vy: 0, spd: 0, dmg: 1, kind: 0, pierce: 1, last: null, age: 0,
    amp: 0, ph: 0, home: false, splitAt: 0, splitN: 0, spread: 0, chain: 0, sc: 1,
  }));
  private parts = new Pool<Particle>(() => ({
    x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 1, hue: 0, kind: 0, drag: 0, grav: 0,
  }));
  private items = new Pool<Item>(() => ({ x: 0, y: 0, vx: 0, vy: 0, kind: 0, t: 0 }));
  private popups: Popup[] = [];
  private enemies: Enemy[] = [];
  private boss: Boss | null = null;
  private queue: { at: number; fn: () => void }[] = [];
  private banner: Banner | null = null;

  private p = { x: W / 2, y: H - 90, focus: 0, shotT: 0, invuln: 0, dying: 0, alive: true, t: 0, volley: 0, lean: 0 };
  private score = 0;
  private dispScore = 0;
  private hi = 0;
  private lives = 3;
  private bombs = 3;
  private power = 1;
  private graze = 0;
  private combo = 0;
  private comboT = 0;
  private bombT = 0;
  private bombAcc = 0;
  private bombOnce = false;
  private level = 0;
  private stageIdx = 0;
  private palIdx = 0;
  private clock = 0;
  private stageTime = 0;
  private spawnT = 0;
  private waveN = 0;
  private warnT = 0;
  private bossAt = 36;
  private over = false;
  private overT = 0;
  private overAt = 0;
  private shake = 0;
  private flashA = 0;
  private flashC = "255,255,255";
  private slowT = 0;
  private slowScale = 1;

  private clouds: { x: number; y: number; s: number; v: number; a: number; i: number }[] = [];
  private bgBubbles: { x: number; y: number; s: number; v: number; a: number; ph: number }[] = [];

  constructor(canvas: HTMLCanvasElement, container: HTMLElement, cb: GameCallbacks) {
    this.canvas = canvas;
    this.container = container;
    this.cb = cb;
    this.ctx = canvas.getContext("2d", { alpha: false })!;
    this.spr = buildSprites(W, H);
    this.spr.charShots = buildCharShots(CHARS);
    this.itemFr = itemFrames();
    this.charFr = CHARS.map((c, i) => charFrames(i, c.hue));
    // Shot art table: player slots are the character index, then four shapes per bomb.
    this.shotArt = this.spr.charShots.slice();
    this.shotRot = CHARS.map((c) => c.rot);
    for (const b of BOMBS) {
      const hue = BOMB_HUE[b.style];
      for (const shape of ["orb", "drop", "star", "bolt"] as const) {
        this.shotArt.push(makeShotArt(shape, hue));
        this.shotRot.push(shape !== "orb");
      }
    }
    this.prefetchStage(0);
    for (let i = 0; i < 7; i++)
      this.clouds.push({ x: rnd(-100, W), y: rnd(-60, H), s: rnd(0.7, 1.4), v: rnd(10, 26), a: rnd(0.35, 0.7), i: i % 3 });
    for (let i = 0; i < 16; i++)
      this.bgBubbles.push({ x: rnd(0, W), y: rnd(0, H), s: rnd(10, 46), v: rnd(10, 38), a: rnd(0.25, 0.6), ph: rnd(0, TAU) });

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    document.addEventListener("visibilitychange", this.onBlur);
    container.addEventListener("pointerdown", this.onPtrDown);
    container.addEventListener("pointermove", this.onPtrMove);
    container.addEventListener("pointerup", this.onPtrUp);
    container.addEventListener("pointercancel", this.onPtrUp);
    container.addEventListener("contextmenu", this.onCtx);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    this.resize();
    this.reset();
    this.lastT = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    document.removeEventListener("visibilitychange", this.onBlur);
    this.container.removeEventListener("pointerdown", this.onPtrDown);
    this.container.removeEventListener("pointermove", this.onPtrMove);
    this.container.removeEventListener("pointerup", this.onPtrUp);
    this.container.removeEventListener("pointercancel", this.onPtrUp);
    this.container.removeEventListener("contextmenu", this.onCtx);
    this.ro.disconnect();
    this.sfx.music(false);
  }

  // ---------- helpers ----------
  private get D(): DiffDef { return DIFFS[this.cfg.diff]; }
  private get C(): CharDef { return CHARS[this.cfg.char]; }
  private T(key: string, vars?: Record<string, string | number>) { return tr(this.lang, key, vars); }
  private N(n: number) { return Math.max(1, Math.round(n * this.D.dens)); }
  private N2(n: number) { return Math.max(1, Math.round(n * (1 + (this.D.dens - 1) * 0.5))); }
  private bc(k: number) { return BH[this.stageIdx % 8][k % 4]; }
  private sp() { return Math.min(1.9, 1 + this.level * 0.09) * this.D.speed; }
  private iv(x: number) { return x / this.D.rate; }

  setHi(n: number) { this.hi = n; }
  setMuted(m: boolean) { this.sfx.setMuted(m); }
  setLang(l: Lang) { this.lang = l; }
  setTouchFocus(on: boolean) { this.touchFocus = on; }
  ui() { this.sfx.init(); this.sfx.click(); }
  configure(char: number, diff: number) {
    this.cfg.char = clamp(char, 0, CHARS.length - 1);
    this.cfg.diff = clamp(diff, 0, DIFFS.length - 1);
  }

  start() {
    this.sfx.init();
    this.reset();
    this.state = "playing";
    this.cb.onState("playing");
    this.sfx.music(true);
    this.sfx.intensity = 0;
    this.showBanner(this.T("stageN", { n: 1 }), stageT(this.lang, 0), 2.4);
  }
  toMenu() {
    this.reset();
    this.state = "menu";
    this.cb.onState("menu");
    this.sfx.music(true);
  }
  pause() {
    if (this.state !== "playing" || this.over) return;
    this.state = "paused";
    this.keys.clear();
    this.activePtr = null;
    this.touchFocus = false;
    this.sfx.music(false);
    this.sfx.click();
    this.cb.onState("paused");
  }
  resume() {
    if (this.state !== "paused") return;
    this.state = "playing";
    this.lastT = performance.now();
    this.sfx.music(true);
    this.sfx.click();
    this.cb.onState("playing");
  }
  togglePause() {
    if (this.state === "playing") this.pause();
    else if (this.state === "paused") this.resume();
  }
  bomb() {
    if (this.state !== "playing" || this.over) return;
    const p = this.p;
    if (this.bombs <= 0 || this.bombT > 0 || !p.alive) return;
    const b = this.B;
    this.bombs--;
    this.bombT = b.dur;
    this.bombAcc = 0;
    this.bombOnce = false;
    p.dying = 0;
    p.invuln = Math.max(p.invuln, b.dur + 0.8);
    this.sfx.bomb();
    this.shake = Math.max(this.shake, 12);
    this.flash(b.col, 0.85);
    this.ring(p.x, p.y, 120, 0.6);
    this.showPopup(p.x, p.y - 26, charT(this.lang, this.cfg.char, 2), 15, "#ffffff");
  }

  private reset() {
    this.bullets.clear(); this.shots.clear(); this.parts.clear(); this.items.clear();
    this.popups.length = 0; this.enemies.length = 0; this.boss = null; this.queue.length = 0; this.banner = null;
    this.p = { x: W / 2, y: H - 90, focus: 0, shotT: 0, invuln: 1.6, dying: 0, alive: true, t: 0, volley: 0, lean: 0 };
    this.score = 0; this.dispScore = 0; this.lives = this.D.lives; this.bombs = this.D.bombs; this.power = 1; this.graze = 0;
    this.combo = 0; this.comboT = 0; this.bombT = 0; this.bombOnce = false; this.level = 0; this.stageIdx = 0;
    this.palIdx = 0; this.clock = 0; this.stageTime = 0; this.spawnT = 0.5; this.waveN = 0; this.warnT = 0;
    this.bossAt = 36; this.bossFr = null; this.over = false; this.overT = 0; this.shake = 0; this.flashA = 0;
    this.slowT = 0; this.slowScale = 1; this.touchDX = 0; this.touchDY = 0; this.touchFocus = false;
  }

  private prefetchStage(si: number) {
    const st = STAGES[si % STAGES.length];
    for (const k in E3D) enemyFrames(E3D[+k], st.eh[ENEMY[+k].slot]);
  }

  private resize() {
    const cw = this.container.clientWidth;
    const ch = this.container.clientHeight;
    const pad = cw < 600 ? 0 : 14;
    this.scale = Math.max(0.2, Math.min((cw - pad * 2) / W, (ch - pad * 2) / H));
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = W * this.scale;
    const cssH = H * this.scale;
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
    this.canvas.width = Math.round(cssW * this.dpr);
    this.canvas.height = Math.round(cssH * this.dpr);
  }

  // ---------- input ----------
  private onCtx = (e: Event) => e.preventDefault();
  private onBlur = () => {
    this.keys.clear();
    if (this.state === "playing") this.pause();
  };
  private onKeyDown = (e: KeyboardEvent) => {
    const tg = e.target as HTMLElement | null;
    if (tg && (tg.tagName === "INPUT" || tg.tagName === "TEXTAREA")) return;
    const k = e.code;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(k)) e.preventDefault();
    this.sfx.init();
    this.keys.add(k);
    if (e.repeat) return;
    switch (k) {
      case "KeyP":
      case "Escape":
        this.togglePause();
        break;
      case "KeyR":
        if (this.state !== "menu") this.start();
        break;
      case "KeyM":
        window.dispatchEvent(new CustomEvent("game-mute-toggle"));
        break;
      case "KeyX":
      case "KeyK":
        this.bomb();
        break;
      case "Enter":
      case "Space":
        if (this.state === "paused") this.resume();
        else if (this.state === "over") {
          if (this.time - this.overAt > 0.45) this.start();
        } else if (this.state === "playing" && k === "Space") this.bomb();
        break;
    }
  };
  private onKeyUp = (e: KeyboardEvent) => { this.keys.delete(e.code); };
  private isUi(e: Event) {
    const t = e.target as HTMLElement | null;
    return !!(t && t.closest && t.closest("[data-ui]"));
  }
  private onPtrDown = (e: PointerEvent) => {
    if (this.isUi(e)) return;
    this.sfx.init();
    if (this.state !== "playing") return;
    if (this.activePtr === null) {
      this.activePtr = e.pointerId;
      this.lastPX = e.clientX;
      this.lastPY = e.clientY;
      try { this.container.setPointerCapture(e.pointerId); } catch { /* noop */ }
    } else if (e.pointerId !== this.activePtr) {
      this.bomb();
    }
  };
  private onPtrMove = (e: PointerEvent) => {
    if (e.pointerId !== this.activePtr) return;
    const gain = e.pointerType === "mouse" ? 1 : 1.35;
    this.touchDX += ((e.clientX - this.lastPX) / this.scale) * gain;
    this.touchDY += ((e.clientY - this.lastPY) / this.scale) * gain;
    this.lastPX = e.clientX;
    this.lastPY = e.clientY;
  };
  private onPtrUp = (e: PointerEvent) => { if (e.pointerId === this.activePtr) this.activePtr = null; };

  // ---------- loop ----------
  private loop = (now: number) => {
    this.raf = requestAnimationFrame(this.loop);
    let dt = (now - this.lastT) / 1000;
    this.lastT = now;
    if (dt <= 0) return;
    if (dt > 0.05) dt = 0.05;
    this.time += dt;
    if (this.state === "playing") this.update(dt);
    else if (this.state === "menu" || this.state === "over") {
      this.updateBg(dt);
      this.updateParts(dt);
      if (this.state === "menu" && Math.random() < dt * 6) this.spawnAmbient();
    }
    this.render();
  };

  private spawnAmbient() {
    if (this.parts.n >= MAX_PARTS) return;
    const q = this.parts.spawn();
    q.x = rnd(0, W); q.y = H + 10; q.vx = rnd(-10, 10); q.vy = rnd(-70, -35);
    q.life = q.max = rnd(4, 8); q.size = rnd(8, 22); q.hue = 0; q.kind = 1; q.drag = 0; q.grav = 0;
  }

  private update(dt: number) {
    let sdt = dt;
    if (this.slowT > 0) {
      this.slowT -= dt;
      sdt = dt * this.slowScale;
    }
    this.clock += sdt;
    this.updateBg(sdt);
    this.p.t += sdt;

    if (!this.over) this.updatePlayer(sdt, dt);
    this.runQueue();
    if (!this.over) this.director(sdt);
    this.updateEnemies(sdt);
    this.updateBoss(sdt);
    this.updateBullets(sdt);
    this.updateShots(sdt);
    this.updateItems(sdt);
    this.updateParts(sdt);
    if (this.bombT > 0) this.updateBomb(sdt);

    if (this.comboT > 0) {
      this.comboT -= sdt;
      if (this.comboT <= 0) this.combo = 0;
    }
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const q = this.popups[i];
      q.life -= dt;
      q.y -= 26 * dt;
      if (q.life <= 0) this.popups.splice(i, 1);
    }
    if (this.banner) {
      this.banner.t += dt;
      if (this.banner.t > this.banner.max) this.banner = null;
    }
    this.shake *= Math.exp(-dt * 9);
    if (this.shake < 0.1) this.shake = 0;
    this.flashA *= Math.exp(-dt * 4.5);
    this.dispScore += (this.score - this.dispScore) * Math.min(1, dt * 9);
    if (Math.abs(this.score - this.dispScore) < 1) this.dispScore = this.score;
    if (this.score > this.hi) this.hi = this.score;

    if (this.over) {
      this.overT += dt;
      if (this.overT > 1.4) this.finish();
    }
  }

  private finish() {
    this.state = "over";
    this.overAt = this.time;
    this.sfx.music(false);
    this.sfx.over();
    this.cb.onState("over");
    this.cb.onOver({
      score: Math.round(this.score), stage: this.level + 1, graze: this.graze,
      diff: this.cfg.diff, char: this.cfg.char,
    });
  }

  private runQueue() {
    for (let i = this.queue.length - 1; i >= 0; i--) {
      if (this.clock >= this.queue[i].at) {
        const f = this.queue[i].fn;
        this.queue.splice(i, 1);
        f();
      }
    }
  }
  private later(sec: number, fn: () => void) { this.queue.push({ at: this.clock + sec, fn }); }

  private updateBg(dt: number) {
    const boost = this.boss ? 1.8 : 1;
    for (const c of this.clouds) {
      c.y += c.v * dt * boost;
      if (c.y > H + 20) { c.y = -120; c.x = rnd(-120, W - 40); c.i = (Math.random() * 3) | 0; }
    }
    for (const b of this.bgBubbles) {
      b.y -= b.v * dt * boost;
      if (b.y < -60) { b.y = H + 40; b.x = rnd(0, W); }
    }
  }

  private mult() { return 1 + Math.min(this.combo, 70) * 0.05; }
  private addScore(n: number) { this.score += n * this.D.score; }
  private bumpCombo(n: number) {
    const before = Math.floor(this.mult() * 2);
    this.combo += n;
    this.comboT = 2.6;
    const after = Math.floor(this.mult() * 2);
    if (after > before && after % 2 === 0) this.showPopup(this.p.x, this.p.y - 30, `×${(after / 2).toFixed(1)}`, 15, "#fff6a8");
  }

  // ---------- player ----------
  private updatePlayer(sdt: number, dt: number) {
    const p = this.p;
    const k = this.keys;
    let dx = (k.has("ArrowRight") || k.has("KeyD") ? 1 : 0) - (k.has("ArrowLeft") || k.has("KeyA") ? 1 : 0);
    let dy = (k.has("ArrowDown") || k.has("KeyS") ? 1 : 0) - (k.has("ArrowUp") || k.has("KeyW") ? 1 : 0);
    const focusKey = k.has("ShiftLeft") || k.has("ShiftRight") || this.touchFocus;
    p.focus += ((focusKey ? 1 : 0) - p.focus) * Math.min(1, dt * 20);
    if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
    const speed = this.C.speed + (this.C.focus - this.C.speed) * p.focus;
    const mdt = p.dying > 0 ? dt * 0.4 : dt;
    const ox = p.x;
    p.x += dx * speed * mdt + this.touchDX;
    p.y += dy * speed * mdt + this.touchDY;
    this.touchDX = 0;
    this.touchDY = 0;
    p.x = clamp(p.x, 10, W - 10);
    p.y = clamp(p.y, HUD_H + 12, H - 12);
    p.lean += (clamp((p.x - ox) / Math.max(dt, 0.001) / 320, -1, 1) - p.lean) * Math.min(1, dt * 12);

    if (p.invuln > 0) p.invuln -= sdt;
    if (p.dying > 0) {
      p.dying -= dt;
      if (p.dying <= 0) this.loseLife();
    }
    p.shotT -= sdt;
    if (p.shotT <= 0 && p.alive) {
      p.shotT += this.C.rate;
      if (p.shotT < 0) p.shotT = 0;
      this.fireVolley();
    }
  }

  private addShot(x: number, y: number, ang: number, spd: number, dmg: number, kind: number, o?: ShotOpt) {
    if (this.shots.n >= MAX_SHOTS) return;
    const s = this.shots.spawn();
    s.x = x; s.y = y; s.spd = spd;
    s.vx = Math.cos(ang) * spd; s.vy = Math.sin(ang) * spd;
    s.dmg = dmg; s.kind = kind; s.age = 0; s.last = null;
    s.pierce = o?.p ?? 1;
    s.home = o?.home ?? false;
    s.amp = o?.amp ?? 0;
    s.ph = o?.ph ?? 0;
    s.splitAt = o?.sp ?? 0;
    s.splitN = o?.sn ?? 0;
    s.spread = o?.ss ?? 0.4;
    s.chain = o?.ch ?? 0;
    s.sc = o?.sc ?? 1;
  }

  private nearestTarget(x: number, y: number, skip?: object): { x: number; y: number } | null {
    if (this.boss && this.boss.y > 0 && this.boss !== skip) return this.boss;
    let target: { x: number; y: number } | null = null;
    let best = 1e9;
    for (const e of this.enemies) {
      if (e.y < 10 || e === skip) continue;
      const d = (e.x - x) ** 2 + (e.y - y) ** 2;
      if (d < best) { best = d; target = e; }
    }
    return target;
  }

  /**
   * Each character has four distinct shot modes, one per power level, plus a
   * focused variant. `A` is the shot-art slot, `u` a secondary slot.
   */
  private fireVolley() {
    const p = this.p;
    const ci = this.cfg.char;
    const A = ci; // player's own art
    const lvl = Math.min(4, Math.floor(this.power));
    const f = p.focus;
    const foc = f > 0.5;
    p.volley++;
    switch (ci) {
      // ----- Mizu: bubble stream + radial pulse -----
      case 0: {
        const n = lvl + 1;
        const off = 9 - 4 * f;
        const sp = 0.075 - 0.063 * f;
        for (let i = 0; i < n; i++) {
          const t = i - (n - 1) / 2;
          this.addShot(p.x + t * off, p.y - 12, UP + t * sp, 820, 1.1, A);
        }
        if (lvl >= 3 && p.volley % 2 === 0) {
          const tg = this.nearestTarget(p.x, p.y);
          for (const s of [-1, 1]) {
            const ox = p.x + s * (30 - 15 * f), oy = p.y + 6;
            this.addShot(ox, oy, tg ? Math.atan2(tg.y - oy, tg.x - ox) : UP, 640, 0.7, A);
          }
        }
        if (lvl >= 4 && p.volley % 4 === 0) {
          const n2 = this.N2(6);
          for (let i = 0; i < n2; i++)
            this.addShot(p.x, p.y, (i / n2) * TAU + p.t, 260, 0.9, A, { sp: 0.3, sn: 2, ss: 0.5 });
          this.ring(p.x, p.y, 46, 0.35);
        }
        break;
      }
      // ----- Kiwi: fan / piercing needles -----
      case 1: {
        if (foc) {
          const n = 1 + Math.floor((lvl + 1) / 2);
          const pi = 1 + lvl;
          for (let i = 0; i < n; i++) {
            const t = i - (n - 1) / 2;
            this.addShot(p.x + t * 7, p.y - 14, UP, 1050, 1.5, A, { p: pi, sc: 1.1 });
          }
        } else {
          const n = lvl + 2;
          for (let i = 0; i < n; i++) {
            const t = i - (n - 1) / 2;
            this.addShot(p.x + t * 6, p.y - 12, UP + t * 0.13, 780, 0.8, A);
          }
        }
        if (lvl >= 3 && p.volley % 2 === 0)
          for (const s of [-1, 1]) this.addShot(p.x + s * (28 - 12 * f), p.y + 4, UP, 760, 0.9, A, { p: 2 });
        break;
      }
      // ----- Momo: homing bubbles -----
      case 2: {
        const n = lvl;
        for (let i = 0; i < n; i++) {
          const t = i - (n - 1) / 2;
          this.addShot(p.x + t * 8, p.y - 12, UP + t * (0.05 + 0.07 * (1 - f)), 800, 0.85, A);
        }
        if (p.volley % 3 === 0) {
          const m = 2 + lvl;
          for (let j = 0; j < m; j++) {
            const s = j % 2 ? 1 : -1;
            this.addShot(
              p.x + s * (12 + (j >> 1) * 7), p.y, UP + s * 0.7, 400,
              lvl >= 4 ? 1.2 : 0.95, A, { home: true, p: lvl >= 4 ? 2 : 1 },
            );
          }
        }
        break;
      }
      // ----- Sora: wavy twin streams -----
      case 3: {
        const n = lvl + 2;
        const amp = 150 - 110 * f;
        for (let i = 0; i < n; i++) {
          const ph = (i / n) * TAU;
          this.addShot(p.x - (amp / 16) * Math.sin(ph), p.y - 12, UP, 790, 0.8, A, { amp, ph });
        }
        if (lvl >= 4 && p.volley % 2 === 0) this.addShot(p.x, p.y - 16, UP, 980, 1.6, A, { p: 2, sc: 1.25 });
        break;
      }
      // ----- Kori: splitting ice shards -----
      case 4: {
        const n = lvl + 1;
        const sn = lvl >= 4 ? 3 : 2;
        const sp = 0.2 - 0.08 * f;
        for (let i = 0; i < n; i++) {
          const t = i - (n - 1) / 2;
          this.addShot(p.x + t * 8, p.y - 12, UP + t * (0.06 - 0.05 * f), 700, 0.75, A, { sp, sn, ss: 0.42 });
        }
        if (lvl >= 3 && p.volley % 3 === 0)
          for (const s of [-1, 1])
            this.addShot(p.x + s * 22, p.y - 4, UP + s * 0.5, 520, 0.7, A, { sp: 0.25, sn: 2, ss: 0.6 });
        break;
      }
      // ----- Hana: sweeping petal arcs -----
      case 5: {
        const arc = 0.32 + 0.19 * lvl - 0.3 * f;
        const sw = Math.sin(p.t * (5 + lvl)) * arc;
        const n = lvl + 1;
        for (let i = 0; i < n; i++) {
          const t = i - (n - 1) / 2;
          this.addShot(p.x + t * 6, p.y - 12, UP + sw + t * 0.07, 720, 0.85, A);
        }
        if (lvl >= 3) {
          const sw2 = Math.sin(p.t * (5 + lvl) + Math.PI) * arc;
          for (const s of [-1, 1]) this.addShot(p.x + s * 20, p.y - 4, UP + sw2, 660, 0.8, A);
        }
        if (lvl >= 4 && p.volley % 4 === 0) this.addShot(p.x, p.y - 14, UP, 900, 2.2, A, { p: 3, sc: 1.3 });
        break;
      }
      // ----- Raiden: piercing chain bolts -----
      case 6: {
        const n = lvl >= 3 ? 3 : 1 + Math.floor(lvl / 2);
        const pi = [2, 3, 4, 6][lvl - 1];
        const ch = lvl >= 3 ? lvl - 2 : 0;
        for (let i = 0; i < n; i++) {
          const t = i - (n - 1) / 2;
          this.addShot(p.x + t * 10, p.y - 14, UP + t * 0.04, 1150, 2.1, A, { p: pi, ch, sc: 1.2 });
        }
        if (lvl >= 4 && p.volley % 2 === 0)
          for (const s of [-1, 1])
            this.addShot(p.x + s * 24, p.y - 2, UP + s * 0.25, 900, 1.1, A, { amp: 90, ph: s, p: 2 });
        break;
      }
      // ----- Yami: forward crescents + rear fire -----
      case 7: {
        const n = lvl + 1;
        const sw = Math.sin(p.t * 4) * (0.35 - 0.25 * f);
        for (let i = 0; i < n; i++) {
          const t = i - (n - 1) / 2;
          this.addShot(p.x + t * 9, p.y - 12, UP + t * 0.09 + sw, 760, 0.9, A);
        }
        if (p.volley % 2 === 0) {
          const m = Math.max(1, lvl - 1);
          for (let i = 0; i < m; i++) {
            const t = i - (m - 1) / 2;
            this.addShot(p.x + t * 10, p.y + 10, Math.PI / 2 + t * 0.22, 620, 0.8, A);
          }
        }
        if (lvl >= 4 && p.volley % 5 === 0) {
          const n2 = 8;
          for (let i = 0; i < n2; i++)
            this.addShot(p.x, p.y, (i / n2) * TAU + p.t * 2, 320, 0.8, A, { sp: 0.22, sn: 1, ss: 0 });
          this.ring(p.x, p.y, 40, 0.3);
        }
        break;
      }
      // ----- Luna: orbiting crescents / focused lunar lances -----
      case 8: {
        if (foc) {
          // Narrow twin lances with a rotating core.
          const pi = 2 + lvl;
          for (const s of [-1, 1])
            this.addShot(p.x + s * (9 + lvl * 2), p.y - 15, UP + s * 0.04, 1000, 1.7, A, { p: pi, sc: 1.15 });
          if (lvl >= 3) this.addShot(p.x, p.y - 18, UP, 1120, 2.4, A, { p: pi + 2, sc: 1.3 });
        } else {
          // Crescent pair that swings out and back in.
          const n = 2 + lvl;
          const arc = 0.5 + 0.16 * lvl;
          for (let i = 0; i < n; i++) {
            const s = i % 2 ? 1 : -1;
            const k = (i >> 1) * 0.16;
            this.addShot(
              p.x + s * (16 + k * 40), p.y - 12 + k * 8,
              UP + s * (arc * (0.6 + k)), 720, 1.0, A, { amp: 120 - 70 * k, ph: s },
            );
          }
          if (lvl >= 3 && p.volley % 2 === 0) {
            const tg = this.nearestTarget(p.x, p.y);
            for (const s of [-1, 1]) {
              const ox = p.x + s * 26, oy = p.y + 4;
              this.addShot(ox, oy, tg ? Math.atan2(tg.y - oy, tg.x - ox) : UP, 700, 0.8, A, { p: 2 });
            }
          }
        }
        if (lvl >= 4 && p.volley % 4 === 0) {
          const n2 = this.N2(8);
          for (let i = 0; i < n2; i++)
            this.addShot(p.x, p.y, (i / n2) * TAU - p.t, 300, 1.0, A, { sp: 0.24, sn: 2, ss: 0.55 });
          this.ring(p.x, p.y, 52, 0.35);
        }
        break;
      }
      // ----- Nami: crossing waves / tight ricochet stream -----
      case 9: {
        if (foc) {
          const n = lvl + 1;
          for (let i = 0; i < n; i++) {
            const t = i - (n - 1) / 2;
            this.addShot(p.x + t * 6, p.y - 14, UP, 960, 1.3, A, { p: 1 + lvl, sc: 1.05 });
          }
        } else {
          // Two counter-rotating sine walls.
          const n = 2 + lvl;
          const amp = 130 - 80 * f;
          for (let i = 0; i < n; i++) {
            const side = i % 2 ? 1 : -1;
            this.addShot(p.x + side * (10 + (i >> 1) * 9), p.y - 12, UP, 800, 0.9, A, {
              amp: side * amp, ph: side * 1.2,
            });
          }
        }
        if (lvl >= 3 && p.volley % 2 === 0)
          for (const s of [-1, 1]) this.addShot(p.x + s * 24, p.y + 6, UP + s * 0.6, 860, 0.9, A, { p: 2 });
        if (lvl >= 4 && p.volley % 3 === 0) {
          const n2 = this.N2(5);
          for (let i = 0; i < n2; i++)
            this.addShot(p.x, p.y, (i / n2) * TAU + p.t * 1.6, 280, 0.9, A, { sp: 0.26, sn: 2, ss: 0.6 });
        }
        break;
      }
      // ----- Sol: spark fan / searing double beam -----
      case 10: {
        if (foc) {
          for (const s of [-1, 1])
            this.addShot(p.x + s * (8 + lvl), p.y - 16, UP, 1150, 2.0, A, { p: 3 + lvl, sc: 1.2 });
          if (lvl >= 3) this.addShot(p.x, p.y - 18, UP, 1250, 2.6, A, { p: 6, sc: 1.35 });
        } else {
          const n = lvl + 3;
          const sp = 0.055 + 0.05 * lvl - 0.1 * f;
          for (let i = 0; i < n; i++) {
            const t = i - (n - 1) / 2;
            this.addShot(p.x + t * 7, p.y - 12, UP + t * sp, 880, 0.9, A);
          }
        }
        if (lvl >= 4 && p.volley % 2 === 0) {
          const n2 = this.N2(10);
          for (let i = 0; i < n2; i++)
            this.addShot(p.x, p.y, (i / n2) * TAU + p.t * 2.4, 340, 0.9, A, { sp: 0.2, sn: 1, ss: 0.3 });
          this.ring(p.x, p.y, 58, 0.35);
        }
        break;
      }
      // ----- Yuki: drifting snow / heavy piercing icicles -----
      case 11: {
        if (foc) {
          const n = lvl;
          const pi = 2 + lvl;
          for (let i = 0; i < n; i++) {
            const t = i - (n - 1) / 2;
            this.addShot(p.x + t * 11, p.y - 14, UP, 920, 1.9, A, { p: pi, sc: 1.3 });
          }
          if (lvl >= 4) this.addShot(p.x, p.y - 18, UP, 1000, 2.6, A, { p: pi + 2, sc: 1.5 });
        } else {
          const n = lvl + 2;
          for (let i = 0; i < n; i++) {
            const t = i - (n - 1) / 2;
            this.addShot(p.x + t * 9, p.y - 12, UP + t * 0.16, 620, 0.85, A, {
              amp: 90 - 50 * f, ph: t * 1.4,
            });
          }
        }
        if (lvl >= 3 && p.volley % 3 === 0)
          for (const s of [-1, 1]) this.addShot(p.x + s * 20, p.y - 4, UP + s * 0.45, 560, 0.75, A, { p: 2 });
        if (lvl >= 4 && p.volley % 4 === 0) {
          const n2 = this.N2(6);
          for (let i = 0; i < n2; i++)
            this.addShot(p.x, p.y, (i / n2) * TAU, 240, 1.0, A, { sp: 0.28, sn: 2, ss: 0.5 });
        }
        break;
      }
      // ----- Akari: ember arcs / piercing flame darts -----
      case 12: {
        if (foc) {
          const n = 2 + (lvl >> 1);
          for (let i = 0; i < n; i++) {
            const t = i - (n - 1) / 2;
            this.addShot(p.x + t * 9, p.y - 14, UP + t * 0.05, 1080, 1.9, A, { p: 2 + lvl, sc: 1.1 });
          }
          if (lvl >= 4) for (const s of [-1, 1]) this.addShot(p.x + s * 16, p.y - 12, UP + s * 0.3, 1180, 1.5, A, { p: 3 });
        } else {
          // Twin embers that curl outward like a flame.
          const n = 2 + lvl;
          const amp = 170 - 120 * f;
          for (let i = 0; i < n; i++) {
            const s = i % 2 ? 1 : -1;
            this.addShot(p.x + s * 12, p.y - 12, UP + s * 0.42, 820, 0.95, A, { amp: s * amp, ph: s * 0.6 });
          }
          if (lvl >= 3) {
            const tg = this.nearestTarget(p.x, p.y);
            for (const s of [-1, 1]) {
              const ox = p.x + s * 22, oy = p.y + 6;
              this.addShot(ox, oy, tg ? Math.atan2(tg.y - oy, tg.x - ox) : UP + s * 0.3, 900, 0.9, A, { p: 2 });
            }
          }
        }
        if (lvl >= 4 && p.volley % 3 === 0) {
          const n2 = this.N2(9);
          for (let i = 0; i < n2; i++)
            this.addShot(p.x, p.y, (i / n2) * TAU - p.t * 2, 300, 0.9, A, { sp: 0.2, sn: 1, ss: 0.4 });
        }
        break;
      }
      // ----- Kaze: spiral gusts / piercing wind needles -----
      case 13: {
        if (foc) {
          const n = 2 + lvl;
          for (let i = 0; i < n; i++) {
            const t = i - (n - 1) / 2;
            this.addShot(p.x + t * 6, p.y - 14, UP + t * 0.03, 1020, 1.5, A, { p: 2 + lvl, sc: 1.05 });
          }
        } else {
          // Shots precess around the aim line.
          const n = lvl + 2;
          for (let i = 0; i < n; i++) {
            const t = i - (n - 1) / 2;
            this.addShot(p.x + t * 8, p.y - 12, UP + t * 0.1, 860, 0.9, A, {
              amp: 60 + 90 * (1 - f), ph: t * 0.9 + p.t * 0.6,
            });
          }
        }
        if (lvl >= 3 && p.volley % 2 === 0)
          for (const s of [-1, 1]) this.addShot(p.x + s * (26 - 10 * f), p.y + 4, UP + s * 0.5, 900, 0.9, A, { p: 3 });
        if (lvl >= 4 && p.volley % 4 === 0) {
          const n2 = this.N2(4);
          for (let i = 0; i < n2; i++)
            this.addShot(p.x, p.y, (i / n2) * TAU + p.t * 3, 400, 1.0, A, { sp: 0.2, sn: 1, ss: 0.5 });
        }
        break;
      }
      // ----- Kumo: mist puffs / dense cloud volley -----
      case 14: {
        if (foc) {
          const n = lvl + 2;
          for (let i = 0; i < n; i++) {
            const t = i - (n - 1) / 2;
            this.addShot(p.x + t * 7, p.y - 12, UP + t * 0.08, 700, 1.4, A, { p: 1 + lvl, sc: 1.15 });
          }
        } else {
          const n = lvl + 2;
          for (let i = 0; i < n; i++) {
            const t = i - (n - 1) / 2;
            this.addShot(p.x + t * 10, p.y - 12, UP + t * 0.2, 520, 1.1, A, { amp: 70, ph: t * 1.6 });
          }
          if (lvl >= 3) {
            const m = 2 + (lvl >> 1);
            for (let j = 0; j < m; j++) {
              const s = j % 2 ? 1 : -1;
              this.addShot(p.x + s * (14 + (j >> 1) * 8), p.y, UP + s * 0.8, 460, 1.0, A, { p: 2 });
            }
          }
        }
        if (lvl >= 4 && p.volley % 3 === 0) {
          const n2 = this.N2(7);
          for (let i = 0; i < n2; i++)
            this.addShot(p.x, p.y, (i / n2) * TAU + p.t * 1.2, 260, 1.0, A, { sp: 0.3, sn: 2, ss: 0.5, sc: 1.2 });
          this.ring(p.x, p.y, 44, 0.3);
        }
        break;
      }
      // ----- Hoshi: twin star lances / meteor burst -----
      default: {
        if (foc) {
          for (const s of [-1, 1])
            this.addShot(p.x + s * 7, p.y - 16, UP, 1180, 2.1, A, { p: 3 + lvl, sc: 1.25 });
        } else {
          const n = lvl + 2;
          const sp = 0.07 + 0.05 * lvl - 0.12 * f;
          for (let i = 0; i < n; i++) {
            const t = i - (n - 1) / 2;
            this.addShot(p.x + t * 8, p.y - 12, UP + t * sp, 900, 1.0, A);
          }
        }
        if (lvl >= 3 && p.volley % 2 === 0)
          for (const s of [-1, 1]) this.addShot(p.x + s * 24, p.y - 2, UP + s * 0.2, 1000, 1.2, A, { amp: 70, ph: s, p: 2 });
        if (lvl >= 4 && p.volley % 4 === 0) {
          const n2 = this.N2(12);
          for (let i = 0; i < n2; i++)
            this.addShot(p.x, p.y, (i / n2) * TAU - p.t * 1.6, 320, 0.9, A, { sp: 0.22, sn: 2, ss: 0.45 });
          this.ring(p.x, p.y, 62, 0.4);
        }
        break;
      }
    }
    this.sfx.shoot();
  }

  private hitPlayer() {
    const p = this.p;
    if (p.invuln > 0 || p.dying > 0 || this.over || !p.alive) return;
    p.dying = 0.15;
    this.slowT = 0.3;
    this.slowScale = 0.15;
    this.shake = Math.max(this.shake, 8);
    this.sparks(p.x, p.y, 10, WHITE, 160, 10, 0.4);
  }

  private loseLife() {
    const p = this.p;
    this.sfx.death();
    this.shake = 18;
    this.flash("255,190,230", 0.75);
    this.burst(p.x, p.y, 36, 0, 260, 16, 0.9);
    this.burst(p.x, p.y, 20, WHITE, 180, 12, 0.7);
    this.bubbleBurst(p.x, p.y, 14, 140);
    this.ring(p.x, p.y, 110, 0.7);
    this.ring(p.x, p.y, 70, 0.5);
    this.combo = 0;
    this.clearBullets(false);
    if (this.lives <= 0) {
      this.over = true;
      this.overT = 0;
      p.alive = false;
      this.slowT = 1.2;
      this.slowScale = 0.35;
      this.sfx.intensity = 0;
      return;
    }
    this.lives--;
    this.bombs = Math.max(this.bombs, this.D.bombs);
    const oldLvl = Math.floor(this.power);
    this.power = Math.max(1, this.power - 1);
    for (let i = 0; i < oldLvl - Math.floor(this.power) + 1 && i < 3; i++) this.dropItem(0, p.x, p.y - 10, 120);
    p.x = W / 2;
    p.y = H - 70;
    p.invuln = 3;
    p.dying = 0;
    this.bombT = 0;
  }

  private get B(): BombDef { return BOMBS[this.C.bomb]; }

  private bombRadius(el: number) {
    const b = this.B;
    if (b.full) return 900;
    const x = clamp(el / b.rTime, 0, 1);
    return 40 + (b.rMax - 40) * (1 - Math.pow(1 - x, 2));
  }

  private updateBomb(sdt: number) {
    const p = this.p;
    const bi = this.C.bomb;
    const b = this.B;
    const st = b.style;
    this.bombT -= sdt;
    const el = b.dur - this.bombT;
    const R = this.bombRadius(el);
    const R2 = R * R;
    // Shot art slot for this bomb: orb / drop / star / bolt.
    const orb = bombArt(bi, BS.orb);
    const drop = bombArt(bi, BS.drop);
    const star = bombArt(bi, BS.star);
    const bolt = bombArt(bi, BS.bolt);

    if (!this.bombOnce) {
      this.bombOnce = true;
      switch (st) {
        case "hearts":
          for (let i = 0; i < 14; i++) this.addShot(p.x, p.y, (i / 14) * TAU, 380, 4, orb, { home: true, p: 3 });
          break;
        case "shards":
          for (let i = 0; i < 24; i++) this.addShot(p.x, p.y, (i / 24) * TAU, 620, 6, drop, { p: 99, sp: 0.18, sn: 2, ss: 0.5 });
          this.slowT = 0.5;
          this.slowScale = 0.4;
          break;
        case "orbit":
          for (let i = 0; i < 18; i++) this.addShot(p.x, p.y, (i / 18) * TAU, 420, 5, orb, { p: 3, amp: 150, ph: i });
          break;
        case "flare":
          for (const s of [-1, 1]) this.addShot(p.x + s * 20, p.y - 10, UP + s * 0.06, 1150, 6, star, { p: 99, sc: 1.3 });
          break;
        case "gale":
          for (let i = 0; i < 8; i++) {
            const a = UP + (i - 3.5) * 0.16;
            this.addShot(p.x, p.y - 10, a, 1000, 5, bolt, { p: 6, amp: 110, ph: i });
          }
          break;
        case "nova":
          for (let i = 0; i < 16; i++) this.addShot(p.x, p.y, (i / 16) * TAU, 500, 6, star, { p: 99, sp: 0.16, sn: 2, ss: 0.5 });
          break;
        case "mist":
          for (let i = 0; i < 20; i++) this.addShot(p.x, p.y, (i / 20) * TAU, 300, 4, orb, { p: 2 });
          break;
      }
    }

    let converted = 0;
    const cvChance = b.convert ?? 0;
    for (let i = this.bullets.n - 1; i >= 0; i--) {
      const bl = this.bullets.items[i];
      if ((bl.x - p.x) ** 2 + (bl.y - p.y) ** 2 < R2) {
        if (Math.random() < 0.6) this.sparks(bl.x, bl.y, 1, (bl.hue + 4) % 7, 70, 7, 0.35);
        if (cvChance > 0 && converted < 6 && Math.random() < cvChance) {
          this.dropItem(1, bl.x, bl.y, 10);
          converted++;
        }
        this.bullets.kill(i);
      }
    }
    for (const e of this.enemies) {
      if (b.full || (e.x - p.x) ** 2 + (e.y - p.y) ** 2 < R2) { e.hp -= b.e * sdt; e.flash = 0.05; }
    }
    if (this.boss && this.boss.inv <= 0 && (b.full || (this.boss.x - p.x) ** 2 + (this.boss.y - p.y) ** 2 < R2)) {
      this.boss.hp -= b.b * sdt;
      this.boss.flash = 0.05;
    }
    for (let i = 0; i < this.items.n; i++) this.items.items[i].t = 99;

    this.bombAcc -= sdt;
    while (this.bombAcc <= 0) {
      switch (st) {
        case "rain":
        case "blizzard": {
          this.bombAcc += st === "rain" ? 0.045 : 0.06;
          const n = st === "rain" ? 1 : 2;
          for (let i = 0; i < n; i++)
            this.addShot(rnd(20, W - 20), H + 10, UP, st === "rain" ? 900 : 760, 5, st === "rain" ? star : drop, { p: 9 });
          break;
        }
        case "bloom":
        case "waves": {
          this.bombAcc += 0.06;
          const arms = st === "bloom" ? 6 : 4;
          for (let i = 0; i < arms; i++) {
            const a = el * (st === "bloom" ? 9 : 5) + (i / arms) * TAU;
            this.addShot(p.x + Math.cos(a) * 60, p.y + Math.sin(a) * 60, a, 520, 4, st === "bloom" ? orb : drop, { p: 5 });
          }
          break;
        }
        case "storm":
        case "inferno": {
          this.bombAcc += 0.14;
          const x = rnd(20, W - 20);
          if (this.parts.n >= MAX_PARTS) break;
          const q = this.parts.spawn();
          q.x = x; q.y = H / 2; q.vx = 0; q.vy = 0; q.life = q.max = 0.28;
          q.size = H; q.hue = st === "storm" ? 2 : 0; q.kind = 3; q.drag = 0; q.grav = 0;
          if (st === "inferno") {
            for (let i = 0; i < 2; i++)
              this.addShot(x + rnd(-14, 14), H + 10, UP, 820, 4, star, { p: 5 });
          }
          this.shake = Math.max(this.shake, 7);
          this.sfx.pop(false);
          break;
        }
        case "spiral": {
          this.bombAcc += 0.07;
          for (let i = 0; i < 5; i++) {
            const a = el * 11 + (i / 5) * TAU;
            this.addShot(p.x + Math.cos(a) * 70, p.y + Math.sin(a) * 70, a, 560, 4, drop, { p: 4 });
          }
          break;
        }
        case "splash": {
          this.bombAcc += 0.1;
          const n = this.N2(4);
          for (let i = 0; i < n; i++)
            this.addShot(p.x, p.y, (i / n) * TAU - el * 1.4, 460, 3, orb, { p: 3 });
          break;
        }
        default:
          this.bombAcc = 1;
          break;
      }
      if (this.bombAcc <= 0) this.bombAcc = 1;
    }
    for (let i = 0; i < 3; i++) {
      const a = Math.random() * TAU;
      this.bubbleAt(p.x + Math.cos(a) * R, p.y + Math.sin(a) * R, Math.cos(a) * 40, Math.sin(a) * 40 - 20, rnd(6, 16));
    }
    if (Math.random() < 0.5) this.shake = Math.max(this.shake, 4);
  }

  // ---------- director ----------
  private director(dt: number) {
    if (this.warnT > 0) {
      this.warnT -= dt;
      if (this.warnT <= 0) this.spawnBoss();
      return;
    }
    if (this.boss) return;
    this.stageTime += dt;
    if (this.stageTime >= this.bossAt) {
      this.warnT = 3;
      const st = STAGES[this.stageIdx];
      this.showBanner(this.T("warning"), bossT(this.lang, st.boss), 3, false);
      this.sfx.warn();
      this.bossFr = bossFrames(st.boss, st.bossHue);
      return;
    }
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = Math.max(1.7, 4.3 - this.level * 0.3) * this.D.spawn;
      this.spawnWave();
    }
  }

  private spawnWave() {
    const st = STAGES[this.stageIdx];
    const pool = this.level < STAGES.length ? st.waves : ALL_WAVES;
    let id: number;
    if (this.waveN < 2) id = pool[this.waveN % pool.length];
    else id = pool[(Math.random() * pool.length) | 0];
    const oneBig = (k: number) => this.enemies.some((e) => e.kind === k);
    if (id === 2 && (oneBig(2) || this.stageTime < 12)) id = 0;
    if (id === 11 && oneBig(11)) id = 9;
    if (id === 6 && oneBig(6)) id = 4;
    this.waveN++;
    this.formation(id);
  }

  private formation(id: number) {
    const lvl = this.level;
    const n2 = (n: number) => Math.max(2, Math.round(n * (0.8 + 0.2 * Math.min(lvl, 4))));
    switch (id) {
      case 0: {
        const side = Math.random() < 0.5 ? 1 : -1;
        const n = 6 + Math.min(lvl, 4);
        const y0 = rnd(70, 150);
        for (let i = 0; i < n; i++) this.later(i * 0.27, () => this.addEnemy(1, side > 0 ? -20 : W + 20, y0, side, 0));
        break;
      }
      case 1: {
        const n = 3 + Math.min(lvl, 2);
        const x0 = rnd(90, 150);
        const gap = (W - 2 * x0) / (n - 1);
        const ord = Math.random() < 0.5;
        for (let i = 0; i < n; i++) {
          const x = x0 + gap * (ord ? i : n - 1 - i);
          this.later(i * 0.35, () => this.addEnemy(0, x, -24, 1, rnd(90, 190)));
        }
        break;
      }
      case 2: {
        this.addEnemy(2, rnd(150, 330), -40, 1, 130);
        this.later(1.2, () => this.addEnemy(0, 70, -24, 1, 100));
        this.later(1.5, () => this.addEnemy(0, W - 70, -24, 1, 100));
        break;
      }
      case 3: {
        const n = n2(5);
        const flip = Math.random() < 0.5;
        for (let i = 0; i < n; i++) {
          const x = 50 + ((flip ? n - 1 - i : i) * (W - 100)) / (n - 1);
          this.later(i * 0.32, () => this.addEnemy(3, x, -26, 1, rnd(90, 230)));
        }
        break;
      }
      case 4: {
        this.addEnemy(4, W * 0.3, -30, 1, 120);
        this.later(1.0, () => this.addEnemy(4, W * 0.7, -30, 1, 170));
        if (lvl >= 2) this.later(2.0, () => this.addEnemy(4, W * 0.5, -30, 1, 100));
        break;
      }
      case 5: {
        const n = 4 + Math.min(lvl, 2);
        for (let i = 0; i < n; i++) this.later(i * 0.5, () => this.addEnemy(5, i % 2 ? W - rnd(40, 120) : rnd(40, 120), -20, 1, 0));
        break;
      }
      case 6: {
        this.addEnemy(6, 70, -30, 1, 110);
        this.addEnemy(6, W - 70, -30, 1, 110);
        for (let i = 0; i < 4; i++) this.later(1.5 + i * 0.3, () => this.addEnemy(1, -20, 210, 1, 0));
        break;
      }
      case 7: {
        const side = Math.random() < 0.5 ? 1 : -1;
        const n = 5 + Math.min(lvl, 2);
        const y0 = rnd(60, 120);
        for (let i = 0; i < n; i++) this.later(i * 0.4, () => this.addEnemy(7, side > 0 ? -20 : W + 20, y0, side, 0));
        break;
      }
      case 8: {
        this.addEnemy(8, -40, 110, 1, 110);
        this.later(1.6, () => this.addEnemy(8, W + 40, 180, -1, 180));
        if (lvl >= 3) this.later(3.2, () => this.addEnemy(8, -40, 250, 1, 250));
        break;
      }
      case 9: {
        const n = n2(3);
        for (let i = 0; i < n; i++)
          this.later(i * 0.6, () => this.addEnemy(9, 60 + (i * (W - 120)) / Math.max(1, n - 1), -30, 1, rnd(120, 220)));
        break;
      }
      case 10: {
        this.addEnemy(10, -30, 140, 1, 140);
        this.later(0.7, () => this.addEnemy(10, W + 30, 210, -1, 210));
        for (let i = 0; i < 4; i++) this.later(1.2 + i * 0.35, () => this.addEnemy(12, rnd(60, W - 60), -20, 1, rnd(90, 200)));
        break;
      }
      case 11: {
        this.addEnemy(11, W / 2, -46, 1, 120);
        for (let i = 0; i < 4; i++) this.later(0.8 + i * 0.4, () => this.addEnemy(1, i % 2 ? W + 20 : -20, rnd(150, 260), i % 2 ? -1 : 1, 0));
        break;
      }
      default: {
        const n = n2(6);
        for (let i = 0; i < n; i++)
          this.later(i * 0.28, () => this.addEnemy(12, rnd(50, W - 50), -20, 1, rnd(80, 240)));
        break;
      }
    }
  }

  private addEnemy(kind: number, x: number, y: number, dir: number, stopY: number) {
    const cfg = ENEMY[kind];
    const st = STAGES[this.stageIdx];
    const hue = st.eh[cfg.slot];
    const hp = cfg.hp * (1 + 0.22 * this.level) * this.D.hp;
    const e: Enemy = {
      kind, x, y, t: 0, hp, maxHp: hp, r: cfg.r, hue,
      fireT: kind === 1 ? 0.5 : kind === 6 ? 1.2 : kind === 10 ? 0.8 : 1.0,
      fireT2: 2.2, flash: 0, sx: x, sy: y, dir, stopY, spin: rnd(0, TAU), vx: 0, vy: 0, fl: 0, fr: null, body: null,
    };
    if (E3D[kind]) e.fr = enemyFrames(E3D[kind], hue);
    else e.body = gel(hue, cfg.r);
    this.enemies.push(e);
  }

  private updateEnemies(dt: number) {
    const p = this.p;
    const sp = this.sp();
    const lvl = this.level;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.t += dt;
      if (e.flash > 0) e.flash -= dt;
      let remove = false;
      const off = e.x < -60 || e.x > W + 60 || e.y > H + 50;
      switch (e.kind) {
        case 1:
          e.x = e.sx + e.dir * e.t * 150;
          e.y = e.sy + Math.sin(e.t * 2.4) * 45 + e.t * 30;
          if (off) remove = true;
          break;
        case 3:
          if (e.t < ENEMY[3].leave) e.y += (e.stopY - e.y) * Math.min(1, dt * 3.2);
          else e.y += 240 * dt;
          if (e.y > H + 40) remove = true;
          break;
        case 5:
          if (e.t < 0.9) e.y += 120 * dt;
          else {
            if (e.fl === 0) {
              const a = Math.atan2(p.y - e.y, p.x - e.x);
              e.vx = Math.cos(a) * 280;
              e.vy = Math.max(Math.sin(a) * 280, 130);
              e.fl = 1;
              e.fireT = 0.1;
            }
            e.x += e.vx * dt;
            e.y += e.vy * dt;
          }
          if (off) remove = true;
          break;
        case 7:
          e.x = e.sx + e.dir * e.t * 115;
          e.y = e.sy + Math.sin(e.t * 1.3) * 80 + e.t * 12;
          if (off) remove = true;
          break;
        case 8: // manta: slow glide with bob
          e.x += e.dir * 62 * dt;
          e.y += (e.stopY + Math.sin(e.t * 1.1 + e.spin) * 16 - e.y) * Math.min(1, dt * 2);
          if (off && e.t > 1) remove = true;
          break;
        case 10: // lancer: approach, aim, charge
          if (e.fl === 0) {
            e.x += e.dir * 150 * dt;
            e.y += (e.stopY - e.y) * Math.min(1, dt * 2.5);
            if ((e.dir > 0 && e.x > 90) || (e.dir < 0 && e.x < W - 90)) { e.fl = 1; e.fireT = 0.5; }
          } else if (e.fl === 1) {
            e.x += e.dir * 20 * dt;
            if (e.fireT <= 0) {
              e.fl = 2;
              const a = Math.atan2(p.y - e.y, p.x - e.x);
              e.vx = Math.cos(a) * 430;
              e.vy = Math.sin(a) * 430;
              this.fire(e.x, e.y, a, 330 * sp, 3, this.bc(3), 0, 0, 330 * sp);
            }
          } else {
            e.x += e.vx * dt;
            e.y += e.vy * dt;
          }
          if (off && e.fl === 2) remove = true;
          break;
        case 12: // firefly: erratic wander
          e.x += Math.sin(e.t * 3.1 + e.spin) * 70 * dt;
          e.y += (e.stopY - e.y) * Math.min(1, dt * 1.4) + Math.cos(e.t * 2.3 + e.spin) * 26 * dt;
          if (e.t > 9) remove = true;
          break;
        default: {
          const leave = ENEMY[e.kind].leave;
          if (e.t < leave) {
            const target = e.stopY + Math.sin(e.t * 1.2 + e.spin) * (e.kind === 6 || e.kind === 11 ? 0 : 6);
            e.y += (target - e.y) * Math.min(1, dt * 2.2);
            const amp = e.kind === 2 ? 14 : e.kind === 4 ? 20 : e.kind === 9 ? 26 : e.kind === 11 ? 10 : 34;
            e.x += Math.sin(e.t * 1.4 + e.spin) * amp * dt;
          } else {
            e.y -= (e.kind === 11 ? 90 : 140) * dt * (1 + (e.t - leave) * 0.6);
            if (e.y < -60) remove = true;
          }
        }
      }

      if (!this.over && e.y > 8 && e.y < H - 130 && !remove) this.enemyFire(e, dt, sp, lvl);
      if (!remove && !this.over && (e.x - p.x) ** 2 + (e.y - p.y) ** 2 < (e.r * 0.7 + PLAYER_R) ** 2) this.hitPlayer();
      if (e.hp <= 0) { this.killEnemy(e); remove = true; }
      if (remove) this.enemies.splice(i, 1);
    }
  }

  private enemyFire(e: Enemy, dt: number, sp: number, lvl: number) {
    const p = this.p;
    e.fireT -= dt;
    const ang = Math.atan2(p.y - e.y, p.x - e.x);
    switch (e.kind) {
      case 0:
        if (e.fireT <= 0) {
          e.fireT = Math.max(1.0, 1.9 - 0.12 * lvl) / this.D.rate;
          const n = this.N2(lvl >= 1 ? 5 : 3);
          for (let j = 0; j < n; j++) this.fire(e.x, e.y + 6, ang + (j - (n - 1) / 2) * 0.24, 125 * sp, 1, this.bc(0));
        }
        break;
      case 1:
        if (e.fireT <= 0) {
          e.fireT = (0.85 - Math.min(0.3, lvl * 0.05)) / this.D.rate;
          this.fire(e.x, e.y, ang, 165 * sp, 0, this.bc(1));
        }
        break;
      case 2:
        if (e.fireT <= 0) {
          e.fireT = this.iv(0.14);
          e.spin += 0.42;
          const arms = this.N2(2);
          for (let a = 0; a < arms; a++) this.fire(e.x, e.y, e.spin + (a / arms) * TAU, 115 * sp, 1, this.bc(2));
        }
        e.fireT2 -= dt;
        if (e.fireT2 <= 0) {
          e.fireT2 = this.iv(3.2);
          const n = this.N(14 + lvl);
          for (let j = 0; j < n; j++) this.fire(e.x, e.y, (j / n) * TAU + e.t, 90 * sp, 2, this.bc(3));
        }
        break;
      case 3:
        if (e.fl === 0 && e.t > 0.9) {
          e.fl = 1;
          const n = this.N(8);
          for (let j = 0; j < n; j++) this.fire(e.x, e.y, (j / n) * TAU + e.spin, 110 * sp, 1, this.bc(0));
          for (let j = -1; j <= 1; j++) this.fire(e.x, e.y, ang + j * 0.12, 210 * sp, 0, this.bc(1));
        } else if (e.fl === 1 && e.t > 2.4) {
          e.fl = 2;
          const n = this.N(10);
          for (let j = 0; j < n; j++) this.fire(e.x, e.y, ((j + 0.5) / n) * TAU + e.spin, 95 * sp, 1, this.bc(2));
        }
        break;
      case 4:
        if (e.fireT <= 0) {
          e.fireT = this.iv(1.8);
          e.fl++;
          const n = this.N(12);
          const sgn = e.fl % 2 ? 1 : -1;
          for (let j = 0; j < n; j++) this.fire(e.x, e.y, (j / n) * TAU + e.fl * 0.3, 85 * sp, 1, this.bc(e.fl), 0, sgn * 1.3);
          this.fire(e.x, e.y, ang, 120 * sp, 3, this.bc(3));
        }
        break;
      case 5:
        if (e.fl === 1 && e.fireT <= 0) {
          e.fireT = this.iv(0.4);
          this.fire(e.x, e.y, ang, 190 * sp, 0, this.bc(0));
        }
        break;
      case 6:
        if (e.fireT <= 0) {
          e.fireT = this.iv(0.2);
          this.fire(e.x, e.y + 8, Math.PI / 2 + Math.sin(e.t * 2 + e.spin) * 0.75, 125 * sp, 0, this.bc(1));
        }
        e.fireT2 -= dt;
        if (e.fireT2 <= 0) {
          e.fireT2 = this.iv(3);
          const n = this.N2(5);
          for (let j = 0; j < n; j++) this.fire(e.x, e.y, ang + (j - (n - 1) / 2) * 0.22, 95 * sp, 2, this.bc(2));
        }
        break;
      case 7:
        if (e.fireT <= 0) {
          e.fireT = this.iv(0.22);
          e.spin += 0.3;
          const arms = this.N2(4);
          for (let a = 0; a < arms; a++) this.fire(e.x, e.y, e.spin + (a / arms) * TAU, 105 * sp, 0, this.bc(a));
        }
        break;
      case 8: // manta: downward spread + occasional ring
        if (e.fireT <= 0) {
          e.fireT = this.iv(1.3);
          const n = this.N2(3);
          for (let j = 0; j < n; j++) this.fire(e.x, e.y + 8, Math.PI / 2 + (j - (n - 1) / 2) * 0.42, 120 * sp, 1, this.bc(0));
        }
        e.fireT2 -= dt;
        if (e.fireT2 <= 0) {
          e.fireT2 = this.iv(4);
          const n = this.N(16);
          for (let j = 0; j < n; j++) this.fire(e.x, e.y, (j / n) * TAU + e.t, 78 * sp, 2, this.bc(2));
        }
        break;
      case 9: // mine: drop bombs
        if (e.fireT <= 0) {
          e.fireT = this.iv(1.1);
          const n = this.N2(3);
          for (let j = 0; j < n; j++)
            this.fire(e.x + (j - (n - 1) / 2) * 14, e.y + 10, Math.PI / 2, 30, 3, this.bc(1), 190, 0, 210 * sp);
        }
        break;
      case 10: // lancer: handled by movement
        break;
      case 11: // tower: double spiral + columns
        if (e.fireT <= 0) {
          e.fireT = this.iv(0.13);
          e.spin += 0.34 * (e.fl++ % 2 ? 1 : -1);
          this.fire(e.x - 12, e.y, e.spin, 100 * sp, 1, this.bc(0));
          this.fire(e.x + 12, e.y, -e.spin, 100 * sp, 1, this.bc(2));
        }
        e.fireT2 -= dt;
        if (e.fireT2 <= 0) {
          e.fireT2 = this.iv(2.6);
          const n = this.N2(5);
          for (let j = 0; j < n; j++) this.fire(e.x, e.y + 14, Math.PI / 2 + (j - (n - 1) / 2) * 0.14, 140 * sp, 0, this.bc(1));
          for (const s of [-1, 1]) this.fire(e.x + s * 26, e.y, Math.PI / 2, 105 * sp, 2, this.bc(3));
        }
        break;
      default: // firefly: curving slow shots
        if (e.fireT <= 0) {
          e.fireT = this.iv(1.5);
          const sgn = Math.random() < 0.5 ? 1 : -1;
          this.fire(e.x, e.y, ang, 60 * sp, 0, this.bc(2), 95, sgn * 0.9, 165 * sp);
        }
    }
  }

  private killEnemy(e: Enemy) {
    const cfg = ENEMY[e.kind];
    const v = cfg.score * this.mult();
    this.addScore(v);
    const big = e.kind === 2 || e.kind === 6 || e.kind === 11;
    this.bumpCombo(big ? 5 : e.kind === 4 || e.kind === 8 ? 3 : 1);
    const hi = hueIdx(e.hue);
    this.burst(e.x, e.y, big ? 34 : 14, hi, big ? 260 : 170, big ? 15 : 10, big ? 0.9 : 0.6);
    this.burst(e.x, e.y, big ? 14 : 5, WHITE, big ? 200 : 120, 10, 0.4);
    this.bubbleBurst(e.x, e.y, big ? 12 : 5, big ? 130 : 80);
    this.ring(e.x, e.y, big ? 90 : 44, big ? 0.6 : 0.4);
    this.showPopup(e.x, e.y - 10, fmt(v * this.D.score), big ? 18 : 13, "#ffffff");
    this.shake = Math.max(this.shake, big ? 10 : 2.5);
    this.sfx.pop(big);
    if (big) { this.slowT = 0.18; this.slowScale = 0.3; }
    for (let i = 0; i < cfg.gems; i++) this.dropItem(1, e.x, e.y, 90);
    // mines detonate on death
    if (e.kind === 9) {
      const n = this.N(10);
      for (let j = 0; j < n; j++) this.fire(e.x, e.y, (j / n) * TAU, 100 * this.sp(), 1, this.bc(0));
    }
    const r = Math.random();
    if ((e.kind === 0 || e.kind === 3 || e.kind === 9) && r < 0.25) this.dropItem(0, e.x, e.y, 60);
    else if ((e.kind === 1 || e.kind === 5 || e.kind === 7 || e.kind === 12) && r < 0.07) this.dropItem(0, e.x, e.y, 40);
    else if ((e.kind === 4 || e.kind === 10) && r < 0.55) this.dropItem(0, e.x, e.y, 60);
    else if (big) {
      for (let i = 0; i < 3; i++) this.dropItem(0, e.x, e.y, 110);
      if (Math.random() < 0.4) this.dropItem(2, e.x, e.y, 60);
    }
  }

  // ---------- boss ----------
  private bossHp() { return (450 + 180 * this.level) * this.D.hp; }

  private spawnBoss() {
    const st = STAGES[this.stageIdx];
    const hp = this.bossHp();
    if (!this.bossFr) this.bossFr = bossFrames(st.boss, st.bossHue);
    this.boss = {
      kind: st.boss, x: W / 2, y: -70, tx: W / 2, ty: 110, hp, maxHp: hp, phase: 0, phaseT: 0, t: 0,
      inv: 2.4, tm: [1.6, 2.2, 1.6, 1.2], spin: 0, dir: 1, moveT: 3, flash: 0, cnt: 0,
    };
    this.sfx.intensity = 1;
    this.later(1.2, () => {
      this.showBanner(spellT(this.lang, st.boss * 3), bossT(this.lang, st.boss), 2.8, true);
      this.sfx.spell();
    });
  }

  private nextPhase(timeout: boolean) {
    const b = this.boss!;
    const x = b.x, y = b.y;
    this.clearBullets(true);
    this.burst(x, y, 40, 4, 280, 16, 0.9);
    this.ring(x, y, 140, 0.7);
    this.shake = 16;
    this.flash("255,255,255", 0.6);
    this.slowT = 0.35;
    this.slowScale = 0.25;
    this.sfx.pop(true);
    if (!timeout) {
      const v = (15000 + this.level * 5000) * this.mult();
      this.addScore(v);
      this.showPopup(x, y + 40, `${this.T("fx.bonus")} ${fmt(v * this.D.score)}`, 16, "#fff6a8");
      for (let i = 0; i < 2; i++) this.dropItem(0, x, y, 120);
    }
    if (b.phase >= 2) { this.endStage(); return; }
    b.phase++;
    b.hp = b.maxHp = this.bossHp();
    b.phaseT = 0; b.inv = 1.6; b.tm = [1.4, 2, 1.6, 1.2]; b.spin = 0; b.cnt = 0; b.dir = 1;
    const kind = b.kind, ph = b.phase;
    this.later(0.4, () => {
      this.showBanner(spellT(this.lang, kind * 3 + ph), bossT(this.lang, kind), 2.6, true);
      this.sfx.spell();
    });
  }

  private endStage() {
    const b = this.boss!;
    const x = b.x, y = b.y;
    this.boss = null;
    this.bossFr = null;
    this.clearBullets(true);
    for (let i = 0; i < 4; i++)
      this.later(i * 0.12, () => {
        this.burst(x + rnd(-30, 30), y + rnd(-30, 30), 30, i % 7, 300, 16, 1);
        this.ring(x + rnd(-20, 20), y + rnd(-20, 20), 120 + i * 30, 0.8);
      });
    this.bubbleBurst(x, y, 30, 220);
    this.shake = 26;
    this.flash("255,255,255", 1);
    this.slowT = 1.0;
    this.slowScale = 0.25;
    const bonus = (30000 + this.level * 10000) * this.mult();
    this.addScore(bonus);
    this.sfx.clear();
    this.sfx.intensity = 0;
    for (let i = 0; i < 4; i++) this.dropItem(0, x, y, 140);
    this.dropItem(2, x, y, 40);
    for (let i = 0; i < 18; i++) this.dropItem(1, x, y, 150);
    this.bombs = Math.min(5, this.bombs + 1);
    const even = (this.level + 1) % 2 === 0;
    const gotLife = even && this.lives < 5;
    if (gotLife) this.lives++;
    else if (!even) this.dropItem(3, x, y, 60);
    const done = this.level + 1;
    this.showBanner(
      this.T("stageClear", { n: done }),
      this.T("bonusLine", { v: fmt(bonus * this.D.score) }) + (gotLife ? "  ·  " + this.T("extraLife") : ""),
      3, false
    );
    this.level++;
    this.stageIdx = this.level % STAGES.length;
    this.palIdx = STAGES[this.stageIdx].pal;
    this.stageTime = 0;
    this.spawnT = 4.2;
    this.waveN = 0;
    this.bossAt = 38;
    const si = this.stageIdx;
    this.later(1.0, () => this.prefetchStage(si));
    this.later(3.2, () => this.showBanner(this.T("stageN", { n: this.level + 1 }), stageT(this.lang, si), 2.4, false));
  }

  private tick(b: Boss, i: number, iv: number, dt: number) {
    b.tm[i] -= dt;
    if (b.tm[i] <= 0) {
      b.tm[i] = iv / this.D.rate;
      return true;
    }
    return false;
  }
  private bRing(b: Boss, n: number, spd: number, size: number, hue: number, acc = 0, turn = 0) {
    for (let i = 0; i < n; i++) this.fire(b.x, b.y, b.spin + (i / n) * TAU, spd * this.sp(), size, hue, acc, turn, acc ? 240 * this.sp() : spd * this.sp());
  }
  private bFan(b: Boss, n: number, spread: number, spd: number, size: number, hue: number, aim: number) {
    for (let j = 0; j < n; j++) this.fire(b.x, b.y, aim + (j - (n - 1) / 2) * spread, spd * this.sp(), size, hue);
  }
  private bRain(n: number, spd: number, size: number, hue: number, acc = 0) {
    for (let i = 0; i < n; i++) this.fire(rnd(8, W - 8), -8, Math.PI / 2 + rnd(-0.1, 0.1), spd * this.D.speed, size, hue, acc, 0, acc ? 250 * this.D.speed : spd * this.D.speed);
  }
  private bSpiral(b: Boss, arms: number, step: number, spd: number, size: number, hue: number, dir = 1) {
    b.spin += step * dir;
    for (let i = 0; i < arms; i++) this.fire(b.x, b.y, b.spin + (i / arms) * TAU, spd * this.sp(), size, hue);
  }

  private updateBoss(dt: number) {
    const b = this.boss;
    if (!b) return;
    const p = this.p;
    b.t += dt;
    b.phaseT += dt;
    if (b.flash > 0) b.flash -= dt;
    if (b.inv > 0) b.inv -= dt;
    b.moveT -= dt;
    if (b.moveT <= 0) {
      b.moveT = rnd(2.2, 3.4);
      b.tx = b.kind === 0 && b.phase === 1 ? W / 2 + rnd(-40, 40) : rnd(110, W - 110);
      b.ty = rnd(90, 165);
    }
    b.x += (b.tx - b.x) * Math.min(1, dt * 1.7);
    b.y += (b.ty - b.y) * Math.min(1, dt * (b.t < 2.4 ? 1.2 : 1.7));
    if (!this.over && b.t > 1.6 && b.inv <= 0.4) this.bossPattern(b, dt);
    if (!this.over && b.y > 0 && (b.x - p.x) ** 2 + (b.y - p.y) ** 2 < (22 + PLAYER_R) ** 2) this.hitPlayer();
    if (b.hp <= 0) this.nextPhase(false);
    else if (b.phaseT > 34) this.nextPhase(true);
  }

  private bossPattern(b: Boss, dt: number) {
    const sp = this.sp();
    const lvl = this.level;
    const aim = Math.atan2(this.p.y - b.y, this.p.x - b.x);
    const bc = (k: number) => this.bc(k);
    switch (b.kind * 3 + b.phase) {
      // ===== B0 Bubble Sky =====
      case 0:
        if (this.tick(b, 0, 0.95, dt)) { this.bRing(b, this.N(14 + 2 * lvl), 95, 2, bc(b.cnt++ % 3)); b.spin += 0.29; }
        if (this.tick(b, 1, 1.7, dt)) this.bFan(b, this.N2(5), 0.17, 175, 1, bc(2), aim);
        break;
      case 1:
        if (this.tick(b, 0, 0.085, dt)) this.bSpiral(b, this.N2(lvl >= 2 ? 4 : 3), 0.26, 140, 0, bc(b.cnt++ % 2 ? 3 : 1), b.dir);
        b.dir = Math.floor(b.phaseT / 4.5) % 2 === 0 ? 1 : -1;
        if (this.tick(b, 1, 2.4, dt)) this.bFan(b, 3, 0.35, 85, 3, bc(0), aim);
        break;
      case 2:
        if (this.tick(b, 0, 0.13 - Math.min(0.06, lvl * 0.01), dt)) this.bRain(1, 80, 1, bc((Math.random() * 4) | 0), 70);
        if (this.tick(b, 1, 1.8, dt)) {
          const n = this.N(12 + lvl);
          for (let i = 0; i < n; i++) {
            const a = (i / n) * TAU + b.t;
            this.fire(b.x, b.y, a, 110 * sp, 0, bc(2), 0, 0.9);
            this.fire(b.x, b.y, a, 110 * sp, 0, bc(1), 0, -0.9);
          }
        }
        break;
      // ===== B1 Crystal Lagoon =====
      case 3:
        if (this.tick(b, 0, 0.12, dt)) {
          b.dir = Math.floor(b.phaseT / 3) % 2 === 0 ? 1 : -1;
          this.bSpiral(b, this.N2(4), 0.11, 140, 0, bc(b.cnt++ % 2 ? 2 : 0), b.dir);
        }
        if (this.tick(b, 1, 1.6, dt)) this.bFan(b, this.N2(3), 0.3, 115, 2, bc(1), aim);
        break;
      case 4:
        if (this.tick(b, 0, 1.3, dt)) { this.bRing(b, this.N(18), 55, 1, bc(b.cnt++ % 3), 110); }
        if (this.tick(b, 1, 0.45, dt)) this.fire(rnd(20, W - 20), -8, Math.atan2(this.p.y + 8, this.p.x - b.x), 170 * sp, 0, bc(3));
        break;
      case 5:
        if (this.tick(b, 0, 0.11, dt)) {
          const n = this.N2(5);
          b.spin += 0.5;
          for (let i = 0; i < n; i++) this.fire(b.x, b.y, b.spin + (i / n) * TAU, 120 * sp, 0, bc(i % 3), 0, i % 2 ? 1.8 : -1.8);
        }
        if (this.tick(b, 1, 2.6, dt)) this.bRing(b, this.N(24), 80, 2, bc(1));
        break;
      // ===== B2 Aero Twilight =====
      case 6:
        if (this.tick(b, 0, 0.09, dt)) this.fire(b.x, b.y, Math.PI / 2 + Math.sin(b.t * 1.6) * 0.95, 170 * sp, 0, bc(b.cnt++ % 3));
        if (this.tick(b, 1, 1.8, dt)) { b.dir = -b.dir; this.bRing(b, this.N(12), 100, 1, bc(3), 0, b.dir * 1.2); }
        break;
      case 7:
        if (this.tick(b, 0, 0.06, dt)) {
          this.fire(b.x, b.y, b.spin, 120 * sp, 0, bc(3));
          this.fire(b.x, b.y, -b.spin + Math.PI, 120 * sp, 0, bc(1));
          b.spin += 0.21;
        }
        if (this.tick(b, 1, 2.5, dt)) this.bFan(b, this.N2(7), 0.16, 100, 1, bc(0), aim);
        break;
      case 8:
        if (this.tick(b, 0, 1.1, dt)) {
          const stars = this.N2(3);
          const ph = b.phase;
          for (let s = 0; s < stars; s++) {
            const sx = rnd(60, W - 60), sy = rnd(70, 300);
            this.ring(sx, sy, 30, 0.45);
            this.later(0.45, () => {
              if (!this.boss || this.boss.phase !== ph) return;
              const n = this.N(10), off = rnd(0, TAU);
              for (let i = 0; i < n; i++) this.fire(sx, sy, off + (i / n) * TAU, 75 * this.sp(), 1, this.bc(s));
              this.sparks(sx, sy, 8, WHITE, 120, 9, 0.4);
            });
          }
        }
        if (this.tick(b, 1, 0.35, dt)) this.fire(b.x, b.y, aim, 200 * sp, 0, bc(2));
        break;
      // ===== B3 Liquid Aurora =====
      case 9:
        if (this.tick(b, 0, 0.16, dt)) {
          const x = 30 + ((b.cnt++ * 47) % (W - 60));
          this.fire(x, -8, Math.PI / 2, 115 * sp, 0, bc(1));
          this.fire(W - x, -8, Math.PI / 2, 115 * sp, 0, bc(2));
        }
        if (this.tick(b, 1, 2.2, dt)) this.bFan(b, this.N2(5), 0.2, 140, 1, bc(0), aim);
        break;
      case 10:
        if (this.tick(b, 0, 0.9, dt)) { b.dir = -b.dir; this.bRing(b, this.N(20), 100, 1, bc(b.dir > 0 ? 0 : 2), 0, b.dir * 1.6); }
        if (this.tick(b, 1, 0.3, dt)) this.fire(b.x, b.y, aim, 200 * sp, 0, bc(3));
        break;
      case 11:
        if (this.tick(b, 0, 0.09, dt)) this.bSpiral(b, this.N2(3), 0.23, 130, 0, bc(Math.floor(b.spin * 2) % 4));
        if (this.tick(b, 1, 1.6, dt)) this.bRing(b, this.N(22), 70, 1, bc(2), 60);
        if (this.tick(b, 2, 0.3, dt)) this.bRain(1, 150, 0, bc(1));
        break;
      // ===== B4 Frost Garden =====
      case 12:
        if (this.tick(b, 0, 1.05, dt)) { this.bRing(b, this.N(16), 60, 0, bc(b.cnt++ % 2 ? 0 : 4), 150); b.spin += 0.37; }
        if (this.tick(b, 1, 0.5, dt)) this.fire(b.x, b.y, aim, 260 * sp, 0, bc(1));
        break;
      case 13:
        if (this.tick(b, 0, 0.75, dt)) {
          const rows = this.N2(3);
          for (let r = 0; r < rows; r++) {
            const y = 60 + r * 90;
            const s = r % 2 ? 1 : -1;
            for (let i = 0; i < 5; i++) this.fire(s > 0 ? -10 : W + 10, y + i * 16, s > 0 ? 0 : Math.PI, 120 * sp, 1, bc(0));
          }
        }
        if (this.tick(b, 1, 1.9, dt)) this.bRing(b, this.N(14), 70, 2, bc(2));
        break;
      case 14:
        if (this.tick(b, 0, 0.1, dt)) {
          b.spin += 0.19 * b.dir;
          this.fire(b.x, b.y, b.spin, 125 * sp, 0, bc(0), 0, 1.1);
          this.fire(b.x, b.y, b.spin + Math.PI, 125 * sp, 0, bc(4), 0, -1.1);
        }
        b.dir = Math.floor(b.phaseT / 3.4) % 2 === 0 ? 1 : -1;
        if (this.tick(b, 1, 2.1, dt)) this.bRing(b, this.N(20), 55, 3, bc(2), 95);
        break;
      // ===== B5 Petal Meadow =====
      case 15:
        if (this.tick(b, 0, 0.1, dt)) this.bSpiral(b, this.N2(5), 0.31, 110, 0, bc(b.cnt++ % 3));
        if (this.tick(b, 1, 0.9, dt)) this.fire(b.x, b.y, aim, 150 * sp, 1, bc(3));
        break;
      case 16:
        if (this.tick(b, 0, 0.09, dt)) {
          b.dir = Math.floor(b.phaseT / 2.8) % 2 === 0 ? 1 : -1;
          this.bSpiral(b, this.N2(3), 0.22, 130, 0, bc(0), b.dir);
          this.bSpiral(b, this.N2(3), -0.22, 105, 1, bc(2), -b.dir);
        }
        if (this.tick(b, 1, 2.3, dt)) this.bRing(b, this.N(18), 65, 2, bc(1), 70);
        break;
      case 17:
        if (this.tick(b, 0, 0.22, dt)) {
          const n = this.N2(4);
          for (let i = 0; i < n; i++)
            this.fire(rnd(10, W - 10), -8, Math.PI / 2 + rnd(-0.3, 0.3), 60 * this.D.speed, 0, bc(i), 55, rnd(-1, 1) * 1.4, 150 * this.D.speed);
        }
        if (this.tick(b, 1, 0.8, dt)) this.bSpiral(b, this.N2(4), 0.4, 120, 1, bc(3));
        break;
      // ===== B6 Thunder Reef =====
      case 18:
        if (this.tick(b, 0, 0.55, dt)) this.bFan(b, this.N2(3), 0.12, 300, 0, bc(3), aim);
        if (this.tick(b, 1, 1.15, dt)) {
          const n = this.N(10);
          for (let i = 0; i < n; i++) this.fire(b.x, b.y, (i / n) * TAU + b.t * 2, 90 * sp, 1, bc(2), 0, 2.2);
        }
        break;
      case 19:
        if (this.tick(b, 0, 0.5, dt)) {
          const cols = this.N2(5);
          for (let i = 0; i < cols; i++) {
            const x = 40 + (i * (W - 80)) / (cols - 1);
            for (let j = 0; j < 4; j++) this.fire(x, -10 - j * 26, Math.PI / 2, 165 * sp, 0, bc(1));
          }
        }
        if (this.tick(b, 1, 1.4, dt)) {
          for (const s of [-1, 1]) for (let i = 0; i < 4; i++) this.fire(s > 0 ? -10 : W + 10, 120 + i * 70, s > 0 ? 0 : Math.PI, 150 * sp, 1, bc(0));
        }
        break;
      case 20:
        if (this.tick(b, 0, 0.075, dt)) this.bSpiral(b, this.N2(6), 0.34, 145, 0, bc(b.cnt++ % 4));
        if (this.tick(b, 1, 2.0, dt)) this.bRing(b, this.N(26), 78, 2, bc(2));
        if (this.tick(b, 2, 1.3, dt)) this.bFan(b, this.N2(9), 0.13, 190, 1, bc(3), aim);
        break;
      // ===== B7 Moonlit Sea =====
      case 21:
        if (this.tick(b, 0, 0.7, dt)) {
          const n = this.N(13);
          const sweep = Math.sin(b.t * 1.3) * 1.1;
          for (let i = 0; i < n; i++) this.fire(b.x, b.y, sweep + (i / n) * Math.PI * 0.9 + Math.PI * 0.05, 105 * sp, 1, bc(i % 2 ? 0 : 2));
        }
        if (this.tick(b, 1, 0.42, dt)) this.fire(b.x, b.y, aim, 175 * sp, 0, bc(3));
        break;
      case 22:
        if (this.tick(b, 0, 1.15, dt)) {
          const n = this.N(22);
          b.spin += 0.23;
          for (let i = 0; i < n; i++) this.fire(b.x, b.y, b.spin + (i / n) * TAU, 48 * sp, 1, bc(i % 3), 42, 0, 130 * sp);
        }
        if (this.tick(b, 1, 0.28, dt)) {
          b.cnt++;
          this.fire(b.x, b.y, b.cnt * 0.7, 95 * sp, 0, bc(1), 0, 1.5);
          this.fire(b.x, b.y, -b.cnt * 0.7, 95 * sp, 0, bc(2), 0, -1.5);
        }
        break;
      default:
        if (this.tick(b, 0, 0.85, dt)) {
          const n = this.N(28);
          for (let i = 0; i < n; i++) this.fire(b.x, b.y, (i / n) * TAU + b.t, 22 * sp, 2, bc(i % 4), 120, 0, 210 * sp);
        }
        if (this.tick(b, 1, 0.11, dt)) this.bSpiral(b, this.N2(4), 0.29, 135, 0, bc(b.cnt++ % 3), b.dir);
        if (this.tick(b, 2, 1.7, dt)) this.bFan(b, this.N2(7), 0.18, 165, 1, bc(0), aim);
    }
  }

  // ---------- bullets ----------
  private fire(x: number, y: number, ang: number, spd: number, size: number, hue: number, acc = 0, turn = 0, maxSpd = spd) {
    if (this.bullets.n >= MAX_BULLETS) return;
    const b = this.bullets.spawn();
    b.x = x; b.y = y; b.ang = ang; b.spd = spd;
    b.vx = Math.cos(ang) * spd; b.vy = Math.sin(ang) * spd;
    b.acc = acc; b.turn = turn; b.maxSpd = maxSpd;
    b.size = size; b.r = SIZES[size] * 0.62; b.hue = hue; b.grazed = false; b.age = 0;
  }

  private clearBullets(toItems: boolean) {
    let gems = 0;
    for (let i = this.bullets.n - 1; i >= 0; i--) {
      const b = this.bullets.items[i];
      if (Math.random() < 0.5) this.sparks(b.x, b.y, 1, (b.hue + 4) % 7, 60, 7, 0.4);
      if (toItems && gems < 36 && Math.random() < 0.4) { this.dropItem(1, b.x, b.y, 20); gems++; }
      this.bullets.kill(i);
    }
    if (toItems) for (let i = 0; i < this.items.n; i++) this.items.items[i].t = 99;
  }

  private updateBullets(dt: number) {
    const p = this.p;
    const check = !this.over && p.alive && p.dying <= 0;
    const B = this.bullets;
    const gz = this.C.graze;
    for (let i = B.n - 1; i >= 0; i--) {
      const b = B.items[i];
      b.age += dt;
      if (b.acc !== 0 || b.turn !== 0) {
        if (b.acc > 0) b.spd = Math.min(b.spd + b.acc * dt, b.maxSpd);
        else if (b.acc < 0) b.spd = Math.max(b.spd + b.acc * dt, b.maxSpd);
        if (b.turn !== 0) {
          b.ang += b.turn * dt;
          b.turn *= 1 - Math.min(1, dt * 0.7);
        }
        b.vx = Math.cos(b.ang) * b.spd;
        b.vy = Math.sin(b.ang) * b.spd;
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x < -30 || b.x > W + 30 || b.y < -30 || b.y > H + 30 || b.age > 16) { B.kill(i); continue; }
      if (check) {
        const dx = b.x - p.x, dy = b.y - p.y;
        const d2 = dx * dx + dy * dy;
        const hr = b.r + PLAYER_R;
        if (d2 < hr * hr) {
          this.hitPlayer();
        } else if (!b.grazed) {
          const gr = b.r + GRAZE_R;
          if (d2 < gr * gr) {
            b.grazed = true;
            this.graze++;
            this.addScore(25 * gz * this.mult());
            this.comboT = Math.max(this.comboT, 2.6);
            this.combo += 0.5 * gz;
            this.sparks(p.x + dx * 0.5, p.y + dy * 0.5, 2, WHITE, 110, 8, 0.3);
            this.sfx.graze(this.combo);
          }
        }
      }
    }
  }

  private updateShots(dt: number) {
    const S = this.shots;
    const boss = this.boss;
    for (let i = S.n - 1; i >= 0; i--) {
      const s = S.items[i];
      s.age += dt;
      if (s.splitAt > 0 && s.age >= s.splitAt) {
        const ang = Math.atan2(s.vy, s.vx);
        const n = s.splitN;
        for (let j = 0; j < n; j++) {
          const t = n === 1 ? 0 : j - (n - 1) / 2;
          this.addShot(s.x, s.y, ang + t * s.spread * 2, s.spd * 1.05, s.dmg * 0.7, s.kind, { p: s.pierce, sc: s.sc * 0.8 });
        }
        this.sparks(s.x, s.y, 3, 4, 90, 6, 0.25);
        S.kill(i);
        continue;
      }
      if (s.amp > 0) {
        s.vx = Math.cos(s.age * 16 + s.ph) * s.amp;
      } else if (s.home) {
        s.spd = Math.min(720, s.spd + 900 * dt);
        const tg = this.nearestTarget(s.x, s.y);
        let cur = Math.atan2(s.vy, s.vx);
        if (tg) {
          const want = Math.atan2(tg.y - s.y, tg.x - s.x);
          cur += clamp(wrapAng(want - cur), -7 * dt, 7 * dt);
        }
        s.vx = Math.cos(cur) * s.spd;
        s.vy = Math.sin(cur) * s.spd;
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.y < -30 || s.x < -30 || s.x > W + 30 || s.y > H + 30) { S.kill(i); continue; }

      let dead = false;
      for (let j = 0; j < this.enemies.length; j++) {
        const e = this.enemies[j];
        if (s.last === e) continue;
        const rr = e.r + 5;
        if (e.y > -6 && (e.x - s.x) ** 2 + (e.y - s.y) ** 2 < rr * rr) {
          e.hp -= s.dmg;
          e.flash = 0.06;
          this.addScore(10);
          this.hitFx(s.x, s.y);
          if (s.chain > 0) this.chainBolt(s, e);
          s.last = e;
          if (--s.pierce <= 0) { dead = true; break; }
        }
      }
      if (!dead && boss && s.last !== boss && boss.y > -10 && (boss.x - s.x) ** 2 + (boss.y - s.y) ** 2 < 34 * 34) {
        if (boss.inv <= 0) {
          boss.hp -= s.dmg;
          boss.flash = 0.06;
          this.addScore(10);
          this.hitFx(s.x, s.y);
        } else if (Math.random() < 0.3) this.sparks(s.x, s.y, 1, 5, 80, 6, 0.25);
        s.last = boss;
        if (--s.pierce <= 0) dead = true;
      }
      if (dead) S.kill(i);
    }
  }

  private chainBolt(s: Shot, from: object) {
    const n = s.chain;
    let made = 0;
    for (let i = 0; i < this.enemies.length && made < n; i++) {
      const e = this.enemies[i];
      if (e === from) continue;
      const d = (e.x - s.x) ** 2 + (e.y - s.y) ** 2;
      if (d > 200 * 200) continue;
      this.addShot(s.x, s.y, Math.atan2(e.y - s.y, e.x - s.x), 900, s.dmg * 0.6, 8, { p: 1, sc: 0.85 });
      made++;
    }
    if (made > 0) this.sparks(s.x, s.y, 5, 2, 160, 8, 0.25);
  }

  private hitFx(x: number, y: number) {
    if (Math.random() < 0.6) this.sparks(x, y, 1, WHITE, 130, 7, 0.22);
    this.sfx.hit();
  }

  // ---------- items ----------
  private dropItem(kind: number, x: number, y: number, spread: number) {
    if (this.items.n > 140) return;
    const it = this.items.spawn();
    it.x = x; it.y = y; it.kind = kind; it.t = 0;
    const a = rnd(0, TAU);
    const s = rnd(0.2, 1) * spread;
    it.vx = Math.cos(a) * s;
    it.vy = -Math.abs(Math.sin(a)) * s - 60;
  }

  private updateItems(dt: number) {
    const p = this.p;
    const Q = this.items;
    for (let i = Q.n - 1; i >= 0; i--) {
      const it = Q.items[i];
      it.t += dt;
      const dx = p.x - it.x, dy = p.y - it.y;
      const d2 = dx * dx + dy * dy;
      const magnet = p.alive && !this.over && (it.t > 50 || d2 < 80 * 80 || (p.y < 170 && it.t > 0.3));
      if (magnet) {
        const d = Math.sqrt(d2) || 1;
        it.x += (dx / d) * 560 * dt;
        it.y += (dy / d) * 560 * dt;
      } else {
        it.vy = Math.min(it.vy + 280 * dt, 105);
        it.vx *= Math.exp(-dt * 2.5);
        it.x += it.vx * dt;
        it.y += it.vy * dt;
      }
      if (p.alive && !this.over && d2 < 17 * 17) { this.collect(it.kind, it.x, it.y); Q.kill(i); continue; }
      if (it.y > H + 20 || it.x < -20 || it.x > W + 20) Q.kill(i);
    }
  }

  private collect(kind: number, x: number, y: number) {
    this.sfx.pickup();
    if (kind === 1) {
      this.addScore(300 * this.mult());
      this.sparks(x, y, 3, WHITE, 80, 6, 0.25);
    } else if (kind === 0) {
      if (this.power >= 4) {
        this.addScore(2000);
        this.showPopup(x, y - 10, fmt(2000 * this.D.score), 12, "#bff7ff");
      } else {
        const before = Math.floor(this.power);
        this.power = Math.min(4, this.power + 0.5);
        if (Math.floor(this.power) > before) {
          this.sfx.powerUp();
          this.showPopup(this.p.x, this.p.y - 30, this.power >= 4 ? this.T("fx.powerMax") : this.T("fx.powerUp"), 15, "#bff7ff");
          this.ring(this.p.x, this.p.y, 60, 0.45);
          this.flash("170,230,255", 0.25);
          this.showPopup(this.p.x, this.p.y - 52, `${this.T("modes")} ${Math.min(4, Math.floor(this.power))}/4`, 12, "#fff6a8");
        }
      }
      this.sparks(x, y, 5, 5, 100, 8, 0.3);
    } else if (kind === 2) {
      this.bombs = Math.min(5, this.bombs + 1);
      this.showPopup(x, y - 10, this.T("fx.bomb"), 14, "#b8ffb0");
      this.ring(x, y, 50, 0.4);
    } else {
      this.lives = Math.min(5, this.lives + 1);
      this.showPopup(x, y - 10, this.T("fx.life"), 14, "#ffb8e0");
      this.ring(x, y, 50, 0.4);
    }
  }

  // ---------- fx ----------
  private sparks(x: number, y: number, n: number, hue: number, speed: number, size: number, life: number) {
    for (let i = 0; i < n; i++) {
      if (this.parts.n >= MAX_PARTS) return;
      const q = this.parts.spawn();
      const a = Math.random() * TAU;
      const s = speed * rnd(0.3, 1);
      q.x = x; q.y = y; q.vx = Math.cos(a) * s; q.vy = Math.sin(a) * s;
      q.life = q.max = life * rnd(0.6, 1); q.size = size * rnd(0.6, 1.1); q.hue = hue; q.kind = 0; q.drag = 3; q.grav = 0;
    }
  }
  private burst(x: number, y: number, n: number, hue: number, speed: number, size: number, life: number) {
    this.sparks(x, y, n, hue, speed, size, life);
  }
  private bubbleAt(x: number, y: number, vx: number, vy: number, size: number) {
    if (this.parts.n >= MAX_PARTS) return;
    const q = this.parts.spawn();
    q.x = x; q.y = y; q.vx = vx; q.vy = vy; q.life = q.max = rnd(0.7, 1.4); q.size = size; q.hue = 0; q.kind = 1; q.drag = 1.5; q.grav = -30;
  }
  private bubbleBurst(x: number, y: number, n: number, speed: number) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const s = speed * rnd(0.3, 1);
      this.bubbleAt(x, y, Math.cos(a) * s, Math.sin(a) * s, rnd(6, 18));
    }
  }
  private ring(x: number, y: number, maxR: number, life: number) {
    if (this.parts.n >= MAX_PARTS) return;
    const q = this.parts.spawn();
    q.x = x; q.y = y; q.vx = 0; q.vy = 0; q.life = q.max = life; q.size = maxR; q.hue = 0; q.kind = 2; q.drag = 0; q.grav = 0;
  }
  private updateParts(dt: number) {
    const P = this.parts;
    for (let i = P.n - 1; i >= 0; i--) {
      const q = P.items[i];
      q.life -= dt;
      if (q.life <= 0) { P.kill(i); continue; }
      if (q.drag) {
        const f = Math.exp(-q.drag * dt);
        q.vx *= f; q.vy *= f;
      }
      q.vy += q.grav * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
    }
  }
  private flash(c: string, a: number) { this.flashC = c; this.flashA = Math.max(this.flashA, a); }
  private showPopup(x: number, y: number, text: string, size: number, color: string) {
    if (this.popups.length > 26) this.popups.shift();
    this.popups.push({ x: clamp(x, 60, W - 60), y, text, life: 0.9, max: 0.9, size, color });
  }
  private showBanner(title: string, sub: string, sec: number, spell = false) {
    this.banner = { title, sub, t: 0, max: sec, spell };
  }

  // ---------- render ----------
  private drawFr(ctx: CanvasRenderingContext2D, fr: Frames, idx: number, x: number, y: number, sc = 1) {
    const c = fr.cv[((idx % fr.cv.length) + fr.cv.length) % fr.cv.length];
    const w = fr.w * sc, h = fr.h * sc;
    ctx.drawImage(c, x - w / 2, y - h / 2, w, h);
  }

  private render() {
    const ctx = this.ctx;
    const k = this.scale * this.dpr;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    this.drawBg(ctx);
    ctx.save();
    if (this.shake > 0 && this.state === "playing") ctx.translate((Math.random() - 0.5) * 2 * this.shake, (Math.random() - 0.5) * 2 * this.shake);
    if (this.state !== "menu") {
      this.drawItems(ctx);
      this.drawShots(ctx);
      for (const e of this.enemies) this.drawEnemy(ctx, e);
      if (this.boss) this.drawBoss(ctx, this.boss);
      if (this.p.alive) this.drawPlayer(ctx);
    }
    this.drawParts(ctx);
    if (this.state !== "menu") {
      this.drawBullets(ctx);
      if (this.bombT > 0) this.drawBomb(ctx);
      this.drawPopups(ctx);
    }
    ctx.restore();
    if (this.flashA > 0.01) {
      ctx.fillStyle = `rgba(${this.flashC},${this.flashA})`;
      ctx.fillRect(0, 0, W, H);
    }
    if (this.state !== "menu") {
      this.drawHud(ctx);
      if (this.banner) this.drawBanner(ctx, this.banner);
    }
    ctx.globalAlpha = 1;
  }

  private drawBg(ctx: CanvasRenderingContext2D) {
    const s = this.spr;
    ctx.drawImage(s.bgs[this.palIdx], 0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.28 + 0.1 * Math.sin(this.time * 0.7);
    ctx.drawImage(s.rays, Math.sin(this.time * 0.25) * 34 - 30, 0);
    ctx.globalCompositeOperation = "source-over";
    const ca = this.palIdx >= 2 ? 0.5 : 1;
    for (const c of this.clouds) {
      const sp = s.clouds[c.i];
      ctx.globalAlpha = c.a * ca;
      ctx.drawImage(sp.c, c.x, c.y, sp.w * c.s, sp.h * c.s);
    }
    for (const b of this.bgBubbles) {
      ctx.globalAlpha = b.a;
      ctx.drawImage(s.bgBubble.c, b.x + Math.sin(this.time * 0.8 + b.ph) * 10, b.y, b.s, b.s);
    }
    ctx.globalAlpha = 1;
  }

  private drawItems(ctx: CanvasRenderingContext2D) {
    const glow = this.spr.glows[WHITE];
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < this.items.n; i++) {
      const it = this.items.items[i];
      ctx.drawImage(glow.c, it.x - 14, it.y - 14, 28, 28);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    const F = this.itemFr;
    for (let i = 0; i < this.items.n; i++) {
      const it = this.items.items[i];
      const bob = Math.sin(it.t * 7) * 1.2;
      const fr = it.kind === 0 ? F.power : it.kind === 2 ? F.bomb : it.kind === 3 ? F.life : F.gem;
      this.drawFr(ctx, fr, Math.floor(it.t * 14 + i * 3), it.x, it.y + bob);
    }
  }

  private drawShots(ctx: CanvasRenderingContext2D) {
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.92;
    for (let i = 0; i < this.shots.n; i++) {
      const sh = this.shots.items[i];
      const spr = this.shotArt[sh.kind];
      if (!spr) continue;
      const round = spr.w === spr.h;
      const w = spr.w * sh.sc;
      const h = spr.h * sh.sc;
      if (this.shotRot[sh.kind] && !round) {
        ctx.save();
        ctx.translate(sh.x, sh.y);
        ctx.rotate(Math.atan2(sh.vy, sh.vx) + Math.PI / 2);
        ctx.drawImage(spr.c, -w / 2, -h / 2, w, h);
        ctx.restore();
      } else if (round) {
        ctx.drawImage(spr.c, sh.x - w / 2, sh.y - h / 2, w, h);
      } else {
        const tilt = this.shotRot[sh.kind] ? Math.atan2(sh.vy, sh.vx) + Math.PI / 2 : 0;
        ctx.save();
        ctx.translate(sh.x, sh.y);
        ctx.rotate(tilt);
        ctx.drawImage(spr.c, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }

  private drawBullets(ctx: CanvasRenderingContext2D) {
    const B = this.bullets;
    const sprs = this.spr.bullets;
    for (let i = 0; i < B.n; i++) {
      const b = B.items[i];
      const sp = sprs[b.size][b.hue];
      const pop = b.age < 0.14 ? 0.4 + (b.age / 0.14) * 0.6 : 1;
      const w = sp.w * pop;
      ctx.drawImage(sp.c, b.x - w / 2, b.y - w / 2, w, w);
    }
  }

  private drawParts(ctx: CanvasRenderingContext2D) {
    const s = this.spr;
    const P = this.parts;
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < P.n; i++) {
      const q = P.items[i];
      if (q.kind === 0) {
        const a = q.life / q.max;
        const d = q.size * (0.5 + 0.9 * a) * 2;
        ctx.globalAlpha = Math.min(1, a * 1.6);
        ctx.drawImage(s.glows[q.hue].c, q.x - d / 2, q.y - d / 2, d, d);
      } else if (q.kind === 2) {
        const a = q.life / q.max;
        const r = q.size * (1 - a * a);
        ctx.globalAlpha = a * 0.9;
        ctx.lineWidth = 1 + a * 4;
        ctx.strokeStyle = "#dff8ff";
        ctx.beginPath();
        ctx.arc(q.x, q.y, Math.max(1, r), 0, TAU);
        ctx.stroke();
      } else if (q.kind === 3) {
        // lightning column
        const a = q.life / q.max;
        ctx.globalAlpha = a;
        ctx.strokeStyle = "#fffbe0";
        ctx.lineWidth = 2 + a * 7;
        ctx.beginPath();
        let yy = 0;
        ctx.moveTo(q.x, 0);
        while (yy < H) {
          yy += 34;
          ctx.lineTo(q.x + rnd(-11, 11), yy);
        }
        ctx.stroke();
        ctx.globalAlpha = a * 0.5;
        ctx.lineWidth = 14;
        ctx.strokeStyle = "rgba(255,240,150,0.5)";
        ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = "source-over";
    const bb = s.bgBubble;
    for (let i = 0; i < P.n; i++) {
      const q = P.items[i];
      if (q.kind !== 1) continue;
      const a = q.life / q.max;
      ctx.globalAlpha = Math.min(1, a * 2) * 0.95;
      const d = q.size * (1.1 - 0.2 * a);
      ctx.drawImage(bb.c, q.x - d / 2, q.y - d / 2, d, d);
    }
    ctx.globalAlpha = 1;
  }

  private drawBomb(ctx: CanvasRenderingContext2D) {
    const p = this.p;
    const b = this.B;
    const st = b.style;
    const col = b.col;
    const el = b.dur - this.bombT;
    const R = Math.min(this.bombRadius(el), 900);
    const fade = Math.min(1, this.bombT / 0.6);
    ctx.globalCompositeOperation = "lighter";
    if (!b.full) {
      const g = ctx.createRadialGradient(p.x, p.y, R * 0.5, p.x, p.y, R);
      g.addColorStop(0, `rgba(${col},0)`);
      g.addColorStop(0.85, `rgba(${col},${0.32 * fade})`);
      g.addColorStop(1, `rgba(255,255,255,${0.75 * fade})`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, R, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = fade * (1 - i * 0.3);
        ctx.lineWidth = 5 - i * 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, R * (1 - i * 0.12), 0, TAU);
        ctx.stroke();
      }
    }
    switch (st) {
      case "spiral":
      case "orbit":
      case "gale": {
        // Rotating blades / crescents.
        ctx.fillStyle = `rgba(${col},0.75)`;
        const arms = st === "spiral" ? 8 : st === "orbit" ? 6 : 10;
        const spin = st === "spiral" ? 8 : st === "orbit" ? -4 : 12;
        for (let i = 0; i < arms; i++) {
          const a = el * spin + (i / arms) * TAU;
          ctx.save();
          ctx.translate(p.x + Math.cos(a) * R * 0.78, p.y + Math.sin(a) * R * 0.78);
          ctx.rotate(a + Math.PI / 2);
          ctx.globalAlpha = fade;
          ctx.beginPath();
          if (st === "gale") ctx.ellipse(0, 0, 5, 22, 0, 0, TAU);
          else ctx.ellipse(0, 0, 9, 26, 0, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
        break;
      }
      case "hearts":
      case "bloom":
      case "waves": {
        ctx.strokeStyle = `rgba(${col},0.8)`;
        ctx.lineWidth = 6;
        const n = st === "bloom" ? 14 : 12;
        const spin = st === "bloom" ? 6 : st === "waves" ? -3 : 2;
        for (let i = 0; i < n; i++) {
          const a = el * spin + (i / n) * TAU;
          ctx.globalAlpha = fade * 0.6;
          ctx.beginPath();
          ctx.moveTo(p.x + Math.cos(a) * R * 0.25, p.y + Math.sin(a) * R * 0.25);
          ctx.lineTo(p.x + Math.cos(a) * R * 0.95, p.y + Math.sin(a) * R * 0.95);
          ctx.stroke();
        }
        break;
      }
      case "rain":
      case "nova": {
        ctx.fillStyle = `rgba(${col},0.9)`;
        const n = st === "nova" ? 12 : 6;
        const spin = st === "nova" ? -3 : -5;
        for (let i = 0; i < n; i++) {
          const a = el * spin + (i / n) * TAU;
          ctx.globalAlpha = fade;
          ctx.save();
          ctx.translate(p.x + Math.cos(a) * R * 0.7, p.y + Math.sin(a) * R * 0.7);
          ctx.rotate(a + Math.PI / 2);
          if (st === "nova") {
            ctx.beginPath();
            for (let k = 0; k < 8; k++) {
              const b2 = (k / 8) * TAU - Math.PI / 2;
              const rr = k % 2 === 0 ? 11 : 4;
              const x2 = Math.cos(b2) * rr, y2 = Math.sin(b2) * rr;
              if (k === 0) ctx.moveTo(x2, y2);
              else ctx.lineTo(x2, y2);
            }
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, 6, 0, TAU);
            ctx.fill();
          }
          ctx.restore();
        }
        break;
      }
      case "shards":
      case "blizzard": {
        ctx.globalAlpha = fade * 0.5;
        ctx.fillStyle = `rgba(${col},0.5)`;
        const n = st === "blizzard" ? 14 : 10;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU + el * (st === "blizzard" ? -1 : 1);
          ctx.save();
          ctx.translate(p.x + Math.cos(a) * R * 0.6, p.y + Math.sin(a) * R * 0.6);
          ctx.rotate(a);
          ctx.beginPath();
          ctx.moveTo(0, -16);
          ctx.lineTo(7, 0);
          ctx.lineTo(0, 16);
          ctx.lineTo(-7, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        break;
      }
      case "storm": {
        ctx.globalAlpha = fade * 0.35;
        ctx.fillStyle = `rgba(${col},1)`;
        ctx.fillRect(0, 0, W, H);
        break;
      }
      case "flare": {
        // Twin searing beams up the screen.
        ctx.globalAlpha = fade * 0.8;
        ctx.fillStyle = `rgba(${col},0.85)`;
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(p.x + s * 6, p.y);
          ctx.lineTo(p.x + s * (24 + R * 0.06), 0);
          ctx.lineTo(p.x + s * (44 + R * 0.06), 0);
          ctx.lineTo(p.x + s * 16, p.y);
          ctx.closePath();
          ctx.fill();
        }
        ctx.globalAlpha = fade;
        ctx.strokeStyle = "#fffbe0";
        ctx.lineWidth = 2;
        for (const s of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(p.x + s * 11, p.y);
          ctx.lineTo(p.x + s * (34 + R * 0.06), 0);
          ctx.stroke();
        }
        break;
      }
      case "void":
      case "mist": {
        const dark = st === "void" ? "rgba(20,10,60,1)" : "rgba(225,232,255,1)";
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = fade * (st === "void" ? 0.3 : 0.22);
        ctx.fillStyle = dark;
        ctx.beginPath();
        ctx.arc(p.x, p.y, R, 0, TAU);
        ctx.fill();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = fade;
        ctx.strokeStyle = `rgba(${col},0.9)`;
        ctx.lineWidth = 3;
        const arcs = st === "mist" ? 5 : 3;
        for (let i = 0; i < arcs; i++) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, R * (0.35 + i * 0.16), el * (st === "mist" ? -1.4 : 2) + i, el * (st === "mist" ? -1.4 : 2) + i + 2.2);
          ctx.stroke();
        }
        break;
      }
      case "inferno": {
        ctx.globalAlpha = fade * 0.4;
        ctx.fillStyle = `rgba(${col},1)`;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = fade * 0.8;
        ctx.fillStyle = "rgba(255,255,220,0.9)";
        for (let i = 0; i < 8; i++) {
          const x = (i / 8) * W + Math.sin(el * 12 + i) * 8;
          ctx.fillRect(x - 5, 0, 10, H);
        }
        break;
      }
      case "splash": {
        ctx.strokeStyle = `rgba(${col},0.75)`;
        ctx.lineWidth = 4;
        for (let i = 0; i < 4; i++) {
          ctx.globalAlpha = fade * (0.7 - i * 0.15);
          ctx.beginPath();
          ctx.arc(p.x, p.y, R * (0.4 + i * 0.2), el * 2.2 + i, el * 2.2 + i + 3.4);
          ctx.stroke();
        }
        break;
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  }

  private drawPlayer(ctx: CanvasRenderingContext2D) {
    const p = this.p;
    const s = this.spr;
    const ci = this.cfg.char;
    const blink = p.invuln > 0 && Math.sin(this.time * 40) > 0.2;
    const alpha = p.dying > 0 ? 0.6 : blink ? 0.45 : 1;
    const flap = Math.sin(this.time * 22) * 0.16;
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = alpha * 0.55;
    ctx.drawImage(s.glows[WHITE].c, p.x - 34, p.y - 34, 68, 68);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = alpha;
    if (ci === 3) {
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(p.x + side * 5, p.y);
        ctx.scale(side * 1.25, 1.25);
        ctx.rotate(-0.7 - flap * 1.5);
        ctx.drawImage(s.wing.c, 0, -s.wing.h / 2, s.wing.w, s.wing.h);
        ctx.restore();
      }
    } else if (ci !== 7) {
      for (const side of [-1, 1]) {
        ctx.save();
        ctx.translate(p.x + side * 4, p.y - 2);
        ctx.scale(side, 1);
        ctx.rotate(-0.45 - flap + p.lean * side * 0.25);
        ctx.drawImage(s.wing.c, 0, -s.wing.h / 2, s.wing.w, s.wing.h);
        ctx.restore();
        ctx.save();
        ctx.translate(p.x + side * 3, p.y + 3);
        ctx.scale(side * 0.7, 0.7);
        ctx.rotate(0.35 + flap);
        ctx.drawImage(s.wing.c, 0, -s.wing.h / 2, s.wing.w, s.wing.h);
        ctx.restore();
      }
    } else {
      // Yami: dark crescent aura
      ctx.globalAlpha = alpha * 0.5;
      ctx.strokeStyle = "rgba(190,170,255,0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 20, this.time * 1.5, this.time * 1.5 + 4.2);
      ctx.stroke();
      ctx.globalAlpha = alpha;
    }
    if (Math.floor(this.power) >= 3 && OPT_CH[ci]) {
      const gelSpr = s.bullets[1][hueIdx(this.C.hue)];
      for (const side of [-1, 1]) {
        const ox = p.x + side * (30 - 15 * p.focus);
        const oy = p.y + 6 + Math.sin(this.time * 5 + side) * 2;
        ctx.drawImage(gelSpr.c, ox - gelSpr.w / 2 + 1, oy - gelSpr.h / 2 + 1, gelSpr.w - 2, gelSpr.h - 2);
      }
    }
    const bob = Math.sin(this.time * 4) * 1.2;
    this.drawFr(ctx, this.charFr[ci], Math.round(p.lean * 2), p.x, p.y + bob);
    ctx.globalAlpha = 1;
    const fa = 0.55 + 0.45 * p.focus;
    ctx.fillStyle = `rgba(255,255,255,${fa})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.2, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = `rgba(255,70,140,${fa})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.2, 0, TAU);
    ctx.stroke();
    if (p.focus > 0.05) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(this.time * 2);
      ctx.globalAlpha = p.focus * 0.85;
      ctx.strokeStyle = "#e9fbff";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, 14 + (1 - p.focus) * 8, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  private drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy) {
    const s = this.spr;
    const t = e.t;
    const glow = s.glows[WHITE];
    if (e.fr) {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.35;
      const gd = e.r * 3.2;
      ctx.drawImage(glow.c, e.x - gd / 2, e.y - gd / 2, gd, gd);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      const spin = e.kind === 4 || e.kind === 9 ? 6 : e.kind === 6 || e.kind === 11 ? 8 : e.kind === 8 ? 5 : 12;
      this.drawFr(ctx, e.fr, Math.floor(t * spin + e.spin * 2), e.x, e.y);
    } else {
      const body = e.body!;
      if (e.kind === 0) {
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 2.2;
        ctx.lineCap = "round";
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(e.x + i * 6, e.y + 9);
          ctx.quadraticCurveTo(e.x + i * 7 + Math.sin(t * 6 + i) * 5, e.y + 17, e.x + i * 6 + Math.sin(t * 6 + i + 1.5) * 4, e.y + 26);
          ctx.stroke();
        }
      } else if (e.kind === 10) {
        // lancer: pointing spear
        const a = e.fl === 2 ? Math.atan2(e.vy, e.vx) : Math.atan2(this.p.y - e.y, this.p.x - e.x);
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(a);
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.beginPath();
        ctx.moveTo(e.r + 12, 0);
        ctx.lineTo(e.r - 2, -5);
        ctx.lineTo(e.r - 2, 5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-e.r, 0);
        ctx.lineTo(e.r, 0);
        ctx.stroke();
        ctx.restore();
      } else if (e.kind === 12) {
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 9 + e.spin);
        const d = 34;
        ctx.drawImage(s.glows[e.hue === 0 ? WHITE : 2].c, e.x - d / 2, e.y - d / 2, d, d);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
      }
      const wings = e.kind === 1 || e.kind === 2 || e.kind === 5 || e.kind === 12;
      if (wings) {
        const fl = Math.sin(t * 24 + e.spin) * 0.22;
        const k = e.kind === 2 ? 1.5 : e.kind === 5 ? 1.15 : e.kind === 12 ? 0.6 : 0.9;
        for (const side of [-1, 1]) {
          ctx.save();
          ctx.translate(e.x + side * 3, e.y);
          ctx.scale(side * k, k);
          ctx.rotate(-0.5 - fl);
          ctx.globalAlpha = 0.9;
          ctx.drawImage(s.wing.c, 0, -s.wing.h / 2, s.wing.w, s.wing.h);
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      }
      ctx.drawImage(body.c, e.x - body.w / 2, e.y - body.h / 2, body.w, body.h);
      if (e.kind !== 12) {
        ctx.fillStyle = "#2a1040";
        const ey = e.y + (e.kind === 2 ? 2 : 1);
        const ex = e.kind === 2 ? 6 : 4;
        const lx = clamp((this.p.x - e.x) * 0.02, -1, 1);
        ctx.beginPath();
        ctx.arc(e.x - ex + lx, ey, e.kind === 2 ? 2.4 : 1.7, 0, TAU);
        ctx.arc(e.x + ex + lx, ey, e.kind === 2 ? 2.4 : 1.7, 0, TAU);
        ctx.fill();
      }
    }
    if (e.flash > 0) {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.85;
      const d = e.r * 3;
      ctx.drawImage(glow.c, e.x - d / 2, e.y - d / 2, d, d);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }
    if (e.kind === 2 || e.kind === 4 || e.kind === 6 || e.kind === 8 || e.kind === 11) {
      ctx.strokeStyle = "rgba(255,255,255,0.75)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r + 8, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(e.hp / e.maxHp, 0, 1));
      ctx.stroke();
    }
  }

  private drawBoss(ctx: CanvasRenderingContext2D, b: Boss) {
    const s = this.spr;
    const t = this.time;
    const baseA = b.inv > 0 ? 0.65 + 0.35 * Math.sin(t * 20) : 1;
    ctx.globalAlpha = baseA;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 2;
    ctx.save();
    ctx.rotate(t * 0.7);
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, 66, 0, TAU);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.rotate(-t * 1.1);
    ctx.setLineDash([4, 10]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 78, 0, TAU);
    ctx.stroke();
    ctx.restore();
    ctx.setLineDash([]);
    ctx.restore();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = baseA * 0.45;
    ctx.drawImage(s.glows[WHITE].c, b.x - 70, b.y - 70, 140, 140);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = baseA;
    if (this.bossFr) this.drawFr(ctx, this.bossFr, Math.floor(t * 10), b.x, b.y);
    const dx = clamp((this.p.x - b.x) * 0.03, -2.5, 2.5);
    const dy = clamp((this.p.y - b.y) * 0.02, 0, 2);
    ctx.fillStyle = "#0a2a55";
    ctx.beginPath();
    ctx.ellipse(b.x - 8 + dx, b.y + 1 + dy, 3, 4.2, 0, 0, TAU);
    ctx.ellipse(b.x + 8 + dx, b.y + 1 + dy, 3, 4.2, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(b.x - 9 + dx, b.y - 0.5 + dy, 1.1, 0, TAU);
    ctx.arc(b.x + 7 + dx, b.y - 0.5 + dy, 1.1, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#0a2a55";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(b.x, b.y + 9, 4, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    if (b.flash > 0) {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.7;
      ctx.drawImage(s.glows[WHITE].c, b.x - 55, b.y - 55, 110, 110);
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.globalAlpha = 1;
  }

  private drawPopups(ctx: CanvasRenderingContext2D) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    for (const q of this.popups) {
      const a = Math.min(1, (q.life / q.max) * 2);
      const pop = q.max - q.life < 0.1 ? 0.7 + (q.max - q.life) * 3 : 1;
      ctx.globalAlpha = a;
      ctx.font = `bold ${Math.round(q.size * pop)}px ${FONT}`;
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(10,60,130,0.85)";
      ctx.strokeText(q.text, q.x, q.y);
      ctx.fillStyle = q.color;
      ctx.fillText(q.text, q.x, q.y);
    }
    ctx.globalAlpha = 1;
  }

  private text(ctx: CanvasRenderingContext2D, str: string, x: number, y: number, size: number, align: CanvasTextAlign, fill: string | CanvasGradient = "#fff", stroke = "rgba(6,50,120,0.9)") {
    ctx.font = `bold ${size}px ${FONT}`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(2, size * 0.2);
    ctx.strokeStyle = stroke;
    ctx.strokeText(str, x, y);
    ctx.fillStyle = fill;
    ctx.fillText(str, x, y);
  }

  private drawHud(ctx: CanvasRenderingContext2D) {
    const s = this.spr;
    const g = ctx.createLinearGradient(0, 0, 0, HUD_H);
    g.addColorStop(0, "rgba(255,255,255,0.5)");
    g.addColorStop(0.5, "rgba(190,235,255,0.28)");
    g.addColorStop(0.5, "rgba(60,150,230,0.35)");
    g.addColorStop(1, "rgba(120,210,255,0.3)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, HUD_H);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(0, HUD_H - 1, W, 1.5);

    this.text(ctx, fmt(this.dispScore), 10, 14, 20, "left");
    this.text(ctx, `${this.T("hud.hi")} ${fmt(Math.max(this.hi, this.score))}`, 10, 34, 11, "left", "#d8f6ff");
    this.text(ctx, `${this.T("hud.graze")} ${this.graze}`, 104, 34, 11, "left", "#d8f6ff");
    this.text(ctx, `${this.T("hud.pow")} ${this.power >= 4 ? this.T("hud.max") : this.power.toFixed(1)}`, 200, 34, 11, "left", "#ffffb8");

    const m = this.mult();
    this.text(ctx, `×${m.toFixed(2)}`, 322, 14, 15, "center", m > 1.5 ? "#fff6a8" : "#fff");
    const cw = 66;
    ctx.fillStyle = "rgba(0,40,100,0.45)";
    ctx.fillRect(322 - cw / 2, 28, cw, 6);
    ctx.fillStyle = "#8ff3ff";
    ctx.fillRect(322 - cw / 2, 28, cw * clamp(this.comboT / 2.6, 0, 1), 6);

    for (let i = 0; i < this.lives; i++) ctx.drawImage(s.lifeIcon.c, W - 18 - i * 16 - s.lifeIcon.w / 2 + 6, 13 - s.lifeIcon.h / 2, s.lifeIcon.w, s.lifeIcon.h);
    for (let i = 0; i < this.bombs; i++) ctx.drawImage(s.bombIcon.c, W - 18 - i * 16 - s.bombIcon.w / 2 + 6, 31 - s.bombIcon.h / 2, s.bombIcon.w, s.bombIcon.h);

    const b = this.boss;
    if (b) {
      const x = 16, y = HUD_H + 8, w = W - 32, h = 9;
      ctx.fillStyle = "rgba(0,40,100,0.55)";
      ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
      const ratio = clamp(b.hp / b.maxHp, 0, 1);
      const bg = ctx.createLinearGradient(0, y, 0, y + h);
      bg.addColorStop(0, "#d9fbff");
      bg.addColorStop(0.5, "#46d6ff");
      bg.addColorStop(0.5, "#1aa0ee");
      bg.addColorStop(1, "#6fe8ff");
      ctx.fillStyle = bg;
      ctx.fillRect(x, y, w * ratio, h);
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i >= b.phase ? "#fff" : "rgba(255,255,255,0.25)";
        ctx.beginPath();
        ctx.arc(x + 6 + i * 13, y + h + 13, 4, 0, TAU);
        ctx.fill();
      }
      const left = Math.max(0, 34 - b.phaseT);
      this.text(ctx, left.toFixed(0), W - 18, y + h + 13, 13, "right");
      ctx.globalAlpha = 0.95;
      this.text(ctx, bossT(this.lang, b.kind), W / 2, y + h + 26, 12, "center", "#eaffff");
      ctx.globalAlpha = 1;
    }
  }

  private drawBanner(ctx: CanvasRenderingContext2D, bn: Banner) {
    const inT = Math.min(1, bn.t / 0.3);
    const outT = Math.min(1, Math.max(0, (bn.max - bn.t) / 0.4));
    const a = Math.min(inT, outT);
    const ease = 1 - Math.pow(1 - inT, 3);
    ctx.globalAlpha = a;
    if (bn.spell) {
      const y = HUD_H + 66;
      const x = W - 14 - (1 - ease) * 120;
      ctx.font = `bold 14px ${FONT}`;
      const tw = Math.max(ctx.measureText(bn.title).width, ctx.measureText(bn.sub).width) + 26;
      const g = ctx.createLinearGradient(0, y - 22, 0, y + 22);
      g.addColorStop(0, "rgba(255,255,255,0.6)");
      g.addColorStop(0.5, "rgba(170,230,255,0.4)");
      g.addColorStop(0.5, "rgba(40,140,230,0.5)");
      g.addColorStop(1, "rgba(100,210,255,0.5)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.roundRect(x - tw, y - 22, tw, 44, 16);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      this.text(ctx, bn.title, x - 13, y - 6, 14, "right");
      this.text(ctx, bn.sub, x - 13, y + 11, 11, "right", "#dff6ff", "rgba(6,50,120,0.8)");
    } else {
      const y = H * 0.36;
      const sc = 0.8 + 0.2 * ease;
      ctx.save();
      ctx.translate(W / 2, y);
      ctx.scale(sc, sc);
      const tg = ctx.createLinearGradient(0, -26, 0, 26);
      tg.addColorStop(0, "#ffffff");
      tg.addColorStop(0.5, "#d4f7ff");
      tg.addColorStop(0.52, "#7fe0ff");
      tg.addColorStop(1, "#d8fff2");
      this.text(ctx, bn.title, 0, 0, bn.title.length > 18 ? 24 : 34, "center", tg, "rgba(5,70,150,0.95)");
      if (bn.sub) this.text(ctx, bn.sub, 0, 38, bn.sub.length > 24 ? 12 : 15, "center", "#eaffff");
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
}

export { PALETTES };
