// Synthesised SFX + tiny ambient "aero" music loop. No asset files needed.

type Wave = OscillatorType;
interface ToneOpts {
  slide?: number;
  at?: number;
  bus?: GainNode;
}

const CHORDS = [
  [60, 64, 67, 71], // Cmaj7
  [57, 60, 64, 67], // Am7
  [53, 57, 60, 64], // Fmaj7
  [55, 59, 62, 64], // G6
];
const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export class Sfx {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxBus!: GainNode;
  private musBus!: GainNode;
  private noiseBuf: AudioBuffer | null = null;
  private last: Record<string, number> = {};
  private timer: number | null = null;
  private nextT = 0;
  private step = 0;
  private musicWanted = false;
  /** set when the platform has no usable WebAudio output */
  private unavailable = false;
  muted = false;
  intensity = 0;

  /** Best-effort audio boot. Any failure (no device, blocked autoplay, closed ctx) leaves the game silent instead of throwing. */
  init() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume().catch(() => {});
      return;
    }
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) {
      this.unavailable = true;
      return;
    }
    try {
      const ctx = new AC();
      this.ctx = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.7;
      this.master.connect(ctx.destination);
      this.sfxBus = ctx.createGain();
      this.sfxBus.gain.value = 0.9;
      this.sfxBus.connect(this.master);
      this.musBus = ctx.createGain();
      this.musBus.gain.value = 0.55;
      this.musBus.connect(this.master);
      const len = ctx.sampleRate;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
      this.unavailable = false;
      if (this.musicWanted) this.startTimer();
    } catch {
      // Audio is a nice-to-have: keep playing silently.
      this.ctx = null;
      this.unavailable = true;
      this.stopTimer();
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx && this.master) this.master.gain.value = m ? 0 : 0.7;
  }

  /** Live context, or null when audio is closed/missing (callers then no-op). */
  private get live(): AudioContext | null {
    const c = this.ctx;
    if (!c) return null;
    if (c.state === "closed") {
      this.ctx = null;
      this.stopTimer();
      return null;
    }
    return c;
  }

  private can(name: string, ms: number) {
    const now = performance.now();
    if (now - (this.last[name] || 0) < ms) return false;
    this.last[name] = now;
    return true;
  }

  private tone(freq: number, dur: number, type: Wave, vol: number, o: ToneOpts = {}) {
    const c = this.live;
    if (!c || this.muted || vol <= 0) return;
    try {
      const t = o.at ?? c.currentTime;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g);
      g.connect(o.bus ?? this.sfxBus);
      osc.start(t);
      osc.stop(t + dur + 0.03);
    } catch {
      /* device disappeared mid-call: stay silent */
    }
  }

  private noise(dur: number, vol: number, f0: number, f1: number) {
    const c = this.live;
    if (!c || this.muted || !this.noiseBuf || vol <= 0) return;
    try {
      const t = c.currentTime;
      const src = c.createBufferSource();
      src.buffer = this.noiseBuf;
      const f = c.createBiquadFilter();
      f.type = "bandpass";
      f.Q.value = 0.8;
      f.frequency.setValueAtTime(f0, t);
      f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
      const g = c.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.sfxBus);
      src.start(t);
      src.stop(t + dur + 0.02);
    } catch {
      /* ignore */
    }
  }

  // ---- sfx ----
  shoot() {
    if (this.can("shoot", 75)) this.tone(900, 0.05, "triangle", 0.018, { slide: 1500 });
  }
  hit() {
    if (this.can("hit", 55)) this.tone(520 + Math.random() * 120, 0.04, "square", 0.012);
  }
  pop(big = false) {
    if (big) {
      this.tone(180, 0.35, "sine", 0.22, { slide: 900 });
      this.noise(0.5, 0.18, 2500, 300);
    } else if (this.can("pop", 25)) {
      this.tone(320 + Math.random() * 100, 0.13, "sine", 0.16, { slide: 1100 });
      this.noise(0.1, 0.06, 3500, 900);
    }
  }
  graze(combo: number) {
    if (this.can("graze", 35)) this.tone(1500 + Math.min(combo, 40) * 35, 0.04, "sine", 0.035);
  }
  pickup() {
    if (this.can("pickup", 30)) this.tone(1200, 0.08, "sine", 0.06, { slide: 1900 });
  }
  powerUp() {
    const c = this.ctx;
    if (!c) return;
    [784, 988, 1319].forEach((f, i) => this.tone(f, 0.18, "sine", 0.09, { at: c.currentTime + i * 0.06 }));
  }
  bomb() {
    const c = this.ctx;
    this.noise(1.1, 0.3, 300, 5000);
    this.tone(160, 0.9, "sawtooth", 0.07, { slide: 900 });
    if (c) [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.4, "sine", 0.07, { at: c.currentTime + i * 0.07 }));
  }
  death() {
    this.tone(700, 0.7, "sawtooth", 0.11, { slide: 70 });
    this.noise(0.6, 0.25, 4000, 200);
  }
  warn() {
    const c = this.ctx;
    if (!c) return;
    for (let i = 0; i < 4; i++) this.tone(i % 2 ? 330 : 247, 0.3, "square", 0.05, { at: c.currentTime + i * 0.35 });
  }
  spell() {
    const c = this.ctx;
    if (!c) return;
    this.tone(400, 0.6, "sine", 0.1, { slide: 1600 });
    [1047, 1319, 1568].forEach((f, i) => this.tone(f, 0.3, "triangle", 0.05, { at: c.currentTime + 0.25 + i * 0.08 }));
  }
  clear() {
    const c = this.ctx;
    if (!c) return;
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) =>
      this.tone(f, 0.5, "sine", 0.09, { at: c.currentTime + i * 0.09 })
    );
  }
  over() {
    const c = this.ctx;
    if (!c) return;
    [523, 440, 349, 262].forEach((f, i) => this.tone(f, 0.5, "triangle", 0.1, { at: c.currentTime + i * 0.18 }));
  }
  click() {
    this.tone(880, 0.08, "sine", 0.08, { slide: 1320 });
  }

  // ---- music ----
  music(on: boolean) {
    this.musicWanted = on;
    if (!this.ctx) return;
    if (on) this.startTimer();
    else this.stopTimer();
  }
  private startTimer() {
    if (this.timer !== null || this.unavailable || !this.live) return;
    this.nextT = (this.ctx as AudioContext).currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), 80);
  }
  private stopTimer() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
  private schedule() {
    const c = this.live;
    if (!c) {
      this.stopTimer();
      return;
    }
    if (this.nextT < c.currentTime - 0.5) this.nextT = c.currentTime + 0.05;
    while (this.nextT < c.currentTime + 0.3) {
      this.playStep(this.nextT, this.step);
      this.nextT += this.intensity > 0 ? 0.17 : 0.21;
      this.step++;
    }
  }
  private playStep(t: number, step: number) {
    if (this.muted) return;
    const bar = Math.floor(step / 8) % 4;
    const s = step % 8;
    const ch = CHORDS[bar];
    const bus = this.musBus;
    const arp = [0, 1, 2, 3, 2, 1, 3, 2][s];
    this.tone(mtof(ch[arp] + (s % 4 === 3 ? 12 : 0)), 0.35, "sine", 0.06, { at: t, bus });
    if (s === 0) {
      this.tone(mtof(ch[0] - 12), 1.5, "sine", 0.1, { at: t, bus });
      ch.forEach((n) => this.tone(mtof(n), 1.6, "triangle", 0.018, { at: t, bus }));
    }
    if (s === 4) this.tone(mtof(ch[0] - 12), 0.6, "sine", 0.06, { at: t, bus });
    if (this.intensity > 0 && s % 2 === 0) this.tone(mtof(ch[(s / 2) % 4] + 24), 0.22, "triangle", 0.035, { at: t, bus });
    if (this.intensity > 0 && (s === 2 || s === 6)) this.noise(0.05, 0.03, 7000, 6000);
  }
}
