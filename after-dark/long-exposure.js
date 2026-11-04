/*@vfx
id: 3fd5807b-2f6d-4d22-89d5-15bec172025f
title: Long Exposure
created: 2026-10-12
artist: Latch (apprentice name)
lineage:
  - id: 2bba4eb5-cd9b-4f2a-bb27-b5929bd67d43
    relation: variation
    note: kept the noise-steered wandering ember; refused fade() as the
      trail mechanism - here the whole frame is the trail, resampled
      through a slow rotate/zoom feedback so paths smear into spirals
influences:
  - Gjon Mili's light-painting photography
  - demoscene rotate/zoom feedback effects
rationale: |
  A light-painting, not a particle system. A few embers wander on
  noise (as in Fireflies), but instead of fade() trails the entire
  frame is the photograph: each frame is resampled through a tiny
  rotation and zoom whose rates drift on slow noise, so the smear
  winds into spirals, unwinds, breathes in and out, and never
  settles into one lump - the transform is externally forced at
  ever-advancing t, so there is no attractor to fall into. Mono
  float intensity buffer (accumulate in float, show in 8-bit)
  quantized through an ember ramp with a cool smoke floor, so dying
  trails read as blue-gray smoke before they vanish. Audio is a
  guest, not the engine: level thickens the strokes, a beat strikes
  a match somewhere on the panel; in silence the piece is fully
  itself. First session, apprentice name: Latch - the panel's data
  is clocked in a row at a time and held; this practice holds too,
  one frame into the next.
@vfx*/

// long_exposure — buffer mode, full-frame feedback
// A mono Float32 intensity buffer is resampled each frame through a
// drifting rotate/zoom (bilinear, read from the previous buffer),
// decayed, seeded by three noise-steered embers, and quantized through
// an ember palette. Demonstrates: user-side float accumulation,
// full-frame feedback resample, externally-forced transform rates
// (attractor avoidance), palette-ramp quantization, graceful audio
// degradation.

const meta = { name: "long_exposure", fps: 30, inputs: ["audio"] };

const CX = (WIDTH - 1) / 2;
const CY = (HEIGHT - 1) / 2;
const NPIX = WIDTH * HEIGHT;
const DECAY = 0.990; // ~3s trail half-life at 30fps

let bufA = new Float32Array(NPIX);
let bufB = new Float32Array(NPIX);

// --- ember palette: black -> cool smoke -> crimson -> orange -> gold ----
const PAL = new Int32Array(256);
(function buildPalette() {
  const stops = [
    [0.00, 0, 0, 0],
    [0.08, 12, 14, 30],    // smoke: the blue ghost of a dying trail
    [0.22, 78, 20, 10],
    [0.45, 190, 64, 14],
    [0.70, 255, 152, 42],
    [0.88, 255, 216, 132],
    [1.00, 255, 246, 222],
  ];
  for (let i = 0; i < 256; i++) {
    const v = i / 255;
    let s = 0;
    while (s < stops.length - 2 && v > stops[s + 1][0]) s++;
    const a = stops[s], b = stops[s + 1];
    const u = clamp((v - a[0]) / (b[0] - a[0]), 0, 1);
    PAL[i] = rgb(lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u));
  }
})();

// --- embers ---------------------------------------------------------------
const EMBERS = 3;
let embers = [];

function setup() {
  for (let i = 0; i < EMBERS; i++) {
    embers.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      a: Math.random() * Math.PI * 2,
      speed: 6 + Math.random() * 5,
      turn: 2.5 + Math.random() * 2,
      seed: i * 37.7,
    });
  }
}

function splat(b, x, y, g) {
  const xi = x | 0, yi = y | 0;
  for (let oy = -1; oy <= 1; oy++) {
    const yy = yi + oy;
    if (yy < 0 || yy >= HEIGHT) continue;
    for (let ox = -1; ox <= 1; ox++) {
      const xx = xi + ox;
      if (xx < 0 || xx >= WIDTH) continue;
      const w = ox === 0 && oy === 0 ? 1 : 0.35;
      b[yy * WIDTH + xx] += g * w;
    }
  }
}

function render(t, dt) {
  // Feedback transform: rotation and zoom rates wander on slow noise
  // (t never revisits a value, so the system is externally forced and
  // has no attractor). Both cross zero: the spiral winds and unwinds,
  // breathes in and out.
  const rot = 0.35 * noise3(3.1, 8.7, t * 0.045);
  const zoom = 1.0 + 0.0028 * noise3(11.3, 4.9, t * 0.06);
  const ang = rot * dt;
  const ca = Math.cos(ang), sa = Math.sin(ang);

  // Resample last frame through the transform, bilinear, with decay.
  for (let y = 0; y < HEIGHT; y++) {
    const dy = y - CY;
    const row = y * WIDTH;
    for (let x = 0; x < WIDTH; x++) {
      const dx = x - CX;
      const sx = CX + (dx * ca - dy * sa) * zoom;
      const sy = CY + (dx * sa + dy * ca) * zoom;
      let v = 0;
      if (sx >= 0 && sx < WIDTH - 1 && sy >= 0 && sy < HEIGHT - 1) {
        const x0 = sx | 0, y0 = sy | 0;
        const fx = sx - x0, fy = sy - y0;
        const i00 = y0 * WIDTH + x0;
        const a = bufA[i00], b = bufA[i00 + 1];
        const c2 = bufA[i00 + WIDTH], d = bufA[i00 + WIDTH + 1];
        const top = a + (b - a) * fx;
        const bot = c2 + (d - c2) * fx;
        v = top + (bot - top) * fy;
      }
      bufB[row + x] = v * DECAY;
    }
  }

  // Embers: noise-steered wander, toroidal wrap, thick strokes.
  const level = input.audio.ok ? input.audio.level : 0;
  const gain = 0.09 + 0.07 * level;
  for (const e of embers) {
    const steer = noise3(e.x * 0.05, e.y * 0.05, t * 0.22 + e.seed);
    e.a += steer * e.turn * dt;
    e.x += Math.cos(e.a) * e.speed * dt;
    e.y += Math.sin(e.a) * e.speed * dt;
    e.x = (e.x + WIDTH) % WIDTH;
    e.y = (e.y + HEIGHT) % HEIGHT;
    splat(bufB, e.x, e.y, gain);
  }

  // A struck match on the beat.
  if (input.audio.beat) {
    splat(bufB, Math.random() * WIDTH, Math.random() * HEIGHT, 0.5);
  }

  // Quantize through the ember ramp.
  for (let i = 0; i < NPIX; i++) {
    let v = bufB[i] * 1.15;
    if (v > 1) v = 1;
    setPixel(i % WIDTH, (i / WIDTH) | 0, PAL[(v * 255) | 0]);
  }

  const tmp = bufA; bufA = bufB; bufB = tmp;
}
