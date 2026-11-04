/*@vfx
id: 458023a8-f170-40e3-8e0c-6bc1db482617
title: Nordlys over Lysefjord
created: 2026-10-11
artist: Solyanka (apprentice name)
lineage:
  - id: 35feb5ba-985f-4f64-8dfb-13f3bec71b08
    relation: contrast
    note: Replaced abstract full-screen plasma math with a physical atmospheric landscape; retained the spectral hue gradient discipline (emerald to violet) while anchoring it to dark basalt crags and dynamic liquid water reflection.
  - id: 3a997c07-9327-4c3e-8b5c-db10ca3fcd8d
    relation: inspiration
    note: Borrowed multi-rate organic breathing and subtle audio swell, but scaled from a localized point beacon to wide atmospheric curtains spanning the horizon.
influences:
  - Peder Balke (nocturnal Arctic atmosphere and maritime contrast)
rationale: |
  A nocturnal Nordic landscape where curtains of auroral light dance over a jagged
  mountain skyline and cast shimmering reflections into a still fjord.

  The composition solves a core challenge of the 64x64 matrix: creating profound
  depth without muddying fine details. By bifurcating the panel with a dark basalt
  mountain ridge at y=41, the upper half acts as an active luminous emitter while
  the lower half acts as an imperfect liquid receiver. Rather than tracing expensive
  rays per pixel, the render loop accumulates downward radiant energy into a 1D
  column buffer during the sky pass, then resamples it into the water using
  perspective-scaled wavelet ripples and Fresnel weighting.
@vfx*/

// nordlys_over_lysefjord — buffer mode, atmospheric landscape
// Aurora borealis undulating over a Norwegian fjord with dark mountain
// silhouettes, twinkling sub-polar stars, and liquid water reflections.
// Demonstrates: 1D radiant column reflection, multi-scale incommensurate
// substorm dynamics, rim lighting, audio/clock reactivity, zero-allocation
// render loop.

const meta = { name: "nordlys_over_lysefjord", fps: 30, inputs: ["audio", "clock"] };

const HORIZON_Y = 41; // Horizon dividing sky/mountains from fjord water

// Precomputed mountain silhouette & crags
const mountainY = new Int32Array(WIDTH);
const snow = new Float32Array(WIDTH);

// Fixed stars with varied brightness and twinkle speed
const STARS = [
  { x: 4, y: 3, b: 0.85, s: 1.4 }, { x: 11, y: 8, b: 0.6, s: 2.1 },
  { x: 19, y: 4, b: 0.95, s: 1.0 }, { x: 27, y: 9, b: 0.5, s: 3.2 },
  { x: 33, y: 2, b: 0.75, s: 1.8 }, { x: 42, y: 7, b: 0.8, s: 1.5 },
  { x: 49, y: 3, b: 0.9, s: 1.2 }, { x: 57, y: 6, b: 0.65, s: 2.5 },
  { x: 61, y: 12, b: 0.7, s: 1.9 }, { x: 8, y: 14, b: 0.45, s: 2.8 },
  { x: 23, y: 13, b: 0.55, s: 2.4 }, { x: 38, y: 11, b: 0.5, s: 3.0 },
];

// Preconfigured auroral drapery parameters
const CURTAINS = [
  { baseH: 35, height: 26, speed: 0.22, freq: 2.1, hue0: 0.35, amp: 4.5, rayK: 1.8 },
  { baseH: 29, height: 24, speed: -0.16, freq: 2.8, hue0: 0.46, amp: 3.8, rayK: 2.4 },
];

// Preallocated radiant column buffers for reflection into fjord water
const skyReflR = new Float32Array(WIDTH);
const skyReflG = new Float32Array(WIDTH);
const skyReflB = new Float32Array(WIDTH);

