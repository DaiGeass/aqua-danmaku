export type Lang = "en" | "es" | "ja" | "zh" | "ru" | "he" | "fr" | "ar";

export const LANGS: { id: Lang; label: string; rtl?: boolean }[] = [
  { id: "en", label: "EN" },
  { id: "es", label: "ES" },
  { id: "ja", label: "日本語" },
  { id: "zh", label: "中文" },
  { id: "ru", label: "RU" },
  { id: "he", label: "עברית", rtl: true },
  { id: "fr", label: "FR" },
  { id: "ar", label: "العربية", rtl: true },
];

/** UI strings, same order for every language. */
const KEYS = [
  "tag", "play", "pilot", "how.move", "how.focus", "how.misc", "how.tip", "scores", "noScores",
  "select.title", "select.diff", "select.start", "back", "pause", "resume", "restart", "menu",
  "over", "record", "stage", "graze", "rank", "again", "hint.pause", "hint.over",
  "stat.power", "stat.speed", "stat.control", "bombBtn", "bombLabel",
  "hud.hi", "hud.graze", "hud.pow", "hud.max", "fx.powerUp", "fx.powerMax", "fx.bomb", "fx.life",
  "fx.bonus",   "stageN", "stageClear", "bonusLine", "extraLife", "warning", "warningSub", "modes", "new",
  "how.mode", "select.wide", "select.focus", "zoomBtn", "speedBtn", "hitbox",
] as const;
export type Key = (typeof KEYS)[number];
const IDX: Record<string, number> = {};
KEYS.forEach((k, i) => (IDX[k] = i));

interface Pack {
  ui: string[];
  /** "Name|Description|Bomb name" × 16 */
  chars: string[];
  /** "Wide shot|Focused shot" × 16 */
  shots: string[];
  /** 24 spell card names */
  spells: string[];
  /** 8 stage names */
  stages: string[];
  /** 8 boss names */
  bosses: string[];
  /** 4 difficulty names + 4 descriptions */
  diffs: string[];
}

const EN: Pack = {
  ui: [
    "✦ Frutiger Aero Bullet Hell ✦", "▶ PLAY", "Pilot name",
    "Move: WASD / Arrows · or drag a finger", "Shift: precise move · X / Space: bomb", "P / Esc: pause · R: restart · M: mute",
    "Auto-fire. Graze bullets to build combo. The pink dot is your hitbox. Two fingers = bomb.",
    "🏆 High scores", "No records yet. Be the first!", "Choose your pilot", "Difficulty", "▶ START", "← Back",
    "Pause", "▶ Resume", "↻ Restart (R)", "⌂ Menu", "Game Over", "✨ NEW RECORD! ✨", "Stage", "Graze", "Rank",
    "↻ Play again", "P / Esc to continue", "Enter / Space / R", "Power", "Speed", "Control", "BOMB", "Bomb",
    "HI", "GRAZE", "POW", "MAX", "POWER UP!", "MAX POWER!", "+BOMB", "+LIFE", "BONUS",
    "Stage {n}", "Stage {n} clear!", "Bonus +{v}", "Extra life!", "WARNING!", "A huge spirit approaches…", "Shot modes", "NEW",
    "Shift switches between the wide and focused shot patterns.",
    "WIDE", "FOCUS · SHIFT",
    "Zoom: see more field", "Speed: slow the game down", "Hitbox",
  ],
  chars: [
    "Mizu|Balanced bubble spirit. Steady stream, plus a radial bubble pulse at max power.|Splash Wave",
    "Kiwi|Leaf sprite. Wide fan normally, piercing needles when focused.|Leaf Storm",
    "Momo|Peach kitten. Homing bubbles that hunt enemies. Very forgiving.|Heart Burst",
    "Sora|Sky angel. Blazing speed, wavy twin streams and extra graze points.|Starfall",
    "Kori|Ice witch. Shards that split into fragments mid-flight.|Absolute Zero",
    "Hana|Flower dancer. Petals swept in rotating arcs that cover the screen.|Bloom Cyclone",
    "Raiden|Thunder spirit. Slow fire, but piercing bolts that chain between foes.|Thunder God",
    "Yami|Moon shadow. Shoots forward and backward at once, and drinks bullets.|Eclipse",
    "Luna|Moon witch. Crescent pairs swinging out and back, or twin lunar lances.|Lunar Eclipse",
    "Nami|Tidal sprite. Two crossing wave walls, or a narrow stream of droplets.|Tidal Surge",
    "Sol|Sun spirit. A dense fan of sparks, or one searing beam straight up.|Solar Flare",
    "Yuki|Snow guardian. Drifting snow, or slow and heavy piercing icicles.|Crystal Blizzard",
    "Akari|Ember dancer. Curling twin flames, or piercing darts that seek heat.|Ember Dance",
    "Kaze|Wind fairy. Shots that precess around the aim line like gusts.|Gale Ring",
    "Kumo|Cloud spirit. Slow misty puffs that fill the lanes, easy to graze.|Cloud Bank",
    "Hoshi|Star dancer. Twin star lances up close, with a meteor burst at max.|Meteor Shower",
  ],
  shots: [
    "Bubble fan / tight stream", "Leaf spread / piercing needles", "Heart spread / homing swarm",
    "Wavy twin streams / rapid lance", "Splitting shards / heavy fragments", "Petal arcs / spiral sweep",
    "Chain bolts / twin lightning", "Front crescents + rear fire",
    "Swinging crescents / lunar lances", "Crossing waves / tight stream", "Spark fan / double beam",
    "Snow drift / piercing icicles", "Ember arcs / piercing darts", "Spiral gusts / gale needles",
    "Mist puffs / cloud volley", "Star lances / meteor burst",
  ],
  spells: [
    "Bubble Sign «Aqua Bloom»", "Whirl Sign «Crystal Spiral»", "Rain Sign «Aero Cascade»",
    "Crystal Sign «Prism Lattice»", "Shatter Sign «Bloom Burst»", "Rainbow Sign «Petal Prism»",
    "Star Sign «Meteor Sweep»", "Twin Sign «Binary Helix»", "Night Sign «Constellation»",
    "Aurora Sign «Silk Curtain»", "Wind Sign «Spinning Whirl»", "Final Sign «Liquid Aurora»",
    "Frost Sign «Shattered Mirror»", "Ice Sign «Glacier Cage»", "Winter Sign «Absolute Zero»",
    "Flower Sign «Petal Dance»", "Bloom Sign «Garden of Turning Light»", "Spring Sign «Cherry Blizzard»",
    "Thunder Sign «Forked Heaven»", "Bolt Sign «Cage of Lightning»", "Storm Sign «Wrath of Raijin»",
    "Moon Sign «Crescent Tide»", "Dream Sign «Silver Labyrinth»", "Eclipse Sign «Vanishing Horizon»",
    "Tide Sign «Coral Lattice»", "Abyss Sign «Deep Polyp»", "Final Sign «Benthic Cathedral»",
    "Solar Sign «Crown of Flames»", "Zenith Sign «Brass Sun»", "Apex Sign «Solar Verdict»",
    "Prism Sign «Refraction»", "Lattice Sign «Bound Spectrum»", "Crown Sign «Prismatic Zenith»",
    "Silk Sign «Woven Dawn»", "Curtain Sign «Aurora Veil»", "Drape Sign «Silk Cathedral»",
    "Frost Sign «Rime Lattice»", "Vault Sign «Frozen Choir»", "Zero Sign «Everlasting Winter»",
    "Petal Sign «Spiral Bloom»", "Blossom Sign «Petal Cyclone»", "Sakura Sign «Dancing Petals»",
    "Thunder Sign «Forked Sky»", "Cage Sign «Bound Tempest»", "Raijin Sign «Heaven Severed»",
    "Lunar Sign «Tidal Cross»", "Night Sign «Silver Veil»", "Eclipse Sign «Blackened Horizon»",
  ],
  stages: [
    "Bubble Sky", "Crystal Lagoon", "Aero Twilight", "Liquid Aurora", "Frost Garden", "Petal Meadow", "Thunder Reef", "Moonlit Sea",
    "Polyp Deep", "Solar Court", "Prism Lattice", "Silk Curtain", "Glacier Vault", "Petal Dance", "Thunder Cage", "Drowned Moon",
  ],
  bosses: [
    "Mizuha, Spirit of Bubbles", "Prism, the Crystal Sage", "Comet, Weaver of Stars", "Aurora, Crown of the Deep",
    "Shirayuki, the Frost Maiden", "Hanabi, the Blooming Dancer", "Narukami of the Thunder Reef", "Tsukiyomi, the Drowned Moon",
    "Umibozu, Warden of the Polyp", "Shou, the Burning Crown", "Kagami, the Bound Spectrum", "Orin, Weaver of Silk",
    "Sōgen, Warden of the Vault", "Sakura, the Dancing Petal", "Raikou, Warden of the Cage", "Amaterasu, the Drowned Sun",
  ],
  diffs: [
    "Easy", "Normal", "Hard", "Lunatic",
    "Fewer, slower bullets. Extra lives and bombs. Score ×0.6", "The intended experience. Score ×1",
    "Denser, faster patterns. Score ×1.5", "Bullet heaven. Only for the brave. Score ×2.2",
  ],
};

