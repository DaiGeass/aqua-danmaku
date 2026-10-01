// All art is procedurally pre-rendered to offscreen canvases (glossy "Frutiger Aero" gel look)
// so the per-frame cost is just drawImage.

export const S = 2; // supersample factor
export interface Spr {
  c: HTMLCanvasElement;
  w: number;
  h: number;
}

export const HUES = [340, 25, 52, 130, 185, 215, 280];
export const SIZES = [5, 8, 12, 18];
export const WHITE = HUES.length; // glow index for white

function mk(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.ceil(w * S);
  c.height = Math.ceil(h * S);
  const g = c.getContext("2d")!;
  g.scale(S, S);
  return { c, g, w, h };
}

const gelCache = new Map<string, Spr>();

/** Glossy gel orb: dark saturated rim, bright core, specular highlight, bounce light. */
export function gel(hue: number, r: number, label?: string): Spr {
  const key = `${hue}|${r}|${label ?? ""}`;
  const cached = gelCache.get(key);
  if (cached) return cached;
  const d = (r + 3) * 2;
  const { c, g } = mk(d, d);
  const cx = d / 2;
  const cy = d / 2;
  const gr = g.createRadialGradient(cx - r * 0.2, cy - r * 0.25, r * 0.1, cx, cy, r);
  gr.addColorStop(0, `hsla(${hue},100%,90%,0.97)`);
  gr.addColorStop(0.55, `hsla(${hue},95%,62%,0.96)`);
  gr.addColorStop(1, `hsla(${hue},90%,34%,1)`);
  g.fillStyle = gr;
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fill();
  // bounce light
  g.save();
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.clip();
  const b = g.createRadialGradient(cx, cy + r * 0.8, 0, cx, cy + r * 0.8, r * 0.8);
  b.addColorStop(0, `hsla(${(hue + 35) % 360},100%,88%,0.6)`);
  b.addColorStop(1, `hsla(${(hue + 35) % 360},100%,88%,0)`);
  g.fillStyle = b;
  g.fillRect(0, 0, d, d);
  g.restore();
  // rim
  const lw = Math.max(0.8, r * 0.09);
  g.strokeStyle = "rgba(255,255,255,0.8)";
  g.lineWidth = lw;
  g.beginPath();
  g.arc(cx, cy, r - lw * 0.5, 0, Math.PI * 2);
  g.stroke();
  // specular
  g.save();
  g.translate(cx - r * 0.28, cy - r * 0.45);
  g.rotate(-0.5);
  const sp = g.createLinearGradient(0, -r * 0.25, 0, r * 0.25);
  sp.addColorStop(0, "rgba(255,255,255,0.98)");
  sp.addColorStop(1, "rgba(255,255,255,0.15)");
  g.fillStyle = sp;
  g.beginPath();
  g.ellipse(0, 0, r * 0.42, r * 0.2, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
  if (label) {
    g.font = `bold ${Math.round(r * 1.15)}px "Trebuchet MS", sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.lineWidth = 2.2;
    g.strokeStyle = `hsla(${hue},90%,28%,0.95)`;
    g.strokeText(label, cx, cy + r * 0.08);
    g.fillStyle = "#fff";
    g.fillText(label, cx, cy + r * 0.08);
  }
  const spr = { c, w: d, h: d };
  gelCache.set(key, spr);
  return spr;
}

function makeGlow(hue: number | null): Spr {
  const d = 48;
  const { c, g } = mk(d, d);
  const gr = g.createRadialGradient(d / 2, d / 2, 0, d / 2, d / 2, d / 2);
  const col = hue === null ? "255,255,255" : null;
  if (col) {
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.25, "rgba(225,250,255,0.55)");
    gr.addColorStop(1, "rgba(180,240,255,0)");
  } else {
    gr.addColorStop(0, `hsla(${hue},100%,92%,1)`);
    gr.addColorStop(0.3, `hsla(${hue},100%,65%,0.55)`);
    gr.addColorStop(1, `hsla(${hue},100%,55%,0)`);
  }
  g.fillStyle = gr;
  g.fillRect(0, 0, d, d);
  return { c, w: d, h: d };
}

function makeShot(hue: number | null): Spr {
  const w = 12;
  const h = 28;
  const { c, g } = mk(w, h);
  const cx = w / 2;
  const grad = g.createLinearGradient(0, 0, 0, h);
  if (hue === null) {
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.5, "rgba(170,240,255,0.95)");
    grad.addColorStop(1, "rgba(40,170,255,0.35)");
  } else {
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.5, `hsla(${hue},100%,70%,0.95)`);
    grad.addColorStop(1, `hsla(${hue},100%,55%,0.3)`);
  }
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(cx, 0);
  g.bezierCurveTo(cx + 3, 8, cx + 5, 14, cx + 4, 19);
  g.quadraticCurveTo(cx, 27, cx - 4, 19);
  g.bezierCurveTo(cx - 5, 14, cx - 3, 8, cx, 0);
  g.fill();
  return { c, w, h };
}

/** Long narrow lightning dart. */
function makeBolt(hue: number): Spr {
  const w = 9;
  const h = 34;
  const { c, g } = mk(w, h);
  const cx = w / 2;
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.45, `hsla(${hue},100%,78%,0.98)`);
  grad.addColorStop(1, `hsla(${hue},100%,55%,0.25)`);
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(cx, 0);
  g.bezierCurveTo(cx + 2.5, 9, cx + 3.5, 20, cx + 2.5, 25);
  g.lineTo(cx + 5.5, 29);
  g.lineTo(cx, 34);
  g.lineTo(cx - 5.5, 29);
  g.lineTo(cx - 2.5, 25);
  g.bezierCurveTo(cx - 3.5, 20, cx - 2.5, 9, cx, 0);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,0.85)";
  g.lineWidth = 0.9;
  g.beginPath();
  g.moveTo(cx, 2);
  g.lineTo(cx, 30);
  g.stroke();
  return { c, w, h };
}

/** Four-point sparkle star, for spark/ember characters. */
function makeStar(hue: number): Spr {
  const w = 16;
  const h = 16;
  const { c, g } = mk(w, h);
  const cx = w / 2;
  const cy = h / 2;
  const grad = g.createRadialGradient(cx, cy, 0, cx, cy, w / 2);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, `hsla(${hue},100%,74%,0.95)`);
  grad.addColorStop(1, `hsla(${hue},100%,52%,0.15)`);
  g.fillStyle = grad;
  g.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? w / 2 - 0.5 : 3.1;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
  g.fill();
  g.fillStyle = "rgba(255,255,255,0.98)";
  g.beginPath();
  g.arc(cx, cy, 2.4, 0, Math.PI * 2);
  g.fill();
  return { c, w, h };
}

function makeWing(): Spr {
  const w = 30;
  const h = 16;
  const { c, g } = mk(w, h);
  const gr = g.createLinearGradient(0, 0, w, 0);
  gr.addColorStop(0, "rgba(255,255,255,0.9)");
  gr.addColorStop(1, "rgba(120,220,255,0.25)");
  g.fillStyle = gr;
  g.beginPath();
  g.ellipse(w / 2, h / 2, w / 2 - 1, h / 2 - 1.5, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,0.9)";
  g.lineWidth = 1;
  g.stroke();
  g.strokeStyle = "rgba(255,255,255,0.45)";
  g.beginPath();
  g.moveTo(2, h / 2);
  g.lineTo(w - 4, h / 2);
  g.stroke();
  return { c, w, h };
}

function makePlayerOrb(): Spr {
  const r = 9;
  const base = gel(185, r);
  const { c, g } = mk(base.w, base.h);
  g.drawImage(base.c, 0, 0, base.w, base.h);
  const cx = base.w / 2;
  const cy = base.h / 2;
  g.fillStyle = "#0a3a78";
  for (const dx of [-3.2, 3.2]) {
    g.beginPath();
    g.ellipse(cx + dx, cy + 1.2, 1.5, 2.2, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = "#fff";
  for (const dx of [-3.6, 2.8]) {
    g.beginPath();
    g.arc(cx + dx, cy + 0.3, 0.6, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = "#0a3a78";
  g.lineWidth = 0.8;
  g.beginPath();
  g.arc(cx, cy + 4.3, 1.8, 0.2 * Math.PI, 0.8 * Math.PI);
  g.stroke();
  return { c, w: base.w, h: base.h };
}

function makeGem(): Spr {
  const w = 12;
  const h = 14;
  const { c, g } = mk(w, h);
  const gr = g.createLinearGradient(0, 0, w, h);
  gr.addColorStop(0, "#ffffff");
  gr.addColorStop(0.5, "#9af6ff");
  gr.addColorStop(1, "#1aa6e8");
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(w / 2, 0.5);
  g.lineTo(w - 1, h * 0.4);
  g.lineTo(w / 2, h - 0.5);
  g.lineTo(1, h * 0.4);
  g.closePath();
  g.fill();
  g.strokeStyle = "rgba(255,255,255,0.95)";
  g.lineWidth = 1;
  g.stroke();
  g.fillStyle = "rgba(255,255,255,0.7)";
  g.beginPath();
  g.moveTo(w / 2, 1.5);
  g.lineTo(w / 2 + 2, h * 0.4);
  g.lineTo(w / 2, h * 0.4);
  g.closePath();
  g.fill();
  return { c, w, h };
}

function makeCloud(w: number, h: number): Spr {
  const { c, g } = mk(w, h);
  for (let i = 0; i < 10; i++) {
    const cx = w * (0.15 + 0.7 * Math.random());
    const cy = h * (0.5 + 0.22 * Math.random());
    const r = h * (0.28 + 0.3 * Math.random());
    const gr = g.createRadialGradient(cx, cy - r * 0.2, 0, cx, cy, r);
    gr.addColorStop(0, "rgba(255,255,255,0.95)");
    gr.addColorStop(0.6, "rgba(240,250,255,0.55)");
    gr.addColorStop(1, "rgba(230,248,255,0)");
    g.fillStyle = gr;
    g.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  return { c, w, h };
}

function makeBgBubble(): Spr {
  const d = 64;
  const { c, g } = mk(d, d);
  const r = 29;
  const gr = g.createRadialGradient(d / 2, d / 2, r * 0.3, d / 2, d / 2, r);
  gr.addColorStop(0, "rgba(255,255,255,0.02)");
  gr.addColorStop(0.8, "rgba(200,245,255,0.18)");
  gr.addColorStop(1, "rgba(255,255,255,0.6)");
  g.fillStyle = gr;
  g.beginPath();
  g.arc(d / 2, d / 2, r, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,0.75)";
  g.lineWidth = 1.5;
  g.stroke();
  g.save();
  g.translate(d / 2 - r * 0.35, d / 2 - r * 0.5);
  g.rotate(-0.6);
  g.fillStyle = "rgba(255,255,255,0.85)";
  g.beginPath();
  g.ellipse(0, 0, r * 0.3, r * 0.14, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
  return { c, w: d, h: d };
}

function makeRays(W: number, H: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = W + 80;
  c.height = H;
  const g = c.getContext("2d")!;
  for (let i = 0; i < 5; i++) {
    const x0 = i * 100 + 10;
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, "rgba(255,255,255,0.5)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(x0, 0);
    g.lineTo(x0 + 34 + (i % 2) * 18, 0);
    g.lineTo(x0 + 34 + 170 + (i % 2) * 40, H);
    g.lineTo(x0 + 120, H);
    g.closePath();
    g.fill();
  }
  return c;
}

export interface Palette {
  name: string;
  sky: [string, string, string];
  hillBack: [string, string];
  hillFront: [string, string];
  stars: boolean;
}
export const PALETTES: Palette[] = [
  { name: "Cielo de Burbujas", sky: ["#0a58c4", "#2b9fe9", "#8de3f7"], hillBack: ["#58d36a", "#1f9a52"], hillFront: ["#9aee5a", "#2fae45"], stars: false },
  { name: "Laguna Cristalina", sky: ["#066a86", "#14b0a6", "#a4f0c0"], hillBack: ["#36c48a", "#0e7a62"], hillFront: ["#7be87a", "#22a060"], stars: false },
  { name: "Crepúsculo Aero", sky: ["#1b2a94", "#5a57d8", "#b9a0f5"], hillBack: ["#3c8fb0", "#1a4c7e"], hillFront: ["#5fd0a8", "#2a7e8e"], stars: true },
  { name: "Aurora Líquida", sky: ["#04162e", "#0b5870", "#2fc9a2"], hillBack: ["#1a7d82", "#0b4052"], hillFront: ["#35b59a", "#126a70"], stars: true },
  { name: "Jardín de Escarcha", sky: ["#123a72", "#4d9fd8", "#e2f7ff"], hillBack: ["#8fd4ef", "#2f7fae"], hillFront: ["#d8f6ff", "#5aa8d8"], stars: false },
  { name: "Prado de Pétalos", sky: ["#3a2a86", "#8f6fd0", "#ffd6f0"], hillBack: ["#7fd08a", "#2c8a52"], hillFront: ["#ffb8e0", "#7ad09a"], stars: false },
  { name: "Arrecife del Trueno", sky: ["#0a1030", "#243a86", "#f0c860"], hillBack: ["#2f5fa8", "#122a5e"], hillFront: ["#58a0d8", "#1c4478"], stars: true },
  { name: "Mar a la Luz de la Luna", sky: ["#05061c", "#1a2460", "#7f8fd8"], hillBack: ["#2c3a7a", "#141c4a"], hillFront: ["#4a5aa8", "#1e2a66"], stars: true },
];

function makeBg(W: number, H: number, p: Palette): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = W * 1;
  c.height = H * 1;
  const g = c.getContext("2d")!;
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, p.sky[0]);
  sky.addColorStop(0.55, p.sky[1]);
  sky.addColorStop(1, p.sky[2]);
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);
  if (p.stars) {
    for (let i = 0; i < 70; i++) {
      g.fillStyle = `rgba(255,255,255,${0.3 + Math.random() * 0.6})`;
      const s = Math.random() * 1.6 + 0.4;
      g.fillRect(Math.random() * W, Math.random() * H * 0.7, s, s);
    }
  }
  // sun glare
  g.globalCompositeOperation = "lighter";
  const sun = g.createRadialGradient(W * 0.82, 30, 0, W * 0.82, 30, 300);
  sun.addColorStop(0, "rgba(255,255,255,0.75)");
  sun.addColorStop(0.2, "rgba(255,245,200,0.35)");
  sun.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = sun;
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = "source-over";
  // hills
  const hill = (top: number, cols: [string, string], a: number, b: number, c2: number, d: number) => {
    const gr = g.createLinearGradient(0, top, 0, H);
    gr.addColorStop(0, cols[0]);
    gr.addColorStop(1, cols[1]);
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(0, a);
    g.bezierCurveTo(W * 0.25, b, W * 0.65, c2, W, d);
    g.lineTo(W, H);
    g.lineTo(0, H);
    g.closePath();
    g.fill();
    // rim light
    g.strokeStyle = "rgba(255,255,255,0.35)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(0, a);
    g.bezierCurveTo(W * 0.25, b, W * 0.65, c2, W, d);
    g.stroke();
  };
  hill(H - 150, p.hillBack, H - 100, H - 165, H - 70, H - 125);
  hill(H - 100, p.hillFront, H - 55, H - 105, H - 28, H - 72);
  // glossy band
  const gl = g.createLinearGradient(0, H - 60, 0, H);
  gl.addColorStop(0, "rgba(255,255,255,0.18)");
  gl.addColorStop(1, "rgba(0,0,0,0.15)");
  g.fillStyle = gl;
  g.fillRect(0, H - 60, W, 60);
  return c;
}

export interface Sprites {
  bullets: Spr[][]; // [size][hue]
  glows: Spr[];
  shotMain: Spr;
  shotOpt: Spr;
  shots: Spr[];
  /** Player shot art per character, built from its shape + hue. */
  charShots: Spr[];
  wing: Spr;
  playerOrb: Spr;
  gem: Spr;
  itemP: Spr;
  itemB: Spr;
  itemL: Spr;
  clouds: Spr[];
  bgBubble: Spr;
  rays: HTMLCanvasElement;
  bgs: HTMLCanvasElement[];
  lifeIcon: Spr;
  bombIcon: Spr;
}

export type ShotArt = "drop" | "orb" | "bolt" | "star";

/** Build one shot sprite in the given shape and hue. */
export function makeShotArt(shape: ShotArt, hue: number): Spr {
  switch (shape) {
    case "bolt":
      return makeBolt(hue);
    case "star":
      return makeStar(hue);
    case "orb":
      return gel(hue, 9);
    default:
      return makeShot(hue);
  }
}

/** Player shot art, one entry per character, from its shape + hue. */
export function buildCharShots(chars: { hue: number; shape: ShotArt; hue2?: number }[]): Spr[] {
  return chars.map((c) => makeShotArt(c.shape, c.shape === "star" ? c.hue2 ?? c.hue : c.hue));
}

export function buildSprites(W: number, H: number): Sprites {
  return {
    bullets: SIZES.map((r) => HUES.map((h) => gel(h, r))),
    glows: [...HUES.map((h) => makeGlow(h)), makeGlow(null)],
    shotMain: makeShot(null),
    shotOpt: makeShot(130),
    shots: [makeShot(null), makeShot(130), makeShot(335), makeShot(48), makeShot(200), makeShot(60), makeShot(265)],
    charShots: [],
    wing: makeWing(),
    playerOrb: makePlayerOrb(),
    gem: makeGem(),
    itemP: gel(215, 9, "P"),
    itemB: gel(130, 9, "B"),
    itemL: gel(340, 9, "♥"),
    clouds: [makeCloud(220, 90), makeCloud(300, 110), makeCloud(180, 70)],
    bgBubble: makeBgBubble(),
    rays: makeRays(W, H),
    bgs: PALETTES.map((p) => makeBg(W, H, p)),
    lifeIcon: gel(340, 6),
    bombIcon: gel(130, 6),
  };
}
