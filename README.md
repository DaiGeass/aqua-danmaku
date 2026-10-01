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

Shots fire automatically. Graze enemy bullets to build combo and raise your score multiplier; the
pink dot is your actual hitbox. Power rises from 1 to 4 as you collect items, and every character
has a different pattern at each level.

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

| # | Pilot | Bomb | Signature shot |
| --- | --- | --- | --- |
| 0 | Mizu | Splash Wave | steady bubble stream + radial pulse |
| 1 | Kiwi | Leaf Storm | wide fan → piercing needles |
| 2 | Momo | Heart Burst | homing bubbles |
| 3 | Sora | Starfall | wavy twin streams, high speed |
| 4 | Kori | Absolute Zero | shards that split mid-flight |
| 5 | Hana | Bloom Cyclone | rotating petal arcs |
| 6 | Raiden | Thunder God | piercing chain bolts |
| 7 | Yami | Eclipse | forward crescents + rear fire |
| 8 | Luna | Lunar Eclipse | swinging crescents → lunar lances |
| 9 | Nami | Tidal Surge | crossing wave walls |
| 10 | Sol | Solar Flare | spark fan → searing beam |
| 11 | Yuki | Crystal Blizzard | drifting snow → piercing icicles |
| 12 | Akari | Ember Dance | curling flames → piercing darts |
| 13 | Kaze | Gale Ring | shots that precess like gusts |
| 14 | Kumo | Cloud Bank | slow mist puffs |
| 15 | Hoshi | Meteor Shower | twin star lances + meteor burst |

Four difficulties, 8 stages and 8 bosses (24 spell cards total), local high scores, and full UI in
English, Spanish, Japanese, Chinese, Russian, Hebrew, French and Arabic (Hebrew and Arabic render
right-to-left).

## Layout

```
src/
  App.tsx            React shell: menus, HUD, overlays, touch controls
  game/
    config.ts        16 character defs, 16 bomb defs, difficulties
    engine.ts        game loop, player, enemies, bosses, bullets, rendering
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