const ES: Pack = {
  ui: [
    "✦ Bullet Hell Frutiger Aero ✦", "▶ JUGAR", "Nombre de piloto",
    "Mover: WASD / Flechas · o arrastra el dedo", "Shift: movimiento preciso · X / Espacio: bomba", "P / Esc: pausa · R: reiniciar · M: silencio",
    "Disparo automático. Roza las balas para subir el combo. El punto rosa es tu hitbox. Dos dedos = bomba.",
    "🏆 Mejores puntuaciones", "Aún no hay récords. ¡Sé el primero!", "Elige a tu piloto", "Dificultad", "▶ EMPEZAR", "← Volver",
    "Pausa", "▶ Reanudar", "↻ Reiniciar (R)", "⌂ Menú", "Fin del juego", "✨ ¡NUEVO RÉCORD! ✨", "Etapa", "Roce", "Puesto",
    "↻ Jugar otra vez", "P / Esc para continuar", "Enter / Espacio / R", "Poder", "Velocidad", "Control", "BOMBA", "Bomba",
    "REC", "ROCE", "POD", "MÁX", "¡POTENCIA ↑!", "¡POTENCIA MÁX!", "+BOMBA", "+VIDA", "BONO",
    "Etapa {n}", "¡Etapa {n} superada!", "Bono +{v}", "¡Vida extra!", "¡ADVERTENCIA!", "Se acerca un espíritu enorme…", "Modos de disparo", "NUEVO",
    "Shift alterna entre el patrón abierto y el preciso.",
    "ABIERTO", "PRECISO · SHIFT",
    "Zoom: ver más campo", "Velocidad: ralentizar el juego", "Hitbox",
  ],
  chars: [
    "Mizu|Espíritu de burbuja equilibrado. Flujo constante y pulso radial a potencia máxima.|Ola Salpicante",
    "Kiwi|Duende de hoja. Abanico amplio, o agujas perforantes en modo preciso.|Tormenta de Hojas",
    "Momo|Gatita durazno. Burbujas teledirigidas que persiguen enemigos. Muy noble.|Explosión de Corazones",
    "Sora|Ángel del cielo. Velocidad altísima, ondas gemelas y más puntos por roce.|Lluvia de Estrellas",
    "Kori|Bruja de hielo. Fragmentos que se parten en el aire.|Cero Absoluto",
    "Hana|Bailarina floral. Pétalos en arcos giratorios que cubren la pantalla.|Ciclón Floral",
    "Raiden|Espíritu del trueno. Disparo lento, pero rayos que encadenan enemigos.|Dios del Trueno",
    "Yami|Sombra lunar. Dispara hacia delante y hacia atrás, y devora balas.|Eclipse",
    "Luna|Bruja lunar. Medias lunas que oscilan, o lanzas lunares gemelas.|Eclipse Lunar",
    "Nami|Hada de la marea. Dos muros de olas cruzados, o un chorro estrecho de gotas.|Marea Alta",
    "Sol|Espíritu solar. abanico denso de chispas, o un rayo abrasador recto.|Estallido Solar",
    "Yuki|Guardián de la nieve. Nieve a la deriva, o carámbanos lentos y perforantes.|Ventisca de Cristal",
    "Akari|Bailarina de brasas. Llamas gemelas que se enrollan, o dardos perforantes.|Danza de Brasas",
    "Kaze|Hada del viento. Disparos que giran alrededor de la línea de tiro como ráfagas.|Anillo de Vendaval",
    "Kumo|Espíritu de nube. Pomadas de niebla lentas que llenan los carriles.|Banco de Nubes",
    "Hoshi|Bailarina estelar. Lanzas gemelas de cerca, con estallido de meteoros.|Lluvia de Meteoros",
  ],
  shots: [
    "Abanico de burbujas / flujo preciso", "Abanico de hojas / agujas perforantes", "Abanico de corazones / enjambre guiado",
    "Ondas gemelas / lanza rápida", "Fragmentos que se parten / fragmentos pesados", "Arcos de pétalos / barrido en espiral",
    "Rayos en cadena / relámpago gemelo", "Medias lunas delante + fuego trasero",
    "Medias lunas oscilantes / lanzas lunares", "Olas cruzadas / flujo preciso", "Abanico de chispas / haz doble",
    "Nieve a la deriva / carámbanos", "Arcos de brasa / dardos perforantes", "Ráfagas en espiral / agujas de vendaval",
    "Pomadas de niebla / ráfaga de nubes", "Lanzas estelares / estallido de meteoros",
  ],
  spells: [
    "Signo de Burbuja «Floración Acuática»", "Signo de Remolino «Espiral de Cristal»", "Signo de Lluvia «Cascada Aero»",
    "Signo de Cristal «Red de Prismas»", "Signo de Fractura «Estallido Floral»", "Signo Arcoíris «Pétalos de Prisma»",
    "Signo de Estrella «Barrido Meteoro»", "Signo Gemelo «Hélice Binaria»", "Signo Nocturno «Constelación»",
    "Signo de Aurora «Cortina de Seda»", "Signo de Viento «Torbellino»", "Signo Final «Aurora Líquida»",
    "Signo de Escarcha «Espejo Roto»", "Signo de Hielo «Jaula Glaciar»", "Signo de Invierno «Cero Absoluto»",
    "Signo de Flor «Danza de Pétalos»", "Signo Floral «Jardín de Luz Giratoria»", "Signo de Primavera «Ventisca de Cerezo»",
    "Signo de Trueno «Cielo Bifurcado»", "Signo de Rayo «Jaula de Relámpagos»", "Signo de Tormenta «Ira de Raijin»",
    "Signo Lunar «Marea Creciente»", "Signo Onírico «Laberinto de Plata»", "Signo de Eclipse «Horizonte Perdido»",
  ],
  stages: ["Cielo de Burbujas", "Laguna Cristalina", "Crepúsculo Aero", "Aurora Líquida", "Jardín de Escarcha", "Prado de Pétalos", "Arrecife del Trueno", "Mar a la Luz de la Luna"],
  bosses: [
    "Mizuha, Espíritu de las Burbujas", "Prisma, la Sabia de Cristal", "Cometa, Tejedora de Estrellas", "Aurora, Corona del Abismo",
    "Shirayuki, la Doncella de Escarcha", "Hanabi, la Bailarina en Flor", "Narukami del Arrecife del Trueno", "Tsukiyomi, la Luna Sumergida",
  ],
  diffs: [
    "Fácil", "Normal", "Difícil", "Lunático",
    "Menos balas y más lentas. Más vidas y bombas. Puntos ×0.6", "La experiencia prevista. Puntos ×1",
    "Patrones más densos y rápidos. Puntos ×1.5", "Paraíso de balas. Solo para valientes. Puntos ×2.2",
  ],
};

