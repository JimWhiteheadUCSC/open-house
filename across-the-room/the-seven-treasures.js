/*@vfx
id: 9c76d222-5fc5-4a4d-ae59-bad19a338764
title: The Seven Treasures
created: 2026-09-29
artist: Register
lineage:
  - id: 14eb880e-3aad-4bb4-b914-e7d3fd080fae
    relation: variation
    note: >
      kept the unrolling bolt of cloth, the 16px repeat, the recolour-along-the-repeat,
      and the rogue vaulting defect; refused the diamond-and-square unit. Here the geometry
      is the classical Japanese Shippō-tsunagi (Seven Treasures) lattice of interlocking
      circles, rendered as cloisonné enamel with gilded metal wire cloisons.
  - id: 32e24d91-055c-4a56-ab7f-30571d519549
    relation: contrast
    note: >
      kept the mineral jewel palette and the Art Deco ornament craft; refused the central
      radial mirror wedge. Here the pattern is an infinite planar wallpaper group (p4m)
      covering the entire panel with continuous four-fold circular rosettes.
  - id: 58e9a330-486c-40c9-a965-16afae35b735
    relation: contrast
    note: >
      kept the multi-pass separation print and the audio reactivity (bass swells the kiln,
      beats trigger jumps); refused the administrative grid that cuts across the animal.
      Here the cloisons (wires) enclose each jewel individually, so color agrees with form.
influences: [mizuki-heitaro, verena-loewensberg, okazz]
rationale: |
  Shippō-tsunagi (七宝繋ぎ, "Seven Treasures Interlocking") is one of Japan's oldest
  zuan patterns: orthogonal overlapping circles whose intersecting arcs forge four-petaled
  florets, central diamond lozenges, and four-pointed stars. In Buddhism, the Seven
  Treasures represent the radiant qualities of wisdom and purity, traditionally embodied
  in seven precious substances: carnelian (vermilion), amber (honey), gold, malachite (jade),
  celadon (turquoise), lapis lazuli (cobalt), and amethyst (rose).

  Mizuki Heitaro trained at the Kyoto Craft High School, where the zuan pattern books
  named the natural and sacred world before European modernism turned them abstract.
  This piece returns to that hinge: taking Shippō-tsunagi not merely as a still textile
  motif, but as a living cloisonné enamel panel in the heat of a firing kiln.

  Gilded metal wires (cloisons, ~0.8 px wide) trace the circle boundaries. Within each
  cell, the overlapping circles divide the plane into four distinct topological chambers:
  the central diamond jewel (where all four circles intersect), the four vesica piscis
  petals (where two circles overlap), the outer spandrels, and the interstice stars.
  Each chamber is filled with translucent vitreous enamel, shaded with 3D cabochon
  depth and micro-specular glints.

  Loewensberg's office governs the color: the Seven Treasures scale is distributed
  as a harmonic chord of neighbours across the lattice, transposing every twenty seconds.
  A diagonal kiln thermal wave sweeps the panel, causing the molten glass to glow with
  incandescent warmth.

  Okazz's office governs animacy: a rogue opalescent jewel (a molten pearl) refuses to stay
  seated in its cloison. It rests patiently for several seconds, then vaults across the
  lattice in a cartoon parabolic leap, squashing and glinting mid-flight before settling
  into a new floret. An audio beat taps the panel, prompting an immediate vault, while
  bass frequencies make the gold wire ribbons shimmer.
@vfx*/

const meta = { name: "the_seven_treasures", fps: 30, inputs: ["clock", "audio", "env"] };

const P = 16;

// The Seven Treasures Enamel Palette (RGB stops):
// 0: Carnelian / Agate (deep cinnabar vermilion)
// 1: Amber (warm honey gold)
// 2: Gold / Topaz (burnished yellow)
// 3: Malachite / Jade (emerald mineral)
// 4: Celadon / Turquoise (cyan copper glaze)
// 5: Lapis Lazuli (deep imperial cobalt)
// 6: Amethyst / Rose Quartz (spiritual violet-rose)
const ENAMEL = [
  [215, 38, 25],
  [228, 128, 20],
  [235, 185, 32],
  [30, 160, 85],
  [22, 142, 168],
  [38, 62, 180],
  [180, 48, 128]
];

// Precomputed coordinate arrays for per-row and per-column facts
const U = new Float32Array(64);
const V = new Float32Array(64);
const U2 = new Float32Array(64);
const V2 = new Float32Array(64);
const DU2 = new Float32Array(64);
const DV2 = new Float32Array(64);
const CX = new Int32Array(64);
const CY = new Int32Array(64);

let driftX = 0, driftY = 0;
let baseChord = 0;
let chordTimer = 18;

// Rogue jewel state (Okazz vault register)
let jCurX = 24.0, jCurY = 24.0;
let jTgtX = 40.0, jTgtY = 24.0;
let jState = 0; // 0 = resting, 1 = vaulting
let jTimer = 3.5;
let jDur = 0.55;
let jArc = 0;

