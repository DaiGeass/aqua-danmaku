// Real 3D models (three.js) pre-rendered once into turntable sprite frames.
// At runtime the game only does cheap drawImage calls => stable 60fps on mobile.
import {
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  IcosahedronGeometry,
  Mesh,
  MeshPhysicalMaterial,
  OctahedronGeometry,
  OrthographicCamera,
  Scene,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  TorusKnotGeometry,
  Vector3,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
} from "three";
import { gel } from "./sprites";

const TAU = Math.PI * 2;

export interface Frames {
  cv: HTMLCanvasElement[];
  w: number;
  h: number;
}
interface Model {
  root: Group;
  anim: (t: number) => void;
  ext?: number;
}

let renderer: WebGLRenderer | null = null;
let scene: Scene;
let camera: OrthographicCamera;
let failed = false;

function ensure(): boolean {
  if (renderer) return true;
  if (failed) return false;
  try {
    const cv = document.createElement("canvas");
    const r = new WebGLRenderer({ canvas: cv, alpha: true, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
    r.setClearColor(0x000000, 0);
    r.setPixelRatio(1);
    scene = new Scene();
    camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 20);
    camera.position.set(0, 0, 6);
    camera.lookAt(0, 0, 0);
    scene.add(new AmbientLight(0xffffff, 0.85));
    const key = new DirectionalLight(0xffffff, 2.3);
    key.position.set(-2.5, 3.5, 4);
    scene.add(key);
    const rim = new DirectionalLight(0x9af0ff, 1.4);
    rim.position.set(3, -2, -1.5);
    scene.add(rim);
    scene.add(new HemisphereLight(0xdff8ff, 0x48e070, 0.6));
    renderer = r;
    return true;
  } catch {
    failed = true;
    renderer = null;
    return false;
  }
}

function mat(hue: number, l = 0.56, s = 0.92, emis = 0.22) {
  const c = new Color().setHSL((((hue % 360) + 360) % 360) / 360, s, l);
  return new MeshPhysicalMaterial({
    color: c,
    roughness: 0.22,
    metalness: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    emissive: c.clone().multiplyScalar(emis),
  });
}
const darkMat = () => new MeshPhysicalMaterial({ color: 0x0a2a55, roughness: 0.25, clearcoat: 1 });
const whiteMat = () => new MeshPhysicalMaterial({ color: 0xffffff, emissive: 0xaaaaaa, roughness: 0.2 });
const M = (g: BufferGeometry, m: Material) => new Mesh(g, m);

function renderFrames(build: () => Model, n: number, px: number, size: number, fb: [number, number]): Frames {
  if (!ensure() || !renderer) return fallback(fb);
  try {
    const m = build();
    const ext = m.ext ?? 1.05;
    camera.left = -ext;
    camera.right = ext;
    camera.top = ext;
    camera.bottom = -ext;
    camera.updateProjectionMatrix();
    scene.add(m.root);
    renderer.setSize(px, px, false);
    const cv: HTMLCanvasElement[] = [];
    for (let i = 0; i < n; i++) {
      m.anim(i / n);
      renderer.render(scene, camera);
      const c = document.createElement("canvas");
      c.width = px;
      c.height = px;
      c.getContext("2d")!.drawImage(renderer.domElement, 0, 0, px, px);
      cv.push(c);
    }
    scene.remove(m.root);
    m.root.traverse((o) => {
      const me = o as Mesh;
      if (me.isMesh) {
        me.geometry.dispose();
        const mm = me.material as Material | Material[];
        if (Array.isArray(mm)) mm.forEach((x) => x.dispose());
        else mm.dispose();
      }
    });
    return { cv, w: size, h: size };
  } catch {
    failed = true;
    return fallback(fb);
  }
}
function fallback(fb: [number, number]): Frames {
  const s = gel(fb[0], fb[1]);
  return { cv: [s.c], w: s.w, h: s.h };
}

// ---------- geometry helpers ----------
function starGeo(outer: number, inner: number, depth: number, bevel: number, pts = 5) {
  const s = new Shape();
  for (let i = 0; i < pts * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = (i * Math.PI) / pts - Math.PI / 2;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  const g = new ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3 });
  g.center();
  return g;
}
function heartGeo() {
  const s = new Shape();
  s.moveTo(0, -0.6);
  s.bezierCurveTo(-0.15, -0.4, -0.7, -0.15, -0.7, 0.2);
  s.bezierCurveTo(-0.7, 0.6, -0.2, 0.75, 0, 0.4);
  s.bezierCurveTo(0.2, 0.75, 0.7, 0.6, 0.7, 0.2);
  s.bezierCurveTo(0.7, -0.15, 0.15, -0.4, 0, -0.6);
  const g = new ExtrudeGeometry(s, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.09, bevelSize: 0.08, bevelSegments: 4 });
  g.center();
  return g;
}
function petalGeo() {
  const s = new Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.28, 0.1, 0.42, 0.5, 0, 0.85);
  s.bezierCurveTo(-0.42, 0.5, -0.28, 0.1, 0, 0);
  const g = new ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 });
  g.center();
  return g;
}
const PHI = (1 + Math.sqrt(5)) / 2;
const ICO: Vector3[] = [];
for (const a of [-1, 1])
  for (const b of [-PHI, PHI]) ICO.push(new Vector3(0, a, b), new Vector3(a, b, 0), new Vector3(b, 0, a));