const JA: Pack = {
  ui: [
    "✦ フルーティガーエアロ弾幕 ✦", "▶ プレイ", "パイロット名",
    "移動: WASD / 矢印 ・ または指でドラッグ", "Shift: 低速移動 ・ X / Space: ボム", "P / Esc: ポーズ ・ R: リスタート ・ M: ミュート",
    "ショットは自動。弾をかすめてコンボUP。ピンクの点が当たり判定。2本指でボム。",
    "🏆 ハイスコア", "まだ記録がありません。一番乗りを！", "パイロットを選択", "難易度", "▶ スタート", "← 戻る",
    "ポーズ", "▶ 再開", "↻ リスタート (R)", "⌂ メニュー", "ゲームオーバー", "✨ ニューレコード！ ✨", "ステージ", "グレイズ", "順位",
    "↻ もう一度", "P / Esc で再開", "Enter / Space / R", "火力", "速度", "操作性", "ボム", "ボム",
    "HI", "グレイズ", "パワー", "MAX", "パワーアップ！", "パワーMAX！", "+ボム", "+残機", "ボーナス",
    "ステージ {n}", "ステージ {n} クリア！", "ボーナス +{v}", "1UP！", "警告！", "巨大な精霊が近づいている…", "ショット形式", "NEW",
    "Shiftで広射と精密ショットを切り替えます。",
    "広射", "精密 · SHIFT",
    "ズーム：より広い視野", "速度：ゲームを遅くする", "ヒットボックス",
  ],
  chars: [
    "ミズ|バランス型の泡の精。連射に加え、最大パワーで円状の泡を放つ。|スプラッシュウェーブ",
    "キウイ|葉っぱの妖精。通常は広範囲、低速で貫通ニードル。|リーフストーム",
    "モモ|桃色の子猫。敵を追う誘導バブル。初心者向け。|ハートバースト",
    "ソラ|空の天使。超高速、波打つ2連ショット、グレイズ得点UP。|スターフォール",
    "コリ|氷の魔女。空中で分裂する氷の欠片。|絶対零度",
    "ハナ|花の舞姫。画面を覆う回転する花びらの弧。|ブルームサイクロン",
    "ライデン|雷の精。連射は遅いが敵を連鎖する貫通ボルト。|雷神",
    "ヤミ|月の影。前方と後方へ同時に撃ち、弾を飲み込む。|日食",
    "ルナ|月の魔女。振れる三日月か、姉妹の月槍。|ルナエクリプス",
    "ナミ|潮の妖精。交差する波の壁、 または細身の飛沫の連射。|タイダルサージ",
    "ソル|太陽の精。密な火花の扇、 または真上を焼く一本のビーム。|ソーラーフレア",
    "ユキ|雪の守り手。漂う雪玉、 または重く遅い貫通氷柱。|クリスタルブリザード",
    "アカリ|炎の踊り手。巻きつく双炎、 または貫通する火の矢。|エンバーダンス",
    "カゼ|風の妖精。狙線を中心に旋回する哨戒弾。|ゲーリング",
    "クモ|雲の精。低速の霧球がレーンを埋め、グレイズしやすい。|クラウドバンク",
    "ホシ|星の踊り手。ニアで双星槍、最大パワーで隕石爆発。|メテオシャワー",
  ],
  shots: [
    "泡の扇 / 精密な連射", "葉の広がり / 貫通ニードル", "ハート扇 / 誘導スウォーム",
    "波打つ2連 / 急速星槍", "分裂する氷片 / 重い破片", "花びらの弧 / 螺旋の掃射",
    "連鎖ボルト / 双雷撃", "前の三日月 + 後ろの炎",
    "揺れる三日月 / 月槍", "交差する波 / 細い連射", "火花の扇 / ダブルビーム",
    "雪の漂流 / 貫通氷柱", "炎の弧 / 貫通の矢", "螺旋の突風 / 風のニードル",
    "霧の球 / 雲の連射", "星槍 / 隕石爆発",
  ],
  spells: [
    "泡符「アクアブルーム」", "渦符「クリスタルスパイラル」", "雨符「エアロカスケード」",
    "晶符「プリズムラティス」", "砕符「ブルームバースト」", "虹符「ペタルプリズム」",
    "星符「メテオスウィープ」", "双符「バイナリヘリックス」", "夜符「コンステレーション」",
    "極光符「シルクカーテン」", "風符「スピニングワール」", "終符「リキッドオーロラ」",
    "霜符「シャッタードミラー」", "氷符「グレイシャケージ」", "冬符「絶対零度」",
    "花符「ペタルダンス」", "咲符「回光の庭」", "春符「チェリーブリザード」",
    "雷符「フォークトヘヴン」", "閃符「稲妻の檻」", "嵐符「雷神の怒り」",
    "月符「クレセントタイド」", "夢符「銀の迷宮」", "蝕符「消える地平線」",
  ],
  stages: ["泡の空", "水晶の入り江", "エアロの黄昏", "液体オーロラ", "霜の庭", "花びらの草原", "雷の岩礁", "月夜の海"],
  bosses: [
    "ミズハ ― 泡の精霊", "プリズム ― 水晶の賢者", "コメット ― 星を織る者", "オーロラ ― 深淵の冠",
    "シラユキ ― 霜の乙女", "ハナビ ― 咲き誇る舞姫", "ナルカミ ― 雷の岩礁", "ツクヨミ ― 沈んだ月",
  ],
  diffs: [
    "イージー", "ノーマル", "ハード", "ルナティック",
    "弾が少なく遅い。残機とボム多め。スコア ×0.6", "標準の難易度。スコア ×1",
    "より密で速い弾幕。スコア ×1.5", "弾の楽園。勇者のみ。スコア ×2.2",
  ],
};

