import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Game, type GameResult, type GameState } from "./game/engine";
import { addScore, loadName, loadPrefs, loadScores, saveName, savePrefs, type ScoreEntry } from "./game/scores";
import { charT, diffDescT, diffT, LANGS, RTL, shotT, tr, type Lang } from "./game/i18n";
import { CHARS, DIFFS } from "./game/config";
import { charFrames } from "./game/models3d";

interface OverInfo extends GameResult {
  rank: number;
  date: number;
  record: boolean;
}

type TFn = (key: string, vars?: Record<string, string | number>) => string;
const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

function ScoreTable({ scores, highlight, limit = 8, t }: { scores: ScoreEntry[]; highlight?: number; limit?: number; t: TFn }) {
  const rows = scores.slice(0, limit);
  if (rows.length === 0) return <p className="empty">{t("noScores")}</p>;
  return (
    <ol className="score-table">
      {rows.map((s, i) => {
        const d = DIFFS[s.diff ?? 1] ?? DIFFS[1];
        const c = CHARS[s.char ?? 0] ?? CHARS[0];
        return (
          <li key={s.date + "-" + i} className={s.date === highlight ? "hl" : ""}>
            <span className="rk">{i + 1}</span>
            <span className="nm">{s.name}</span>
            <span className="cdot" style={{ background: `hsl(${c.hue} 95% 62%)` }} title={c.id} />
            <span className="dtag" style={{ background: d.color }} title={d.id}>
              {d.id[0].toUpperCase()}
            </span>
            <span className="st">S{s.stage}</span>
            <span className="sc">{fmt(s.score)}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Bokeh() {
  const dots = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        left: (i * 53) % 100,
        size: 30 + ((i * 37) % 90),
        dur: 14 + ((i * 7) % 16),
        delay: -((i * 5) % 20),
      })),
    []
  );
  return (
    <div className="bokeh" aria-hidden>
      {dots.map((d, i) => (
        <span key={i} style={{ left: `${d.left}%`, width: d.size, height: d.size, animationDuration: `${d.dur}s`, animationDelay: `${d.delay}s` }} />
      ))}
    </div>
  );
}

/** Turntable of the pre-rendered 3D character model. */
function CharPreview({ idx, active, size = 72 }: { idx: number; active: boolean; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const fr = charFrames(idx, CHARS[idx].hue);
    const g = cv.getContext("2d")!;
    const draw = (i: number) => {
      g.clearRect(0, 0, cv.width, cv.height);
      g.drawImage(fr.cv[i % fr.cv.length], 0, 0, cv.width, cv.height);
    };
    draw(0);
    if (!active) return;
    let i = 0;
    const id = window.setInterval(() => {
      i = (i + 1) % Math.max(1, fr.cv.length);
      draw(i);
    }, 95);
    return () => clearInterval(id);
  }, [idx, active]);
  return <canvas ref={ref} width={96} height={96} style={{ width: size, height: size }} className="char-cv" />;
}

function Stat({ label, v }: { label: string; v: number }) {
  return (
    <div className="stat-row">
      <span>{label}</span>
      <div className="bar">
        {[1, 2, 3, 4, 5].map((i) => (
          <i key={i} className={i <= v ? "on" : ""} />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const prefs0 = useMemo(() => loadPrefs(), []);
  const nameRef = useRef(loadName());
  const mutedRef = useRef(false);

  const [screen, setScreen] = useState<GameState>("menu");
  const [view, setView] = useState<"main" | "select">("main");
  const [scores, setScores] = useState<ScoreEntry[]>(() => loadScores());
  const [over, setOver] = useState<OverInfo | null>(null);
  const [name, setName] = useState(nameRef.current);
  const [muted, setMuted] = useState(false);
  const [lang, setLang] = useState<Lang>(prefs0.lang);
  const [char, setChar] = useState(prefs0.char);
  const [diff, setDiff] = useState(prefs0.diff);

  const t: TFn = useCallback((k, v) => tr(lang, k, v), [lang]);
  const rtl = RTL[lang];

  useEffect(() => {
    const game = new Game(canvasRef.current!, rootRef.current!, {
      onState: (s) => setScreen(s),
      onOver: (r) => {
        let rank = -1;
        let date = 0;
        let list = loadScores();
        const prevBest = list[0]?.score ?? 0;
        if (r.score > 0) {
          date = Date.now();
          const res = addScore({
            name: nameRef.current || "AQUA",
            score: r.score,
            stage: r.stage,
            graze: r.graze,
            date,
            diff: r.diff,
            char: r.char,
          });
          list = res.list;
          rank = res.rank;
        }
        setScores(list);
        game.setHi(list[0]?.score ?? 0);
        setOver({ ...r, rank, date, record: r.score > 0 && r.score > prevBest });
      },
    });
    game.setHi(loadScores()[0]?.score ?? 0);
    gameRef.current = game;
    const onMute = () => {
      mutedRef.current = !mutedRef.current;
      game.setMuted(mutedRef.current);
      setMuted(mutedRef.current);
    };
    window.addEventListener("game-mute-toggle", onMute);
    return () => {
      window.removeEventListener("game-mute-toggle", onMute);
      game.destroy();
      gameRef.current = null;
    };
  }, []);

  useEffect(() => {
    gameRef.current?.setLang(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL[lang] ? "rtl" : "ltr";
  }, [lang]);
  useEffect(() => {
    gameRef.current?.configure(char, diff);
    savePrefs({ lang, char, diff });
  }, [lang, char, diff]);

  const g = () => gameRef.current;
  const start = useCallback(() => {
    saveName(nameRef.current);
    setOver(null);
    const game = gameRef.current;
    if (!game) return;
    game.configure(char, diff);
    game.start();
  }, [char, diff]);
  const toMenu = useCallback(() => {
    setOver(null);
    setView("main");
    g()?.toMenu();
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (screen !== "menu") return;
      const tg = e.target as HTMLElement | null;
      if (tg && tg.tagName === "INPUT") return;
      const cols = 4;
      if (e.key === "Enter" || e.code === "Space") {
        e.preventDefault();
        gameRef.current?.ui();
        if (view === "main") setView("select");
        else start();
      } else if (e.key === "Escape" && view === "select") {
        setView("main");
      } else if (view === "select") {
        if (e.key === "ArrowLeft") setChar((c) => (c + CHARS.length - (rtl ? -1 : 1)) % CHARS.length);
        else if (e.key === "ArrowRight") setChar((c) => (c + (rtl ? -1 : 1) + CHARS.length) % CHARS.length);
        else if (e.key === "ArrowUp") setChar((c) => (c - cols + CHARS.length) % CHARS.length);
        else if (e.key === "ArrowDown") setChar((c) => (c + cols) % CHARS.length);
        else if (e.key === "Tab") {
          e.preventDefault();
          setDiff((d) => (d + (e.shiftKey ? DIFFS.length - 1 : 1)) % DIFFS.length);
        }
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [screen, view, start, rtl]);

  const toggleMute = () => window.dispatchEvent(new CustomEvent("game-mute-toggle"));
  const noFocus = (e: React.MouseEvent) => e.preventDefault();
  const playing = screen === "playing";
  const cdef = CHARS[char];

  return (
    <div ref={rootRef} className="aero-root" dir={rtl ? "rtl" : "ltr"}>
      <Bokeh />
      <div className="hill" aria-hidden />
      <canvas ref={canvasRef} className="game-canvas" />

      {screen !== "playing" && (
        <div data-ui className="lang-switch">
          {LANGS.map((l) => (
            <button
              key={l.id}
              tabIndex={-1}
              onMouseDown={noFocus}
              className={l.id === lang ? "on" : ""}
              onClick={() => {
                g()?.ui();
                setLang(l.id);
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}

      <div data-ui className="hud-btns">
        <button tabIndex={-1} onMouseDown={noFocus} className="round-btn" onClick={toggleMute} aria-label="Mute">
          {muted ? "🔇" : "🔊"}
        </button>
        {(playing || screen === "paused") && (
          <button tabIndex={-1} onMouseDown={noFocus} className="round-btn" onClick={() => g()?.togglePause()} aria-label="Pause">
            {playing ? "⏸" : "▶"}
          </button>
        )}
      </div>

      {playing && (
        <button
          data-ui
          tabIndex={-1}
          onPointerDown={(e) => {
            e.stopPropagation();
            e.currentTarget.setPointerCapture(e.pointerId);
            g()?.setTouchFocus(true);
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            g()?.setTouchFocus(false);
          }}
          onPointerCancel={() => g()?.setTouchFocus(false)}
          className="focus-btn"
          aria-label={t("select.focus")}
        >
          <span>◎</span>
          <small>{t("select.focus")}</small>
        </button>
      )}

      {playing && (
        <button
          data-ui
          tabIndex={-1}
          onMouseDown={noFocus}
          onPointerDown={(e) => {
            e.stopPropagation();
            g()?.bomb();
          }}
          className="bomb-btn"
          aria-label="Bomb"
        >
          <span>💧</span>
          <small>{t("bombBtn")}</small>
        </button>
      )}

      {/* ---------- MAIN MENU ---------- */}
      {screen === "menu" && view === "main" && (
        <div className="overlay" data-ui>
          <div className="panel menu-panel">
            <div className="logo-wrap">
              <h1 className="logo">
                Aqua<span>Danmaku</span>
              </h1>
              <p className="tagline">{t("tag")}</p>
            </div>

            <div className="char-strip">
              {CHARS.map((c, i) => (
                <CharPreview key={c.id} idx={i} active={i === char} size={40} />
              ))}
            </div>

            <label className="name-field">
              <span>{t("pilot")}</span>
              <input
                value={name}
                maxLength={10}
                spellCheck={false}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase();
                  setName(v);
                  nameRef.current = v;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    (e.target as HTMLInputElement).blur();
                    setView("select");
                  }
                }}
              />
            </label>

            <button
              tabIndex={-1}
              onMouseDown={noFocus}
              className="gel gel-big"
              onClick={() => {
                g()?.ui();
                setView("select");
              }}
            >
              {t("play")}
            </button>

            <div className="howto">
              <p>{t("how.move")}</p>
              <p>{t("how.focus")}</p>
              <p>{t("how.mode")}</p>
              <p>{t("how.misc")}</p>
              <p className="dim">{t("how.tip")}</p>
            </div>

            <h2 className="sect">{t("scores")}</h2>
            <ScoreTable scores={scores} limit={6} t={t} />
          </div>
        </div>
      )}

      {/* ---------- SELECT ---------- */}
      {screen === "menu" && view === "select" && (
        <div className="overlay" data-ui>
          <div className="panel select-panel">
            <h2 className="title-md">{t("select.title")}</h2>

            <div className="char-grid">
              {CHARS.map((c, i) => (
                <button
                  key={c.id}
                  tabIndex={-1}
                  onMouseDown={noFocus}
                  className={"char-card" + (i === char ? " sel" : "")}
                  onClick={() => {
                    g()?.ui();
                    setChar(i);
                  }}
                >
                  <CharPreview idx={i} active={i === char} size={62} />
                  <b>{charT(lang, i, 0)}</b>
                </button>
              ))}
            </div>

            <div className="char-detail">
              <p className="desc">{charT(lang, char, 1)}</p>
              <p className="bomb-line">
                💧 {t("bombLabel")}: <b>{charT(lang, char, 2)}</b>
              </p>
              <p className="modes-line">
                ✦ {t("modes")}: <span className="pips"><i /><i /><i /><i /></span> 1 → 4
              </p>
              <p className="shot-line">
                <b>{t("select.wide")}</b> {shotT(lang, char, 0)}
              </p>
              <p className="shot-line">
                <b>{t("select.focus")}</b> {shotT(lang, char, 1)}
              </p>
              <div className="stats-box">
                <Stat label={t("stat.power")} v={cdef.stats[0]} />
                <Stat label={t("stat.speed")} v={cdef.stats[1]} />
                <Stat label={t("stat.control")} v={cdef.stats[2]} />
              </div>
            </div>

            <h3 className="sect-sm">{t("select.diff")}</h3>
            <div className="diff-row">
              {DIFFS.map((d, i) => (
                <button
                  key={d.id}
                  tabIndex={-1}
                  onMouseDown={noFocus}
                  className={"diff-chip" + (i === diff ? " sel" : "")}
                  style={{ ["--c" as string]: d.color }}
                  onClick={() => {
                    g()?.ui();
                    setDiff(i);
                  }}
                >
                  {diffT(lang, i)}
                </button>
              ))}
            </div>
            <p className="dim center">{diffDescT(lang, diff)}</p>

            <div className="btn-col">
              <button tabIndex={-1} onMouseDown={noFocus} className="gel gel-green gel-big" onClick={() => start()}>
                {t("select.start")}
              </button>
              <button tabIndex={-1} onMouseDown={noFocus} className="gel gel-pink" onClick={() => { g()?.ui(); setView("main"); }}>
                {t("back")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- PAUSE ---------- */}
      {screen === "paused" && (
        <div className="overlay dim-bg" data-ui>
          <div className="panel small-panel">
            <h2 className="title-lg">{t("pause")}</h2>
            <div className="btn-col">
              <button tabIndex={-1} onMouseDown={noFocus} className="gel" onClick={() => g()?.resume()}>
                {t("resume")}
              </button>
              <button tabIndex={-1} onMouseDown={noFocus} className="gel gel-green" onClick={() => start()}>
                {t("restart")}
              </button>
              <button tabIndex={-1} onMouseDown={noFocus} className="gel gel-pink" onClick={toMenu}>
                {t("menu")}
              </button>
            </div>
            <p className="dim center">{t("hint.pause")}</p>
          </div>
        </div>
      )}

      {/* ---------- GAME OVER ---------- */}
      {screen === "over" && over && (
        <div className="overlay dim-bg" data-ui>
          <div className="panel small-panel">
            <h2 className="title-lg pop">{t("over")}</h2>
            {over.record && <div className="badge">{t("record")}</div>}
            <div className="final-score">{fmt(over.score)}</div>
            <div className="stats">
              <span>{t("stage")} <b>{over.stage}</b></span>
              <span>{t("graze")} <b>{over.graze}</b></span>
              {over.rank >= 0 && <span>{t("rank")} <b>#{over.rank + 1}</b></span>}
            </div>
            <div className="stats">
              <span className="dtag" style={{ background: DIFFS[over.diff].color }}>{diffT(lang, over.diff)}</span>
              <span className="cdot" style={{ background: `hsl(${CHARS[over.char].hue} 95% 62%)` }} />
              <span>{charT(lang, over.char, 0)}</span>
            </div>
            <ScoreTable scores={scores} highlight={over.date} limit={6} t={t} />
            <div className="btn-col">
              <button tabIndex={-1} onMouseDown={noFocus} className="gel gel-green gel-big" onClick={() => start()}>
                {t("again")}
              </button>
              <button tabIndex={-1} onMouseDown={noFocus} className="gel gel-pink" onClick={toMenu}>
                {t("menu")}
              </button>
            </div>
            <p className="dim center">{t("hint.over")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