ICO.forEach((v) => v.normalize());

function addFace(root: Group, z = 0.53, spread = 0.22) {
  const dark = darkMat();
  for (const s of [-1, 1]) {
    const e = M(new SphereGeometry(0.085, 16, 12), dark);
    e.position.set(s * spread, 0.06, z);
    e.scale.set(0.9, 1.25, 0.6);
    root.add(e);
    const gl = M(new SphereGeometry(0.03, 8, 8), whiteMat());
    gl.position.set(s * spread - 0.025, 0.11, z + 0.05);
    root.add(gl);
  }
}

// ---------- items ----------
function gemModel(hue: number): Model {
  const root = new Group();
  const m = M(new OctahedronGeometry(0.62), mat(hue, 0.64, 1, 0.35));
  m.scale.set(0.85, 1.3, 0.85);
  root.add(m);
  root.rotation.x = 0.35;
  return { root, anim: (t) => (root.rotation.y = t * TAU) };
}
function powerCube(): Model {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const gr = g.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, "#7fd6ff");
  gr.addColorStop(1, "#1770e0");
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  g.strokeStyle = "rgba(255,255,255,0.9)";
  g.lineWidth = 8;
  g.strokeRect(4, 4, 120, 120);
  g.fillStyle = "#fff";
  g.font = "900 88px Arial, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("P", 64, 70);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  const mm = new MeshPhysicalMaterial({ map: tex, roughness: 0.2, clearcoat: 1, emissive: 0x103060, emissiveIntensity: 0.6 });
  const root = new Group();
  root.add(M(new BoxGeometry(0.95, 0.95, 0.95), mm));
  root.rotation.x = 0.5;
  return { root, anim: (t) => (root.rotation.y = t * TAU), ext: 1.1 };
}
function bombStar(): Model {
  const root = new Group();
  root.add(M(starGeo(0.85, 0.42, 0.28, 0.07), mat(130, 0.58, 1, 0.3)));
  root.rotation.x = 0.3;
  return { root, anim: (t) => (root.rotation.y = t * TAU) };
}
function lifeHeart(): Model {
  const root = new Group();
  root.add(M(heartGeo(), mat(340, 0.6, 1, 0.3)));
  root.rotation.x = 0.15;
  return { root, anim: (t) => (root.rotation.y = t * TAU) };
}

