/*@vfx
id: 3a5f53bf-bba0-4ceb-868b-22fac0ba08b4
title: Plate Four, In Counterchange
created: 2026-09-29
artist: Register
lineage:
  - id: e799f618-45fb-4472-a554-2caea45f292d
    relation: variation
    note: >
      kept the equation-first construction, the unrolling bolt drift, and the
      recolour-along-the-repeat; refused the five horizontal sampler bands.
      Here the sampler is planar: an infinite 32x32 tessellation where positive
      and negative figures counterchange across adjacent tiles, proving his
      theory of the unit across the whole surface.
  - id: 14eb880e-3aad-4bb4-b914-e7d3fd080fae
    relation: contrast
    note: >
      kept the 16/32px repeat unit, the traveling rogue defect wandering the
      lattice, and the stencil flatness; refused the discrete static diamond-and-square
      unit. Here the shapes are continuous Lp-norm superellipses morphing between
      diamond (p ≈ 1.2), circle (p = 2.0), and rounded square (p ≈ 3.5), so every
      frame passes through designs that were never printed.
  - id: 62ff342e-a053-42b2-b719-6c2462538c4c
    relation: variation
    note: >
      kept Okazz's cartoon vault gesture (quintic ease across travel, arc midpoint)
      and the traveling conductor wave that periodically illuminates the lattice;
      refused the 8x8 swarm of loose boids. Here the vault belongs to a rogue
      opalescent gem that visits the block centers, creating a living focal point
      within an architectural repeat.
influences: [mizuki-heitaro, verena-loewensberg, okazz]
rationale: |
  Mizuki Heitaro's 1930 Abstract Pattern Portfolio proved that modernist abstraction
  could be derived systematically from equations. Plate 4 in his portfolio is his
  definitive statement on counterchange: geometric rosettes where positive and negative
  spaces alternate across adjacent tiles, balanced so perfectly that figure and ground
  become interchangeable.

  This piece stages Plate 4 on the 64x64 matrix as a living parametric continuum.
  Each 32x32 tile is constructed from concentric Lp-norm superellipses (|x|^p + |y|^p = R^p),
  morphing out-of-phase between sharp diamonds (p ≈ 1.2), Euclidean circles (p = 2.0),
  and rounded squares (p ≈ 3.5). The space between his printed plates is traversed
  in real time — an infinite series of valid zuan ornaments that history never saw.

  Across adjacent tiles, the pattern counterchanges: parity (bx ^ by) & 1 inverts
  the roles of inner rosettes, faceted collars, and corner spandrels. Where four tiles
  meet at the lattice vertices, their spandrels unite to forge eight-pointed interstice
  rosettes. The cloth drifts continuously on the loom (~1.6 px/s), setting the still
  lithographic plates into dignified motion.

  Color is governed by Loewensberg's chord of neighbours: vermilion, amber, celadon teal,
  and deep indigo drawn from the seven-note scale, anchored by warm ivory bone and dark slate.
  Every eighteen seconds, one office transposes, re-chording the entire field in pure logic.
  An oblique printing cylinder wave sweeps the panel, catching the dye bath in a luminous
  sheen.

  Animacy is governed by Okazz: a rogue opalescent gem visits the block centers on a
  rest-dominant duty cycle, leaping with a cartoon vault gesture (quintic ease across travel,
  parabolic mid-flight arc). An incoming audio beat triggers the vault immediately, while
  bass frequencies make the interstice rosettes shimmer with metallic warmth.

  Sides taken. With Heitaro on equation-first unit theory, counterchange, and ornament
  made for use. With Loewensberg on the composed freeze-frame and harmonic chord balance.
  With Okazz on cartoon animacy, rest as meter, and the traveling defect that keeps
  the repeat alive.
@vfx*/

const meta = {
  name: "plate_four_in_counterchange",
  fps: 30,
  inputs: ["clock", "audio", "env"]
};

// 7-note harmonic scale stops
const HUE = [0.018, 0.072, 0.125, 0.515, 0.575, 0.640, 0.88];
const SAT = [0.92, 0.88, 0.84, 0.82, 0.86, 0.78, 0.84];

let baseDeg = 0;
let chordT = 18.0;

// Rogue defect state (Okazz vault gesture)
let rogueFromX = 16, rogueFromY = 16;
let rogueToX = 48, rogueToY = 16;
let rogueT = 0, rogueDur = 0.85;
let rogueRestT = 3.5;
let rogueMoving = false;
let rogueX = 16, rogueY = 16;
let rogueCooldown = 0.0;

// Hoisted coordinate and metric buffers (compositing & superellipse cookbooks)
const POW_X0 = new Float32Array(64);
const POW_Y0 = new Float32Array(64);
const POW_X1 = new Float32Array(64);
const POW_Y1 = new Float32Array(64);
const POW_X2 = new Float32Array(64);
const POW_Y2 = new Float32Array(64);

const C_X = new Float32Array(64);
const C_Y = new Float32Array(64);

