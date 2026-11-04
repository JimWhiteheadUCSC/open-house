/*@vfx
id: 32e24d91-055c-4a56-ab7f-30571d519549
title: The Object Chamber
created: 2026-09-29
artist: Register
lineage:
  - id: 821b1dcd-ac77-4d9a-9552-d32d1089daaf
    relation: contrast
    note: >
      kept the search for hybrid emergent figures born where systems meet;
      refused the rectangular loom, the three separate warp sheets, and the
      subtractive ink. Here the mechanism is an optical cylinder: dihedral
      mirror symmetry folding a dynamic object chamber into a 12-fold Art
      Deco rosette.
  - id: e799f618-45fb-4472-a554-2caea45f292d
    relation: variation
    note: >
      kept Heitaro's equation-first combinatorics and his documented European
      source — M. P. Verneuil's 1926 Kaleidoscope; refused the stacked
      horizontal sampler bands. Here the sampler is the cylinder itself:
      discrete geometric jewels tumbling between mirror reflections, creating
      an uncountable portfolio of rosettes in time.
  - id: 62ff342e-a053-42b2-b719-6c2462538c4c
    relation: variation
    note: >
      kept Okazz's cartoon rhythm — snap-then-rest, tumbling end-over-end —
      and his dark slate ground; refused the orthogonal grid of separate
      boids. Here the tumble is the physical turn of the kaleidoscope chamber,
      settling into poised rest.
influences: [mizuki-heitaro, verena-loewensberg, okazz]
rationale: |
  Mizuki Heitaro's 1930 Abstract Pattern Portfolio was born from a documented
  European ancestor: M. P. Verneuil's 1926 Paris album "Kaleidoscope —
  Ornements Abstraits." Verneuil's insight was that an optical instrument —
  two mirrors meeting at an angle — is the ultimate parametric pattern machine.
  It takes a handful of loose glass shards in an object chamber and, purely
  through reflection, multiplies them into an infinite portfolio of Art Deco
  ornaments.

  This piece builds that optical cylinder on the 64x64 panel. Two mirrors
  meeting at 30 degrees (alpha = pi / 6) establish dihedral symmetry (*632 /
  12-fold reflection), folding the panel into a single fundamental wedge.
  Inside the chamber drift four geometric jewels: a stepped lozenge, a notched
  concentric band, a core rosette star, and an outer chevron wing. As these
  shards slide through the wedge, their reflections meet at the radial mirror
  planes to forge 12-pointed crowns, faceted stars, and intricate rosettes.

  The motion is physical: Okazz's cartoon rhythm of snap-then-rest translated
  to the turn of a brass kaleidoscope. The cylinder precesses continuously at a
  dignified, hypnotic pace (~78 seconds per revolution). Every ten to eighteen
  seconds, the chamber tumbles — the jewels slide and tumble to new radial and
  angular coordinates along a smooth ease-out curve, settling into a poised,
  unrepeatable configuration. If music is playing in the room, an audio beat
  taps the glass cylinder, prompting an immediate tumble.

  The central medallion is framed inside a knurled bronze bezel, surrounded at
  the four corners by architectural Art Deco spandrels (palmettes) that pulse
  gently in counter-rhythm. Color is Loewensberg's chord of neighbours, dealt as
  structural offices from the seven-note scale (ochre, teal, vermilion, rose,
  ivory) against an obsidian ground. Every twenty to thirty seconds, one office
  transposes, re-chording the entire rosette while the physical shards remain
  in place.

  Sides taken. With Heitaro and Verneuil on equation-first combinatorics and
  ornament with dignity. With Loewensberg on the composed freeze-frame and
  the harmonic chord of neighbours. With Okazz on the joyous physical gesture of
  the tumble and the dark ground that lets saturated color sing.
@vfx*/

const meta = { name: "the_object_chamber", fps: 30, inputs: ["clock", "env", "audio"] };

// The seven-note chord scale (three warm, three cool, one distant rose)
const HUE = [0.018, 0.072, 0.125, 0.515, 0.575, 0.640, 0.88];
const SAT = [0.92, 0.88, 0.84, 0.82, 0.85, 0.80, 0.84];

// Precomputed coordinate LookUp Tables (setup)
const R_LUT = new Float32Array(4096);
const TH_LUT = new Float32Array(4096);
const CR_LUT = new Float32Array(4096);
const CTH_LUT = new Float32Array(4096);

const N_SECTORS = 6;
const ALPHA = Math.PI / N_SECTORS; // 30 degrees (pi/6)
const TWO_PI = Math.PI * 2;
const PI_OVER_4 = Math.PI / 4;
const PI_OVER_8 = Math.PI / 8;

