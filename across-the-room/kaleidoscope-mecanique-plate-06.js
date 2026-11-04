/*@vfx
id: 0a9861a7-a071-48b9-ad57-ce3e8d93e527
title: Kaléidoscope Mécanique (Plate 06)
created: 2026-10-10
artist: Chusen (apprentice name)
lineage:
  - id: e7b33633-1301-41bc-a518-c2f562ff4c6a
    relation: contrast
    note: Rejects the linear horizontal unrolling band format of Plate 14 in favor of a concentric radial mandala, directly inspired by M. P. Verneuil's 1926 Paris pochoir portfolio 'Kaleidoscope' (Heitaro's documented European source).
  - id: 499066a2-9abe-4791-b24e-2db2ce68c5ac
    relation: inspiration
    note: Inherits the traveling pochoir defect that counterchanges color across the lattice to break wallpaper equilibrium, while translating the motion into rotational ratchet escapement.
  - id: eeb81c7b-12f2-44ed-9dc2-35c2995b89f3
    relation: contrast
    note: Replaces rectilinear vertical jazz staves and quiet concrete adagio with dynamic counter-rotating radial gears, interlocking navettes, and Okazz-style cartoon escapement snaps.
influences:
  - mizuki-heitaro
  - okazz
rationale: |
  In 1930, Mizuki Heitaro published the Abstract Pattern Portfolio in Osaka,
  introducing parametric Western modernism to the Kyoto zuan textile tradition.
  His documented European touchstone was M. P. Verneuil's 1926 Paris portfolio
  'Kaleidoscope: Ornements Abstraits' (published by Éditions Albert Lévy and
  stenciled in luminous pochoir by Jean Saudé). Where Heitaro's Plate 14 realized
  these motifs as stacked horizontal yardage bands, Verneuil's foundational
  plates presented them as radiant, multi-ring radial mandalas.

  This piece reimagines Verneuil's 1926 pochoir kaleidoscope as a living mechanical
  print. The 64x64 panel is organized into four concentric rings and four corner
  spandrels, precomputed in turns-normalized polar and corner distance lookup
  tables for zero-cost per-pixel rendering:
  - Zone 0 (r < 7.5): Central 8-fold star rosette with ivory jewel eye and cinnabar collar.
  - Zone 1 (7.5 <= r < 15.5): 12-fold interlocking navette shuttles in verdigris and gold.
  - Zone 2 (15.5 <= r < 23.5): 16-fold stepped chevron sawtooth ring in vermilion and ivory.
  - Zone 3 (23.5 <= r < 30.0): 24-fold outer gear rim featuring dentil cogs and golden bead track.
  - Rim (30.0 <= r < 31.0): 1px pochoir registration border.
  - Spandrels (r >= 31.0): Concentric corner quarter-rosettes, allowing the print to tile
    seamlessly across multiple panels like modular wallpaper.

  Crucially, instead of continuous hypnotic rotation, the rings are animated by
  Okazz's rest-dominant escapement meter: each ring holds still for 72% of its step,
  then executes a crisp quintic spring snap. The four rings and outer spandrels
  operate along incommensurate, pairwise coprime periods (19.3s, 26.7s, 31.0s, 34.1s,
  and 41.5s) in alternating clockwise and counter-clockwise directions, coupled with
  gentle perimeter micro-drift to keep the active motion field expansive over long runs.

  To defy wallpaper equilibrium over indefinite runs, a traveling pochoir registration
  defect wanders across the rings on a 17-second cycle, counterchanging colors along
  its sector. Five authentic 1926 Saudé pochoir color chords slowly morph across a
  218-second macro progression. Clock daylight modulates ground depth and silk warmth,
  while room bass resonates through the gold jewel track, quantizing escapement snaps
  on musical beats.
@vfx*/

const meta = { name: "kaleidoscope_mecanique", fps: 30, inputs: ["clock", "audio"] };

// --- polar & spandrel lookup tables (turns-normalized, computed once at load) -

const RADIUS_LUT = new Float32Array(4096);
const ANGLE_TURNS = new Float32Array(4096);
const CORNER_LUT = new Float32Array(4096);
const CORNER_ANGLE_TURNS = new Float32Array(4096);

const TWO_PI = Math.PI * 2;

