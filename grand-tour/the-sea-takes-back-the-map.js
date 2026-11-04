/*@vfx
id: 80f5bf7a-dc0f-4f89-8a1d-5972fb1ed427
title: The Sea Takes Back the Map
created: 2026-09-30
artist: Register
lineage:
  - id: 96a6330b-c94f-4f99-b027-e1ce1b334d91
    relation: variation
    note: >-
      Kept the level-set instrument whole - the 17x17 C1 lattice, the analytic
      gradient, phase-distance line width, crowd-fade, hue dealt by altitude.
      Refused the surveyor's distance: that piece withheld the surface and showed
      only its levels; here one more datum is laid across the same relief and the
      surface is named - land above it, sea below it.
  - id: 89453f88-10ef-42ef-8032-26dfed956f20
    relation: contrast
    note: >-
      Kept the hidden relief and the mosaic honesty about reading. Refused the
      temporal misregistration: every tile here is read at the same moment, so no
      seam ever disagrees about the past. The disagreement is between the land and
      the water, both present, not between two dates of the same land.
influences: [verena-loewensberg, mizuki-heitaro]
rationale: |
  A contour map is a promise that the land stays put while it is read. The tide
  refuses the promise. One hidden relief drifts and breathes forever; one level
  laid across it is the sea. Above the water the surveyed land keeps its thin
  altitude contours, tinted by height; below it the same field goes dark blue
  and quiet, still contoured faintly the way a chart shows depth. The brightest
  line on the panel is the shoreline itself - the one contour that is a fact
  about the water rather than about the land.

  The sea breathes on a slow tide, rises with real rain and falls without it,
  and the daylight sets the exposure and the tempo. Clouds soften every line.
  With no weather feed the tide still comes and goes on its own clock, and the
  map is complete: a place with a coast is never a still picture, because the
  coast is where the reading changes its mind.

  Sides taken. With Loewensberg: the chord is dealt by altitude and a paused
  frame is a composed sheet - with no straight edge anywhere. With Heitaro: the
  panel is a working sheet with a job, and the pattern admits it is water, so it
  can be wrong about the weather. On the standing argument, measurement again:
  a line is the trace of an act of reading, and here the oldest reading of all
  is where the sea says the land stops.
@vfx*/
const meta = { name: "the_sea_takes_back_the_map", fps: 30, inputs: ["clock", "env"] };
const LAT = new Float32Array(289);
const SXC = new Float32Array(4), DSXC = new Float32Array(4);
for (let k = 0; k < 4; k++) {
  const f = 0.125 + 0.25 * k;
  SXC[k] = f * f * (3 - 2 * f);
  DSXC[k] = 6 * f * (1 - f) / 4;
}
const VN = new Float32Array(17), DVN = new Float32Array(17);
const HH = [0.07, 0.11, 0.15, 0.50, 0.57, 0.63, 0.92];
const LR = new Float32Array(7), LG = new Float32Array(7), LB = new Float32Array(7);
const TR = new Float32Array(7), TG = new Float32Array(7), TB = new Float32Array(7);
for (let k = 0; k < 7; k++) {
  const c = hsv(HH[k], 0.75, 0.9);
  LR[k] = (c >> 16) & 255; LG[k] = (c >> 8) & 255; LB[k] = c & 255;
  const d = hsv(HH[k], 0.5, 0.22);
  TR[k] = (d >> 16) & 255; TG[k] = (d >> 8) & 255; TB[k] = d & 255;
}
const AMP = 2.4;
let te = 0, dayS = 0.5;
function render(t, dt) {
  const step = clamp(dt, 0.001, 0.1);
  const tDay = clamp(input.clock.daylight, 0, 1);
  dayS += (tDay - dayS) * (1 - Math.exp(-step / 3));
  const tempo = 0.65 + 0.7 * dayS;
  te += step * tempo;
  const weather = input.env.ok;
  const rain = weather ? clamp(input.env.rain, 0, 1) : 0.12;
  const cloud = weather ? clamp(input.env.cloud, 0, 1) : 0.20;
  const ox = te * 0.40, oy = te * 0.28, oz = te * 0.016;
  const datum = 0.30 * Math.sin(te * 0.075 + 1.0) + 0.12 * Math.sin(te * 0.13 + 0.4);
  const sea = -0.05 + 0.38 * Math.sin(te * 0.075 + 0.7) + rain * 0.30 + (dayS - 0.5) * 0.14;
  const exposure = (0.70 + 0.35 * dayS) * (1 - 0.08 * cloud);
  for (let jy = 0; jy < 17; jy++) {
    const wy = jy * 0.22 + oy;
    const row = jy * 17;
    for (let jx = 0; jx < 17; jx++) {
      LAT[row + jx] = noise3(jx * 0.22 + ox, wy, oz) * AMP;
    }
  }
  for (let y = 0; y < 64; y++) {
    const cy = y >> 2, fy = y & 3;
    const sy = SXC[fy], dsy = DSXC[fy];
    const r0 = cy * 17, r1 = (cy + 1) * 17;
    for (let c = 0; c < 17; c++) {
      const a = LAT[r0 + c], b = LAT[r1 + c];
      VN[c] = a + (b - a) * sy;
      DVN[c] = (b - a) * dsy;
    }
    for (let x = 0; x < 64; x++) {
      const cx = x >> 2, k = x & 3;
      const sx = SXC[k], dsx = DSXC[k];
      const v0 = VN[cx], v1 = VN[cx + 1];
      const f = v0 + (v1 - v0) * sx + datum;
      const dfdx = (v1 - v0) * dsx;
      const d0 = DVN[cx], d1 = DVN[cx + 1];
      const dfdy = d0 + (d1 - d0) * sx;
      let gg = dfdx * dfdx + dfdy * dfdy;
      gg = Math.sqrt(gg);
      if (gg < 0.0001) gg = 0.0001;
      let r, g, b;
      if (f < sea) {
        const depth = sea - f;
        let w = depth * 0.6;
        if (w > 1) w = 1;
        r = (16 + (5 - 16) * w) * exposure;
        g = (34 + (9 - 34) * w) * exposure;
        b = (48 + (15 - 48) * w) * exposure;
        r += 1.0 * Math.sin(x * 0.31 + t * 0.35 + y * 0.11) * (0.4 + rain);
        b += 1.5 * Math.sin(x * 0.23 - t * 0.30 + y * 0.17) * (0.4 + rain);
      } else {
        const lv = Math.floor(f);
        let hi = lv % 7;
        if (hi < 0) hi += 7;
        const lift = 1 + 0.08 * f;
        r = TR[hi] * lift * exposure;
        g = TG[hi] * lift * exposure;
        b = TB[hi] * lift * exposure;
      }
      const q = f + 0.5;
      const qf = q - Math.floor(q);
      const p = qf < 0.5 ? qf : 1 - qf;
      if (p < 0.30) {
        const dist = p / gg;
        if (dist < 1.2) {
          const spacing = 1 / gg;
          let fade = (spacing - 0.55) / (1.6 - 0.55);
          fade = fade < 0 ? 0 : fade > 1 ? 1 : fade;
          fade = fade * fade * (3 - 2 * fade);
          if (fade > 0.01) {
            let ink = 1 - (dist - 0.6) / (1.2 - 0.6);
            ink = ink < 0 ? 0 : ink > 1 ? 1 : ink;
            ink = ink * ink * (3 - 2 * ink);
            ink *= fade * 0.55;
            if (ink > 0.01) {
              const lv2 = Math.floor(f + 0.5);
              let h2 = lv2 % 7;
              if (h2 < 0) h2 += 7;
              const dim = (f < sea) ? 0.35 : 1.0;
              r += (LR[h2] * dim * exposure - r) * ink;
              g += (LG[h2] * dim * exposure - g) * ink;
              b += (LB[h2] * dim * exposure - b) * ink;
            }
          }
        }
      }
      const ds2 = f - sea;
      const ads = ds2 < 0 ? -ds2 : ds2;
      const sdist = ads / gg;
      if (sdist < 1.0) {
        let s = (sdist - 0.45) / (1.0 - 0.45);
        s = s < 0 ? 0 : s > 1 ? 1 : s;
        let si = 1 - s;
        si = si * si * (3 - 2 * si);
        if (si > 0.01) {
          r += (150 * exposure - r) * si * 0.8;
          g += (140 * exposure - g) * si * 0.8;
          b += (112 * exposure - b) * si * 0.8;
        }
      }
      r = r < 0 ? 0 : r > 255 ? 255 : r;
      g = g < 0 ? 0 : g > 255 ? 255 : g;
      b = b < 0 ? 0 : b > 255 ? 255 : b;
      setPixel(x, y, ((r | 0) << 16) | ((g | 0) << 8) | (b | 0));
    }
  }
}
