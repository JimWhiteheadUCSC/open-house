/*@vfx
id: eeb81c7b-12f2-44ed-9dc2-35c2995b89f3
title: City-Discount (Septet in Eight Chords)
created: 2026-10-10
artist: Chusen (apprentice name)
lineage:
  - id: 5c51a9b6-dfa2-4dc2-ac31-a502d3c1f9fe
    relation: contrast
    note: Rejects 5c51a9b6's floating overlapping figures and organic simplex wander in favor of a rigid vertical architectural framework of 7 parallel musical staves (balken) separated by dark registration gutters, translating Loewensberg's experimental jazz record store into concrete visual counterpoint.
  - id: e7b33633-1301-41bc-a518-c2f562ff4c6a
    relation: inspiration
    note: Adapts the vertical column/band partitioning from Heitaro's sampler plate to Verena Loewensberg's concrete color chords, replacing scrolling textile repeats with an asynchronous polyphonic septet.
  - id: eba357a0-6c49-4701-a5e1-67ce1b0b2047
    relation: contrast
    note: Replaces autonomous wandering cartoon actors and kikkō hex lattices with strict rectilinear concrete staves and poised geometric holding states.
influences:
  - verena-loewensberg
rationale: |
  In 1960, Verena Loewensberg founded City-Discount near Zurich's Limmatquai:
  the city's sole dedicated jazz record store, and one of Switzerland's only
  importers of post-bop and free jazz (Eric Dolphy, Sun Ra, Ornette Coleman,
  Thelonious Monk). For a founding member of the Zurich Concretists, this was
  not a side venture—it was the acoustic twin to her visual discipline. Where
  Bill and Lohse sought strict mathematical logic, Loewensberg was trained in
  dance under Trudi Schoop, understood acoustic syncopation, and pursued
  'Stimmung': the tuned, living mood of color and form.

  This piece translates City-Discount's ethos into a visual counterpoint of
  seven parallel vertical staves (Balkenelemente), echoing a jazz septet (double
  bass, baritone, piano left, saxophone lead, piano right, trumpet, and ondes
  martenot). The panel's 64-pixel width is partitioned with architectural rigor
  into seven 7-pixel columns separated by 2-pixel sumi pochoir registration
  gutters.

  Each voice moves through composed geometric phrases along incommensurate,
  pairwise coprime time periods (17.3s, 13.1s, 21.7s, 11.5s, 19.3s, 15.7s, and
  23.9s), warped by slow simplex drift. In accordance with Loewensberg's adagio
  phrasing, each staff spends 72% of its cycle in serene, composed poise, then
  cross-modulates in a smooth quintic cadence. The seven voices modulate out of
  phase: at any instant, five or six hold still while one or two transition,
  maintaining constant balance and passing the freeze-frame test on every frame.

  Eight concrete pigments—ochre gold, cadmium vermilion, deep ultramarine,
  verdigris, plum madder, lemon citron, chalk ivory, and slate ash—interact
  across the staves. Room bass gently resonates through the lower contrabass
  registers, while daylight from the clock modulates the warmth of the deep
  slate-taupe ground.
@vfx*/

const meta = { name: "city_discount_septet", fps: 30, inputs: ["clock", "audio"] };

// Base ground: deep nocturnal slate-taupe
const C_GROUND_BASE = [26, 24, 30];
const C_GUTTER_BASE = [14, 12, 16];

// Loewensberg jazz chord palette (8 concrete pigments)
const PAL = [
  [198, 142, 38],  // 0: Ochre / Saffron Gold
  [215, 52, 42],   // 1: Cadmium Vermilion
  [32, 92, 186],   // 2: Deep Ultramarine Blue
  [42, 148, 124],  // 3: Verdigris Green
  [142, 38, 76],   // 4: Plum Madder
  [238, 204, 76],  // 5: Citron Lemon
  [236, 232, 222], // 6: Chalk Ivory
  [92, 86, 96],    // 7: Slate Ash
];

