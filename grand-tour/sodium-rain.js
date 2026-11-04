/*@vfx
id: 61ef4c70-c2a9-4058-a62c-8d50d03ae529
title: Sodium Rain
created: 2026-10-14
artist: Tallow (apprentice name)
influences: []
rationale: |
  First authored piece of the practice (the library so far is seed
  exemplars). The panel as a surface, not a field: rain on a window at
  night, droplets sliding down the pane and refracting the sodium
  streetlights and neon behind the glass. env.rain sets droplet
  density (a gentle drizzle when env is unavailable), clock.daylight
  shifts the scene between sodium-night and pale day-rain, and audio
  beats shiver the pane loose. Background bokeh is precomputed and
  cached, rebuilt only when daylight moves; per frame is one buffer
  copy plus a handful of droplet pixels.
@vfx*/

const meta = { name: "sodium_rain", fps: 30, inputs: ["env", "clock", "audio"] };

// --- background: out-of-focus lights behind the glass ----------------------

const LIGHTS = [
  { x: 12, y: 18, r: 15, c: [255, 140, 40] },  // sodium streetlamp
  { x: 50, y: 12, r: 10, c: [170, 195, 255] }, // cool white sign
  { x: 41, y: 45, r: 12, c: [255, 55, 45] },   // red neon
  { x: 18, y: 52, r: 9,  c: [50, 190, 220] },  // cyan shop sign
  { x: 58, y: 33, r: 8,  c: [255, 170, 60] },  // second sodium lamp
];

const bg = new Int32Array(WIDTH * HEIGHT);
let bgDaylight = -1;

function buildBackground(dl) {
  const dayDim = 1 - 0.75 * dl; // daylight washes the signs out
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      let r = 2, g = 3, b = 7; // night floor
      for (let i = 0; i < LIGHTS.length; i++) {
        const L = LIGHTS[i];
        const dx = x - L.x, dy = y - L.y;
        const f = (L.r * L.r) / (dx * dx + dy * dy + L.r * L.r * 0.35);
        r += L.c[0] * f * 0.32 * dayDim;
        g += L.c[1] * f * 0.32 * dayDim;
        b += L.c[2] * f * 0.32 * dayDim;
      }
      // day mix: pale overcast behind the glass; full strength only at
      // midday (dl=1), so twilight still reads as night.
      const dm = dl * dl * 0.9;
      r += (85 - r) * dm;
      g += (95 - g) * dm;
      b += (112 - b) * dm;
      bg[y * WIDTH + x] = rgb(r, g, b);
    }
  }
}

// --- droplets ---------------------------------------------------------------

let drops = []; // {x, y, v, size, ph, hold}
let beads = []; // static evaporating beads left behind {x, y, life}

// Draw a brightened sample of the background (the droplet acts as a lens).
function drawDropPixel(x, y, k, glint) {
  if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
  const c = bg[y * WIDTH + x];
  const r = ((c >> 16) & 255) * k + glint;
  const g = ((c >> 8) & 255) * k + glint;
  const b = (c & 255) * k + glint;
  setPixel(x, y, rgb(r, g, b));
}

function render(t, dt) {
  const dl = input.clock.daylight;
  if (bgDaylight < 0 || Math.abs(dl - bgDaylight) > 0.02) {
    buildBackground(dl);
    bgDaylight = dl;
  }

  // Copy background to frame; a slow noise flicker on the whole scene
  // reads as an unstable neon sign somewhere off-frame.
  const flick = 1 - 0.22 * smoothstep(0.5, 0.85, noise3(3.1, 8.7, t * 1.3));
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const c = bg[y * WIDTH + x];
      const r = ((c >> 16) & 255) * flick;
      const g = ((c >> 8) & 255) * flick;
      const b = (c & 255) * flick;
      setPixel(x, y, rgb(r, g, b));
    }
  }

  // Droplet population follows the rain reading; drizzle if env is absent.
  const rain = input.env.ok ? clamp(input.env.rain, 0, 1) : 0.3;
  const target = 2 + Math.round(rain * 16);
  if (drops.length < target && Math.random() < 0.35) {
    drops.push({
      x: 2 + Math.random() * (WIDTH - 4),
      y: -2,
      v: 0,
      size: 0.6 + Math.random() * 0.9,
      ph: Math.random() * 10,
      hold: 0,
    });
  }

  const glint = 55 * (1 - dl * 0.5);

  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    if (d.hold > 0) {
      d.hold -= dt; // stuck to the glass for a moment
    } else {
      d.v = Math.min(d.v + dt * 30, 8 + d.size * 14);
      d.y += d.v * dt;
      d.x += noise2(d.y * 0.15, d.ph + t * 0.2) * 2 * dt;
      if (Math.random() < 0.25 * dt) d.hold = 0.2 + Math.random() * 0.8;
      if (Math.random() < 1.2 * dt * d.size && beads.length < 40) {
        beads.push({ x: d.x | 0, y: d.y | 0, life: 1 });
        d.size *= 0.92;
      }
    }
    // A beat shakes the pane: held droplets break loose, everything jumps.
    if (input.audio.beat) {
      d.v += 25;
      d.x += (Math.random() - 0.5) * 2;
      if (d.hold > 0 && Math.random() < 0.5) d.hold = 0;
    }
    if (d.y > HEIGHT + 2) {
      drops.splice(i, 1);
      continue;
    }
    const xi = d.x | 0, yi = d.y | 0;
    drawDropPixel(xi, yi, 2.6, glint);          // lensed head
    drawDropPixel(xi, yi - 1, 1.7, glint * 0.4); // wake
    drawDropPixel(xi, yi - 2, 1.3, 0);
  }

  for (let i = beads.length - 1; i >= 0; i--) {
    const b = beads[i];
    b.life -= dt * 0.12;
    if (b.life <= 0) {
      beads.splice(i, 1);
      continue;
    }
    drawDropPixel(b.x, b.y, 1.2 + b.life * 0.5, glint * 0.25 * b.life);
  }
}
