/*@vfx
id: 9160b70b-f921-46a2-9b3f-ec1e2c0c7619
title: Catherine Wheel
created: 2026-10-12
artist: Bellows (apprentice name)
lineage:
  - id: 2bba4eb5-cd9b-4f2a-bb27-b5929bd67d43
    relation: inspiration
    note: kept the noise-steered sparks on darkness; traded fade() trails
      for a float feedback buffer the sparks feed, so the trail itself
      becomes the artwork
  - id: 35feb5ba-985f-4f64-8dfb-13f3bec71b08
    relation: contrast
    note: where Plasma Bloom is a field the eye reads at once, this piece
      refuses instant legibility - its image is memory, accumulated
      structure you only understand by watching it turn
influences:
  - demoscene feedback/rotate-zoom effects (the "galaxy from a single
    moving dot" family, per the effect bestiary)
  - the catherine wheel firework - a pinned wheel spun by its own
    burning, named for the spoked wheel of the saint's martyrdom
rationale: |
  First piece of this practice, and the library's first feedback piece:
  the bestiary's "mother of a thousand demo effects" was unclaimed
  ground. Three embers wander Lissajous-like noise orbits and burn into
  a float buffer; each frame the whole buffer is resampled through a
  slow rotate-and-breathe transform about a drifting pivot, decayed,
  and quantized through a teal-to-violet palette ramp. The picture is
  therefore never the sparks - it is what the sparks were, smeared into
  spirals by a pivot that keeps wandering off. Spin direction, zoom
  sign, and pivot are all driven by noise3 at ever-advancing t, so the
  system is externally forced and cannot finish settling (see
  craft/attractors.md); warm-up takes ~30s from black, and epochs past
  the 8m cap can be assumed, not measured - the rationale claims
  "keeps reorganizing," which is true of the dynamics by construction:
  the noise field never repeats. Dim background stars sit underneath
  where the wheel hasn't burned, so the dark half of the panel reads as
  sky, not as dead pixels.
@vfx*/

// catherine_wheel — buffer mode, feedback
// Three noise-wandering embers burn into a persistent Float32 buffer.
// Each frame the buffer is bilinearly resampled through a slow
// rotate+zoom about a drifting pivot, decayed, then quantized to the
// panel through a palette ramp. The transform parameters (spin sign,
// zoom in/out, pivot position) are all noise3-driven at advancing t,
// so the accumulated image keeps re-spiralling without repeating.
// Demonstrates: user-side float accumulation, double-buffered feedback
// resample, palette ramp quantization, noise as external forcing.

const meta = { name: "catherine_wheel", fps: 30 };

const N = WIDTH * HEIGHT;
let bufA = new Float32Array(N);
let bufB = new Float32Array(N);

// --- palette ramp --------------------------------------------------------
// Rebuilt once per frame: base hue drifts over minutes, tip offset
// breathes. Buffer intensity indexes it directly.

const PAL_STEPS = 160;
const palette = new Int32Array(PAL_STEPS);

// --- embers --------------------------------------------------------------
// Three seeds on incommensurate noise orbits; (ox, oy) decorrelate them.

const SEEDS = [
  { ox: 0.0, oy: 13.7, spd: 0.075, amp: 150 },
  { ox: 31.1, oy: 47.3, spd: 0.058, amp: 120 },
  { ox: 57.9, oy: 3.1, spd: 0.088, amp: 100 },
];

// --- background stars ----------------------------------------------------
// Fixed dim pixels, drawn only where the wheel hasn't burned, so the
// dark reads as sky.

const STAR_COUNT = 34;
const stars = [];

function setup() {
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: (Math.random() * WIDTH) | 0,
      y: (Math.random() * HEIGHT) | 0,
      ph: Math.random() * 6.283,
      rate: 0.4 + Math.random() * 1.1,
    });
  }
}