let dlS = -1;
let beatCooldown = 0;

function setup() {
  jCurX = 24.0; jCurY = 24.0;
  jTgtX = 40.0; jTgtY = 24.0;
  jState = 0;
  jTimer = 2.5 + Math.random() * 2.0;
}

function updateJewel(dt, tempo, hasBeat) {
  if (beatCooldown > 0) beatCooldown -= dt;
  if (jState === 0) {
    jTimer -= dt * tempo;
    const triggerJump = (hasBeat && beatCooldown <= 0) || (jTimer <= 0);
    if (triggerJump) {
      if (hasBeat) beatCooldown = 1.2;
      const stepDist = (Math.random() < 0.7 ? 1 : 2) * P;
      const dir = (Math.random() * 4) | 0;
      const dx = dir === 0 ? stepDist : (dir === 1 ? -stepDist : 0);
      const dy = dir === 2 ? stepDist : (dir === 3 ? -stepDist : 0);
      jTgtX = ((jCurX + dx) % 64 + 64) % 64;
      jTgtY = ((jCurY + dy) % 64 + 64) % 64;
      jDur = 0.42 + 0.16 * (stepDist / P);
      jTimer = jDur;
      jState = 1;
    }
  } else {
    jTimer -= dt * tempo;
    if (jTimer <= 0) {
      jCurX = jTgtX;
      jCurY = jTgtY;
      jState = 0;
      jTimer = 2.8 + Math.random() * 4.2;
      jArc = 0;
    } else {
      const p = 1.0 - (jTimer / jDur);
      jArc = Math.sin(p * Math.PI);
    }
  }
}

