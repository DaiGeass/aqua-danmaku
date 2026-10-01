export type ShotShape = "drop" | "orb" | "bolt" | "star";

/** Field-of-view zoom levels (1 = fills the container, lower = see more field). */
export const ZOOMS = [0.62, 0.72, 0.82, 0.91, 1];
/** Global time scales for easier dodging. */
export const SPEEDS = [1, 0.85, 0.7, 0.55];

/** Per-pilot signature mechanics, applied on top of their volley pattern. */
export type Trait =
  | "none"
  | "delayed"   // shots hang in place, then launch (Raven)
  | "ricochet"  // shots bounce off the side walls once (Kiwi)
  | "bigshot"   // fewer, much larger and heavier shots (Kori)
  | "spread"    // shots accelerate after a short delay (Hana)
  | "chainhit"  // destroyed enemies re-ignite nearby bullets (Raiden)
  | "rear"      // a rear-facing shot mirrors the main volley (Yami)
  | "orbit"     // shots circle the pilot before flying (Luna)
  | "wave"      // shots weave side to side with a persistent offset (Nami)
  | "pierce"    // every shot pierces, damage scales with power (Sol)
  | "slowgrow"  // shots accelerate slowly over their lifetime (Yuki)
  | "ember"     // every 4th volley is a wide fanned burst (Akari)
  | "gust"      // shots drift outward, curve back when focused (Kaze)
  | "dense"     // many slow small shots, wide coverage (Kumo)
  | "meteor"    // high-damage shots that accelerate hard (Hoshi)
  | "lance"     // alternating tight twin columns (Mizu)
  | "homing"    // shots gently seek, stronger when focused (Momo)
  | "dash"      // extra movement speed while not focused (Sora);

export interface CharDef {
  id: string;
  hue: number;
  speed: number;
  focus: number;
  rate: number;
  bomb: number;
  graze: number;
  stats: [number, number, number]; // power, speed, control
  options: boolean;
  /** Player shot art: shape + whether it rotates along its velocity. */
  shape: ShotShape;
  rot: boolean;
  /** Secondary shot hue for special volleys (defaults to the character hue). */
  hue2?: number;
  /** Player hitbox radius in px. Smaller dodges more easily but grazes less. */
  hitR: number;
  /** Grapes/special shot behaviour unique to this pilot. */
  trait: Trait;
}


export const CHARS: CharDef[] = [
  { id: "mizu", hue: 185, speed: 320, focus: 130, rate: 0.072, bomb: 0, graze: 1, stats: [3, 3, 4], options: true, shape: "drop", rot: false, hitR: 3.0, trait: "lance" },
  { id: "kiwi", hue: 130, speed: 296, focus: 118, rate: 0.076, bomb: 1, graze: 1, stats: [5, 2, 4], options: true, shape: "drop", rot: true, hitR: 2.6, trait: "ricochet" },
  { id: "momo", hue: 335, speed: 310, focus: 135, rate: 0.078, bomb: 2, graze: 1.2, stats: [3, 3, 5], options: false, shape: "drop", rot: true, hitR: 3.2, trait: "homing" },
  { id: "sora", hue: 48, speed: 385, focus: 172, rate: 0.07, bomb: 3, graze: 1.5, stats: [2, 5, 3], options: true, shape: "drop", rot: false, hitR: 2.8, trait: "dash" },
  { id: "kori", hue: 200, speed: 305, focus: 128, rate: 0.082, bomb: 4, graze: 1, stats: [4, 3, 3], options: true, shape: "drop", rot: true, hitR: 3.4, trait: "bigshot" },
  { id: "hana", hue: 300, speed: 312, focus: 140, rate: 0.066, bomb: 5, graze: 1.15, stats: [4, 3, 4], options: true, shape: "orb", rot: false, hitR: 3.0, trait: "spread" },
  { id: "raiden", hue: 60, speed: 330, focus: 150, rate: 0.1, bomb: 6, graze: 0.9, stats: [5, 4, 2], options: true, shape: "bolt", rot: true, hitR: 2.7, trait: "chainhit" },
  { id: "yami", hue: 265, speed: 318, focus: 138, rate: 0.074, bomb: 7, graze: 1.3, stats: [4, 3, 4], options: false, shape: "drop", rot: true, hitR: 3.0, trait: "rear" },
  { id: "luna", hue: 280, speed: 322, focus: 142, rate: 0.075, bomb: 8, graze: 1.05, stats: [4, 3, 4], options: true, shape: "orb", rot: false, hue2: 300, hitR: 2.9, trait: "orbit" },
  { id: "nami", hue: 218, speed: 316, focus: 134, rate: 0.08, bomb: 9, graze: 1.1, stats: [3, 3, 4], options: true, shape: "drop", rot: true, hitR: 3.1, trait: "wave" },
  { id: "sol", hue: 25, speed: 340, focus: 150, rate: 0.088, bomb: 10, graze: 0.95, stats: [5, 4, 2], options: true, shape: "star", rot: true, hitR: 2.6, trait: "pierce" },
  { id: "yuki", hue: 168, speed: 300, focus: 122, rate: 0.084, bomb: 11, graze: 1, stats: [4, 2, 4], options: false, shape: "drop", rot: true, hitR: 3.5, trait: "slowgrow" },
  { id: "akari", hue: 8, speed: 336, focus: 148, rate: 0.092, bomb: 12, graze: 0.95, stats: [5, 4, 2], options: true, shape: "star", rot: true, hue2: 45, hitR: 2.7, trait: "ember" },
  { id: "kaze", hue: 150, speed: 328, focus: 140, rate: 0.077, bomb: 13, graze: 1.15, stats: [3, 4, 4], options: true, shape: "drop", rot: true, hitR: 2.8, trait: "gust" },
  { id: "kumo", hue: 240, speed: 306, focus: 126, rate: 0.086, bomb: 14, graze: 1.05, stats: [3, 2, 5], options: false, shape: "orb", rot: false, hue2: 200, hitR: 3.4, trait: "dense" },
  { id: "hoshi", hue: 315, speed: 348, focus: 152, rate: 0.081, bomb: 15, graze: 1, stats: [4, 5, 3], options: true, shape: "star", rot: true, hitR: 2.5, trait: "meteor" },
];