const ZH: Pack = {
  ui: [
    "✦ 清新气泡弹幕 ✦", "▶ 开始游戏", "驾驶员姓名",
    "移动：WASD / 方向键 · 或手指拖动", "Shift：低速移动 · X / 空格：炸弹", "P / Esc：暂停 · R：重新开始 · M：静音",
    "自动射击。擦弹可提升连击。粉点为你的判定。双指＝炸弹。",
    "🏆 最高分", "还没有记录，来当第一名吧！", "选择驾驶员", "难度", "▶ 开始", "← 返回",
    "暂停", "▶ 继续", "↻ 重新开始 (R)", "⌂ 主菜单", "游戏结束", "✨ 新纪录！ ✨", "关卡", "擦弹", "排名",
    "↻ 再玩一次", "P / Esc 继续", "Enter / 空格 / R", "火力", "速度", "操控", "炸弹", "炸弹",
    "最高", "擦弹", "力量", "满", "力量提升！", "力量全开！", "+炸弹", "+生命", "奖励",
    "第 {n} 关", "第 {n} 关通过！", "奖励 +{v}", "额外生命！", "警告！", "巨大的精灵正在接近…", "射击模式", "新",
    "Shift 键在散射与精准射击之间切换。",
    "散射", "精准 · SHIFT",
    "缩放：看到更多区域", "速度：放慢游戏", "判定点",
  ],
  chars: [
    "水珠|均衡的泡泡精灵。稳定连射，满力量时放出环形泡泡。|水花之浪",
    "奇异果|叶之精灵。平时扇形散射，低速时发射穿透针。|绿叶风暴",
    "桃子|蜜桃小猫。追踪泡泡自动索敌，非常宽容。|爱心爆裂",
    "天空|天空天使。极速，双波浪弹道，擦弹得分更高。|星陨",
    "冰璃|冰之魔女。碎片会在空中分裂。|绝对零度",
    "花音|花之舞者。旋转花瓣弧线覆盖全屏。|绽放气旋",
    "雷电|雷之精灵。射速慢，但闪电可穿透并在敌间连锁。|雷神",
    "夜影|月之影。同时向前后射击，并吞噬敌弹。|日蚀",
    "露娜|月之魔女。摆动的双新月，或双发月枪。|月蚀",
    "波奈|潮之精灵。两道交叉的波墙，或细窄的水滴连射。|怒涛",
    "索尔|太阳之精。密集的火花扇面，或一道灼热的垂直光束。|太阳耀斑",
    "雪绪|雪之守护。飘落的雪花，或缓慢沉重的贯穿冰锥。|水晶暴风雪",
    "明里|余烬舞者。卷曲的双焰，或追寻热源的贯穿火矢。|余烬之舞",
    "霞|风之妖精。子弹绕着瞄准线旋转，如同阵风。|疾风之环",
    "云|云之精灵。缓慢的雾球填满轨道，容易擦弹。|积云",
    "星|星之舞者。近距离双星枪，最大力量时陨石爆发。|流星雨",
  ],
  shots: [
    "泡泡扇面 / 精准连射", "叶片散射 / 贯穿针", "爱心散射 / 追踪群",
    "双波浪流 / 快速星枪", "分裂碎片 / 沉重破片", "花瓣弧线 / 螺旋扫射",
    "连锁闪电 / 双雷击", "前方新月 + 后方火焰",
    "摆动新月 / 月枪", "交叉波浪 / 细窄连射", "火花扇面 / 双光束",
    "飘雪 / 贯穿冰锥", "余烬弧线 / 贯穿火矢", "螺旋阵风 / 风针",
    "雾球 / 浓云连射", "星枪 / 陨石爆发",
  ],
  spells: [
    "泡符「水华绽放」", "涡符「水晶螺旋」", "雨符「气流瀑布」",
    "晶符「棱镜之网」", "碎符「花爆」", "虹符「花瓣棱镜」",
    "星符「流星横扫」", "双符「二元螺旋」", "夜符「星座」",
    "极光符「丝绸之幕」", "风符「回旋涡流」", "终符「液态极光」",
    "霜符「破碎之镜」", "冰符「冰川牢笼」", "冬符「绝对零度」",
    "花符「花瓣之舞」", "绽符「流光庭园」", "春符「樱吹雪」",
    "雷符「分叉之天」", "闪符「雷电之笼」", "岚符「雷神之怒」",
    "月符「新月之潮」", "梦符「白银迷宫」", "蚀符「消逝的地平线」",
  ],
  stages: ["泡泡天空", "水晶潟湖", "气流黄昏", "液态极光", "霜之庭园", "花瓣草甸", "雷鸣礁石", "月光之海"],
  bosses: ["水花・泡泡精灵", "棱镜・水晶贤者", "彗星・织星者", "极光・深渊之冠", "白雪・霜之少女", "花火・绽放舞者", "鸣神・雷鸣礁石", "月读・沉没之月"],
  diffs: [
    "简单", "普通", "困难", "疯狂",
    "弹更少更慢，生命与炸弹更多。分数 ×0.6", "标准体验。分数 ×1",
    "弹幕更密更快。分数 ×1.5", "弹之天堂，勇者专属。分数 ×2.2",
  ],
};