for (let y = 0; y < 64; y++) {
  for (let x = 0; x < 64; x++) {
    const idx = (y << 6) | x;
    const dx = x - 31.5;
    const dy = y - 31.5;
    RADIUS_LUT[idx] = Math.hypot(dx, dy);
    let a = Math.atan2(dy, dx);
    if (a < 0) a += TWO_PI;
    ANGLE_TURNS[idx] = a / TWO_PI;

    const cx = x < 32 ? 0 : 63;
    const cy = y < 32 ? 0 : 63;
    const cdx = x - cx;
    const cdy = y - cy;
    CORNER_LUT[idx] = Math.hypot(cdx, cdy);
    let ca = Math.atan2(cdy, cdx);
    if (ca < 0) ca += TWO_PI;
    CORNER_ANGLE_TURNS[idx] = ca / TWO_PI;
  }
}

// --- 5 authentic 1926 Saudé pochoir color chords (Verneuil Kaleidoscope) -----

const CHORDS = [
  // 0: Cinnabar & Prussian Lapis (Deep indigo, vermilion, saffron ochre, verdigris, plum, ivory, gilt gold, sumi ink)
  [[14, 18, 28], [205, 42, 34], [218, 156, 26], [32, 142, 115], [146, 36, 72], [236, 230, 216], [238, 192, 54], [22, 24, 28]],
  // 1: Benibana & Imperial Jade (Sumi charcoal, persimmon, jade green, rose benibana, amber gold, ivory, bronze, deep navy)
  [[24, 20, 26], [215, 65, 38], [36, 152, 92], [202, 48, 96], [224, 168, 32], [238, 232, 220], [215, 145, 40], [18, 18, 24]],
  // 2: Seiji Celadon & Madder (Dark teal slate, coral orange, mustard, celadon, wine madder, ecru, pale gold, iron ink)
  [[16, 24, 30], [218, 82, 42], [208, 144, 24], [44, 138, 128], [132, 32, 60], [232, 228, 214], [228, 182, 60], [20, 22, 24]],
  // 3: Nanban Lacquer & Malachite (Urushi black-brown, cinnabar, golden yellow, malachite, imperial purple, raw silk, gilt, lacquer sumi)
  [[22, 18, 18], [198, 38, 36], [222, 162, 28], [28, 134, 102], [128, 42, 88], [234, 230, 218], [242, 196, 48], [16, 16, 20]],
  // 4: Pochoir Ultramarine & Saffron (Prussian blue, cadmium red, saffron, verdigris, amethyst, chalk ivory, gold, carbon)
  [[18, 22, 38], [212, 46, 40], [226, 172, 30], [38, 148, 120], [140, 48, 110], [240, 236, 224], [245, 198, 52], [20, 24, 32]]
];

const G_COLORS = new Int32Array(8);

let G_th0 = 0, G_th1 = 0, G_th2 = 0, G_th3 = 0, G_thCorner = 0;
let G_r0 = 7.5, G_r1 = 15.5, G_r2 = 23.5, G_r3 = 30.0;
let G_defectRing = 0, G_defectAngleTurn = 0;
let __lastT = -999;
let G_beatSpring = 0;

// --- Okazz cartoon escapement ratchet ---------------------------------------

function ratchetTurns(t, period, steps, dir, driftSpeed, beatNudge) {
  const stepTime = period / steps;
  const cycle = ((t % period) + period) % period;
  const stepIdx = Math.floor(cycle / stepTime);
  const stepFrac = (cycle - stepIdx * stepTime) / stepTime;

  let snap = 0;
  // 72% poise hold, 28% rapid escapement snap
  if (stepFrac > 0.72) {
    const rawU = (stepFrac - 0.72) / 0.28;
    // Quintic snap with soft ends
    snap = rawU < 0.5 ? 4 * rawU * rawU * rawU : 1 - Math.pow(-2 * rawU + 2, 3) / 2;
  }
  return dir * ((stepIdx + snap + beatNudge * 0.15) / steps + t * driftSpeed);
}

// --- per-frame state update --------------------------------------------------