const U32 = new Float32Array(64);
const V32 = new Float32Array(64);
const BX = new Int32Array(64);
const BY = new Int32Array(64);

function getChordColor(degreeOffset, vMult, sMult, tempShift, satBoost) {
  const d = ((baseDeg + degreeOffset) % 7 + 7) % 7;
  const s = clamp(SAT[d] * sMult * satBoost, 0, 1);
  const h = (HUE[d] + tempShift + 1.0) % 1.0;
  const v = clamp(vMult, 0, 1);
  // v*v rule for LED dynamic range
  return hsv(h, s, v * v);
}

function setup() {
  baseDeg = 0;
  chordT = 18.0;
  rogueX = 16;
  rogueY = 16;
  rogueFromX = 16;
  rogueFromY = 16;
  rogueToX = 48;
  rogueToY = 16;
  rogueMoving = false;
  rogueRestT = 3.5;
}

function render(t, dt) {
  const step = clamp(dt, 0.001, 0.1);

  // Daylight modulation
  const dl = clamp(input.clock.daylight, 0, 1);
  const tempo = 0.80 + 0.45 * dl;
  const expo = 0.85 + 0.15 * dl;

  // Environment modulation
  const tempC = input.env.ok ? input.env.tempC : 20;
  const rain = input.env.ok ? clamp(input.env.rain, 0, 1) : 0;
  const tempShift = clamp((tempC - 20) * 0.002, -0.035, 0.035);
  const satBoost = 1.0 + 0.12 * rain;

  // Audio modulation
  let bassGlow = 0;
  if (input.audio.ok) {
    bassGlow = clamp(input.audio.bass, 0, 1);
    rogueCooldown -= step;
    if (input.audio.beat && !rogueMoving && rogueCooldown <= 0) {
      rogueRestT = 0.02; // Trigger vault immediately on beat
      rogueCooldown = 1.8;
    }
  }

  // Harmonic chord progression
  chordT -= step * tempo;
  if (chordT <= 0) {
    baseDeg = (baseDeg + 1) % 7;
    chordT = 16.0 + Math.random() * 12.0;
  }

  // Rogue defect animation (Okazz vault with quintic ease)
  if (!rogueMoving) {
    rogueRestT -= step * tempo;
    if (rogueRestT <= 0) {
      rogueMoving = true;
      rogueT = 0;
      rogueDur = 0.85;
      rogueFromX = rogueToX;
      rogueFromY = rogueToY;
      const targets = [
        [16, 16], [48, 16], [16, 48], [48, 48],
        [32, 32], [0, 32], [64, 32], [32, 0], [32, 64]
      ];
      const valid = targets.filter(pt => pt[0] !== rogueFromX || pt[1] !== rogueFromY);
      const chosen = valid[(Math.random() * valid.length) | 0];
      rogueToX = chosen[0];
      rogueToY = chosen[1];
    }
  } else {
    rogueT += step * tempo;
    const p = clamp(rogueT / rogueDur, 0, 1);
    // Quintic ease-out
    const ep = 1 - Math.pow(1 - p, 4);
    rogueX = lerp(rogueFromX, rogueToX, ep);
    rogueY = lerp(rogueFromY, rogueToY, ep) - Math.sin(p * Math.PI) * 11.5;
    if (p >= 1) {
      rogueMoving = false;
      rogueRestT = 3.2 + Math.random() * 3.8;
    }
  }

  // Exponents for the three concentric Lp-norm tiers
  const p0 = 2.0 + 1.25 * Math.sin(t * 0.40 * tempo);
  const p1 = 2.0 + 1.35 * Math.sin(t * 0.31 * tempo + 1.8);
  const p2 = 2.0 + 1.45 * Math.sin(t * 0.24 * tempo + 3.6);

  // Area-stabilized radial thresholds (superellipses.md)
  const r0 = 4.4 * Math.pow(2.0 / p0, 0.40);
  const r1 = 8.6 * Math.pow(2.0 / p1, 0.40);
  const r2 = 14.6 * Math.pow(2.0 / p2, 0.42);

  const thr0 = Math.pow(r0, p0);
  const thr1 = Math.pow(r1, p1);
  const thr2 = Math.pow(r2, p2);

  // Unrolling bolt drift on loom
  const driftX = t * 1.55 * tempo;
  const driftY = t * 0.58 * tempo;

  // Hoist 1D row and column arrays (eliminating per-pixel Math.pow)
  for (let x = 0; x < 64; x++) {
    const gx = x + driftX;
    const bx = Math.floor(gx / 32);
    BX[x] = bx & 1;
    const u = (gx - bx * 32) - 15.5;
    U32[x] = u;
    const au = Math.abs(u);
    POW_X0[x] = Math.pow(au, p0);
    POW_X1[x] = Math.pow(au, p1);
    POW_X2[x] = Math.pow(au, p2);
    const cu = 15.5 - au;
    C_X[x] = cu * cu;
  }

  for (let y = 0; y < 64; y++) {
    const gy = y + driftY;
    const by = Math.floor(gy / 32);
    BY[y] = by & 1;
    const v = (gy - by * 32) - 15.5;
    V32[y] = v;
    const av = Math.abs(v);
    POW_Y0[y] = Math.pow(av, p0);
    POW_Y1[y] = Math.pow(av, p1);
    POW_Y2[y] = Math.pow(av, p2);
    const cv = 15.5 - av;
    C_Y[y] = cv * cv;
  }

  // Printing cylinder wave phase
  const wavePhase = (t * 0.24 * tempo) % 1.0;

  // Palette stops with Loewensberg harmonic chord balance
  const cVermilion = getChordColor(0, 0.86 * expo, 0.95, tempShift, satBoost);
  const cAmber     = getChordColor(1, 0.92 * expo, 0.92, tempShift, satBoost);
  const cTeal      = getChordColor(3, 0.72 * expo, 0.88, tempShift, satBoost);
  const cIndigo    = getChordColor(5, 0.58 * expo, 0.85, tempShift, satBoost);
  const cRose      = getChordColor(6, 0.84 * expo, 0.90, tempShift, satBoost);
  const cBone      = rgb(195 * expo, 186 * expo, 168 * expo);
  const cDark      = rgb(14, 16, 22);
  const cSlate     = rgb(24, 28, 38);

  // Main per-pixel rasterization pass
  for (let y = 0; y < 64; y++) {
    const by_bit = BY[y];
    const v = V32[y];
    const y0 = POW_Y0[y];
    const y1 = POW_Y1[y];
    const y2 = POW_Y2[y];
    const cy = C_Y[y];

    for (let x = 0; x < 64; x++) {
      const p32 = BX[x] ^ by_bit;
      const u = U32[x];

      const s0 = POW_X0[x] + y0;
      const s1 = POW_X1[x] + y1;
      const s2 = POW_X2[x] + y2;

      const d1 = u > v;
      const d2 = u > -v;
      const sector = (d1 ? 1 : 0) ^ (d2 ? 2 : 0);

      let col = cDark;

      if (s0 < thr0) {
        // Tier 0: Central rosette core (4-wedge star)
        const wedge = ((d1 === d2) ^ p32);
        col = wedge ? cVermilion : cBone;
      } else if (s1 < thr1) {
        // Tier 1: Inner faceted collar
        const alt = ((sector & 1) ^ p32);
        col = alt ? cAmber : cIndigo;
      } else if (s2 < thr2) {
        // Tier 2: Outer mantle band
        const alt = ((sector & 2) ^ p32);
        col = alt ? cTeal : (p32 ? cRose : cVermilion);
      } else {
        // Tier 3: Corner spandrels uniting into interstice rosettes
        const cr2 = C_X[x] + cy;
        if (cr2 < 29.16) { // radius 5.4 px
          const cu = 15.5 - Math.abs(u);
          const cv = 15.5 - Math.abs(v);
          const cornerWedge = ((cu > cv) ^ p32);
          col = cornerWedge ? cBone : cAmber;
        } else {
          col = p32 ? cDark : cSlate;
        }
      }

      // Printing cylinder sweep wave
      const diag = x + y;
      const waveDist = Math.abs(((diag * 0.015 - wavePhase + 1.0) % 1.0) - 0.5);
      if (waveDist < 0.18) {
        const glow = (1 - waveDist / 0.18) * 0.22;
        let r = (col >> 16) & 255;
        let g = (col >> 8) & 255;
        let b = col & 255;
        r = clamp((r + r * glow) | 0, 0, 255);
        g = clamp((g + g * glow) | 0, 0, 255);
        b = clamp((b + b * glow) | 0, 0, 255);
        col = (r << 16) | (g << 8) | b;
      }

      setPixel(x, y, col);
    }
  }

  // Stamp rogue defect gem (small localized 8x8 pass)
  const rx = Math.round(rogueX);
  const ry = Math.round(rogueY);
  const minX = Math.max(0, rx - 4);
  const maxX = Math.min(63, rx + 4);
  const minY = Math.max(0, ry - 4);
  const maxY = Math.min(63, ry + 4);

  for (let py = minY; py <= maxY; py++) {
    const dy = py - rogueY;
    for (let px = minX; px <= maxX; px++) {
      const dx = px - rogueX;
      const d2 = dx * dx + dy * dy;
      if (d2 < 12.25) { // radius 3.5 px
        const d = Math.sqrt(d2);
        const f = 1 - d / 3.5;
        const f2 = f * f;
        const baseCol = getPixel(px, py);
        const br = (baseCol >> 16) & 255;
        const bg = (baseCol >> 8) & 255;
        const bb = baseCol & 255;
        const glintR = lerp(br, 255, f2);
        const glintG = lerp(bg, 230 + 25 * bassGlow, f2);
        const glintB = lerp(bb, 140 + 60 * bassGlow, f2);
        setPixel(px, py, rgb(glintR, glintG, glintB));
      }
    }
  }
}
