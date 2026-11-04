/*@vfx
id: a6f3a50f-80a8-4150-bc29-5acf89fafec0
title: Copper Dawn
created: 2026-10-14
artist: Retrace (apprentice name)
influences: [Amiga demoscene copper-bar intros, classic starfield demos]
rationale: |
  First piece under the apprentice name Retrace. All five seed pieces
  stay inside the soft-organic register (glow, plasma, bands, pond,
  fireflies) and none touch the demoscene tradition the API docs
  repeatedly invoke — so this is a raster-bar homage: four copper bars
  on independent sine paths over a three-layer parallax starfield,
  additive where bars overlap, the classic copper look. The palette is
  four named hues (ember, gold, cyan, violet) on a very slow shared
  drift rather than a rainbow cycle. Craft carried forward from the
  seeds: plasma_bloom's per-frame cache idiom (all t-only and x-only
  terms hoisted; pixel() is abs/compare/array-add plus a single-hash
  starfield), the v*v perceptual gradient, and dark floor with bright
  accents. quality:"half" turns the render into deliberate big-pixel
  low-res, which suits the retro subject. Motion is visible in under
  2 s; bar path LCM is on the order of minutes and the hue journey far
  longer, so it never visibly repeats.
@vfx*/

// copperdawn — pixel mode (half quality)
// Demoscene homage: copper (raster) bars drifting on independent sine
// paths over a three-layer parallax starfield. Overlaps additively
// blend, the classic copper look. All t-only and x-only terms are
// hoisted into per-frame caches (plasma_bloom idiom), so pixel() is
// abs/compare/array-add plus a single-hash starfield.

const meta = { name: "copperdawn", fps: 30, quality: "half" };

const BARS = 4;
const HALF = 4;                 // bar half-thickness (bars are 9 px tall)
const GRAD = 2 * HALF + 1;      // gradient entries per bar, by pixel distance

// --- per-frame caches ------------------------------------------------------
const barY = new Float64Array(BARS);           // t-only bar centers
const wob = new Float64Array(BARS * WIDTH);    // per-column wobble offsets
const gradR = new Float64Array(BARS * GRAD);   // per-bar color gradient
const gradG = new Float64Array(BARS * GRAD);
const gradB = new Float64Array(BARS * GRAD);

const barW = [0.31, 0.23, 0.42, 0.17];   // vertical drift rates (rad/s)
const barP = [0.0, 1.7, 3.6, 5.1];       // phases
const barA = [17, 21, 15, 19];           // amplitudes
const wobW = [0.9, 1.3, 0.7, 1.1];       // wobble time rates
const wobA = [2.5, 3.5, 2.0, 3.0];       // wobble amplitudes
const barHue = [0.03, 0.14, 0.55, 0.80]; // ember, gold, cyan, violet

// Star layer tints (near warm white, far blue).
const starR = [235, 190, 140];
const starG = [220, 190, 155];
const starB = [190, 215, 205];
const starOcc = [90, 110, 125];        // occupancy threshold (of 255)

let __cacheT = null;

function __rebuildFrameCache(t) {
  const drift = t * 0.005; // very slow palette journey
  for (let i = 0; i < BARS; i++) {
    barY[i] = 32 + barA[i] * Math.sin(t * barW[i] + barP[i]);
    const hue = barHue[i] + drift + 0.015 * Math.sin(t * 0.11 + i * 2.1);
    for (let k = 0; k < GRAD; k++) {
      const f = 1 - k / (GRAD - 1);       // 1 at bar center, 0 at edge
      const c = hsv(hue, 0.85, 0.85 * f * f);
      gradR[i * GRAD + k] = (c >> 16) & 255;
      gradG[i * GRAD + k] = (c >> 8) & 255;
      gradB[i * GRAD + k] = c & 255;
    }
    for (let x = 0; x < WIDTH; x++) {
      wob[i * WIDTH + x] = wobA[i] * Math.sin(x * 0.13 + t * wobW[i] + barP[i]);
    }
  }
  __cacheT = t;
}

function pixel(x, y, t) {
  if (t !== __cacheT) __rebuildFrameCache(t);

  let r = 0, g = 0, b = 0;

  // Copper bars: additive where they overlap.
  for (let i = 0; i < BARS; i++) {
    const cy = barY[i] + wob[i * WIDTH + x];
    let d = y - cy;
    if (d < 0) d = -d;
    if (d < GRAD) {
      const k = (d | 0) + i * GRAD;
      r += gradR[k]; g += gradG[k]; b += gradB[k];
    }
  }

  // Starfield: one integer hash per layer per pixel; power-of-two cells
  // so all addressing is shifts and masks. Only actual star pixels pay
  // for the sin() twinkle.
  for (let layer = 0; layer < 3; layer++) {
    const shift = 3 + layer;                 // cell = 8, 16, 32
    const mask = (1 << shift) - 1;
    const sx = x + t * (2 + layer * 2.5);    // parallax scroll
    const cx = (sx / (1 << shift)) | 0;      // sx >= 0, so truncate = floor
    const cy2 = y >> shift;
    let h = Math.imul(cx, 374761393) ^ Math.imul(cy2, 668265263) ^ Math.imul(layer + 1, 974711);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h = (h ^ (h >>> 16)) >>> 0;
    if ((h & 255) >= starOcc[layer]) continue;          // most cells empty
    if (((sx | 0) & mask) !== ((h >>> 8) & mask)) continue;
    if ((y & mask) !== ((h >>> 16) & mask)) continue;
    const phase = ((h >>> 20) & 255) * 0.02466;         // 0..2pi
    const rate = 1 + ((h >>> 28) & 15) * 0.2;           // 1..4 Hz
    const tw = 0.5 + 0.5 * Math.sin(t * rate + phase);
    const s = tw * tw * (0.9 - layer * 0.28);
    r += starR[layer] * s; g += starG[layer] * s; b += starB[layer] * s;
  }

  return rgb(r, g, b);
}