// Jewel state inside the object chamber wedge
let tubeRot = 0.0, tubeRotF = 0.0, tubeRotT = 0.0;
let r0 = 17.0, r0F = 17.0, r0T = 17.0;
let p0 = 0.5 * ALPHA, p0F = 0.5 * ALPHA, p0T = 0.5 * ALPHA;
let r1 = 25.0, r1F = 25.0, r1T = 25.0;
let r2 = 6.0, r2F = 6.0, r2T = 6.0;
let r3 = 21.0, r3F = 21.0, r3T = 21.0;
let p3 = 0.3 * ALPHA, p3F = 0.3 * ALPHA, p3T = 0.3 * ALPHA;

// Timing and phase
let phase = 0; // 0 = Rest/Poise, 1 = Tumble
let phaseT = 0.0, phaseD = 12.0;
let chordT = 20.0;
let beatCool = 0.0;
let dlS = -1.0;

// Chord degrees for the four jewel roles
const deg = [1, 3, 0, 6]; // ochre, teal, vermilion, rose

function rnd(a, b) {
  return a + Math.random() * (b - a);
}

function nextTumble() {
  phase = 1;
  phaseT = 0.0;
  phaseD = rnd(3.5, 5.2);

  tubeRotF = tubeRot;
  const dir = Math.random() < 0.5 ? 1 : -1;
  tubeRotT = tubeRot + rnd(0.35, 0.75) * dir;

  r0F = r0; r0T = rnd(12.0, 22.0);
  p0F = p0; p0T = rnd(0.15, 0.85) * ALPHA;

  r1F = r1; r1T = rnd(22.0, 27.5);
  r2F = r2; r2T = rnd(4.5, 8.5);

  r3F = r3; r3T = rnd(15.0, 24.5);
  p3F = p3; p3T = rnd(0.12, 0.88) * ALPHA;
}

function nextRest() {
  phase = 0;
  phaseT = 0.0;
  phaseD = rnd(9.0, 16.0);

  tubeRot = tubeRotT;
  r0 = r0T; p0 = p0T;
  r1 = r1T; r2 = r2T;
  r3 = r3T; p3 = p3T;
}

function setup() {
  // Precompute polar and corner coordinates to remove all runtime Math.atan2 and Math.hypot calls
  for (let y = 0; y < 64; y++) {
    const dy = y - 31.5;
    const cdy = y < 32 ? y : 63 - y;
    const ro = y << 6;
    for (let x = 0; x < 64; x++) {
      const dx = x - 31.5;
      const cdx = x < 32 ? x : 63 - x;
      const idx = ro + x;

      R_LUT[idx] = Math.hypot(dx, dy);
      let th = Math.atan2(dy, dx);
      if (th < 0) th += TWO_PI;
      TH_LUT[idx] = th;

      CR_LUT[idx] = Math.hypot(cdx, cdy);
      let cth = Math.atan2(cdy, cdx);
      if (cth < 0) cth += TWO_PI;
      CTH_LUT[idx] = cth;
    }
  }

  phase = 0;
  phaseT = 0;
  phaseD = rnd(8.0, 14.0);
}