// Architectural layout across 64px width:
// 7 columns of 7px width = 49px
// 7 gutters of 2px width + 1 margin gutter of 1px = 15px
// 49 + 15 = 64px exactly.
const COL_X = [2, 11, 20, 29, 38, 47, 56];
const COL_W = 7;
const NUM_COLS = 7;

// Incommensurate, pairwise coprime phrase periods for the 7 voices
const PERIODS = [17.3, 13.1, 21.7, 11.5, 19.3, 15.7, 23.9];

// Composed thematic states for each voice (2 to 3 bars per state):
// Format: [ [yStart, yEnd, paletteIndex], ... ]
const COL_THEMES = [
  // Voice 0 (Contrabass / Low Foundation)
  [
    [[34, 58, 2], [10, 24, 7]],
    [[24, 60, 2], [4, 16, 0]],
    [[38, 62, 4], [14, 30, 2]],
    [[18, 52, 2], [54, 62, 1]],
  ],
  // Voice 1 (Baritone / Cello)
  [
    [[18, 44, 0], [48, 56, 1]],
    [[8, 32, 1], [36, 58, 0]],
    [[22, 54, 0], [2, 14, 7]],
    [[12, 38, 3], [42, 60, 1]],
  ],
  // Voice 2 (Piano Left Hand)
  [
    [[6, 22, 3], [26, 50, 4]],
    [[14, 36, 4], [40, 58, 3]],
    [[4, 28, 0], [32, 48, 4]],
    [[18, 42, 3], [46, 62, 7]],
  ],
  // Voice 3 (Tenor / Saxophone Lead / Axis)
  [
    [[12, 38, 1], [42, 58, 0], [2, 8, 6]],
    [[16, 46, 0], [50, 62, 1], [6, 12, 5]],
    [[8, 30, 1], [34, 52, 6], [56, 62, 0]],
    [[20, 48, 4], [52, 60, 1], [4, 14, 6]],
  ],
  // Voice 4 (Piano Right Hand)
  [
    [[20, 38, 2], [42, 58, 3]],
    [[6, 26, 3], [30, 52, 2]],
    [[16, 44, 2], [48, 60, 5]],
    [[10, 32, 7], [36, 56, 3]],
  ],
  // Voice 5 (Alto / Trumpet)
  [
    [[8, 26, 5], [30, 48, 0]],
    [[14, 38, 0], [42, 58, 5]],
    [[4, 20, 1], [24, 52, 0]],
    [[18, 40, 5], [44, 62, 6]],
  ],
  // Voice 6 (Soprano / Ondes Martenot)
  [
    [[14, 32, 6], [38, 58, 4]],
    [[6, 24, 4], [28, 48, 6]],
    [[20, 42, 6], [46, 60, 1]],
    [[10, 28, 5], [32, 54, 4]],
  ],
];

function getPhraseState(colIdx, t) {
  const period = PERIODS[colIdx];
  const states = COL_THEMES[colIdx];
  const nStates = states.length;

  // Simplex phase warping prevents mechanical periodicity across long runs
  const tw = t + noise2(t * 0.008, colIdx * 2.5) * 3.0;
  const p = (((tw % period) + period) % period) / period;

  const rawIdx = p * nStates;
  const idx = Math.floor(rawIdx);
  const frac = rawIdx - idx;

  // 72% poised hold, 28% quintic transition cadence
  let u = 0;
  if (frac > 0.72) {
    const rawU = (frac - 0.72) / 0.28;
    // quintic ease-in-out: 6u^5 - 15u^4 + 10u^3
    u = rawU * rawU * rawU * (rawU * (rawU * 6 - 15) + 10);
  }

  const cur = idx % nStates;
  const nxt = (cur + 1) % nStates;
  return { s0: states[cur], s1: states[nxt], u };
}

