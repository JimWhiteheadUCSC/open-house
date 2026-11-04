/*@vfx
id: 438cc194-9781-47d2-8f33-edc872854698
title: Banked Fire
created: 2026-10-14
artist: Porch (apprentice name)
influences: [doom-fire demoscene tradition]
rationale: |
  First piece after the seed exemplars, and the archive had no cellular
  simulation: Plasma Bloom is a field, Fireflies and Tide Pool Lantern
  are particles, Koi Pond is sprites, Weather Bands is env-tuned bands.
  The doom-fire heat-convection automaton is the demoscene's oldest
  hearth, and this one is built for a wall, not a demo. It is framed as
  a brazier: the fuel bed sits raised and centered on a dim iron rim,
  with firelight pooling on the floor below, so the panel's borders
  stay dark and the fire reads as an object in a room rather than a
  full-bleed effect. The bed is hottest over the center log and banks
  lower by day (input.clock.daylight), so midday reads as coals and
  night as a proper fire. Audio is a bellows, not a VU meter - loudness
  eases into fuel over seconds (bass-weighted), and beats throw embers
  up the flue. A one-frame lag on the upward propagation (bottom-up row
  order over a persistent buffer) is deliberate: a fully synchronous
  sweep rises one row per frame at any fps, and at 45fps that outruns
  the eye; the lag halves the speed so tongues detach instead of
  streaming. Fresh fuel, noise flicker, and per-cell random cooling
  feed the system every frame, so it never settles. In total silence it
  holds a low, living fire - the graceful-degradation idiom from Tide
  Pool Lantern, applied to a simulation rather than a glow.
@vfx*/

// banked_fire — buffer mode, reactive (audio, clock)
// Doom-fire-style heat convection in a brazier framing: a raised,
// centered fuel bed feeds heat upward through a persistent buffer;
// each cell averages the four cells below it (with a noise-driven wind
// shear) and cools randomly. Heat maps through a red -> orange -> gold
// palette with a long dark floor. Clock banks the fire by day; audio
// stokes it; beats throw embers. A dim rim and floor glow ground the
// fire as an object; the panel borders stay dark.

const meta = { name: "banked_fire", fps: 45, inputs: ["audio", "clock"] };

const heat = new Float32Array(WIDTH * HEIGHT);

// Brazier geometry: bed rows 52..55, centered with dark side margins;
// rim just below at row 56; floor glow below that.
const BED_CX = WIDTH * 0.5;
const BED_HALF = 24;      // bed spans x 8..55
const BED_Y = 52;         // top fuel row; bed occupies BED_Y..HEIGHT-9

// Fixed palette, built once at load: black through dark red to pale gold.
// Long dark-red floor (smoothstep) keeps the background black; v*v for
// the perceptual curve (see plasma_bloom.js).
const PALETTE_STEPS = 256;
const palette = new Int32Array(PALETTE_STEPS);
for (let i = 0; i < PALETTE_STEPS; i++) {
  const f = i / (PALETTE_STEPS - 1);
  const h = 0.135 * f * f;             // red -> orange -> gold as heat rises
  const s = lerp(1.0, 0.45, f);        // hottest flames run pale
  const v = smoothstep(0.01, 0.9, f);  // long dark floor, bright tip
  palette[i] = hsv(h, s, v * v);
}

const MAX_EMBERS = 40;
let embers = [];
let stoke = 0; // eased audio energy, 0..1 — the bellows, not a VU meter

function spawnEmber(boost) {
  const x = BED_CX - BED_HALF + 2 + Math.random() * (BED_HALF * 2 - 4);
  const y = BED_Y - 8 + Math.random() * 10;
  if (heat[(y | 0) * WIDTH + (x | 0)] < 0.45) return; // only from hot flame
  embers.push({
    x, y,
    vx: (Math.random() - 0.5) * 4,
    vy: -(7 + Math.random() * 9 + boost * 8),
    life: 1,
  });
}