// ---------- enemies ----------
function crystalEnemy(hue: number): Model {
  const root = new Group();
  const core = M(new OctahedronGeometry(0.55), mat(hue, 0.6, 1, 0.35));
  core.scale.set(0.8, 1.5, 0.8);
  root.add(core);
  const orb = new Group();
  const om = mat(hue + 25, 0.78, 1, 0.3);
  for (let i = 0; i < 3; i++) {
    const s = M(new OctahedronGeometry(0.16), om);
    const a = (i / 3) * TAU;
    s.position.set(Math.cos(a) * 0.8, Math.sin(i * 2) * 0.15, Math.sin(a) * 0.8);
    orb.add(s);
  }
  root.add(orb);
  root.rotation.x = 0.3;
  return { root, anim: (t) => { core.rotation.y = t * TAU; orb.rotation.y = -t * TAU * 2; } };
}
function urchinEnemy(hue: number): Model {
  const root = new Group();
  root.add(M(new SphereGeometry(0.5, 28, 20), mat(hue)));
  const sm = mat(hue + 25, 0.72, 1, 0.3);
  const geo = new ConeGeometry(0.12, 0.42, 10);
  const up = new Vector3(0, 1, 0);
  for (const d of ICO) {
    const m = M(geo, sm);
    m.position.copy(d).multiplyScalar(0.66);
    m.quaternion.setFromUnitVectors(up, d);
    root.add(m);
  }
  addFace(root);
  root.rotation.x = 0.35;
  return { root, anim: (t) => (root.rotation.y = t * TAU), ext: 1 };
}
function starEnemy(hue: number): Model {
  const root = new Group();
  root.add(M(starGeo(0.85, 0.42, 0.3, 0.07), mat(hue, 0.62, 1, 0.3)));
  root.rotation.x = 0.25;
  return { root, anim: (t) => (root.rotation.y = t * TAU) };
}
function turretEnemy(hue: number): Model {
  const root = new Group();
  root.add(M(new SphereGeometry(0.5, 28, 20), mat(hue)));
  const rm = mat(hue + 25, 0.78, 1, 0.3);
  const r1 = M(new TorusGeometry(0.8, 0.06, 12, 56), rm);
  const r2 = M(new TorusGeometry(0.66, 0.05, 12, 56), rm);
  root.add(r1, r2);
  addFace(root);
  return { root, anim: (t) => { r1.rotation.set(t * TAU, 0.6, 0); r2.rotation.set(1.1, t * TAU, 0.4); } };
}
function mineEnemy(hue: number): Model {
  const root = new Group();
  const body = M(new SphereGeometry(0.52, 26, 20), mat(hue, 0.5, 0.9, 0.28));
  root.add(body);
  const sm = mat(hue + 20, 0.7, 1, 0.3);
  const geo = new ConeGeometry(0.11, 0.34, 8);
  const up = new Vector3(0, 1, 0);
  for (let i = 0; i < ICO.length; i += 2) {
    const m = M(geo, sm);
    m.position.copy(ICO[i]).multiplyScalar(0.62);
    m.quaternion.setFromUnitVectors(up, ICO[i]);
    root.add(m);
  }
  const ring = M(new TorusGeometry(0.78, 0.055, 10, 48), sm);
  ring.rotation.x = Math.PI / 2;
  root.add(ring);
  const lamp = M(new SphereGeometry(0.11, 14, 12), whiteMat());
  lamp.position.set(0, 0, 0.5);
  root.add(lamp);
  return { root, anim: (t) => { root.rotation.y = t * TAU; ring.rotation.z = t * TAU * 2; lamp.scale.setScalar(0.7 + 0.5 * Math.abs(Math.sin(t * TAU * 2))); }, ext: 1 };
}
function towerEnemy(hue: number): Model {
  const root = new Group();
  const m1 = mat(hue, 0.55, 0.9, 0.25);
  const m2 = mat(hue + 22, 0.74, 1, 0.3);
  const base = M(new CylinderGeometry(0.5, 0.62, 0.4, 24), m1);
  base.position.y = -0.5;
  const mid = M(new CylinderGeometry(0.34, 0.44, 0.62, 24), m1);
  mid.position.y = 0.02;
  const top = M(new SphereGeometry(0.3, 24, 18), m2);
  top.position.y = 0.5;
  root.add(base, mid, top);
  const r1 = M(new TorusGeometry(0.62, 0.05, 10, 48), m2);
  r1.rotation.x = Math.PI / 2;
  r1.position.y = 0.1;
  const r2 = M(new TorusGeometry(0.5, 0.045, 10, 48), m2);
  r2.rotation.x = Math.PI / 2;
  r2.position.y = -0.32;
  root.add(r1, r2);
  root.rotation.x = 0.2;
  return { root, anim: (t) => { r1.rotation.z = t * TAU; r2.rotation.z = -t * TAU * 1.4; top.rotation.y = t * TAU; }, ext: 1 };
}
function mantaEnemy(hue: number): Model {
  const root = new Group();
  const m1 = mat(hue, 0.55, 0.9, 0.25);
  const m2 = mat(hue + 20, 0.76, 1, 0.3);
  const body = M(new SphereGeometry(0.4, 24, 18), m1);
  body.scale.set(1.1, 0.5, 1.5);
  root.add(body);
  const wings: Mesh[] = [];
  for (const s of [-1, 1]) {
    const w = M(new SphereGeometry(0.42, 20, 14), m2);
    w.scale.set(1.5, 0.14, 0.7);
    w.position.set(s * 0.62, 0, 0.1);
    root.add(w);
    wings.push(w);
  }
  const tail = M(new ConeGeometry(0.08, 0.7, 10), m1);
  tail.position.set(0, 0, -0.75);
  tail.rotation.x = -Math.PI / 2;
  root.add(tail);
  const dark = darkMat();
  for (const s of [-1, 1]) {
    const e = M(new SphereGeometry(0.055, 10, 8), dark);
    e.position.set(s * 0.18, 0.12, 0.48);
    root.add(e);
  }
  root.rotation.x = 0.45;
  return { root, anim: (t) => { wings.forEach((w, i) => (w.rotation.z = (i ? -1 : 1) * Math.sin(t * TAU) * 0.5)); root.rotation.y = Math.sin(t * TAU) * 0.35; }, ext: 1.35 };
}