function render(t, dt) {
  const step = clamp(dt, 0.001, 0.1);

  // Daylight modulation (clock)
  if (dlS < 0) dlS = input.clock.daylight;
  dlS += (input.clock.daylight - dlS) * (1 - Math.exp(-step / 3));
  const dl = dlS;
  const tempo = 0.80 + 0.45 * dl;
  const bv = 0.78 + 0.22 * dl;

  // Environmental nuance (env)
  const tempC = input.env.ok ? input.env.tempC : 20;
  const tempWarmth = clamp((tempC - 20) / 25, -1, 1);
  const bronzeHue = 0.08 + 0.015 * tempWarmth;

  // Audio reactivity (audio)
  if (beatCool > 0) beatCool -= step;
  if (input.audio.ok && input.audio.beat && beatCool <= 0) {
    nextTumble();
    beatCool = 3.2; // debounce so glass settles
  }

  // Tumble vs Rest state machine
  phaseT += step * tempo;
  if (phase === 0) {
    if (phaseT >= phaseD) nextTumble();
  } else {
    let p = phaseT / phaseD;
    if (p > 1) p = 1;
    // Smoothstep ease-in-out for realistic mechanical turn
    const e = p * p * (3 - 2 * p);
    tubeRot = tubeRotF + (tubeRotT - tubeRotF) * e;
    r0 = r0F + (r0T - r0F) * e;
    p0 = p0F + (p0T - p0F) * e;
    r1 = r1F + (r1T - r1F) * e;
    r2 = r2F + (r2T - r2F) * e;
    r3 = r3F + (r3T - r3F) * e;
    p3 = p3F + (p3T - p3F) * e;
    if (p >= 1) nextRest();
  }

  // Chord modulation timer (asynchronous voice leading)
  chordT -= step * tempo;
  if (chordT <= 0) {
    const w = (Math.random() * 4) | 0;
    deg[w] = (deg[w] + 1 + ((Math.random() * 2) | 0)) % 7;
    chordT = rnd(18.0, 32.0);
  }

  // Continuous dignified optical precession (~78s / full turn)
  const continuousRot = t * 0.08 * tempo;
  const curRot = tubeRot + continuousRot;

  // Subtle shard breathing (prevents visual freezing during long rests)
  const curR0 = r0 + 0.9 * Math.sin(t * 0.72);
  const curP0 = p0 + 0.035 * ALPHA * Math.cos(t * 0.54);
  const curR1 = r1 + 0.75 * Math.cos(t * 0.61);
  const curR2 = r2 + 0.65 * Math.sin(t * 0.88);
  const curR3 = r3 + 0.95 * Math.cos(t * 0.47);
  const curP3 = p3 + 0.045 * ALPHA * Math.sin(t * 0.58);

  // Palette calculation: v * v curve applied for rich LED dynamic range
  const vOchre = 0.84 * bv;
  const vTeal = 0.78 * bv;
  const vVerm = 0.88 * bv;
  const vRose = 0.82 * bv;
  const vBone = 0.92 * bv;
  const vBronze = 0.50 * bv;

  const cOchre = hsv(HUE[deg[0]], SAT[deg[0]], vOchre * vOchre);
  const cTeal = hsv(HUE[deg[1]], SAT[deg[1]], vTeal * vTeal);
  const cVerm = hsv(HUE[deg[2]], SAT[deg[2]], vVerm * vVerm);
  const cRose = hsv(HUE[deg[3]], SAT[deg[3]], vRose * vRose);
  const cBone = hsv(0.10, 0.14, vBone * vBone);
  const cBronze1 = hsv(bronzeHue, 0.58, vBronze * vBronze);
  const cBronze2 = hsv(bronzeHue + 0.01, 0.68, (vBronze * 0.72) * (vBronze * 0.72));
  const cGround = rgb(12, 14, 18);

  // Spandrel wave progression
  const spWave = t * 0.65 * tempo;

  for (let y = 0; y < 64; y++) {
    const ro = y << 6;
    for (let x = 0; x < 64; x++) {
      const idx = ro + x;
      const r = R_LUT[idx];

      if (r <= 29.5) {
        // --- Inside the Object Chamber ---
        let th = TH_LUT[idx] - curRot;
        if (th < 0) th = (th % TWO_PI) + TWO_PI;
        else if (th >= TWO_PI) th = th % TWO_PI;

        const s = (th / ALPHA) | 0;
        let phi = th - s * ALPHA;
        if (s & 1) phi = ALPHA - phi; // Dihedral mirror reflection

        // Jewel 0: Stepped Lozenge / Diamond
        const dr0 = Math.abs(r - curR0);
        const dp0 = Math.abs(phi - curP0) * r;
        const dLozenge = dr0 * 0.85 + dp0 * 1.25;
        const m0 = dLozenge < 4.2 || (dLozenge > 6.0 && dLozenge < 7.8);

        // Jewel 1: Notched concentric band
        const m1 = Math.abs(r - curR1) < 2.5 && (phi > 0.04 && phi < ALPHA - 0.04);

        // Jewel 2: Core rosette / flower
        const dr2 = Math.hypot(r - curR2, (phi - 0.5 * ALPHA) * r);
        const m2 = dr2 < 3.8 || r < 3.0;

        // Jewel 3: Symmetrical chevron wing
        const dChev = Math.abs((r - curR3) * 0.75 + (phi - curP3) * r * 1.4);
        const m3 = dChev < 2.2 && r > 12.0;

        let col = cGround;
        if (m0 && m1) col = cVerm;
        else if (m0) col = cOchre;
        else if (m1) col = cTeal;
        else if (m2) col = cBone;
        else if (m3) col = cRose;

        // Subtle circular bevel rim inside the aperture
        if (r > 27.5 && r <= 29.5) {
          col = (r > 28.5) ? cBronze2 : cGround;
        }
        setPixel(x, y, col);
      } else if (r <= 31.5) {
        // --- Knurled Brass Bezel Ring ---
        const th = TH_LUT[idx];
        const knurl = ((Math.floor(th * 24) ^ (x + y)) & 1) === 0;
        setPixel(x, y, knurl ? cBronze1 : cBronze2);
      } else {
        // --- Corner Spandrels (Verneuil Art Deco Palmettes) ---
        const cr = CR_LUT[idx];
        const cth = CTH_LUT[idx];
        const cphi = Math.abs((cth % PI_OVER_4) - PI_OVER_8);

        const cm1 = Math.sin(cr * 0.68 - spWave) > 0.15 && cr > 6.0 && cr < 22.0;
        const cm2 = Math.abs((cr - 17.0) * 0.82 + cphi * cr * 1.25) < 2.6 && cr < 22.0;
        const cm3 = cr < 5.5;

        let col = cGround;
        if (cm1 && cm2) col = cVerm;
        else if (cm1) col = cTeal;
        else if (cm2) col = cOchre;
        else if (cm3) col = cRose;

        setPixel(x, y, col);
      }
    }
  }
}