const RU: Pack = {
  ui: [
    "✦ Frutiger Aero Bullet Hell ✦", "▶ ИГРАТЬ", "Имя пилота",
    "Движение: WASD / стрелки · или палец", "Shift: точный ход · X / пробел: бомба", "P / Esc: пауза · R: заново · M: звук",
    "Автоогонь. Задевайте пули для комбо. Розовая точка — ваш хитбокс. Два пальца = бомба.",
    "🏆 Рекорды", "Записей пока нет. Будьте первым!", "Выберите пилота", "Сложность", "▶ СТАРТ", "← Назад",
    "Пауза", "▶ Продолжить", "↻ Заново (R)", "⌂ Меню", "Игра окончена", "✨ НОВЫЙ РЕКОРД! ✨", "Этап", "Задевания", "Место",
    "↻ Играть снова", "P / Esc — продолжить", "Enter / пробел / R", "Мощь", "Скорость", "Контроль", "БОМБА", "Бомба",
    "РЕК", "ЗАДЕВ", "МОЩ", "МАКС", "МОЩЬ ВЫШЕ!", "МАКСИМУМ!", "+БОМБА", "+ЖИЗНЬ", "БОНУС",
    "Этап {n}", "Этап {n} пройден!", "Бонус +{v}", "Доп. жизнь!", "ВНИМАНИЕ!", "Приближается огромный дух…", "Режимы огня", "НОВОЕ",
    "Shift переключает широкий и точный режимы стрельбы.",
    "ШИРОКИЙ", "ТОЧНЫЙ · SHIFT",
    "Масштаб: больше обзор", "Скорость: замедлить игру", "Хитбокс",
  ],
  chars: [
    "Мизу|Ровный дух пузырей. Поток пуль и круговой всплеск на максимуме.|Волна брызг",
    "Киви|Лесной дух. Широкий веер, а в точном режиме — пробивные иглы.|Листовая буря",
    "Момо|Персиковый котёнок. Самонаводящиеся пузыри. Очень дружелюбна.|Взрыв сердец",
    "Сора|Небесный ангел. Огромная скорость, волнистые потоки и бонус за задевания.|Звездопад",
    "Кори|Ледяная ведьма. Осколки раскалываются в полёте.|Абсолютный ноль",
    "Хана|Танцовщица цветов. Лепестки вращающимися дугами по всему экрану.|Цветочный циклон",
    "Райдэн|Дух грома. Медленный огонь, но пробивные разряды бьют цепью.|Бог грома",
    "Ями|Лунная тень. Стреляет вперёд и назад, поглощая пули.|Затмение",
    "Луна|Лунная ведьма. Парные полумесяцы либо сдвоенные лунные копья.|Лунное затмение",
    "Нами|Дух прилива. Две пересекающиеся волны либо узкий поток капель.|Приливный шторм",
    "Сол|Дух солнца. Густой веер искр либо один обжигающий луч вверх.|Солнечная вспышка",
    "Юки|Хранительница снега. Дрейфующие снежинки либо тяжёлые ледяные копья.|Хрустальная метель",
    "Акари|Танцовщица углей. Вьющиеся двойные пламени либо пробивные огненные стрелы.|Танец углей",
    "Кадзе|Фея ветра. Снаряды кружат вокруг линии прицела, как порывы.|Кольцо бури",
    "Кумо|Дух облаков. Медленные туманные шары заполняют коридоры.|Гряда облаков",
    "Хоси|Танцовщица звёзд. Парные звёздные копья вблизи, метеорный взрыв на максимуме.|Звездопад метеоров",
  ],
  shots: [
    "Веер пузырей / точный поток", "Разброс листьев / пробивные иглы", "Веер сердец / самонаводящийся рой",
    "Волнистые потоки / быстрое копьё", "Раскалывающиеся осколки / тяжёлые части", "Дуги лепестков / спиральный обстрел",
    "Разряды цепью / двойная молния", "Полумесяцы вперёд + огонь сзади",
    "Качающиеся полумесяцы / лунные копья", "Пересекающиеся волны / узкий поток", "Веер искр / двойной луч",
    "Дрейф снега / ледяные копья", "Дуги углей / пробивные стрелы", "Спиральные порывы / иглы ветра",
    "Туманные шары / залп облаков", "Звёздные копья / метеорный взрыв",
  ],
  spells: [
    "Знак пузыря «Водное цветение»", "Знак вихря «Кристальная спираль»", "Знак дождя «Аэро-каскад»",
    "Знак кристалла «Призматическая решётка»", "Знак раскола «Цветочный взрыв»", "Знак радуги «Лепестковая призма»",
    "Знак звезды «Метеорный разворот»", "Знак близнецов «Двойная спираль»", "Знак ночи «Созвездие»",
    "Знак сияния «Шёлковый занавес»", "Знак ветра «Кружащийся вихрь»", "Финальный знак «Жидкое сияние»",
    "Знак инея «Разбитое зеркало»", "Знак льда «Ледниковая клетка»", "Знак зимы «Абсолютный ноль»",
    "Знак цветка «Танец лепестков»", "Знак цветения «Сад вращающегося света»", "Знак весны «Вишнёвая метель»",
    "Знак грома «Раздвоенное небо»", "Знак молнии «Клетка разрядов»", "Знак бури «Гнев Райдзина»",
    "Знак луны «Полумесячный прилив»", "Знак сна «Серебряный лабиринт»", "Знак затмения «Исчезающий горизонт»",
  ],
  stages: ["Пузырьковое небо", "Кристальная лагуна", "Аэро-сумерки", "Жидкое сияние", "Сад инея", "Лепестковый луг", "Громовой риф", "Морe под луной"],
  bosses: [
    "Мизуха, дух пузырей", "Призма, кристальная мудрец", "Комета, ткачиха звёзд", "Аврора, корона глубин",
    "Шираюки, дева инея", "Ханаби, цветущая танцовщица", "Наруками с громового рифа", "Цукуёми, утонувшая луна",
  ],
  diffs: [
    "Легко", "Нормально", "Сложно", "Безумие",
    "Пуль меньше и медленнее. Больше жизней и бомб. Счёт ×0.6", "Задуманный баланс. Счёт ×1",
    "Плотнее и быстрее. Счёт ×1.5", "Рай из пуль. Только для смелых. Счёт ×2.2",
  ],
};