// ---------- bosses ----------
function boss0(hue: number): Model {
  const root = new Group();
  root.add(M(new SphereGeometry(0.46, 32, 24), mat(hue)));
  const rm = mat(hue + 20, 0.78, 1, 0.3);
  const a = new Group();
  a.add(M(new TorusGeometry(0.85, 0.05, 12, 72), rm));
  const b = new Group();
  b.add(M(new TorusGeometry(0.7, 0.045, 12, 72), rm));
  for (const s of [-1, 1]) {
    const bead = M(new SphereGeometry(0.1, 14, 12), whiteMat());
    bead.position.set(s * 0.85, 0, 0);
    a.add(bead);
    const bead2 = M(new SphereGeometry(0.08, 14, 12), whiteMat());
    bead2.position.set(0, s * 0.7, 0);
    b.add(bead2);
  }
  root.add(a, b);
  return { root, anim: (t) => { a.rotation.set(t * TAU, 0.5, 0); b.rotation.set(1.0, t * TAU, 0.3); }, ext: 1 };
}
function boss1(hue: number): Model {
  const root = new Group();
  const core = M(new IcosahedronGeometry(0.52, 0), mat(hue, 0.6, 1, 0.3));
  root.add(core);
  const shards = new Group();
  const sm = mat(hue + 30, 0.78, 1, 0.3);
  for (let i = 0; i < 8; i++) {
    const v = new Vector3(i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1).normalize().multiplyScalar(0.82);
    const s = M(new OctahedronGeometry(0.16), sm);
    s.scale.set(0.8, 1.5, 0.8);
    s.position.copy(v);
    s.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), v.clone().normalize());
    shards.add(s);
  }
  root.add(shards);
  root.rotation.x = 0.3;
  return { root, anim: (t) => { core.rotation.y = -t * TAU; shards.rotation.y = t * TAU; }, ext: 1 };
}
function boss2(hue: number): Model {
  const root = new Group();
  root.add(M(new SphereGeometry(0.34, 28, 22), mat(hue, 0.66, 1, 0.3)));
  const knot = M(new TorusKnotGeometry(0.5, 0.13, 140, 16, 2, 3), mat(hue + 30, 0.6, 1, 0.3));
  root.add(knot);
  return { root, anim: (t) => { knot.rotation.y = t * TAU; knot.rotation.x = 0.5; }, ext: 1 };
}
function boss3(hue: number): Model {
  const root = new Group();
  root.add(M(new SphereGeometry(0.45, 32, 24), mat(hue)));
  const crown = new Group();
  const cm = mat(hue + 35, 0.78, 1, 0.3);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU;
    const c = M(new ConeGeometry(0.11, 0.42, 10), cm);
    c.position.set(Math.cos(a) * 0.62, 0.05, Math.sin(a) * 0.62);
    c.rotation.z = -Math.cos(a) * 1.1;
    c.rotation.x = Math.sin(a) * 1.1;
    crown.add(c);
  }
  const ring = M(new TorusGeometry(0.78, 0.05, 12, 72), cm);
  ring.rotation.x = Math.PI / 2;
  crown.add(ring);
  root.add(crown);
  root.rotation.x = 0.45;
  return { root, anim: (t) => (crown.rotation.y = t * TAU), ext: 1 };
}
function boss4(hue: number): Model {
  const root = new Group();
  const core = M(new OctahedronGeometry(0.5, 0), mat(hue, 0.68, 0.8, 0.35));
  root.add(core);
  const spikes = new Group();
  const sm = mat(hue + 15, 0.82, 0.7, 0.3);
  const geo = new ConeGeometry(0.13, 0.62, 8);
  const up = new Vector3(0, 1, 0);
  for (let i = 0; i < 6; i++) {
    const d = new Vector3(Math.cos((i / 6) * TAU), i % 2 ? 0.55 : -0.55, Math.sin((i / 6) * TAU)).normalize();
    const c = M(geo, sm);
    c.position.copy(d).multiplyScalar(0.72);
    c.quaternion.setFromUnitVectors(up, d);
    spikes.add(c);
  }
  root.add(spikes);
  const ring = M(new TorusGeometry(0.88, 0.04, 10, 64), sm);
  ring.rotation.x = Math.PI / 2.4;
  root.add(ring);
  root.rotation.x = 0.3;
  return { root, anim: (t) => { core.rotation.y = t * TAU; spikes.rotation.y = -t * TAU * 0.7; ring.rotation.z = t * TAU; }, ext: 1.05 };
}
function boss5(hue: number): Model {
  const root = new Group();
  root.add(M(new SphereGeometry(0.38, 28, 22), mat(hue + 40, 0.7, 1, 0.3)));
  const petals = new Group();
  const pm = mat(hue, 0.72, 1, 0.28);
  const pg = petalGeo();
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU;
    const p = M(pg, pm);
    p.position.set(Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0);
    p.rotation.z = a - Math.PI / 2;
    p.scale.setScalar(i % 2 ? 0.85 : 1.1);
    petals.add(p);
  }
  root.add(petals);
  const ring = M(new TorusGeometry(0.92, 0.045, 10, 64), mat(hue + 60, 0.78, 1, 0.3));
  root.add(ring);
  root.rotation.x = 0.35;
  return { root, anim: (t) => { petals.rotation.z = t * TAU; ring.rotation.z = -t * TAU * 1.3; }, ext: 1.1 };
}
function boss6(hue: number): Model {
  const root = new Group();
  root.add(M(new SphereGeometry(0.44, 30, 22), mat(hue, 0.6, 1, 0.4)));
  const knot = M(new TorusKnotGeometry(0.62, 0.07, 150, 12, 3, 4), mat(hue + 15, 0.75, 1, 0.45));
  root.add(knot);
  const cubes = new Group();
  const cm = mat(hue - 10, 0.68, 1, 0.35);
  for (let i = 0; i < 5; i++) {
    const c = M(new BoxGeometry(0.16, 0.16, 0.16), cm);
    const a = (i / 5) * TAU;
    c.position.set(Math.cos(a) * 0.9, Math.sin(a * 2) * 0.2, Math.sin(a) * 0.9);
    cubes.add(c);
  }
  root.add(cubes);
  const horn = M(new ConeGeometry(0.12, 0.5, 10), cm);
  horn.position.y = 0.66;
  root.add(horn);
  return { root, anim: (t) => { knot.rotation.y = t * TAU * 1.2; cubes.rotation.y = -t * TAU; horn.rotation.y = t * TAU; }, ext: 1.1 };
}
function boss7(hue: number): Model {
  const root = new Group();
  root.add(M(new SphereGeometry(0.4, 30, 22), mat(hue, 0.62, 0.7, 0.3)));
  const cres = M(new TorusGeometry(0.72, 0.14, 16, 48, Math.PI * 1.25), mat(hue + 20, 0.8, 0.6, 0.35));
  cres.rotation.z = Math.PI * 0.85;
  root.add(cres);
  const stars = new Group();
  const sg = starGeo(0.16, 0.07, 0.06, 0.02);
  const sm = mat(50, 0.75, 1, 0.4);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    const s = M(sg, sm);
    s.position.set(Math.cos(a) * 0.95, Math.sin(a) * 0.95, 0);
    s.rotation.z = a;
    stars.add(s);
  }
  root.add(stars);
  root.rotation.x = 0.3;
  return { root, anim: (t) => { cres.rotation.y = t * TAU * 0.6; stars.rotation.z = -t * TAU; }, ext: 1.15 };
}
/** Boss 8: deep-sea polyp, layered rings of pulsing orbs. */
function boss8(hue: number): Model {
  const root = new Group();
  root.add(M(new SphereGeometry(0.38, 28, 22), mat(hue, 0.6, 1, 0.3)));
  const rings = new Group();
  const rm = mat(hue + 25, 0.72, 1, 0.3);
  for (let i = 0; i < 3; i++) {
    const ring = M(new TorusGeometry(0.5 + i * 0.14, 0.045, 10, 56), rm);
    ring.rotation.x = Math.PI / 2 + i * 0.4;
    ring.rotation.z = i * 0.7;
    rings.add(ring);
  }
  root.add(rings);
  return { root, anim: (t) => { rings.rotation.y = t * TAU * 0.5; rings.rotation.z = t * 0.8; }, ext: 1.1 };
}
/** Boss 9: solar corona, radiating blades over a hot core. */
function boss9(hue: number): Model {
  const root = new Group();
  root.add(M(new SphereGeometry(0.4, 28, 22), mat(hue, 0.5, 1, 0.3)));
  const corona = new Group();
  const cm = mat(hue + 40, 0.82, 1, 0.35);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    const blade = M(new ConeGeometry(0.07, 0.5, 8), cm);
    blade.position.set(Math.cos(a) * 0.6, Math.sin(a) * 0.6, 0);
    blade.rotation.z = a - Math.PI / 2;
    corona.add(blade);
  }
  root.add(corona);
  root.rotation.x = 0.2;
  return { root, anim: (t) => { corona.rotation.z = t * 0.9; corona.scale.setScalar(1 + Math.sin(t * 3) * 0.06); }, ext: 1.05 };
}
/** Boss 10: prism lattice, stacked spinning octahedra. */
function boss10(hue: number): Model {
  const root = new Group();
  const cm = mat(hue, 0.7, 0.9, 0.35);
  const shards = new Group();
  for (let i = 0; i < 4; i++) {
    const s = M(new OctahedronGeometry(0.26 - i * 0.035, 0), cm);
    s.position.y = i * 0.24 - 0.36;
    s.rotation.set(i * 0.5, i * 0.8, 0);
    shards.add(s);
  }
  root.add(shards);
  const ring = M(new TorusGeometry(0.66, 0.04, 10, 60), mat(hue + 50, 0.85, 1, 0.4));
  ring.rotation.x = Math.PI / 2;
  root.add(ring);
  return { root, anim: (t) => { shards.rotation.y = t * TAU * 0.7; ring.rotation.z = t * 1.2; }, ext: 1 };
}
/** Boss 11: silk aurora, interleaved torus loops. */
function boss11(hue: number): Model {
  const root = new Group();
  root.add(M(new SphereGeometry(0.3, 24, 18), mat(hue, 0.68, 1, 0.3)));
  const loops = new Group();
  const lm = mat(hue + 30, 0.8, 0.9, 0.35);
  for (let i = 0; i < 3; i++) {
    const l = M(new TorusGeometry(0.58, 0.055, 12, 64), lm);
    l.rotation.set(Math.PI / 2 + i * 0.9, i * 0.6, i * 1.2);
    loops.add(l);
  }
  root.add(loops);
  return { root, anim: (t) => { loops.rotation.y = t * TAU * 0.45; loops.rotation.z = -t * 0.6; }, ext: 1.05 };
}
/** Boss 12: glacier vault, jagged crystal cluster. */
function boss12(hue: number): Model {
  const root = new Group();
  const cm = mat(hue, 0.72, 0.55, 0.4);
  const cluster = new Group();
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU;
    const len = 0.34 + (i % 3) * 0.16;
    const shard = M(new ConeGeometry(0.09, len, 6), cm);
    shard.position.set(Math.cos(a) * 0.3, Math.sin(a) * 0.3, (i % 2) * 0.1);
    shard.rotation.z = a - Math.PI / 2 + (i % 3) * 0.2;
    cluster.add(shard);
  }
  root.add(M(new IcosahedronGeometry(0.3, 0), cm));
  root.add(cluster);
  root.rotation.x = 0.25;
  return { root, anim: (t) => { cluster.rotation.z = -t * 0.5; root.rotation.y = Math.sin(t) * 0.15; }, ext: 1.1 };
}
/** Boss 13: petal dancer, orbiting blossom petals. */
function boss13(hue: number): Model {
  const root = new Group();
  root.add(M(new SphereGeometry(0.34, 26, 20), mat(hue, 0.66, 1, 0.3)));
  const petals = new Group();
  const pm = mat(hue + 20, 0.84, 0.9, 0.35);
  const pg = new SphereGeometry(0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    const p = M(pg, pm);
    p.scale.set(1, 1.7, 0.5);
    p.position.set(Math.cos(a) * 0.52, Math.sin(a) * 0.52, 0);
    p.rotation.z = a - Math.PI / 2;
    petals.add(p);
  }
  root.add(petals);
  return { root, anim: (t) => { petals.rotation.z = t * 0.7; petals.rotation.y = Math.sin(t * 1.3) * 0.3; }, ext: 1.1 };
}
/** Boss 14: thunder maw, cage of arcs around a charged core. */
function boss14(hue: number): Model {
  const root = new Group();
  root.add(M(new IcosahedronGeometry(0.34, 1), mat(hue, 0.5, 1, 0.35)));
  const cage = new Group();
  const cm = mat(hue + 45, 0.9, 1, 0.4);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI;
    const bar = M(new BoxGeometry(1.15, 0.05, 0.05), cm);
    bar.rotation.z = a;
    cage.add(bar);
  }
  root.add(cage);
  return { root, anim: (t) => { cage.rotation.z = t * 1.4; cage.rotation.y = Math.sin(t * 2) * 0.4; }, ext: 1 };
}
/** Boss 15: drowned moon, eclipsed sphere with a sweeping halo. */
function boss15(hue: number): Model {
  const root = new Group();
  root.add(M(new SphereGeometry(0.42, 30, 24), mat(hue, 0.35, 0.6, 0.4)));
  const halo = M(new TorusGeometry(0.8, 0.09, 14, 72), mat(hue + 15, 0.88, 0.7, 0.35));
  halo.rotation.x = Math.PI / 2;
  root.add(halo);
  const shards = new Group();
  const sm = mat(hue + 60, 0.9, 1, 0.45);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    const s = M(new OctahedronGeometry(0.1, 0), sm);
    s.position.set(Math.cos(a) * 0.9, Math.sin(a) * 0.9, 0);
    shards.add(s);
  }
  root.add(shards);
  return { root, anim: (t) => { halo.rotation.z = t * 0.6; shards.rotation.z = -t * 0.9; root.rotation.y = t * 0.3; }, ext: 1.15 };
}

