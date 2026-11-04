/*@vfx
id: 6b8043d4-3d08-471e-81e2-95a89619efc9
title: Lichen
created: 2026-10-12
artist: Jiffy (apprentice name)
influences: ["Alan Turing, The Chemical Basis of Morphogenesis (1952)", "Karl Sims' reaction-diffusion tutorial"]
rationale: |
  A Gray-Scott reaction-diffusion system grown as lichen across the
  panel. The archive had fields, particles, sprites, a reactive glow,
  and a water sim - but no self-organizing chemistry. Two chemicals
  (U feeds, V eats) diffuse and react on a 32x32 torus, upsampled 2x
  so the frame budget holds; the system runs in the soliton regime of
  Turing space, where the pattern is never a standing texture but a
  population of pulsing, drifting, merging blobs. The feed/kill pair
  wanders slowly inside that band so the character of the growth
  changes over minutes; a slow global breath makes even a quiet moment
  respire. Poisson spores keep arriving like weather; audio level
  raises the spore rate and each beat drops one; a button press is a
  drop of reagent at the center; daylight shifts the growth from
  bioluminescent teal at night to moss-and-ochre by day. A watchdog
  reseeds if the chemistry ever wanders into a kill zone.
@vfx*/

const meta = { name: "lichen", fps: 30, inputs: ["audio", "button", "clock"] };

const SW = 32;              // sim resolution; drawn as 2x2 blocks
const SN = SW * SW;
let U = new Float32Array(SN);
let V = new Float32Array(SN);
let U2 = new Float32Array(SN);
let V2 = new Float32Array(SN);

const PAL = new Int32Array(256);

let seedTimer = 2;
let checkTimer = 5;

// A spore: a small disk that perturbs BOTH chemicals - V-only seeds
// usually fail to ignite. Toroidal wrap.
function seed(cx, cy, r) {
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r * r) continue;
      const x = (cx + dx + SW) % SW;
      const y = (cy + dy + SW) % SW;
      const i = y * SW + x;
      V[i] = 0.6;
      U[i] = 0.4;
    }
  }
}

function setup() {
  U.fill(1);
  for (let i = 0; i < 7; i++) {
    seed(3 + ((Math.random() * (SW - 6)) | 0),
         3 + ((Math.random() * (SW - 6)) | 0), 2);
  }
}

// One Gray-Scott step, dt=1, Du=1, Dv=0.5, normalized 9-point
// Laplacian (Karl Sims kernel: adjacent 0.2, diagonal 0.05, center -1).
function step(F, k) {
  for (let y = 0; y < SW; y++) {
    const yu = (y === 0 ? SW - 1 : y - 1) * SW;
    const yd = (y === SW - 1 ? 0 : y + 1) * SW;
    const yc = y * SW;
    for (let x = 0; x < SW; x++) {
      const xl = x === 0 ? SW - 1 : x - 1;
      const xr = x === SW - 1 ? 0 : x + 1;
      const i = yc + x;
      const lapU = (U[yc + xl] + U[yc + xr] + U[yu + x] + U[yd + x]) * 0.2
                 + (U[yu + xl] + U[yu + xr] + U[yd + xl] + U[yd + xr]) * 0.05 - U[i];
      const lapV = (V[yc + xl] + V[yc + xr] + V[yu + x] + V[yd + x]) * 0.2
                 + (V[yu + xl] + V[yu + xr] + V[yd + xl] + V[yd + xr]) * 0.05 - V[i];
      const u = U[i], v = V[i];
      const uvv = u * v * v;
      U2[i] = u + (lapU - uvv + F * (1 - u));
      V2[i] = v + (0.5 * lapV + uvv - (F + k) * v);
    }
  }
  let tu = U; U = U2; U2 = tu;
  let tv = V; V = V2; V2 = tv;
}

function render(t, dt) {
  const daylight = input.clock.daylight;

  // Palette rebuilt every frame: a slow global breath and a faint hue
  // wobble make the whole organism respire even when the chemistry is
  // quiet. Teal/pale-cyan at night, moss/ochre by day.
  const breath = 0.82 + 0.18 * Math.sin(t * 0.7) + 0.06 * Math.sin(t * 0.23 + 1.7);
  const hShift = 0.012 * Math.sin(t * 0.11);
  const h0 = lerp(0.58, 0.30, daylight) + hShift;
  const h1 = lerp(0.50, 0.12, daylight) + hShift;
  const base = lerp(0.035, 0.07, daylight);
  const vGain = lerp(0.55, 0.8, daylight);
  for (let kk = 0; kk < 256; kk++) {
    const u = kk / 255;
    PAL[kk] = hsv(lerp(h0, h1, smoothstep(0.45, 1, u)),
                  lerp(0.9, 0.5, smoothstep(0.7, 1, u)),
                  (base + Math.pow(u, 1.6) * vGain) * breath);
  }

  // Feed/kill wander slowly inside the soliton band - the regime where
  // blobs pulse, drift, split and merge instead of freezing into a
  // standing labyrinth.
  const F = 0.031 + 0.003 * noise2(t * 0.004, 3.7);
  const k = 0.0615 + 0.0015 * noise2(t * 0.003, 9.1);

  // Poisson spores (rain_barrel idiom): weather-like rhythm, never a
  // metronome. Audio makes it rain spores; a beat drops one now.
  const level = input.audio.ok ? input.audio.level : 0;
  const rate = 0.4 + level * 2.5;
  seedTimer -= dt;
  while (seedTimer <= 0) {
    seedTimer += -Math.log(1 - Math.random()) / rate;
    seed(2 + ((Math.random() * (SW - 4)) | 0),
         2 + ((Math.random() * (SW - 4)) | 0), 1);
  }
  if (input.audio.ok && input.audio.beat) {
    seed(2 + ((Math.random() * (SW - 4)) | 0),
         2 + ((Math.random() * (SW - 4)) | 0), 2);
  }

  // A drop of reagent from a finger.
  if (input.button.pressed) seed(SW >> 1, SW >> 1, 3);

  // Watchdog: if the chemistry ever dies out (parameter wander into a
  // kill zone), reseed. Sampled sparsely, checked rarely.
  checkTimer -= dt;
  if (checkTimer <= 0) {
    checkTimer = 2;
    let sum = 0;
    for (let i = 0; i < SN; i += 8) sum += V[i];
    if (sum / 128 < 0.015) {
      for (let s = 0; s < 3; s++) {
        seed(3 + ((Math.random() * (SW - 6)) | 0),
             3 + ((Math.random() * (SW - 6)) | 0), 2);
      }
    }
  }

  step(F, k);
  step(F, k);

  // Upsample 2x2: one palette lookup paints a block.
  for (let sy = 0; sy < SW; sy++) {
    const row = sy * SW, y0 = sy * 2;
    for (let sx = 0; sx < SW; sx++) {
      let idx = (V[row + sx] * 3.2 * 255) | 0;
      if (idx > 255) idx = 255;
      if (idx < 0) idx = 0;
      const c = PAL[idx], x0 = sx * 2;
      setPixel(x0, y0, c);
      setPixel(x0 + 1, y0, c);
      setPixel(x0, y0 + 1, c);
      setPixel(x0 + 1, y0 + 1, c);
    }
  }
}