function render(t, dt) {
  // Palette: slow teal->violet family, base hue wandering over minutes.
  const hueA = 0.52 + 0.10 * Math.sin(t * 0.011);
  const hueB = hueA + 0.18 + 0.05 * Math.sin(t * 0.007);
  for (let i = 0; i < PAL_STEPS; i++) {
    const u = i / (PAL_STEPS - 1);
    palette[i] = hsv(lerp(hueA, hueB, u), lerp(0.85, 0.25, u * u), Math.pow(u, 1.3) * 0.95);
  }

  // Feedback transform, all noise-forced so the attractor never arrives:
  // spin direction flips over minutes, zoom breathes in and out, and the
  // pivot wanders around the panel center.
  const th = 0.011 + 0.013 * noise3(7.3, 2.1, t * 0.030);
  const zoom = 1.0 + 0.007 * noise3(1.7, 9.2, t * 0.022);
  const cx = 31.5 + 7 * noise3(11.3, 4.7, t * 0.020);
  const cy = 31.5 + 7 * noise3(4.7, 11.3, t * 0.017);
  const c = Math.cos(-th), sn = Math.sin(-th);
  const inv = 1 / zoom;
  const decay = 0.962;

  // Resample: for each destination pixel, pull from the rotated/scaled
  // source position (bilinear). Out-of-bounds reads as black, which is
  // what slowly erodes structure at the rim.
  const src = bufA, dst = bufB;
  for (let y = 0; y < HEIGHT; y++) {
    const dy = y - cy;
    const row = y * WIDTH;
    for (let x = 0; x < WIDTH; x++) {
      const dx = x - cx;
      const sx = cx + (dx * c - dy * sn) * inv;
      const sy = cy + (dx * sn + dy * c) * inv;
      const x0 = sx | 0, y0 = sy | 0;
      let v = 0;
      if (x0 >= 0 && x0 < WIDTH - 1 && y0 >= 0 && y0 < HEIGHT - 1) {
        const fx = sx - x0, fy = sy - y0;
        const i0 = y0 * WIDTH + x0;
        const a = src[i0], b = src[i0 + 1], d = src[i0 + WIDTH], e = src[i0 + WIDTH + 1];
        const top = a + (b - a) * fx;
        v = top + ((d + (e - d) * fx) - top) * fy;
      }
      v = v * decay - 0.07; // multiplicative decay + small absolute floor
      dst[row + x] = v > 0 ? v : 0;
    }
  }

  // Embers: wander the panel on noise orbits, splat a soft 3x3 kernel.
  for (let i = 0; i < SEEDS.length; i++) {
    const sd = SEEDS[i];
    const px = 31.5 + 26 * noise3(sd.ox, sd.oy, t * sd.spd);
    const py = 31.5 + 26 * noise3(sd.oy, sd.ox, t * sd.spd * 1.13 + 5.0);
    const pulse = 0.6 + 0.4 * Math.sin(t * (0.7 + i * 0.23) + i * 2.1);
    const amp = sd.amp * pulse;
    const ix = px | 0, iy = py | 0;
    for (let gy = -1; gy <= 1; gy++) {
      const yy = iy + gy;
      if (yy < 0 || yy >= HEIGHT) continue;
      for (let gx = -1; gx <= 1; gx++) {
        const xx = ix + gx;
        if (xx < 0 || xx >= WIDTH) continue;
        const w = gx === 0 && gy === 0 ? 1.0 : gx === 0 || gy === 0 ? 0.45 : 0.2;
        dst[yy * WIDTH + xx] += amp * w;
      }
    }
  }

  // Quantize to the panel.
  for (let y = 0; y < HEIGHT; y++) {
    const row = y * WIDTH;
    for (let x = 0; x < WIDTH; x++) {
      let idx = (dst[row + x] * (PAL_STEPS / 220)) | 0;
      if (idx < 0) idx = 0; else if (idx >= PAL_STEPS) idx = PAL_STEPS - 1;
      setPixel(x, y, palette[idx]);
    }
  }

  // Stars last, only into near-black pixels.
  for (const st of stars) {
    const tw = 0.5 + 0.5 * Math.sin(t * st.rate + st.ph);
    const cur = getPixel(st.x, st.y);
    if (((cur >> 16) & 255) + ((cur >> 8) & 255) + (cur & 255) < 60) {
      setPixel(st.x, st.y, hsv(0.6, 0.3, 0.05 + 0.10 * tw * tw));
    }
  }

  const tmp = bufA; bufA = bufB; bufB = tmp;
}