function updateFrame(t) {
  const daylight = (typeof input !== "undefined" && input.clock) ? input.clock.daylight : 0.5;
  const bass = (typeof input !== "undefined" && input.audio && input.audio.ok) ? input.audio.bass : 0;
  const beat = (typeof input !== "undefined" && input.audio && input.audio.ok && input.audio.beat);

  if (beat) G_beatSpring = 1.0;
  else G_beatSpring *= 0.88;

  // Slowly morph between 5 pochoir chords (cycle ~43.7s per chord, total ~218.5s)
  const chordCycle = t * (1.0 / 43.7);
  const cIdx0 = Math.floor(chordCycle) % 5;
  const cIdx1 = (cIdx0 + 1) % 5;
  const cFrac = chordCycle - Math.floor(chordCycle);
  const cBlend = cFrac * cFrac * (3 - 2 * cFrac);

  const pal0 = CHORDS[cIdx0];
  const pal1 = CHORDS[cIdx1];

  for (let i = 0; i < 8; i++) {
    const col0 = pal0[i];
    const col1 = pal1[i];
    let r = lerp(col0[0], col1[0], cBlend);
    let g = lerp(col0[1], col1[1], cBlend);
    let b = lerp(col0[2], col1[2], cBlend);

    // Daylight modulates ground and ivory warmth
    if (i === 0) { // Ground
      r = lerp(r - 4, r + 8, daylight);
      g = lerp(g - 4, g + 6, daylight);
      b = lerp(b - 2, b + 6, daylight);
    } else if (i === 5) { // Raw Silk Ivory
      r = Math.min(255, lerp(r - 8, r + 8, daylight) + bass * 14);
      g = Math.min(255, lerp(g - 8, g + 8, daylight));
      b = Math.min(255, lerp(b - 6, b + 6, daylight));
    } else if (i === 6) { // Gilt Gold
      r = Math.min(255, r + bass * 18);
      g = Math.min(255, g + bass * 12);
    }

    G_COLORS[i] = rgb(r | 0, g | 0, b | 0);
  }

  // Four incommensurate pairwise coprime periods + corner rosettes
  G_th0 = ratchetTurns(t, 19.3, 8, 1, 0.003, G_beatSpring);
  G_th1 = ratchetTurns(t + 2.1, 26.7, 12, -1, 0.002, -G_beatSpring);
  G_th2 = ratchetTurns(t + 4.7, 34.1, 16, 1, 0.002, G_beatSpring);
  G_th3 = ratchetTurns(t + 1.4, 41.5, 24, -1, 0.0015, -G_beatSpring);
  G_thCorner = ratchetTurns(t + 3.0, 31.0, 12, 1, 0.002, G_beatSpring);

  // Subtle breathing of ring boundaries via slow simplex noise
  G_r0 = 7.5 + 0.35 * noise2(t * 0.015, 1.2);
  G_r1 = 15.5 + 0.45 * noise2(t * 0.017, 3.4);
  G_r2 = 23.5 + 0.45 * noise2(t * 0.019, 5.6);
  G_r3 = 30.0 + 0.25 * noise2(t * 0.021, 7.8);

  // Pochoir registration defect: hops rings every 17s and slowly circles
  const dCycle = t / 17.0;
  G_defectRing = Math.floor(dCycle) % 3; // ring 0, 1, or 2
  G_defectAngleTurn = (t * 0.025) % 1.0;

  __lastT = t;
}

// --- pixel shader ------------------------------------------------------------