export type BombStyle =
  | "splash" | "spiral" | "hearts" | "rain" | "shards" | "bloom" | "storm" | "void"
  | "orbit" | "waves" | "flare" | "blizzard" | "inferno" | "gale" | "mist" | "nova";

export interface BombDef {
  id: string;
  /** seconds */
  dur: number;
  /** damage per second vs enemies */
  e: number;
  /** damage per second vs boss */
  b: number;
  /** "r,g,b" */
  col: string;
  style: BombStyle;
  /** max blast radius in px */
  rMax: number;
  /** seconds until rMax is reached */
  rTime: number;
  /** hits the whole screen regardless of radius */
  full?: boolean;
  /** chance a cleared bullet turns into a power item */
  convert?: number;
}

export const BOMBS: BombDef[] = [
  { id: "splashwave", dur: 1.6, e: 55, b: 45, col: "140,230,255", style: "splash", rMax: 660, rTime: 1.0 },
  { id: "leafstorm", dur: 2.4, e: 130, b: 70, col: "150,255,150", style: "spiral", rMax: 310, rTime: 0.6 },
  { id: "heartburst", dur: 1.1, e: 45, b: 30, col: "255,170,220", style: "hearts", rMax: 940, rTime: 0.7, convert: 0.05 },
  { id: "starfall", dur: 2.2, e: 30, b: 20, col: "255,230,130", style: "rain", rMax: 340, rTime: 0.5 },
  { id: "absolutzero", dur: 2.0, e: 95, b: 60, col: "190,240,255", style: "shards", rMax: 580, rTime: 0.8, convert: 0.08 },
  { id: "bloomcyclone", dur: 2.0, e: 85, b: 55, col: "255,180,240", style: "bloom", rMax: 480, rTime: 0.7 },
  { id: "thundergod", dur: 1.4, e: 260, b: 150, col: "255,245,170", style: "storm", rMax: 900, rTime: 1.0, full: true },
  { id: "eclipse", dur: 2.4, e: 60, b: 45, col: "190,170,255", style: "void", rMax: 620, rTime: 1.4, convert: 0.35 },
  { id: "lunardeclipse", dur: 2.2, e: 70, b: 55, col: "205,200,255", style: "orbit", rMax: 520, rTime: 1.1, convert: 0.12 },
  { id: "tidalsurge", dur: 2.6, e: 90, b: 65, col: "150,225,255", style: "waves", rMax: 760, rTime: 1.3, convert: 0.18 },
  { id: "solarflare", dur: 1.8, e: 175, b: 120, col: "255,215,140", style: "flare", rMax: 820, rTime: 0.9 },
  { id: "crystalblizzard", dur: 2.4, e: 80, b: 55, col: "225,255,255", style: "blizzard", rMax: 560, rTime: 1.1, convert: 0.15 },
  { id: "emberdance", dur: 2.0, e: 120, b: 85, col: "255,175,120", style: "inferno", rMax: 600, rTime: 0.8 },
  { id: "galering", dur: 2.2, e: 95, b: 65, col: "200,255,225", style: "gale", rMax: 700, rTime: 1.0, convert: 0.1 },
  { id: "cloudbank", dur: 2.6, e: 70, b: 50, col: "215,225,255", style: "mist", rMax: 860, rTime: 1.5, convert: 0.3 },
  { id: "meteorshower", dur: 2.0, e: 160, b: 110, col: "255,205,240", style: "nova", rMax: 640, rTime: 0.8 },
];

export interface DiffDef {
  id: string;
  dens: number;
  speed: number;
  rate: number;
  hp: number;
  lives: number;
  bombs: number;
  score: number;
  spawn: number;
  color: string;
}

export const DIFFS: DiffDef[] = [
  { id: "easy", dens: 0.62, speed: 0.85, rate: 0.8, hp: 0.85, lives: 4, bombs: 4, score: 0.6, spawn: 1.25, color: "#2fc96a" },
  { id: "normal", dens: 1, speed: 1, rate: 1, hp: 1, lives: 3, bombs: 3, score: 1, spawn: 1, color: "#1a9bf0" },
  { id: "hard", dens: 1.3, speed: 1.1, rate: 1.2, hp: 1.15, lives: 2, bombs: 3, score: 1.5, spawn: 0.88, color: "#ff9a1f" },
  { id: "lunatic", dens: 1.55, speed: 1.2, rate: 1.4, hp: 1.3, lives: 1, bombs: 2, score: 2.2, spawn: 0.75, color: "#ee3a9a" },
];

/** 16 bosses × 3 phases = 48 spell cards. */
export const SPELL_COUNT = 48;
export const STAGE_COUNT = 16;
