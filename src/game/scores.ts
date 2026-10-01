import { detectLang, LANGS, type Lang } from "./i18n";
import { CHARS, SPEEDS, ZOOMS } from "./config";

export interface ScoreEntry {
  name: string;
  score: number;
  stage: number;
  graze: number;
  date: number;
  diff?: number;
  char?: number;
}

const KEY = "aqua-danmaku-scores-v1";
const NAME_KEY = "aqua-danmaku-name";
const PREF_KEY = "aqua-danmaku-prefs-v2";
const MAX = 10;

export function loadScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as ScoreEntry[];
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((e) => e && typeof e.score === "number")
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX);
  } catch {
    return [];
  }
}

export function addScore(entry: ScoreEntry): { list: ScoreEntry[]; rank: number } {
  const list = [...loadScores(), entry].sort((a, b) => b.score - a.score);
  const rank = list.indexOf(entry);
  const trimmed = list.slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    /* storage unavailable */
  }
  return { list: trimmed, rank: rank < MAX ? rank : -1 };
}

export function loadName(): string {
  try {
    return localStorage.getItem(NAME_KEY) || "AQUA";
  } catch {
    return "AQUA";
  }
}

export function saveName(n: string) {
  try {
    localStorage.setItem(NAME_KEY, n);
  } catch {
    /* ignore */
  }
}

export interface Prefs {
  lang: Lang;
  char: number;
  diff: number;
  /** index into ZOOMS */
  zoom: number;
  /** index into SPEEDS */
  speed: number;
}
export function loadPrefs(): Prefs {
  const def: Prefs = { lang: detectLang(), char: 0, diff: 1, zoom: ZOOMS.length - 1, speed: 0 };
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return def;
    const p = JSON.parse(raw) as Partial<Prefs>;
    return {
      lang: LANGS.some((l) => l.id === p.lang) ? (p.lang as Lang) : def.lang,
      char:
        typeof p.char === "number" && Number.isFinite(p.char)
          ? Math.max(0, Math.min(CHARS.length - 1, Math.floor(p.char)))
          : 0,
      diff: typeof p.diff === "number" && Number.isFinite(p.diff) ? Math.max(0, Math.min(3, Math.floor(p.diff))) : 1,
      zoom:
        typeof p.zoom === "number" && Number.isFinite(p.zoom)
          ? Math.max(0, Math.min(ZOOMS.length - 1, Math.floor(p.zoom)))
          : def.zoom,
      speed:
        typeof p.speed === "number" && Number.isFinite(p.speed)
          ? Math.max(0, Math.min(SPEEDS.length - 1, Math.floor(p.speed)))
          : 0,
    };
  } catch {
    return def;
  }
}
export function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}
