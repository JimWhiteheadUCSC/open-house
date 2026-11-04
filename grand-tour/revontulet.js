/*@vfx
id: f5b072a8-126d-40ec-b117-409efcbeea36
title: Revontulet
created: 2026-10-10
artist: Tessera (apprentice name)
influences: []
rationale: |
  A study in atmospheric plasma kinematics and arctic luminescence:
  auroral curtains ("revontulet", the Finnish fox-fires) sweeping across
  a sub-arctic starry sky over a frozen boreal lake. Curtains fold along
  geomagnetic field lines with realistic multi-tier atmospheric emission
  physics: sharp molecular nitrogen magenta fringes along the bottom lip,
  intense 557.7nm atomic oxygen emerald cores, and high-altitude diffuse
  crimson veils. Ray bundles flutter with Alfvén wave packets and cast
  soft specular columns across the dark ice below, framed by the silhouette
  of a spruce tree line. Responsive to the clock (twilight indigo to deep
  midnight black), audio (substorm surges and beat sparks), and touch (shooting
  meteors).
@vfx*/

// revontulet — buffer mode with auroral spline rendering and lake reflection
// Demonstrates: multi-tier spectral emission layering (N2+ magenta / O 557nm green / O 630nm red),
// anti-aliased bilinear spline splatting for folding plasma curtains,
// specular cylindrical lake reflection columns with vertical sample smearing,
// foreground spruce tree line silhouettes, and reactive clock/audio/touch inputs.

const meta = { name: "revontulet", fps: 30, inputs: ["audio", "button", "clock"] };

const HORIZON_Y = 43;
const skyR = new Float32Array(64 * HORIZON_Y);
const skyG = new Float32Array(64 * HORIZON_Y);
const skyB = new Float32Array(64 * HORIZON_Y);

// Precomputed tone mapping curve: replaces thousands of per-pixel Math.exp calls
const TONE_LUT = new Uint8Array(1024);

// Precomputed edge profile for N2+ magenta fringe (h = 0, 1, 2, 3)
const MAGENTA_EDGE = [1.0, 0.58, 0.28, 0.08];

// Precomputed random stars (deterministic mulberry32)
const STAR_COUNT = 32;
const starX = new Uint8Array(STAR_COUNT);
const starY = new Uint8Array(STAR_COUNT);
const starSpeed = new Float32Array(STAR_COUNT);
const starPhase = new Float32Array(STAR_COUNT);

{
  let s = 98765;
  function rnd() {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = s;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  }
  for (let i = 0; i < STAR_COUNT; i++) {
    starX[i] = (rnd() * 64) | 0;
    starY[i] = (rnd() * (HORIZON_Y - 14)) | 0;
    starSpeed[i] = 1.0 + rnd() * 2.0;
    starPhase[i] = rnd() * Math.PI * 2;
  }
}

// Silhouette spruce tree line along the lakeshore (y: 37..42)
const treeLine = new Uint8Array(64);
for (let x = 0; x < 64; x++) {
  let th = 42;
  if (x % 5 === 2) th = 38;
  else if (x % 5 === 1 || x % 5 === 3) th = 40;
  else if (x % 11 === 7) th = 37;
  else if (x % 13 === 4) th = 38;
  else if (x % 2 === 0) th = 41;
  treeLine[x] = th;
}

let meteors = [];

function setup() {
  meteors = [];
  // Build tone mapping table for values 0.0 to 4.0
  for (let i = 0; i < 1024; i++) {
    const v = i / 256.0;
    const mapped = (1.0 - Math.exp(-v * 1.5)) * 255;
    TONE_LUT[i] = clamp(mapped | 0, 0, 255);
  }
}