function render(t, dt) {
  const daylight = (typeof input !== "undefined" && input.clock) ? input.clock.daylight : 0.5;
  const bass = (typeof input !== "undefined" && input.audio && input.audio.ok) ? input.audio.bass : 0;

  // Ground: deep nocturnal slate-taupe -> warm gallery linen
  const bgR = lerp(C_GROUND_BASE[0] - 6, C_GROUND_BASE[0] + 12, daylight) | 0;
  const bgG = lerp(C_GROUND_BASE[1] - 6, C_GROUND_BASE[1] + 10, daylight) | 0;
  const bgB = lerp(C_GROUND_BASE[2] - 6, C_GROUND_BASE[2] + 8, daylight) | 0;
  fill(rgb(bgR, bgG, bgB));

  // Gutters (sumi registration lines between staves)
  const gutR = lerp(C_GUTTER_BASE[0] - 4, C_GUTTER_BASE[0] + 4, daylight) | 0;
  const gutG = lerp(C_GUTTER_BASE[1] - 4, C_GUTTER_BASE[1] + 4, daylight) | 0;
  const gutB = lerp(C_GUTTER_BASE[2] - 4, C_GUTTER_BASE[2] + 4, daylight) | 0;
  const cGutter = rgb(gutR, gutG, gutB);

  for (let y = 0; y < 64; y++) {
    for (let c = 0; c < NUM_COLS; c++) {
      const gx = COL_X[c] - 2;
      setPixel(gx, y, cGutter);
      setPixel(gx + 1, y, cGutter);
    }
    setPixel(63, y, cGutter);
  }

  // Render each voice's poised or transitioning bars
  for (let c = 0; c < NUM_COLS; c++) {
    const { s0, s1, u } = getPhraseState(c, t);
    const x0 = COL_X[c];
    const x1 = x0 + COL_W;

    const nBars = Math.max(s0.length, s1.length);
    for (let b = 0; b < nBars; b++) {
      const b0 = s0[Math.min(b, s0.length - 1)];
      const b1 = s1[Math.min(b, s1.length - 1)];

      let yStart = lerp(b0[0], b1[0], u);
      let yEnd   = lerp(b0[1], b1[1], u);

      // Acoustic bass resonance in the lower voices (Col 0 and Col 1)
      if (c <= 1) {
        yEnd += bass * 2.5;
      }

      const col0 = PAL[b0[2]];
      const col1 = PAL[b1[2]];

      let r = lerp(col0[0], col1[0], u);
      let g = lerp(col0[1], col1[1], u);
      let bl = lerp(col0[2], col1[2], u);

      // Bass energy warms plum madder and vermilion saturation
      if (b0[2] === 4 || b1[2] === 4) {
        r += bass * 14;
      }

      const barColor = rgb(clamp(r | 0, 0, 255), clamp(g | 0, 0, 255), clamp(bl | 0, 0, 255));

      const iy0 = Math.max(0, Math.floor(yStart));
      const iy1 = Math.min(63, Math.ceil(yEnd));

      for (let y = iy0; y <= iy1; y++) {
        // Anti-aliased subpixel edge filtering at vertical boundaries
        let alpha = 1.0;
        if (y < yStart) alpha = 1.0 - (yStart - y);
        else if (y > yEnd) alpha = 1.0 - (y - yEnd);
        alpha = clamp(alpha, 0, 1);

        if (alpha >= 0.99) {
          for (let x = x0; x < x1; x++) setPixel(x, y, barColor);
        } else if (alpha > 0.01) {
          for (let x = x0; x < x1; x++) {
            const cur = getPixel(x, y);
            const cr = (cur >> 16) & 255, cg = (cur >> 8) & 255, cb = cur & 255;
            const nr = (cr + ((r | 0) - cr) * alpha) | 0;
            const ng = (cg + ((g | 0) - cg) * alpha) | 0;
            const nb = (cb + ((bl | 0) - cb) * alpha) | 0;
            setPixel(x, y, rgb(nr, ng, nb));
          }
        }
      }
    }
  }
}
