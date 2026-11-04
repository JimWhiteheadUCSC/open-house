/*@vfx
id: bb791037-ce51-4ea6-bbc5-eeb0e0df4875
title: Noctiluca Bay
created: 2026-10-11
artist: Mica (apprentice name)
influences: []
rationale: |
  A nighttime coastline stirred by bioluminescent waves (Noctiluca scintillans).
  Incoming ocean swells bunch and steepen against an organic diagonal shoreline,
  breaking into bursts of cold electric cyan that wash across wet sand and
  slowly quench into deep sapphire phosphorescence. Incorporates wave-set
  envelopes, diurnal tide drift, dinoflagellate micro-sparkles, and a wandering
  creature wake, with gentle reactivity to ambient sound, clock, and touch.
@vfx*/

const meta = { name: "noctiluca_bay", fps: 30, inputs: ["audio", "button", "clock"] };

const bio = new Float32Array(WIDTH * HEIGHT);
const coastD = new Float32Array(WIDTH * HEIGHT);

const ripples = [];
const SPARK_COUNT = 32;
const sparks = [];

let initialized = false;

function init() {
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      // Natural coastline: diagonal slant with organic headlands and sandy bays
      const n1 = noise2(x * 0.045, y * 0.045) * 7.5;
      const n2 = noise2(x * 0.11 + 1.7, y * 0.11 - 2.3) * 2.8;
      coastD[y * WIDTH + x] = (x * 0.72 + y * 0.68) + n1 + n2;
    }
  }

  for (let i = 0; i < SPARK_COUNT; i++) {
    sparks.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      vx: 0,
      vy: 0,
      life: 0,
    });
  }
  initialized = true;
}

function blendMax(a, b) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return rgb(Math.max(ar, br), Math.max(ag, bg), Math.max(ab, bb));
}

