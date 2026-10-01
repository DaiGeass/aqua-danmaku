# Aqua Danmaku

A Frutiger Aero bullet hell in the spirit of classic shmups: 16 playable spirits, one distinct
shot pattern and one distinct bomb each, escalating spell-card boss fights, and endless score
chasing. Everything is drawn procedurally (Canvas 2D sprites + pre-rendered 3D models) and all
sound is synthesised at runtime with the Web Audio API, so the game ships as a single self-contained
binary with no asset files.

## Play

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move | WASD / Arrow keys | drag one finger |
| Focused shot (precise + slower) | hold Shift | hold the ◎ button |
| Bomb | X / K / Space | 💧 button, or a second finger |
| Pause | P / Esc | ⏸ button |
| Restart | R | ↻ button |
| Mute | M | 🔊 button |
| Zoom (see more field) | — | 🔍 button |
| Speed (slow the game down) | — | 🐌 button |

Shots fire automatically. Graze enemy bullets to build combo and raise your score multiplier; the
pink dot is your actual hitbox. Power rises from 1 to 4 as you collect items, and every character
has a different pattern at each level.

## Accessibility buttons

Two assists sit in the top-left corner next to the mute button, both available at any time and
remembered between sessions:

| Button | Levels | Effect |
| --- | --- | --- |
| 🔍 | 5 steps, 62% → 100% | Scales the play field down so you see further ahead. At the lowest step the whole 480×640 arena plus margin fits on screen, which gives you more reaction time against dense patterns. The red badge shows the step. |
| 🐌 | 4 steps, 100% / 85% / 70% / 55% | Slows the entire simulation, not just the bullets. Enemy movement, boss phases, your own shots and timers all scale together, so patterns stay readable instead of just getting sparser. The badge shows the percentage. |

Slow motion stacks with the existing bomb hit-stop rather than replacing it, and both work the same
on Windows and Linux since they only touch the game loop, never the build.

## Install

Grab a build from the Releases page:

- **Windows** — `.exe` (NSIS installer) or `.msi`
- **Linux** — `.AppImage` or `.deb`

```bash
# Debian / Ubuntu
sudo apt install ./aqua-danmaku_*_amd64.deb

# AppImage
chmod +x aqua-danmaku_*_amd64.AppImage
./aqua-danmaku_*_amd64.AppImage
```

Linux needs the usual Tauri runtime libraries on older distros:

```bash
sudo apt install libwebkit2gtk-4.1-0 libgtk-3-0 libayatana-appindicator3-1
```

## Build from source

Requirements: Node 20+, Rust 1.77+, and the Tauri v2 system dependencies
(`webkit2gtk-4.1`, `gtk3`, `libsoup3`, plus `patchelf`, `appimagetool` and `linuxdeploy` style
tooling for `.deb`/`.AppImage` bundling).

```bash
npm install
npm run dev            # browser dev server
npx tauri dev          # desktop dev window
npx tauri build        # native bundles in src-tauri/target/release/bundle
```

Cross-compiling Windows bundles from Linux is not supported; CI builds Windows on a Windows runner
and Linux on an Ubuntu runner (see `.github/workflows/release.yml`). Push a `v*` tag to publish
signed installer artifacts on the Releases page.

## Characters

Each pilot has three things that make them feel different: a hitbox size, a bomb, and a signature
mechanic layered on top of their shot pattern.

| # | Pilot | Hitbox | Bomb | Signature shot | Unique mechanic |
| --- | --- | --- | --- | --- | --- |
| 0 | Mizu | 3.0 | Splash Wave | steady bubble stream + radial pulse | lances gain extra pierce and split every 2nd volley |
| 1 | Kiwi | 2.6 | Leaf Storm | wide fan → piercing needles | shots ricochet off the side walls |
| 2 | Momo | 3.2 | Heart Burst | homing bubbles | every shot seeks, not just every 3rd volley |
| 3 | Sora | 2.8 | Starfall | wavy twin streams, high speed | +12% movement speed while unfocused |
| 4 | Kori | 3.4 | Absolute Zero | shards that split mid-flight | shots 1.5× larger, 1.7× damage |
| 5 | Hana | 3.0 | Bloom Cyclone | rotating petal arcs | shots accelerate after a 0.1s charge |
| 6 | Raiden | 2.7 | Thunder God | piercing chain bolts | kills re-ignite up to 14 nearby bullets |
| 7 | Yami | 3.0 | Eclipse | forward crescents + rear fire | volley fires backwards, plus rear shots at power 3+ |
| 8 | Luna | 2.9 | Lunar Eclipse | swinging crescents → lunar lances | shots orbit the pilot for 0.35s before launching |
| 9 | Nami | 3.1 | Tidal Surge | crossing wave walls | shots weave continuously, tightening when focused |
| 10 | Sol | 2.6 | Solar Flare | spark fan → searing beam | pierce and damage scale with power |
| 11 | Yuki | 3.5 | Crystal Blizzard | drifting snow → piercing icicles | shots accelerate slowly over their whole flight |
| 12 | Akari | 2.7 | Ember Dance | curling flames → piercing darts | every 4th volley bursts wide and gains pierce |
| 13 | Kaze | 2.8 | Gale Ring | shots that precess like gusts | shots drift outward when unfocused |
| 14 | Kumo | 3.4 | Cloud Bank | slow mist puffs | dense, slow, wide coverage |
| 15 | Hoshi | 2.5 | Meteor Shower | twin star lances + meteor burst | shots accelerate hard for 1.35× damage |

Hitbox radius ranges from 2.5 px (Hoshi, easiest to dodge) to 3.5 px (Yuki, hardest). A smaller
hitbox dodges more easily but also grazes less, since the graze ring is measured from the same
centre.

Four difficulties, 16 stages and 16 bosses (48 spell cards total), local high scores, and full UI
in English, Spanish, Japanese, Chinese, Russian, Hebrew, French and Arabic (Hebrew and Arabic
render right-to-left).

## Layout

```
src/
  App.tsx            React shell: menus, HUD, overlays, touch controls
  game/
    config.ts        16 character defs (hitbox + trait each), 16 bomb defs, zoom/speed levels
    engine.ts        game loop, player, enemies, bosses, bullets, rendering, per-pilot traits
    sprites.ts       procedural 2D sprite sheet (shots, items, clouds, boss bits)
    models3d.ts      three.js character/boss models pre-rendered to sprite frames
    audio.ts         Web Audio SFX + ambient music loop
    i18n.ts          8-language string packs
    scores.ts        localStorage score table and preferences
src-tauri/           Tauri v2 desktop shell and bundle config
```

## Notes on audio

`src/game/audio.ts` boots lazily on the first user gesture, guards every node creation in `try`,
and degrades to silence when the platform exposes no audio output or the context is closed. Bomb
and music effects use scheduled oscillators rather than long-lived nodes, so a lost audio device
never throws into the game loop.

## License

GPL-3.0-or-later. See [LICENSE](LICENSE).