function setup() {
  for (let x = 0; x < WIDTH; x++) {
    const u = x / (WIDTH - 1);
    // Three majestic mountain massifs across the horizon
    const p1 = Math.exp(-Math.pow((u - 0.20) * 5.5, 2)) * 8.0;
    const p2 = Math.exp(-Math.pow((u - 0.52) * 5.0, 2)) * 10.0;
    const p3 = Math.exp(-Math.pow((u - 0.82) * 6.0, 2)) * 7.5;
    const crag = Math.sin(u * 34.0) * 1.5 + Math.sin(u * 68.0) * 0.8;
    const mh = p1 + p2 + p3 + crag;
    mountainY[x] = clamp((HORIZON_Y - 2 - mh) | 0, 26, HORIZON_Y);
    snow[x] = mh > 5.0 ? clamp((mh - 5.0) / 3.5, 0, 1) : 0;
  }
}

function addColor(c1, c2) {
  const r1 = (c1 >> 16) & 255, g1 = (c1 >> 8) & 255, b1 = c1 & 255;
  const r2 = (c2 >> 16) & 255, g2 = (c2 >> 8) & 255, b2 = c2 & 255;
  return rgb(Math.min(255, r1 + r2), Math.min(255, g1 + g2), Math.min(255, b1 + b2));
}