// ---------- characters ----------
function charModel(idx: number, hue: number): Model {
  const root = new Group();
  root.add(M(new SphereGeometry(0.6, 36, 28), mat(hue, 0.6, 0.95, 0.25)));
  addFace(root);
  const acc = mat(hue + 12, 0.76, 1, 0.3);
  const white = whiteMat();
  const pink = mat(340, 0.75, 1, 0.3);
  for (const s of [-1, 1]) {
    if (idx === 0) {
      const fin = M(new SphereGeometry(0.3, 16, 12), acc);
      fin.scale.set(0.5, 1, 0.25);
      fin.position.set(s * 0.66, -0.05, -0.05);
      fin.rotation.z = -s * 0.5;
      root.add(fin);
    } else if (idx === 1) {
      const leaf = M(new SphereGeometry(0.3, 16, 12), mat(105, 0.5, 0.85, 0.2));
      leaf.scale.set(0.45, 1.1, 0.22);
      leaf.position.set(s * 0.14, 0.82, 0);
      leaf.rotation.z = -s * 0.6;
      root.add(leaf);
    } else if (idx === 2) {
      const ear = M(new ConeGeometry(0.2, 0.55, 16), acc);
      ear.position.set(s * 0.32, 0.72, 0);
      ear.rotation.z = -s * 0.35;
      root.add(ear);
      const inner = M(new ConeGeometry(0.11, 0.36, 12), pink);
      inner.position.set(s * 0.32, 0.7, 0.07);
      inner.rotation.z = -s * 0.35;
      root.add(inner);
    } else if (idx === 3) {
      const wing = M(new SphereGeometry(0.3, 16, 12), white);
      wing.scale.set(1.3, 0.35, 0.3);
      wing.position.set(s * 0.78, 0.12, -0.1);
      wing.rotation.z = s * 0.6;
      root.add(wing);
    } else if (idx === 4) {
      const shard = M(new OctahedronGeometry(0.19), white);
      shard.scale.set(0.7, 1.7, 0.7);
      shard.position.set(s * 0.44, 0.72, 0);
      shard.rotation.z = -s * 0.5;
      root.add(shard);
      const f = M(new ConeGeometry(0.09, 0.3, 8), acc);
      f.position.set(s * 0.2, 0.86, 0);
      root.add(f);
    } else if (idx === 5) {
      const pg = petalGeo();
      const pm = mat(hue + 20, 0.78, 1, 0.3);
      for (let i = 0; i < 3; i++) {
        const p = M(pg, pm);
        const a = s * (0.5 + i * 0.5) + Math.PI / 2;
        p.position.set(Math.cos(a) * 0.62, 0.62 + Math.sin(a) * 0.2, -0.05);
        p.rotation.z = a - Math.PI / 2;
        p.scale.setScalar(0.7);
        root.add(p);
      }
    } else if (idx === 6) {
      const horn = M(new ConeGeometry(0.12, 0.5, 10), mat(hue - 15, 0.68, 1, 0.45));
      horn.position.set(s * 0.28, 0.78, 0);
      horn.rotation.z = -s * 0.4;
      root.add(horn);
    } else if (idx === 8) {
      // Luna: crescent moon ear
      const cres = M(new TorusGeometry(0.22, 0.05, 10, 26, Math.PI * 1.2), white);
      cres.position.set(s * 0.3, 0.78, 0.02);
      cres.rotation.set(0.2, s * 0.5, Math.PI * 0.85);
      root.add(cres);
    } else if (idx === 9) {
      // Nami: wave fin
      const fin = M(new SphereGeometry(0.32, 16, 12), mat(hue + 12, 0.7, 1, 0.3));
      fin.scale.set(0.35, 1.2, 0.2);
      fin.position.set(s * 0.5, -0.1, -0.1);
      fin.rotation.z = -s * 0.8;
      root.add(fin);
      const drop = M(new SphereGeometry(0.11, 12, 10), white);
      drop.position.set(s * 0.5, 0.82, 0.1);
      root.add(drop);
    } else if (idx === 10) {
      // Sol: sun ray spikes
      const ray = M(new ConeGeometry(0.09, 0.42, 8), mat(hue, 0.8, 1, 0.55));
      ray.position.set(s * 0.34, 0.8, 0);
      ray.rotation.z = -s * 0.35;
      root.add(ray);
      const ray2 = M(new ConeGeometry(0.07, 0.3, 8), mat(hue + 15, 0.8, 1, 0.5));
      ray2.position.set(s * 0.54, 0.6, -0.05);
      ray2.rotation.z = -s * 0.9;
      root.add(ray2);
    } else if (idx === 11) {
      // Yuki: snowflake crystals
      const cg = new OctahedronGeometry(0.2);
      for (let i = 0; i < 3; i++) {
        const f = M(cg, white);
        f.scale.set(0.5, 1.5, 0.5);
        f.position.set(s * (0.2 + i * 0.16), 0.84, -i * 0.06);
        f.rotation.z = (i - 1) * 0.4;
        root.add(f);
      }
    } else if (idx === 12) {
      // Akari: flame tufts
      const fl = M(new ConeGeometry(0.15, 0.5, 10), mat(hue, 0.72, 1, 0.55));
      fl.position.set(s * 0.26, 0.8, 0);
      fl.rotation.z = -s * 0.3;
      root.add(fl);
      const fl2 = M(new ConeGeometry(0.1, 0.34, 10), mat(45, 0.8, 1, 0.6));
      fl2.position.set(s * 0.44, 0.66, 0.05);
      fl2.rotation.z = -s * 0.7;
      root.add(fl2);
    } else if (idx === 13) {
      // Kaze: wind swirl blades
      const bl = M(new SphereGeometry(0.34, 16, 12), mat(hue + 15, 0.72, 0.9, 0.3));
      bl.scale.set(1.3, 0.32, 0.22);
      bl.position.set(s * 0.56, 0.16, -0.12);
      bl.rotation.z = s * 0.35;
      root.add(bl);
    } else if (idx === 14) {
      // Kumo: soft cloud puffs
      for (let i = 0; i < 2; i++) {
        const p = M(new SphereGeometry(0.24, 14, 10), mat(hue + 10 * i, 0.8, 0.7, 0.28));
        p.scale.set(1.2, 0.9, 1);
        p.position.set(s * (0.34 + i * 0.22), 0.72 + i * 0.12, -0.05);
        root.add(p);
      }
    } else if (idx === 15) {
      // Hoshi: star antennae
      const st = M(starGeo(0.2, 0.09, 0.07, 0.03), mat(hue, 0.8, 1, 0.6));
      st.position.set(s * 0.28, 0.86, 0);
      st.rotation.z = s * 0.4;
      root.add(st);
    } else {
      const wing = M(new SphereGeometry(0.26, 16, 12), mat(hue + 25, 0.4, 0.6, 0.3));
      wing.scale.set(1.1, 0.5, 0.2);
      wing.position.set(s * 0.62, -0.1, -0.2);
      wing.rotation.z = s * 0.7;
      root.add(wing);
    }
  }
  if (idx === 3) {
    const halo = M(new TorusGeometry(0.36, 0.05, 12, 40), mat(50, 0.7, 1, 0.5));
    halo.position.y = 0.93;
    halo.rotation.x = Math.PI / 2 - 0.25;
    root.add(halo);
  }
  if (idx === 4) {
    const ring = M(new TorusGeometry(0.86, 0.035, 10, 56), whiteMat());
    ring.rotation.x = Math.PI / 2.2;
    root.add(ring);
  }
  if (idx === 6) {
    const bolt = M(new TorusKnotGeometry(0.78, 0.04, 110, 10, 2, 3), mat(hue, 0.72, 1, 0.5));
    root.add(bolt);
  }
  if (idx === 7) {
    const cres = M(new TorusGeometry(0.85, 0.11, 14, 40, Math.PI * 1.15), mat(hue + 15, 0.75, 0.8, 0.35));
    cres.rotation.z = Math.PI * 0.9;
    cres.position.z = -0.25;
    root.add(cres);
    const st = M(starGeo(0.13, 0.06, 0.05, 0.02), mat(50, 0.78, 1, 0.5));
    st.position.set(0.5, 0.62, 0.2);
    root.add(st);
  }
  if (idx === 8) {
    // Luna: orbit ring of two moons
    for (let i = 0; i < 2; i++) {
      const orb = M(new SphereGeometry(0.12, 14, 10), mat(320 + i * 20, 0.8, 0.7, 0.5));
      orb.position.set(i ? 0.82 : -0.82, i ? 0.4 : -0.3, -0.2);
      root.add(orb);
    }
    const ring = M(new TorusGeometry(0.9, 0.028, 10, 56), mat(hue, 0.7, 1, 0.45));
    ring.rotation.set(Math.PI / 2.4, 0, 0.3);
    root.add(ring);
  }
  if (idx === 9) {
    const crest = M(new TorusGeometry(0.8, 0.045, 10, 48, Math.PI), mat(hue + 10, 0.75, 1, 0.4));
    crest.rotation.set(Math.PI / 2.6, 0, 0);
    crest.position.z = -0.2;
    root.add(crest);
  }
  if (idx === 10) {
    const corona = M(new TorusGeometry(0.92, 0.06, 12, 48), mat(hue + 8, 0.8, 1, 0.6));
    corona.rotation.x = Math.PI / 2 - 0.3;
    corona.position.y = 0.1;
    root.add(corona);
  }
  if (idx === 11) {
    const ring = M(new TorusGeometry(0.88, 0.03, 10, 56), white);
    ring.rotation.x = Math.PI / 2.3;
    root.add(ring);
  }
  if (idx === 12) {
    const halo = M(new TorusGeometry(0.84, 0.05, 12, 44), mat(20, 0.8, 1, 0.6));
    halo.rotation.set(Math.PI / 2 - 0.2, 0, 0);
    halo.position.z = -0.2;
    root.add(halo);
  }
  if (idx === 13) {
    for (let i = 0; i < 2; i++) {
      const swirl = M(new TorusGeometry(0.62 + i * 0.24, 0.028, 10, 40, Math.PI * 1.3), mat(hue + 12, 0.75, 1, 0.4));
      swirl.rotation.set(Math.PI / 2, 0, i * 0.8);
      root.add(swirl);
    }
  }
  if (idx === 14) {
    const puff = M(new SphereGeometry(0.42, 16, 12), mat(hue + 8, 0.85, 0.55, 0.25));
    puff.scale.set(1.3, 0.85, 1);
    puff.position.set(0, 0.95, -0.35);
    root.add(puff);
  }
  if (idx === 15) {
    const band = M(new TorusKnotGeometry(0.82, 0.035, 120, 8, 2, 5), mat(hue, 0.78, 1, 0.55));
    root.add(band);
  }
  root.rotation.x = 0.12;
  return { root, anim: (t) => (root.rotation.y = t * TAU), ext: 1.2 };
}