function render(t, dt) {
  // Clear sky accumulation buffer
  skyR.fill(0);
  skyG.fill(0);
  skyB.fill(0);

  const daylight = input.clock.daylight;
  const audioLevel = input.audio.ok ? input.audio.level : 0;
  const bass = input.audio.ok ? input.audio.bass : 0;

  // Background starry canopy (fades during twilight / daytime)
  const starVis = clamp(1.0 - daylight * 1.5, 0, 1);
  if (starVis > 0.05) {
    for (let i = 0; i < STAR_COUNT; i++) {
      const tw = Math.sin(t * starSpeed[i] + starPhase[i]);
      if (tw > 0.25) {
        const b = (tw - 0.25) * 1.1 * starVis;
        const idx = starY[i] * 64 + starX[i];
        skyR[idx] += b * 0.6;
        skyG[idx] += b * 0.8;
        skyB[idx] += b * 1.0;
      }
    }
  }

  // Substorm auroral cycle & audio surge (slow natural breathing envelope + sound reactive)
  const substorm = 0.85 + 0.25 * Math.sin(t * 0.14);
  const audioSurge = 1.0 + audioLevel * 0.9 + bass * 0.7;
  const activityLevel = substorm * audioSurge;

  // Two independent auroral curtains drifting across the magnetosphere
  for (let c = 0; c < 2; c++) {
    const isMain = (c === 0);
    const segs = 120;
    const speed = isMain ? 0.17 : 0.11;
    const curTime = t * speed + c * 3.6;
    const baseAlt = isMain ? 38 : 31;
    const maxRayH = (isMain ? 27 : 19) * (0.85 + 0.25 * activityLevel);

    for (let s = 0; s < segs; s++) {
      const u = s / (segs - 1);
      const spanU = lerp(-0.35, 1.35, u);

      const curtainEnv = Math.sin(u * Math.PI);
      if (curtainEnv < 0.03) continue;

      // Sinuous folding arc with loops
      const foldX = Math.sin(spanU * 3.2 + curTime) * 16 +
                    Math.cos(spanU * 6.5 - curTime * 1.3) * 9 +
                    noise2(spanU * 2.8, curTime * 0.7) * 7;
      const arcX = spanU * 64 + foldX;

      const foldY = Math.cos(spanU * 2.8 + curTime * 0.8) * 4.5 +
                    noise2(spanU * 3.2 + c * 10, curTime * 0.4) * 2.8;
      const arcY = baseAlt + foldY;

      // Fluttering striations (Alfvén wave packets)
      const rayPhase = spanU * 36.0 + t * 2.8 + c * 4.2;
      const flutter = Math.sin(rayPhase) * Math.sin(rayPhase * 1.6);
      const striation = 0.35 + 0.65 * clamp(0.5 + 0.7 * flutter, 0, 1);

      const rayH = maxRayH * (0.75 + 0.25 * Math.sin(spanU * 11.0 - t * 1.2));
      const steps = Math.ceil(rayH);

      const segWeight = (220.0 / segs);

      for (let h = 0; h < steps; h++) {
        // Geomagnetic inclination tilt
        const xCoord = arcX + h * 0.10;
        const py = (arcY - h) | 0;
        if (py < 0 || py >= HORIZON_Y) continue;

        const ix = Math.floor(xCoord);
        const fx = xCoord - ix;

        const hFrac = h / rayH;
        // Fast parabolic sine approximation: 4 * p * (1 - p) replaces Math.sin in hot loop
        const p = clamp(hFrac * 1.35, 0, 1);
        const sinApprox = 4 * p * (1.0 - p);
        const gProfile = sinApprox * sinApprox;
        const gEnergy = gProfile * curtainEnv * striation * (isMain ? 0.35 : 0.22) * segWeight * activityLevel;

        let rVal = 0, gVal = 0, bVal = 0;

        // Violet-magenta lower border (N2+ first negative band) using static array lookup
        if (h <= 3) {
          const edge = MAGENTA_EDGE[h] * curtainEnv * (isMain ? 0.40 : 0.24) * segWeight * activityLevel;
          rVal += edge * 0.85;
          bVal += edge * 0.95;
          gVal += edge * 0.12;
        }

        // Emerald core (557.7nm atomic oxygen)
        gVal += gEnergy * 1.35;
        rVal += gEnergy * 0.12;
        bVal += gEnergy * 0.38;

        // Diffuse crimson top veil (630nm atomic oxygen) using parabolic bell curve
        if (hFrac > 0.46) {
          const rf = (hFrac - 0.46) / 0.54;
          const redSpread = 4 * rf * (1.0 - rf);
          const redEnergy = redSpread * curtainEnv * (isMain ? 0.19 : 0.11) * segWeight * activityLevel;
          rVal += redEnergy * 0.95;
          gVal += redEnergy * 0.06;
          bVal += redEnergy * 0.12;
        }

        // Bilinear splat across columns to prevent comb aliasing
        const w0 = 1.0 - fx;
        const w1 = fx;

        if (ix >= 0 && ix < 64) {
          const idx0 = py * 64 + ix;
          skyR[idx0] += rVal * w0;
          skyG[idx0] += gVal * w0;
          skyB[idx0] += bVal * w0;
        }
        if (ix + 1 >= 0 && ix + 1 < 64) {
          const idx1 = py * 64 + (ix + 1);
          skyR[idx1] += rVal * w1;
          skyG[idx1] += gVal * w1;
          skyB[idx1] += bVal * w1;
        }
      }
    }
  }

  // Interactive meteor triggers (button press, beat burst, or ambient chance)
  if (input.button.pressed || (input.audio.beat && Math.random() < 0.4) || (Math.random() < 0.02 && meteors.length < 2)) {
    meteors.push({
      x: 6 + Math.random() * 46,
      y: 2 + Math.random() * 10,
      vx: 38 + Math.random() * 25,
      vy: 18 + Math.random() * 14,
      life: 0.4 + Math.random() * 0.3
    });
  }

  // Composite Sky, Spruce Forest Shoreline, and Lake Reflections
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      if (y < HORIZON_Y) {
        if (y >= treeLine[x]) {
          // Dark silhouette of spruce forest on shoreline
          setPixel(x, y, rgb(1, 3, 2));
        } else {
          // Night sky tone mapping via fast TONE_LUT lookup
          const idx = y * 64 + x;
          let r = TONE_LUT[clamp((skyR[idx] * 256) | 0, 0, 1023)];
          let g = TONE_LUT[clamp((skyG[idx] * 256) | 0, 0, 1023)];
          let b = TONE_LUT[clamp((skyB[idx] * 256) | 0, 0, 1023)];

          if (daylight > 0.05) {
            // Twilight shifts deep night sky toward deep indigo
            r = clamp(r + (daylight * 8) | 0, 0, 255);
            g = clamp(g + (daylight * 14) | 0, 0, 255);
            b = clamp(b + (daylight * 28) | 0, 0, 255);
          }

          setPixel(x, y, (r << 16) | (g << 8) | b);
        }
      } else {
        // Frozen lake surface (y: 43..63)
        const dist = y - (HORIZON_Y - 1);
        const refY = clamp((HORIZON_Y - 3) - (dist * 1.4) | 0, 0, HORIZON_Y - 1);

        // Sinusoidal specular streak wobble (hoisted arithmetic replaces per-pixel noise)
        const streakWobble = (Math.sin(x * 0.4 + t * 2.0) * 1.5 + Math.cos(y * 0.5 - t * 1.2) * 1.2) | 0;
        const refX = clamp(x + streakWobble, 0, 63);

        // 2-tap vertical specular column integration
        const sIdx0 = refY * 64 + refX;
        const sIdx1 = clamp(refY - 1, 0, HORIZON_Y - 1) * 64 + refX;
        const accR = (skyR[sIdx0] + skyR[sIdx1]) * 0.5;
        const accG = (skyG[sIdx0] + skyG[sIdx1]) * 0.5;
        const accB = (skyB[sIdx0] + skyB[sIdx1]) * 0.5;

        const refl = 0.72 * (1.0 - dist / 35);
        let lr = TONE_LUT[clamp((accR * refl * 256) | 0, 0, 1023)];
        let lg = TONE_LUT[clamp((accG * refl * 256) | 0, 0, 1023)];
        let lb = TONE_LUT[clamp((accB * refl * 256) | 0, 0, 1023)];

        // Arctic black water / deep ice ambient tint
        lr = clamp(lr + 1, 0, 255);
        lg = clamp(lg + 4, 0, 255);
        lb = clamp(lb + 10, 0, 255);

        // Water ripple glints / ice crystal sparkles
        const ripple = Math.sin(x * 0.6 + y * 1.4 + t * 2.0);
        if (ripple > 0.85 && lg > 20) {
          const boost = ((ripple - 0.85) * 45) | 0;
          lg = clamp(lg + boost, 0, 255);
          lb = clamp(lb + ((boost * 0.4) | 0), 0, 255);
        }

        setPixel(x, y, (lr << 16) | (lg << 8) | lb);
      }
    }
  }

  // Draw meteors
  meteors = meteors.filter((m) => m.life > 0);
  for (const m of meteors) {
    m.life -= dt;
    m.x += m.vx * dt;
    m.y += m.vy * dt;
    const px = m.x | 0;
    const py = m.y | 0;
    if (px >= 0 && px < 64 && py >= 0 && py < HORIZON_Y) {
      setPixel(px, py, rgb(255, 255, 240));
      const tx = (m.x - m.vx * dt * 1.5) | 0;
      const ty = (m.y - m.vy * dt * 1.5) | 0;
      if (tx >= 0 && tx < 64 && ty >= 0 && ty < HORIZON_Y) {
        setPixel(tx, ty, rgb(180, 220, 255));
      }
    }
  }
}