function render(t, dt) {
  dt = clamp(dt, 0, 0.1);

  // Bellows: loudness eases in over seconds, weighted toward bass.
  const level = input.audio.ok ? input.audio.level : 0;
  const bass = input.audio.ok ? input.audio.bass : 0;
  stoke = lerp(stoke, clamp(level * 0.5 + bass * 0.7, 0, 1), clamp(dt * 2.5, 0, 1));

  // Banked lower by day; never fully out.
  const daylight = input.clock.daylight;
  const fuel = lerp(1.35, 0.8, daylight) + stoke * 0.5;

  // --- fuel bed: four rows, hottest over the central log, tapered ends ---
  for (let x = 0; x < WIDTH; x++) {
    const dx = Math.abs(x - BED_CX);
    const mask = clamp((BED_HALF - dx) / 3, 0, 1); // 0 outside the grate
    const flick = 0.65 + 0.35 * noise2(x * 0.09, t * 1.8);
    const log = clamp(1 - dx / BED_HALF, 0, 1);
    const h0 = clamp(fuel * flick * (0.5 + 0.5 * log * log), 0, 1) * mask;
    const b0 = (HEIGHT - 9) * WIDTH + x;
    heat[b0] = h0;
    heat[b0 + WIDTH] = h0 * 0.97;
    heat[b0 + WIDTH * 2] = h0 * 0.9;
    heat[b0 + WIDTH * 3] = h0 * 0.8;
  }

  // --- propagate upward: 4-neighbor average, wind shear, random cool.
  // Bottom-up row order means rows below still hold LAST frame's values
  // when read — a deliberate one-frame lag that halves the rise speed.
  for (let y = HEIGHT - 10; y >= 0; y--) {
    const row = y * WIDTH;
    const below = row + WIDTH;
    const w = (noise2(y * 0.09, t * 0.5) * 1.3) | 0;
    const cool = 0.0025 + y * 0.00025; // cooler toward the top
    for (let x = 0; x < WIDTH; x++) {
      let sx = x + w;
      sx = sx < 0 ? 0 : sx >= WIDTH ? WIDTH - 1 : sx;
      const sl = sx > 0 ? sx - 1 : sx;
      const sr = sx < WIDTH - 1 ? sx + 1 : sx;
      const sum = heat[below + sl] + heat[below + sx] + heat[below + sr] + heat[below + WIDTH + sx];
      const v = sum * 0.25 - cool - Math.random() * 0.008;
      heat[row + x] = v > 0 ? v : 0;
    }
  }

  // --- paint the heat field ---
  for (let y = 0; y < HEIGHT; y++) {
    const row = y * WIDTH;
    for (let x = 0; x < WIDTH; x++) {
      setPixel(x, y, palette[(heat[row + x] * (PALETTE_STEPS - 1)) | 0]);
    }
  }

  // --- brazier furniture: a dim iron rim and firelight on the floor ---
  const rimFlick = 0.75 + 0.25 * noise2(t * 1.1, 3.7);
  for (let x = BED_CX - BED_HALF - 2; x <= BED_CX + BED_HALF + 2; x++) {
    setPixel(x | 0, HEIGHT - 8, rgb(30 * rimFlick, 14 * rimFlick, 7));
  }
  for (let y = HEIGHT - 7; y < HEIGHT; y++) {
    const fall = 1 - (y - (HEIGHT - 7)) / 7;
    for (let x = 0; x < WIDTH; x++) {
      const dx = Math.abs(x - BED_CX) / BED_HALF;
      const glow = 0.055 * fall * fall * clamp(1 - dx * dx, 0, 1) * rimFlick * (0.6 + 0.4 * fuel);
      if (glow > 0.004) setPixel(x, y, hsv(0.06, 0.85, glow));
    }
  }

  // --- embers: occasional drift, a burst on every beat ---
  if (embers.length < MAX_EMBERS && Math.random() < (4 + stoke * 14) * dt) {
    spawnEmber(stoke);
  }
  if (input.audio.ok && input.audio.beat) {
    for (let i = 0; i < 10 && embers.length < MAX_EMBERS; i++) spawnEmber(1);
  }
  for (const e of embers) {
    e.x += (e.vx + noise2(e.y * 0.12, t * 1.4) * 7) * dt;
    e.y += e.vy * dt;
    e.life -= dt * 0.5;
  }
  embers = embers.filter((e) => e.life > 0 && e.y > 0);
  for (const e of embers) {
    const idx = clamp((170 + 85 * e.life) | 0, 0, PALETTE_STEPS - 1);
    setPixel(e.x | 0, e.y | 0, palette[idx]);
  }
}