function render(t, dt) {
  skyReflR.fill(0);
  skyReflG.fill(0);
  skyReflB.fill(0);

  // Substorm surge cycle: macro non-repeating dynamics via two incommensurate periods
  // (approx 83s and 216s) combined with continuous slow 2D simplex drift
  const substorm1 = 0.5 + 0.5 * Math.sin(t * 0.075);
  const substorm2 = 0.5 + 0.5 * Math.sin(t * 0.029 + 1.8);
  const macroEvol = noise2(t * 0.02, 7.7) * 0.5 + 0.5;
  const substorm = substorm1 * 0.5 + substorm2 * 0.3 + macroEvol * 0.4;

  const audioLev = input.audio && input.audio.ok ? input.audio.level : 0;
  const curActivity = 0.85 + substorm * 0.75 + audioLev * 0.6;

  // 1. Midnight Sky Gradient (y = 0..HORIZON_Y-1)
  for (let y = 0; y < HORIZON_Y; y++) {
    const v = y / HORIZON_Y;
    const sr = (1 + v * 2) | 0;
    const sg = (2 + v * 4) | 0;
    const sb = (7 + v * 12) | 0;
    for (let x = 0; x < WIDTH; x++) {
      setPixel(x, y, rgb(sr, sg, sb));
    }
  }

  // 2. Stars
  for (let i = 0; i < STARS.length; i++) {
    const st = STARS[i];
    if (st.y < mountainY[st.x]) {
      const tw = 0.65 + 0.35 * Math.sin(t * st.s + i);
      const b = (st.b * tw * 255) | 0;
      setPixel(st.x, st.y, rgb((b * 0.88) | 0, (b * 0.94) | 0, b));
    }
  }

  // 3. Aurora Curtains (layered draperies undulating across space)
  for (let cIdx = 0; cIdx < CURTAINS.length; cIdx++) {
    const c = CURTAINS[cIdx];
    for (let x = 0; x < WIDTH; x++) {
      const u = x / (WIDTH - 1);
      const footWave =
        Math.sin(u * c.freq * Math.PI * 2 + t * c.speed + cIdx * 1.5) * c.amp +
        noise2(u * 2.5 + t * 0.07, cIdx * 4.0 + t * 0.04) * 3.0;
      const baseRow = clamp((c.baseH + footWave) | 0, 8, HORIZON_Y - 2);
      const topRow = Math.max(0, baseRow - c.height);

      // Magnetic field rayed striations
      const rayPhase = x * c.rayK + t * (0.9 + cIdx * 0.4) + cIdx * 2.3;
      const ray = 0.75 + 0.25 * Math.sin(rayPhase);

      // Fold brightening: optical depth multiplier at drapery bends
      const foldPhase = u * (c.freq * 1.6) * Math.PI * 2 - t * (c.speed * 1.4) + cIdx;
      const fold = Math.pow(0.5 + 0.5 * Math.sin(foldPhase), 3.0) * 1.6;

      const columnIntensity = (0.75 + fold) * ray * curActivity;

      for (let y = topRow; y <= baseRow; y++) {
        if (y >= mountainY[x]) continue;

        const normH = (baseRow - y) / (baseRow - topRow);
        // Vertical emission profile: sharp collision base, soft diffuse upper tail
        const lowerEdge = smoothstep(0.0, 0.12, normH);
        const upperFade = Math.exp(-normH * 1.4);
        const vProf = lowerEdge * upperFade;

        // Spectral altitude transition: atomic oxygen green (0.35) -> seafoam (0.46) -> violet (0.76)
        const hue = (c.hue0 + normH * 0.38 + substorm * 0.08) % 1.0;
        const sat = lerp(0.95, 0.68, normH);
        const val = clamp(vProf * columnIntensity * 0.85, 0, 1);

        if (val > 0.02) {
          const col = hsv(hue, sat, val * val);
          const cur = getPixel(x, y);
          setPixel(x, y, addColor(cur, col));

          // Downward radiant flux into water reflection buffer
          const reflWeight = 1.0 - normH * 0.4;
          skyReflR[x] += ((col >> 16) & 255) * reflWeight;
          skyReflG[x] += ((col >> 8) & 255) * reflWeight;
          skyReflB[x] += (col & 255) * reflWeight;
        }
      }
    }
  }

  // 4. Distant Mountains (y = mountainY[x] to HORIZON_Y - 1)
  for (let x = 0; x < WIDTH; x++) {
    const my = mountainY[x];
    const isSn = snow[x];
    const rimG = clamp((skyReflG[x] * 0.04) | 0, 0, 110);
    const rimB = clamp((skyReflB[x] * 0.03) | 0, 0, 80);

    for (let y = my; y < HORIZON_Y; y++) {
      if (y === my) {
        // Crest rim lighting from overhead aurora
        const sBright = isSn > 0.4 ? 35 : 12;
        setPixel(x, y, rgb(sBright, sBright + rimG, sBright + rimB));
      } else {
        // Deep basalt cliff face
        const crag = 0.85 + 0.2 * Math.sin(x * 14.0 + y * 4.0);
        setPixel(x, y, rgb((6 * crag) | 0, (8 * crag) | 0, (15 * crag) | 0));
      }
    }
  }

  // 5. Water / Fjord Mirror (y = HORIZON_Y to HEIGHT - 1)
  for (let y = HORIZON_Y; y < HEIGHT; y++) {
    const depth = (y - HORIZON_Y) / (HEIGHT - HORIZON_Y); // 0 at horizon, 1 at foreground
    const fresnel = 0.42 + 0.52 * depth;

    // Perspective wavelet compression: tighter ripple frequency near horizon, broader in foreground
    const waveFreq = lerp(4.5, 1.2, depth);
    const ripple = Math.sin(y * waveFreq + t * 2.6) * (1.0 + depth * 2.2) +
                   noise2(y * 0.35 + t * 0.5, t * 0.25) * 1.8;

    for (let x = 0; x < WIDTH; x++) {
      const rx = clamp((x + ripple) | 0, 0, WIDTH - 1);

      // Aurora reflection in water from accumulated radiant column
      const reflR = (skyReflR[rx] * 0.036 * fresnel) | 0;
      const reflG = (skyReflG[rx] * 0.036 * fresnel) | 0;
      const reflB = (skyReflB[rx] * 0.036 * fresnel) | 0;

      // Dark obsidian fjord base tone
      const baseR = (2 + depth * 2) | 0;
      const baseG = (6 + depth * 5) | 0;
      const baseB = (14 + depth * 10) | 0;

      // Specular glint on wavelet ridges catching the auroral light
      const specPhase = Math.sin(x * 1.3 + y * 2.5 + t * 2.8);
      const spec = Math.pow(Math.max(0, specPhase), 8.0) * (36.0 * depth);
      const specG = (spec * 0.75) | 0;
      const specB = (spec * 0.6) | 0;

      const wr = clamp(baseR + reflR + (spec * 0.2) | 0, 0, 255);
      const wg = clamp(baseG + reflG + specG, 0, 255);
      const wb = clamp(baseB + reflB + specB, 0, 255);

      setPixel(x, y, rgb(wr, wg, wb));
    }
  }
}