const HE: Pack = {
  ui: [
    "✦ בועות אאריו — משחק ירי ✦", "▶ שחק", "שם הטייס",
    "תנועה: WASD / חיצים · או גרירה באצבע", "Shift: תנועה מדויקת · X / רווח: פצצה", "P / Esc: השהיה · R: התחלה מחדש · M: השתקה",
    "ירי אוטומטי. געו בקליעים כדי להעלות קומבו. הנקודה הוורודה היא פגיעת הדמות. שתי אצבעות = פצצה.",
    "🏆 שיאים", "אין עדיין שיאים. היו הראשונים!", "בחרו טייס", "רמת קושי", "▶ התחל", "← חזרה",
    "השהיה", "▶ המשך", "↻ מחדש (R)", "⌂ תפריט", "המשחק נגמר", "✨ שיא חדש! ✨", "שלב", "מגע", "מקום",
    "↻ שחק שוב", "P / Esc להמשך", "Enter / רווח / R", "עוצמה", "מהירות", "שליטה", "פצצה", "פצצה",
    "שיא", "מגע", "עוצ", "מקס", "עוצמה עלתה!", "עוצמה מרבית!", "+פצצה", "+חיים", "בונוס",
    "שלב {n}", "שלב {n} הושלם!", "בונוס +{v}", "חיים נוספים!", "אזהרה!", "רוח ענקית מתקרבת…", "מצבי ירי", "חדש",
    "מקש Shift מחליף בין ירי רחב לירי מדויק.",
    "רחב", "מדויק · SHIFT",
    "זום: ראות יותר שדה", "מהירות: להאט את המשחק", "היטבוקס",
  ],
  chars: [
    "מיזו|רוח בועות מאוזנת. זרם יציב וגל בועות בעוצמה מרבית.|גל התזה",
    "קיווי|שדון עלים. מניפה רחבה, או מחטים חודרות בתנועה מדויקת.|סופת עלים",
    "מומו|חתלתולת אפרסק. בועות מונחות שרודפות אויבים. סלחנית מאוד.|פיצוץ לבבות",
    "סורה|מלאכית השמיים. מהירות אדירה, זרמים גליים ובונוס מגע.|מטר כוכבים",
    "קורי|מכשפת הקרח. רסיסים שמתפצלים באוויר.|האפס המוחלט",
    "האנה|רקדנית הפרחים. עלי כותרת בקשתות מסתובבות על כל המסך.|ציקלון פריחה",
    "ריידן|רוח הרעם. ירי איטי, אבל ברקים חודרים שעוברים בין אויבים.|אל הרעם",
    "יאמי|צל הירח. יורה קדימה ואחורה ובולעת קליעים.|ליקוי",
    "לונה|מכשפת הירח. זוג חצי־ירחים מתנדנדים, או רמחי ירח תאומים.|ליקוי ירחי",
    "נאמי|רוח הגאות. שני קירות גלים מצלבים, או זרם טיפות צר.|גל גאותי",
    "סול|רוח השמש. מניפת ניצוצות צפופה, או קרן חודרת בוערת במעלה.|הבהובת שמש",
    "יוקי|שמרת השלג. פתית שלג נסחפות, או סיכות קרח כבדות וחודרות.|שלגבול גבישי",
    "אקארי|רקדנית הגחלים. להבות תאומות מתלפלות, או חצים אש חודרים.|ריקוד הגחלים",
    "קאזה|פיית הרוח. הקליעים סובבים סביב קו המטרה כמו משביות.|טבעת משבית",
    "קומו|רוח הענן. כדורי ערפל איטיים ממלאים את הנתיבים.|בנן עננים",
    "הושי|רקדנית הכוכבים. רמחי כוכב תאומים מקרובים, ופיצוץ מטאור בעוצמה מרבית.|גשם מטאורים",
  ],
  shots: [
    "מניפת בועות / זרם מדויק", "פריסת עלים / מחטים חודרות", "מניפת לבבות / להקה מונחית",
    "זרמים גליים / רמח מהיר", "רסיסים מתפצלים / שברים כבדים", "קשתות עלים / סיבוב ספירלי",
    "ברקים בשרשרת / כפרה כפולה", "חצי־ירחים קדימה + אש אחורה",
    "חצי־ירחים מתנדנדים / רמחי ירח", "גלים מצלבים / זרם צר", "מניפת ניצוצות / קרן כפולה",
    "שלג נסחף / סיכות קרח", "קשתות גחלים / חצים חודרים", "משביות ספירליות / מחטי רוח",
    "כדורי ערפל / מטפקס עננים", "רמחי כוכב / פיצוץ מטאור",
  ],
  spells: [
    "סמל הבועה «פריחת מים»", "סמל המערבולת «ספירלת בדולח»", "סמל הגשם «מפל אאריו»",
    "סמל הבדולח «סריג מנסרות»", "סמל השבירה «פיצוץ פריחה»", "סמל הקשת «מנסרת עלי כותרת»",
    "סמל הכוכב «מטאטא מטאורים»", "סמל התאומים «סליל כפול»", "סמל הלילה «קבוצת כוכבים»",
    "סמל הזוהר «מסך משי»", "סמל הרוח «מערבולת מסתובבת»", "הסמל האחרון «זוהר נוזלי»",
    "סמל הכפור «מראה שבורה»", "סמל הקרח «כלוב קרחון»", "סמל החורף «האפס המוחלט»",
    "סמל הפרח «ריקוד עלי כותרת»", "סמל הפריחה «גן האור המסתובב»", "סמל האביב «סופת דובדבן»",
    "סמל הרעם «שמיים מפוצלים»", "סמל הברק «כלוב ברקים»", "סמל הסערה «זעם ראיג'ין»",
    "סמל הירח «גאות סהר»", "סמל החלום «מבוך כסף»", "סמל הליקוי «אופק נעלם»",
  ],
  stages: ["שמי הבועות", "לגונת הבדולח", "דמדומי אאריו", "זוהר נוזלי", "גן הכפור", "אחו עלי הכותרת", "שונית הרעם", "ים לאור הירח"],
  bosses: [
    "מיזוהא, רוח הבועות", "פריזמה, חכמת הבדולח", "כוכבית, אורגת הכוכבים", "אורורה, כתר המעמקים",
    "שיראיוקי, עלמת הכפור", "האנאבי, הרקדנית הפורחת", "נארוקאמי משונית הרעם", "צוקויומי, הירח הטבוע",
  ],
  diffs: [
    "קל", "רגיל", "קשה", "לונטי",
    "פחות קליעים ואיטיים יותר. יותר חיים ופצצות. ניקוד ×0.6", "החוויה המיועדת. ניקוד ×1",
    "דפוסים צפופים ומהירים. ניקוד ×1.5", "גן עדן של קליעים. לאמיצים בלבד. ניקוד ×2.2",
  ],
};