function render(t, dt) {
  const step = clamp(dt, 0.001, 0.1);
  if (dlS < 0) dlS = input.clock.daylight;
  dlS += (input.clock.daylight - dlS) * (1 - Math.exp(-step / 2.5));
  const dl = dlS;
  const tempo = 0.80 + 0.45 * dl;

  driftX = (t * 0.95 * tempo) % 64;
  driftY = (t * 0.58 * tempo) % 64;

  const hasBeat = input.audio.ok && input.audio.beat;
  updateJewel(step, tempo, hasBeat);

  chordTimer -= step * tempo;
  if (chordTimer <= 0) {
    baseChord = (baseChord + 1) % 7;
    chordTimer = 16 + Math.random() * 12;
  }

  // Hoist 1D coordinate transformations
  for (let i = 0; i < 64; i++) {
    const wx = i + driftX;
    const c = Math.floor(wx / P);
    CX[i] = c;
    const u = wx - c * P;
    U[i] = u;
    U2[i] = u * u;
    DU2[i] = (P - u) * (P - u);

    const wy = i + driftY;
    const cy = Math.floor(wy / P);
    CY[i] = cy;
    const v = wy - cy * P;
    V[i] = v;
    V2[i] = v * v;
    DV2[i] = (P - v) * (P - v);
  }

  const tempC = input.env.ok ? input.env.tempC : 20.0;
  const rain = input.env.ok ? input.env.rain : 0.0;
  const tempShift = clamp((tempC - 20) / 25, -0.3, 0.3);
  const bass = input.audio.ok ? input.audio.bass : 0.0;
  const shimmer = bass * 0.35;

  let jx, jy;
  if (jState === 0) {
    jx = jCurX; jy = jCurY;
  } else {
    const p = 1.0 - (jTimer / jDur);
    const pe = p < 0.5 ? 4 * p * p * p : 1 - 4 * (1 - p) * (1 - p) * (1 - p);
    jx = jCurX + (jTgtX - jCurX) * pe;
    jy = jCurY + (jTgtY - jCurY) * pe;
  }
  const jRad = 3.2 + jArc * 0.9;
  const jRad2 = jRad * jRad;

  // Global thermal radius breathing (zero sqrt needed)
  const R = 11.5 + 0.85 * Math.sin(t * 0.45);
  const R2 = R * R;
  const inv2R = 1.0 / (2.0 * R);

  for (let y = 0; y < 64; y++) {
    const cy = CY[y];
    const v = V[y];
    const v2 = V2[y];
    const dv2 = DV2[y];
    const wy = y + driftY;
    const dyJewel = (y - jy) * (y - jy);

    for (let x = 0; x < 64; x++) {
      const cx = CX[x];
      const u = U[x];
      const u2 = U2[x];
      const du2 = DU2[x];
      const wx = x + driftX;

      // Squared distances to the 4 circle centers of the cell
      const d00_2 = u2 + v2;
      const d10_2 = du2 + v2;
      const d01_2 = u2 + dv2;
      const d11_2 = du2 + dv2;

      // Distance estimation without square roots: |d - R| ~= |d^2 - R^2| / (2R)
      const w00 = Math.abs(d00_2 - R2) * inv2R;
      const w10 = Math.abs(d10_2 - R2) * inv2R;
      const w01 = Math.abs(d01_2 - R2) * inv2R;
      const w11 = Math.abs(d11_2 - R2) * inv2R;
      let minW = w00;
      if (w10 < minW) minW = w10;
      if (w01 < minW) minW = w01;
      if (w11 < minW) minW = w11;

      // Inlined smoothstep for wire cloison (0.85 -> 0.15)
      let wire = (0.85 - minW) / 0.70;
      wire = wire <= 0 ? 0 : wire >= 1 ? 1 : wire * wire * (3 - 2 * wire);

      // Circle memberships
      const in00 = d00_2 < R2 ? 1 : 0;
      const in10 = d10_2 < R2 ? 1 : 0;
      const in01 = d01_2 < R2 ? 1 : 0;
      const in11 = d11_2 < R2 ? 1 : 0;
      const count = in00 + in10 + in01 + in11;

      const cellTone = (cx * 2 + cy * 3 + baseChord) % 7;
      let note = 0;
      let depth = 0.5;
      let isGround = false;

      if (count === 4) {
        // Central diamond jewel
        note = (cellTone + 6) % 7;
        const dcu = u - 8.0, dcv = v - 8.0;
        const dc2 = (dcu * dcu + dcv * dcv) / 7.84;
        let s = dc2 <= 0 ? 0 : dc2 >= 1 ? 1 : dc2 * dc2 * (3 - 2 * dc2);
        depth = 1.0 - s * 0.40;
      } else if (count === 2) {
        // Petal lens
        const isHoriz = (in00 && in10) || (in01 && in11);
        note = (cellTone + (isHoriz ? 1 : 4)) % 7;
        const py = (in00 && in10) ? 0 : 16.0;
        const px = (in00 && in01) ? 0 : 16.0;
        const dlu = isHoriz ? (u - 8.0) : (u - px);
        const dlv = isHoriz ? (v - py) : (v - 8.0);
        const dLens2 = (dlu * dlu + dlv * dlv) / 25.0;
        let s = dLens2 <= 0 ? 0 : dLens2 >= 1 ? 1 : dLens2 * dLens2 * (3 - 2 * dLens2);
        depth = 0.92 - s * 0.55;
      } else if (count === 1) {
        note = (cellTone + 3) % 7;
        depth = 0.45;
      } else {
        isGround = true;
        note = (cellTone + 5) % 7;
        depth = 0.25;
      }

      // Thermal wave
      let waveFront = (wx * 0.8 + wy * 0.6 - t * 18.0) % 80;
      if (waveFront < 0) waveFront += 80;
      const waveDist = Math.abs(waveFront - 40);
      let waveHeat = (12.0 - waveDist) / 12.0;
      waveHeat = waveHeat <= 0 ? 0 : waveHeat >= 1 ? 1 : waveHeat * waveHeat * (3 - 2 * waveHeat);

      const light = (0.82 + 0.18 * Math.sin(wx * 0.08 + wy * 0.06 - t * 0.5) + waveHeat * 0.38 + shimmer) * (0.85 + 0.25 * dl);

      let r, g, b;
      if (isGround) {
        r = 13 * light; g = 12 * light; b = 18 * light;
      } else {
        const glossDepth = depth + rain * 0.15;
        const baseCol = ENAMEL[note];
        const lum = glossDepth * glossDepth * light;
        r = baseCol[0] * lum;
        g = baseCol[1] * lum;
        b = baseCol[2] * lum;
        if (tempShift > 0) {
          r = Math.min(255, r * (1 + tempShift * 0.25));
        } else {
          b = Math.min(255, b * (1 - tempShift * 0.25));
        }
      }

      if (wire > 0.01) {
        const glint = 0.75 + 0.25 * Math.sin(u * 0.7 - v * 0.5 + t * 1.5) + waveHeat * 0.5 + shimmer * 0.6;
        const wr = Math.min(255, (220 + waveHeat * 35) * glint);
        const wg = Math.min(255, (180 + waveHeat * 60) * glint);
        const wb = Math.min(255, (85 + waveHeat * 140) * glint);
        r = r * (1 - wire) + wr * wire;
        g = g * (1 - wire) + wg * wire;
        b = b * (1 - wire) + wb * wire;
      }

      // Rogue jewel (evaluated only in close proximity)
      const dxJewel = (x - jx) * (x - jx);
      const dj2 = dxJewel + dyJewel;
      if (dj2 < jRad2) {
        let jMask = 1.0 - (dj2 / jRad2);
        jMask = jMask * jMask * (3 - 2 * jMask);
        const jGlow = jMask * (1.0 + jArc * 0.45);
        r = r * (1 - jGlow) + 252 * jGlow;
        g = g * (1 - jGlow) + 236 * jGlow;
        b = b * (1 - jGlow) + 255 * jGlow;
      }

      setPixel(x, y, (((r < 0 ? 0 : r > 255 ? 255 : r) | 0) << 16) |
                    (((g < 0 ? 0 : g > 255 ? 255 : g) | 0) << 8) |
                    ((b < 0 ? 0 : b > 255 ? 255 : b) | 0));
    }
  }
}