function pixel(x, y, t) {
  if (t !== __lastT) {
    updateFrame(t);
  }

  const idx = (y << 6) | x;
  const r = RADIUS_LUT[idx];
  const at = ANGLE_TURNS[idx];

  // 1. Spandrel Corners (r >= G_r3 + 1.0)
  if (r >= G_r3 + 1.0) {
    const cd = CORNER_LUT[idx];
    const cat = CORNER_ANGLE_TURNS[idx];
    const uCorner = (cat + G_thCorner) * 12;
    const mCorner = Math.abs((uCorner - Math.floor(uCorner)) - 0.5) * 2;

    if (cd <= 4.2) return G_COLORS[6]; // Gold boss
    if (cd <= 7.4) return mCorner > 0.4 ? G_COLORS[1] : G_COLORS[4]; // Fluted rosette
    if (cd <= 10.8) return G_COLORS[2]; // Ochre arc
    if (cd <= 14.2) return mCorner > 0.5 ? G_COLORS[5] : G_COLORS[3]; // Outer rays
    return G_COLORS[0]; // Ground
  }

  // 2. Pochoir Registration Border Rim (r in [G_r3, G_r3 + 1.0])
  if (r >= G_r3) {
    return G_COLORS[5]; // Ivory border rim
  }

  // Check if pixel falls within traveling defect sector
  let diffTurn = Math.abs(at - G_defectAngleTurn);
  if (diffTurn > 0.5) diffTurn = 1.0 - diffTurn;

  // 3. Zone 3: Outer Gear Dentils and Bead Track (r in [G_r2, G_r3])
  if (r >= G_r2) {
    const isDefect = (G_defectRing === 2 && diffTurn < (1.0 / 24) && r >= G_r2 + 1.5);
    const u = (at + G_th3) * 24;
    const m = Math.abs((u - Math.floor(u)) - 0.5) * 2;
    const rDentil = G_r2 + (G_r3 - G_r2) * 0.58;

    if (r >= rDentil) {
      // Outer Dentils
      if (isDefect) return m > 0.45 ? G_COLORS[5] : G_COLORS[1];
      return m > 0.45 ? G_COLORS[1] : G_COLORS[7];
    } else if (r >= G_r2 + 1.4) {
      // Inner Beads
      if (isDefect) return m > 0.5 ? G_COLORS[6] : G_COLORS[4];
      return m > 0.5 ? G_COLORS[6] : G_COLORS[3];
    } else {
      // Gutter divider
      return G_COLORS[7];
    }
  }

  // 4. Zone 2: Stepped Chevron Sawtooth Ring (r in [G_r1, G_r2])
  if (r >= G_r1) {
    const isDefect = (G_defectRing === 1 && diffTurn < (1.0 / 16));
    const u = (at + G_th2) * 16;
    const m = Math.abs((u - Math.floor(u)) - 0.5) * 2;
    const span = G_r2 - G_r1;
    const rn = (r - G_r1) / span;
    const chevPos = 0.15 + 0.7 * m;
    const dChev = Math.abs(rn - chevPos);

    if (isDefect) {
      if (dChev < 0.11) return G_COLORS[6];
      if (dChev < 0.24) return G_COLORS[5];
      if (m > 0.65) return G_COLORS[1];
      if (rn < 0.25) return G_COLORS[3];
      return G_COLORS[0];
    }

    if (dChev < 0.11) return G_COLORS[5]; // Ivory peak
    if (dChev < 0.24) return G_COLORS[1]; // Vermilion chevron
    if (m > 0.65) return G_COLORS[4];     // Plum cusp
    if (rn < 0.25) return G_COLORS[2];    // Ochre base
    return G_COLORS[0];                   // Ground
  }

  // 5. Zone 1: Interlocking Navettes / Seed Shuttles (r in [G_r0, G_r1])
  if (r >= G_r0) {
    const isDefect = (G_defectRing === 0 && diffTurn < (1.0 / 12));
    const u = (at + G_th1) * 12;
    const m = Math.abs((u - Math.floor(u)) - 0.5) * 2;
    const span = G_r1 - G_r0;
    const rn = (r - G_r0) / span;
    const halfW = Math.sin(rn * Math.PI) * 0.85;

    if (m > 1.0 - halfW) {
      const innerW = halfW * 0.45;
      if (isDefect) {
        if (m > 1.0 - innerW) return G_COLORS[1];
        return G_COLORS[6];
      }
      if (m > 1.0 - innerW) return G_COLORS[6];
      return G_COLORS[3];
    } else {
      if (isDefect) return m < 0.3 ? G_COLORS[5] : G_COLORS[0];
      if (m < 0.3) return G_COLORS[2];
      return G_COLORS[0];
    }
  }

  // 6. Zone 0: Central Star Rosette (r < G_r0)
  const u = (at + G_th0) * 8;
  const m = Math.abs((u - Math.floor(u)) - 0.5) * 2;

  if (r <= 2.2) return G_COLORS[5]; // Ivory jewel eye
  if (r <= 3.2) return G_COLORS[1]; // Vermilion collar
  const rStar = 3.2 + (G_r0 - 3.2) * 0.85 * m;
  if (r <= rStar) {
    return m > 0.45 ? G_COLORS[6] : G_COLORS[4];
  }
  return G_COLORS[0];
}