const FR: Pack = {
  ui: [
    "✦ Bullet Hell Frutiger Aero ✦", "▶ JOUER", "Nom du pilote",
    "Déplacer : WASD / flèches · ou glisser le doigt", "Maj : déplacement précis · X / Espace : bombe", "P / Échap : pause · R : recommencer · M : muet",
    "Tir auto. Frôlez les balles pour le combo. Le point rose est votre hitbox. Deux doigts = bombe.",
    "🏆 Meilleurs scores", "Aucun record. Soyez le premier !", "Choisissez votre pilote", "Difficulté", "▶ COMMENCER", "← Retour",
    "Pause", "▶ Reprendre", "↻ Recommencer (R)", "⌂ Menu", "Fin de partie", "✨ NOUVEAU RECORD ! ✨", "Niveau", "Frôlement", "Rang",
    "↻ Rejouer", "P / Échap pour continuer", "Entrée / Espace / R", "Puissance", "Vitesse", "Contrôle", "BOMBE", "Bombe",
    "REC", "FRÔL", "PUI", "MAX", "PUISSANCE +", "PUISSANCE MAX !", "+BOMBE", "+VIE", "BONUS",
    "Niveau {n}", "Niveau {n} terminé !", "Bonus +{v}", "Vie supplémentaire !", "ATTENTION !", "Un esprit géant approche…", "Modes de tir", "NOUV.",
    "Maj bascule entre le tir large et le tir précis.",
    "LARGE", "PRÉCIS · MAJ",
    "Zoom : voir plus de terrain", "Vitesse : ralentir le jeu", "Hitbox",
  ],
  chars: [
    "Mizu|Esprit de bulle équilibré. Flux régulier et onde radiale à pleine puissance.|Vague d'éclaboussures",
    "Kiwi|Lutin des feuilles. Large éventail, ou aiguilles perforantes en mode précis.|Tempête de feuilles",
    "Momo|Chaton pêche. Bulles guidées qui traquent l'ennemi. Très indulgente.|Éclat de cœurs",
    "Sora|Ange du ciel. Vitesse fulgurante, doubles ondes et bonus de frôlement.|Pluie d'étoiles",
    "Kori|Sorcière de glace. Éclats qui se brisent en plein vol.|Zéro absolu",
    "Hana|Danseuse des fleurs. Pétales en arcs tournants couvrant l'écran.|Cyclone floral",
    "Raiden|Esprit du tonnerre. Tir lent, mais éclairs perforants qui enchaînent les cibles.|Dieu du tonnerre",
    "Yami|Ombre lunaire. Tire devant et derrière, et avale les balles.|Éclipse",
    "Luna|Sorcière de lune. Paires de croissants qui balancent, ou lances jumelles de lune.|Éclipse lunaire",
    "Nami|Esprit de la marée. Deux murs de vagues croisés, ou un jet étroit de gouttes.|Raz de marée",
    "Sol|Esprit du soleil. Éventail dense d'étincelles, ou un faisceau brûlant vers le haut.|Éruption solaire",
    "Yuki|Gardienne de la neige. Neige dérivante, ou longs pics de glace perforants.|Blizzard de cristal",
    "Akari|Danseuse des braises. Flammes jumelles qui s'enroulent, ou dards perforants.|Danse des braises",
    "Kaze|Fée du vent. Les tirs tournent autour de la ligne de visée comme des rafales.|Anneau de bourrasque",
    "Kumo|Esprit de nuage. Bouffées de brume lentes qui remplissent les couloirs.|Banc de nuages",
    "Hoshi|Danseuse des étoiles. Lances jumelles de près, avec une explosion de météores au maximum.|Pluie de météores",
  ],
  shots: [
    "Éventail de bulles / flux précis", "Étalement de feuilles / aiguilles perforantes", "Éventail de cœurs / essaim guidé",
    "Doubles ondes / lance rapide", "Éclats qui se brisent / fragments lourds", "Arcs de pétales / balayage en spirale",
    "Éclairs en chaîne / foudre jumelle", "Croissants devant + feu derrière",
    "Croissants balancants / lances de lune", "Vagues croisées / flux étroit", "Éventail d'étincelles / double faisceau",
    "Neige dérivante / pics de glace", "Arcs de braises / dards perforants", "Rafales en spirale / aiguilles de vent",
    "Bouffées de brume / volée de nuages", "Lances d'étoiles / explosion de météores",
  ],
  spells: [
    "Signe de Bulle « Floraison Aquatique »", "Signe de Tourbillon « Spirale de Cristal »", "Signe de Pluie « Cascade Aero »",
    "Signe de Cristal « Treillis Prismatique »", "Signe d'Éclatement « Explosion Florale »", "Signe d'Arc-en-ciel « Prisme de Pétales »",
    "Signe d'Étoile « Balayage Météore »", "Signe Jumeau « Hélice Binaire »", "Signe Nocturne « Constellation »",
    "Signe d'Aurore « Rideau de Soie »", "Signe de Vent « Tourbillon Rotatif »", "Signe Final « Aurore Liquide »",
    "Signe de Givre « Miroir Brisé »", "Signe de Glace « Cage Glaciaire »", "Signe d'Hiver « Zéro Absolu »",
    "Signe de Fleur « Danse des Pétales »", "Signe d'Éclosion « Jardin de Lumière Tournante »", "Signe de Printemps « Blizzard de Cerisiers »",
    "Signe de Tonnerre « Ciel Fourchu »", "Signe d'Éclair « Cage de Foudre »", "Signe d'Orage « Colère de Raijin »",
    "Signe de Lune « Marée Croissante »", "Signe de Rêve « Labyrinthe d'Argent »", "Signe d'Éclipse « Horizon Évanescent »",
  ],
  stages: ["Ciel de Bulles", "Lagon Cristallin", "Crépuscule Aero", "Aurore Liquide", "Jardin de Givre", "Prairie de Pétales", "Récif du Tonnerre", "Mer au Clair de Lune"],
  bosses: [
    "Mizuha, esprit des bulles", "Prisme, la sage de cristal", "Comète, tisseuse d'étoiles", "Aurore, couronne des abysses",
    "Shirayuki, la demoiselle de givre", "Hanabi, la danseuse en fleurs", "Narukami du récif du tonnerre", "Tsukiyomi, la lune engloutie",
  ],
  diffs: [
    "Facile", "Normal", "Difficile", "Lunatique",
    "Moins de balles, plus lentes. Vies et bombes en plus. Score ×0.6", "L'expérience prévue. Score ×1",
    "Motifs plus denses et rapides. Score ×1.5", "Un paradis de balles. Pour les braves. Score ×2.2",
  ],
};