function render(t, dt) {
  if (!initialized) init();

  // Decay bioluminescence buffer
  // Two-phase decay: rapid initial quench on bright shearing bursts,
  // lingering low-level phosphorescence for gentle wakes and backwash
  for (let i = 0; i < bio.length; i++) {
    const v = bio[i];
    if (v > 0.003) {
      bio[i] = v > 0.4 ? v * 0.87 : v * 0.94;
    } else {
      bio[i] = 0;
    }
  }

  const daylight = (input.clock && input.clock.daylight !== undefined) ? input.clock.daylight : 0.0;
  const hour = (input.clock && input.clock.hour !== undefined) ? input.clock.hour : 0;
  // Natural tide: diurnal rhythm plus slow evolving drift
  const tide = Math.sin(hour * Math.PI / 6) * 2.5 + Math.sin(t * 0.028) * 3.0;

  const audioLevel = (input.audio && input.audio.ok) ? input.audio.level : 0;
  const audioBass = (input.audio && input.audio.ok) ? input.audio.bass : 0;

  // Wave sets envelope (long period swell modulation ~16s)
  const setEnvelope = (0.72 + 0.28 * Math.sin(t * 0.39) * Math.sin(t * 0.19 + 1.4)) * (1.0 + audioBass * 0.4);

  // Audio beat throws a bioluminescent splash ring
  if (input.audio && input.audio.beat) {
    ripples.push({
      x: 10 + Math.random() * 34,
      y: 10 + Math.random() * 34,
      r: 1,
      maxR: 10 + Math.random() * 8,
      strength: 1.0 + audioLevel,
    });
  }

  // Button interaction: skimming a hand through the water stirs glowing swirls
  if (input.button && input.button.down) {
    const handX = 26 + Math.cos(t * 2.2) * 16;
    const handY = 26 + Math.sin(t * 2.2) * 16;
    const hIdx = ((handY | 0) * WIDTH + (handX | 0));
    if (handX >= 0 && handX < WIDTH && handY >= 0 && handY < HEIGHT) {
      bio[hIdx] = 1.6;
    }
  }

  // Subtle wandering night creature (bioluminescent fish / ray wake)
  const rayT = t * 0.35;
  const rayX = 24 + Math.sin(rayT * 1.3) * 18 + Math.cos(rayT * 0.5) * 8;
  const rayY = 24 + Math.cos(rayT * 1.1) * 18 + Math.sin(rayT * 0.7) * 8;
  if (rayX >= 1 && rayX < WIDTH - 1 && rayY >= 1 && rayY < HEIGHT - 1) {
    const rIdx = ((rayY | 0) * WIDTH + (rayX | 0));
    if (coastD[rIdx] < 54) { // Only glows in water
      bio[rIdx] = Math.min(1.4, bio[rIdx] + 0.45);
      bio[rIdx - 1] = Math.min(1.1, bio[rIdx - 1] + 0.2);
      bio[rIdx + 1] = Math.min(1.1, bio[rIdx + 1] + 0.2);
    }
  }

  // Update expanding ripples
  for (let i = ripples.length - 1; i >= 0; i--) {
    const rip = ripples[i];
    rip.r += dt * 16.0;
    rip.strength -= dt * 1.8;
    if (rip.r >= rip.maxR || rip.strength <= 0) {
      ripples.splice(i, 1);
      continue;
    }
    const steps = Math.max(8, (rip.r * 5) | 0);
    for (let s = 0; s < steps; s++) {
      const a = (s / steps) * Math.PI * 2;
      const px = (rip.x + Math.cos(a) * rip.r) | 0;
      const py = (rip.y + Math.sin(a) * rip.r) | 0;
      if (px >= 0 && px < WIDTH && py >= 0 && py < HEIGHT) {
        const bIdx = py * WIDTH + px;
        bio[bIdx] = Math.min(1.8, bio[bIdx] + rip.strength * 0.35);
      }
    }
  }

  // Wave & coastline rendering
  for (let y = 0; y < HEIGHT; y++) {
    const yTurb = Math.sin(y * 0.18 - t * 1.8);
    for (let x = 0; x < WIDTH; x++) {
      const idx = y * WIDTH + x;
      const d = coastD[idx] - tide;

      // Depth shoaling factor: waves compress and steepen as depth decreases
      const depthFactor = d > 65 ? 0.2 : (70 - d) * 0.02;
      const wavePhase1 = d * 0.25 * (1 + 0.06 / (depthFactor + 0.1)) - t * 2.3;
      const wavePhase2 = d * 0.37 - t * 3.1 + 1.8;

      const s1 = Math.sin(wavePhase1) * setEnvelope;
      const s2 = Math.sin(wavePhase2) * 0.35;
      const swell = s1 + s2;

      // Breakers: swell cresting over the shallow bar (d: 36..64)
      if (d > 36 && d < 64 && swell > 0.52) {
        const crest = (swell - 0.52) * 2.08;
        const xTurb = Math.sin(x * 0.19 + t * 2.1);
        const xyTurb = Math.cos((x + y) * 0.14 - t * 1.3);
        const turb = 0.5 + 0.25 * (xTurb + yTurb) + 0.25 * xyTurb;

        const bz = d < 48 ? (d - 36) * 0.083 : (64 - d) * 0.0625;
        const flash = crest * bz * turb * 0.65;
        if (flash > 0.02) {
          bio[idx] = Math.min(2.0, bio[idx] + flash);
        }
      }

      // Swash: thin film of foam running up wet beach sand (d: 55..74)
      if (d > 55 && d < 74 && s1 > 0.58) {
        const swash = (s1 - 0.58) * 2.38;
        const sz = d < 64 ? (d - 55) * 0.11 : (74 - d) * 0.1;
        const swashFlash = swash * sz * 0.35;
        if (swashFlash > 0.02) {
          bio[idx] = Math.min(1.5, bio[idx] + swashFlash);
        }
      }

      // Base environmental palette
      let r, g, b;
      if (d > 66) {
        // Wet sand: dark earthy umber with faint sheen
        const wetness = clamp(1 - (d - 66) * 0.09, 0, 1);
        const ambientSand = lerp(1.0, 2.5, daylight);
        r = ((6 + wetness * 10) * ambientSand) | 0;
        g = ((5 + wetness * 8) * ambientSand) | 0;
        b = ((4 + wetness * 6) * ambientSand) | 0;
      } else {
        // Ocean water: deep navy blue with subtle swell reflection
        const depth = clamp((58 - d) * 0.02, 0, 1);
        const shimmer = swell * 0.08;
        const ambientSea = lerp(1.0, 2.2, daylight);
        r = clamp(((2 + shimmer * 10) * ambientSea) | 0, 1, 30);
        g = clamp(((6 + depth * 12 + shimmer * 20) * ambientSea) | 0, 3, 50);
        b = clamp(((18 + depth * 28 + shimmer * 40) * ambientSea) | 0, 8, 90);
      }

      // Bioluminescence blending
      const lum = bio[idx];
      if (lum > 0.01) {
        const lv = clamp(lum, 0, 1);
        const lSq = lv * lv;
        // Bioluminescent color spectrum:
        // Fringe: deep electric sapphire
        // Body: brilliant neon cyan
        // Core: incandescent white
        const br = (lSq * lSq * 180) | 0;
        const bg = (lSq * 225 + lv * 30) | 0;
        const bb = (lv * 255) | 0;

        r = Math.min(255, r + br);
        g = Math.min(255, g + bg);
        b = Math.min(255, b + bb);
      }

      setPixel(x, y, rgb(r, g, b));
    }
  }

  // Drifting dinoflagellate sparkles in the surf
  for (const sp of sparks) {
    if (sp.life <= 0) {
      const sx = Math.random() * WIDTH;
      const sy = Math.random() * HEIGHT;
      const idx = ((sy | 0) * WIDTH + (sx | 0));
      if (bio[idx] > 0.35 && Math.random() < 0.25) {
        sp.x = sx;
        sp.y = sy;
        sp.vx = (Math.random() - 0.5) * 8.0;
        sp.vy = (Math.random() - 0.5) * 8.0;
        sp.life = 0.4 + Math.random() * 0.8;
      }
    } else {
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.life -= dt;
      if (sp.life > 0.1 && sp.x >= 0 && sp.x < WIDTH && sp.y >= 0 && sp.y < HEIGHT) {
        const br = sp.life * sp.life;
        const c = rgb((br * 140) | 0, (br * 245) | 0, (br * 255) | 0);
        const px = sp.x | 0, py = sp.y | 0;
        setPixel(px, py, blendMax(getPixel(px, py), c));
      }
    }
  }
}
