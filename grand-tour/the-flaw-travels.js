/*@vfx
id: d2db07b2-8eeb-4eb9-ba7c-7be52e684e35
title: The Flaw Travels
created: 2026-10-12
artist: Weft (apprentice name)
lineage:
  - id: 35feb5ba-985f-4f64-8dfb-13f3bec71b08
    relation: inspiration
    note: kept the per-frame palette cache and restrained hue band; refused the full-field fluid plasma for a settled, tiled lattice
influences:
  - Mizuki Heitaro
  - Verena Loewensberg
rationale: |
  A bolt of cloth unrolling on a loom, at drift speed. Heitaro's office:
  a 16px block repeat (64 = 4x4 tiles exactly), even tiles in nested
  counterchanged diamonds, odd tiles in diagonal bars, the whole field
  scrolling on incommensurate axes (1 : golden ratio) so the cut of
  cloth on screen never exactly repeats. The equilibrium is chosen, not
  suffered — and per his dossier's own question ("does even the bolt
  need its defect?"), one tile in the weave is wrong: it runs the
  opposite motif, jumps to a neighboring tile every half-minute or so
  with a small flare at its accent dots, and because its lattice period
  is 5 tiles against the panel's 4, it occasionally wanders off the
  bolt's edge entirely before returning. The clock re-chords the
  palette through the day — indigo/slate/violet/amber at night,
  paper/indigo/vermilion/gold by day (Loewensberg's recolor-as-
  progression, taken from Heitaro's "one structure, many chords").
  All hue lerps take the long way around the wheel: linear hue
  interpolation passes through green, and green reads as a bug, not a
  chord. On the roster's standing argument this piece sides with
  Heitaro: ornament with a job, meant to be lived beside.
@vfx*/

// the_flaw_travels — pixel mode, clock-reactive
// A Heitaro block repeat: 16px tiles, 64 = 4x4 tiles exactly. Even tiles
// carry nested counterchanged diamonds; odd tiles carry diagonal bars.
// The bolt scrolls on incommensurate axes (1 : golden ratio) so the field
// never exactly repeats. One tile in the cloth is woven wrong — it runs
// the opposite motif — and the flaw travels WITH the cloth, jumping to a
// neighboring tile every half-minute or so. The clock re-chords the
// palette: indigo/teal/violet at night, paper/indigo/vermilion by day.
// All hue lerps take the long way around the wheel so the day's
// transition never dips through green (see tide_pool_lantern.js).

const meta = { name: "the_flaw_travels", fps: 30, inputs: ["clock"] };

const TILE = 16;
const VX = 1.0;        // px/s, warp direction
const VY = 0.618034;   // px/s, weft direction (incommensurate with VX)

const __pal = new Int32Array(4);
let __cacheT = null;

// The flaw: a tile coordinate on a 5-tile-periodic lattice (80px > 64+16),
// so exactly one copy can ever be on screen at once — and occasionally it
// wanders off the bolt's edge entirely before returning.
let dtx = 1, dty = 2;
let nextMove = 20;
let movedAt = -10;

function __rebuildFrame(t) {
  const dl = input.clock.daylight; // 0 deep night .. 1 midday
  // ground: deep indigo by night, dim warm paper by day (via violet/red)
  __pal[0] = hsv(lerp(0.63, 1.09, dl), lerp(0.55, 0.35, dl), lerp(0.10, 0.16, dl));
  // figure A: slate teal by night, indigo by day (short way, no green)
  __pal[1] = hsv(lerp(0.48, 0.60, dl), 0.58, lerp(0.30, 0.34, dl));
  // figure B: muted violet by night, vermilion by day (via magenta/red)
  __pal[2] = hsv(lerp(0.72, 1.03, dl), 0.55, lerp(0.28, 0.40, dl));
  // accent: amber by night, gold by day
  __pal[3] = hsv(lerp(0.09, 0.12, dl), 0.78, lerp(0.55, 0.60, dl));

  if (t > nextMove) {
    // The flaw takes one random step along its lattice.
    const step = Math.random() < 0.5 ? 1 : -1;
    if (Math.random() < 0.5) dtx = (dtx + step + 5) % 5;
    else dty = (dty + step + 5) % 5;
    nextMove = t + 18 + Math.random() * 16;
    movedAt = t;
  }
  __cacheT = t;
}

function pixel(x, y, t) {
  if (t !== __cacheT) __rebuildFrame(t);

  const wx = x + t * VX;
  const wy = y + t * VY;
  const wtx = Math.floor(wx / TILE);
  const wty = Math.floor(wy / TILE);
  const lx = wx - wtx * TILE; // 0..16 within the tile
  const ly = wy - wty * TILE;

  const parity = (wtx + wty) & 1;
  const isFlaw = (wtx % 5 === dtx) && (wty % 5 === dty);
  const motif = isFlaw ? 1 - parity : parity; // the flaw runs the wrong motif

  let idx;
  if (motif === 0) {
    // Nested counterchanged diamonds (Manhattan rings about the tile's
    // true center, 7.5); accent dots at tile center and tile corners
    // (corners join across tiles into full dots on the lattice points).
    const d = Math.abs(lx - 7.5) + Math.abs(ly - 7.5);
    if (d < 2 || d > 14.5) idx = 3;
    else if (d < 6) idx = 1;
    else if (d < 10) idx = 0;
    else idx = 2;
  } else {
    // Diagonal bars, 4px pitch; &15 keeps the rhythm seamless across
    // tile edges. Sequence A, dark, B, dark — counterchange.
    const band = (((lx + ly) | 0) & 15) >> 2;
    idx = band === 0 ? 1 : band === 2 ? 2 : 0;
  }

  let c = __pal[idx];
  if (isFlaw && idx === 3) {
    // Arrival blink: the flaw's accent dots flare briefly after a jump.
    const boost = 1 + 1.5 * Math.exp(-(t - movedAt) * 2.5);
    const r = ((c >> 16) & 255) * boost;
    const g = ((c >> 8) & 255) * boost;
    const b = (c & 255) * boost;
    c = rgb(r > 255 ? 255 : r, g > 255 ? 255 : g, b > 255 ? 255 : b);
  }
  return c;
}