const AR: Pack = {
  ui: [
    "✦ رصاص الفقاعات النمط الزجاجي ✦", "▶ ابدأ", "اسم الطيّار",
    "التحرك: WASD / الأسهم · أو اسحب بإصبعك", "Shift: حركة دقيقة · X / مسافة: قنبلة", "P / Esc: إيقاف · R: إعادة · M: كتم",
    "إطلاق تلقائي. لامس الرصاص لرفع السلسلة. النقطة الوردية هي منطقة الإصابة. إصبعان = قنبلة.",
    "🏆 أفضل النتائج", "لا سجلات بعد. كن الأول!", "اختر طيّارك", "الصعوبة", "▶ انطلاق", "← رجوع",
    "إيقاف مؤقت", "▶ متابعة", "↻ إعادة (R)", "⌂ القائمة", "انتهت اللعبة", "✨ رقم قياسي جديد! ✨", "المرحلة", "اللمس", "الترتيب",
    "↻ العب مجددًا", "P / Esc للمتابعة", "Enter / مسافة / R", "القوة", "السرعة", "التحكم", "قنبلة", "قنبلة",
    "أعلى", "لمس", "قوة", "قصوى", "ارتقاء القوة!", "قوة قصوى!", "+قنبلة", "+حياة", "مكافأة",
    "المرحلة {n}", "أكملت المرحلة {n}!", "مكافأة +{v}", "حياة إضافية!", "تحذير!", "روح هائلة تقترب…", "أنماط الرمي", "جديد",
    "مفتاح Shift يبدّل بين الرمي الواسع والدقيق.",
    "واسع", "دقيق · SHIFT",
    "التكبير: رؤية أوسع", "السرعة: إبطاء اللعبة", "مربع الإصابة",
  ],
  chars: [
    "ميزو|روح فقاعات متوازنة. تدفق ثابت ونبضة دائرية عند أقصى قوة.|موجة الرذاذ",
    "كيوي|جنّي الأوراق. مروحة واسعة، أو إبر خارقة في الوضع الدقيق.|عاصفة الأوراق",
    "مومو|هرّة الخوخ. فقاعات موجّهة تطارد الأعداء. متسامحة جدًا.|انفجار القلوب",
    "سورا|ملاك السماء. سرعة فائقة وتيارات متموّجة ونقاط لمس إضافية.|مطر النجوم",
    "كوري|ساحرة الجليد. شظايا تنشطر في منتصف طيرانها.|الصفر المطلق",
    "هانا|راقصة الزهور. بتلات بأقواس دوّارة تغطي الشاشة.|إعصار التفتّح",
    "رايدن|روح الرعد. إطلاق بطيء لكن صواعق خارقة تتسلسل بين الأعداء.|إله الرعد",
    "يامي|ظل القمر. ترمي للأمام والخلف معًا وتبتلع الرصاص.|الكسوف",
    "لونا|ساحرة القمر. أزواج من الهلال تتأرجح، أو رماح قمرية مزدوجة.|الكسوف القمري",
    "نامي|روح المد. جداران من الأمواج المتقاطعة، أو خيط ضيق من القطرات.|مد جزري",
    "صول|روح الشمس. مروحة كثيفة من الشرر، أو شعاع واحد يحرق للأعلى.|وميض شمسي",
    "يوكي|حارسة الثلج. ثلج ينجرف، أو رماح جليدية ثقيلة خارقة.|عاصفة بلورية",
    "أكاري|راقصة الجمر. لهب مزدوج يلتف، أو رقائق نارية خارقة.|رقصة الجمر",
    "كازيه|جنية الريح. القذائف تدور حول خط التصويب كالهبوب.|حلقة العاصفة",
    "كومو|روح السحاب. كرات ضباب بطيئة تملأ الممرات وتسهّل اللمس.|بنك الغيوم",
    "هوشي|راقصة النجوم. رماح نجمية مزدوجة عن قرب، وانفجار شهب عند الحد الأقصى.|مطر الشهب",
  ],
  shots: [
    "مروحة فقاعات / تدفق دقيق", "انتشار أوراق / إبر خارقة", "مروحة قلوب / سرب موجّه",
    "تياران متموّجان / رمح سريع", "شظايا متشققة / شظايا ثقيلة", "أقواس بتلات / كنس حلزوني",
    "صواعق متسلسلة / برق مزدوج", "أقمار أمامية + نار خلفية",
    "أقمار متأرجحة / رماح قمرية", "أمواج متقاطعة / تدفق ضيق", "مروحة شرر / شعاع مزدوج",
    "ثلج منجرف / رماح جليدية", "أقواس جمر / رقائق خارقة", "هبوب حلزوني / إبر ريح",
    "كرات ضباب / زحيف سحاب", "رماح نجمية / انفجار شهب",
  ],
  spells: [
    "شارة الفقاعة «تفتّح مائي»", "شارة الدوّامة «لولب بلّوري»", "شارة المطر «شلال إيرو»",
    "شارة البلّور «شبكة المناشير»", "شارة التحطّم «انفجار زهري»", "شارة قوس قزح «منشور البتلات»",
    "شارة النجم «كنس النيازك»", "شارة التوأم «لولب ثنائي»", "شارة الليل «كوكبة»",
    "شارة الشفق «ستارة حرير»", "شارة الريح «دوّامة دوّارة»", "الشارة الأخيرة «شفق سائل»",
    "شارة الصقيع «مرآة محطّمة»", "شارة الجليد «قفص جليدي»", "شارة الشتاء «الصفر المطلق»",
    "شارة الزهرة «رقصة البتلات»", "شارة التفتّح «حديقة الضوء الدوّار»", "شارة الربيع «عاصفة الكرز»",
    "شارة الرعد «سماء متشعّبة»", "شارة الصاعقة «قفص البرق»", "شارة العاصفة «غضب رايجين»",
    "شارة القمر «مدّ الهلال»", "شارة الحلم «متاهة فضية»", "شارة الكسوف «أفق يتلاشى»",
  ],
  stages: ["سماء الفقاعات", "بحيرة البلّور", "شفق إيرو", "شفق سائل", "حديقة الصقيع", "مرج البتلات", "شعاب الرعد", "بحر ضوء القمر"],
  bosses: [
    "ميزوها، روح الفقاعات", "بريزم، حكيمة البلّور", "كوميت، ناسجة النجوم", "أورورا، تاج الأعماق",
    "شيرايوكي، فتاة الصقيع", "هانابي، الراقصة المتفتّحة", "ناروكامي شعاب الرعد", "تسوكيومي، القمر الغارق",
  ],
  diffs: [
    "سهل", "عادي", "صعب", "جنوني",
    "رصاص أقل وأبطأ. حيوات وقنابل أكثر. النتيجة ×0.6", "التجربة المقصودة. النتيجة ×1",
    "أنماط أكثف وأسرع. النتيجة ×1.5", "جنّة الرصاص. للشجعان فقط. النتيجة ×2.2",
  ],
};

export const PACKS: Record<Lang, Pack> = { en: EN, es: ES, ja: JA, zh: ZH, ru: RU, he: HE, fr: FR, ar: AR };
export const RTL: Record<Lang, boolean> = { en: false, es: false, ja: false, zh: false, ru: false, he: true, fr: false, ar: true };

function get(p: Pack, i: number) {
  return p.ui[i] ?? EN.ui[i] ?? "";
}

export function tr(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const i = IDX[key];
  if (i === undefined) return key;
  let s = get(PACKS[lang] ?? EN, i);
  if (vars) for (const k in vars) s = s.replace(`{${k}}`, String(vars[k]));
  return s;
}

/** index 0 name · 1 description · 2 bomb */
export function charT(lang: Lang, ci: number, part: 0 | 1 | 2): string {
  const p = PACKS[lang] ?? EN;
  const row = p.chars[ci] ?? EN.chars[ci];
  const bits = row.split("|");
  const v = bits[part] ?? (EN.chars[ci].split("|")[part] ?? "");
  return v;
}
/** index 0 wide shot · 1 focused shot */
export function shotT(lang: Lang, ci: number, part: 0 | 1): string {
  const p = PACKS[lang] ?? EN;
  const row = p.shots?.[ci] ?? EN.shots[ci] ?? "";
  const bits = row.split("|");
  return bits[part] ?? (EN.shots[ci]?.split("|")[part] ?? "");
}
export function spellT(lang: Lang, i: number): string {
  const p = PACKS[lang] ?? EN;
  return p.spells[i] ?? EN.spells[i] ?? "";
}
export function stageT(lang: Lang, i: number): string {
  const p = PACKS[lang] ?? EN;
  return p.stages[i] ?? EN.stages[i] ?? "";
}
export function bossT(lang: Lang, i: number): string {
  const p = PACKS[lang] ?? EN;
  return p.bosses[i] ?? EN.bosses[i] ?? "";
}
export function diffT(lang: Lang, i: number): string {
  const p = PACKS[lang] ?? EN;
  return p.diffs[i] ?? EN.diffs[i] ?? "";
}
export function diffDescT(lang: Lang, i: number): string {
  const p = PACKS[lang] ?? EN;
  return p.diffs[4 + i] ?? EN.diffs[4 + i] ?? "";
}

export function detectLang(): Lang {
  const n = (navigator.language || "en").toLowerCase();
  if (n.startsWith("ja")) return "ja";
  if (n.startsWith("zh")) return "zh";
  if (n.startsWith("ru") || n.startsWith("uk") || n.startsWith("be")) return "ru";
  if (n.startsWith("he") || n.startsWith("iw")) return "he";
  if (n.startsWith("ar")) return "ar";
  if (n.startsWith("fr")) return "fr";
  if (n.startsWith("es") || n.startsWith("ca") || n.startsWith("gl")) return "es";
  return "en";
}