// ---------- public API (cached) ----------
const cache = new Map<string, Frames>();
function cached(key: string, f: () => Frames) {
  let v = cache.get(key);
  if (!v) {
    v = f();
    cache.set(key, v);
  }
  return v;
}

export interface ItemFrames {
  gem: Frames;
  power: Frames;
  bomb: Frames;
  life: Frames;
}
export function itemFrames(): ItemFrames {
  return {
    gem: cached("gem", () => renderFrames(() => gemModel(190), 16, 48, 17, [190, 5])),
    power: cached("power", () => renderFrames(powerCube, 16, 64, 26, [215, 9])),
    bomb: cached("bomb", () => renderFrames(bombStar, 16, 64, 27, [130, 9])),
    life: cached("life", () => renderFrames(lifeHeart, 16, 64, 26, [340, 9])),
  };
}

export type Enemy3D = "crystal" | "urchin" | "star" | "turret" | "mine" | "tower" | "manta";
export function enemyFrames(kind: Enemy3D, hue: number): Frames {
  return cached(`e-${kind}-${hue}`, () => {
    switch (kind) {
      case "crystal": return renderFrames(() => crystalEnemy(hue), 16, 96, 46, [hue, 12]);
      case "urchin": return renderFrames(() => urchinEnemy(hue), 16, 112, 54, [hue, 17]);
      case "star": return renderFrames(() => starEnemy(hue), 16, 96, 46, [hue, 14]);
      case "mine": return renderFrames(() => mineEnemy(hue), 16, 112, 56, [hue, 17]);
      case "tower": return renderFrames(() => towerEnemy(hue), 16, 128, 66, [hue, 21]);
      case "manta": return renderFrames(() => mantaEnemy(hue), 16, 140, 70, [hue, 20]);
      default: return renderFrames(() => turretEnemy(hue), 16, 120, 60, [hue, 20]);
    }
  });
}

const BOSS_MODELS = [boss0, boss1, boss2, boss3, boss4, boss5, boss6, boss7, boss8, boss9, boss10, boss11, boss12, boss13, boss14, boss15];

export function bossFrames(idx: number, hue: number): Frames {
  return cached(`boss-${idx}-${hue}`, () => {
    const b = BOSS_MODELS[idx % BOSS_MODELS.length];
    return renderFrames(() => b(hue), 24, 224, 124, [hue, 28]);
  });
}

export function charFrames(idx: number, hue: number): Frames {
  return cached(`char-${idx}`, () => renderFrames(() => charModel(idx, hue), 16, 96, 44, [hue, 10]));
}
