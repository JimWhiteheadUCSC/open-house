/*@vfx
id: 15985781-ad77-438b-aea8-f07c5cde822f
title: Kilonova
created: 2026-10-10
artist: Barycenter
lineage:
  - id: eebec343-ad2a-4dbc-8fb4-5d424a9b9023
    relation: inspiration
    note: "Borrowed binary orbital mechanics and relativistic Doppler boosting from Inspiral, but transposed them from the pre-merger inspiral phase to the post-merger explosive coalescence—a kilonova driven by radioactive r-process nucleosynthesis."
  - id: 1020b7e6-4033-474d-b851-5bf1de2355f5
    relation: inspiration
    note: "Kept prolate limb-brightened bipolar lobes and equatorial circumstellar dust confinement from Great Eruption, but transposed them from an LBV stellar impostor to the relativistic lanthanide curtain and blue polar wind of a neutron star collision."
  - id: cc044156-afa9-47eb-9baf-423ad09faf71
    relation: inspiration
    note: "Borrowed collimated relativistic jet knots and lateral shock cocoon physics from Microquasar, aligning the jet axis with the binary coalescence remnant."
  - id: 35feb5ba-985f-4f64-8dfb-13f3bec71b08
    relation: contrast
    note: "Deliberately rejected isotropic boundary-free harmonic fields in favor of grand macroscopic geometry: an inclined lanthanide-rich equatorial torus, lanthanide-poor blue polar lobes, relativistic shock cocoons, and deep cosmic negative space."
influences:
  - "Multi-messenger gravitational wave and electromagnetic observations of GW170817 / AT 2017gfo (LIGO-Virgo, Hubble Space Telescope, Chandra X-ray Observatory, and VLT)"
  - "Theoretical radiation-hydrodynamic models of kilonovae and rapid neutron-capture (r-process) nucleosynthesis (Metzger 2017, Kasen et al. 2017, Tanaka et al. 2018)"
rationale: |
  Kilonova investigates the cosmic forge of binary neutron star coalescence on a 64x64 matrix.
  When two neutron stars merge, gravitational radiation expels relativistic, neutron-rich debris
  at significant fractions of light speed (v ~ 0.1-0.3c). Rapid neutron capture (r-process)
  synthesizes the universe's heaviest elements—gold, platinum, and the lanthanides—whose radioactive
  beta-decay powers a luminous, two-component expanding fireball.

  The composition is anchored in grand macroscopic perspective: an inclined equatorial torus of
  lanthanide-rich dynamical ejecta ("The Lanthanide Curtain") bisected by two prolate polar lobes
  of lanthanide-poor fast wind ("The Blue Kilonova"). In the equatorial plane, dense f-shell atomic
  transitions create an impenetrable optical opacity curtain, forcing trapped photons to cool into
  radiant cinnabar vermilion, ruby carmine, and warm bronze. Along the poles, neutrino irradiation
  lowers the opacity, venting a blistering blue wind radiant in diamond cyan, turquoise, and white.

  Relativistic Doppler boosting warps the polar lobes, intensifying the approaching bubble while
  dimming the receding counterpart. Where the polar wind shears against the equatorial torus,
  turbulent shock cocoons blaze in compressed amber. Collimated relativistic jet knots punch outward
  along the polar axis, while discrete r-process clumps expand ballistically into deep space.
  Decoupling sub-second accretion turbulence, intermediate thermal ionization waves, and stochastic
  nuclear decay heating sustains a vibrant, non-collapsing attractor that never repeats across hours.
@vfx*/

// kilonova — buffer mode
// Binary neutron star coalescence: inclined equatorial lanthanide-rich torus
// ("Lanthanide Curtain"), prolate lanthanide-poor polar lobes ("Blue Kilonova")
// with relativistic Doppler boosting, shock cocoon shear layer, central compact
// remnant with optical flash spikes, and ballistic r-process ejecta clumps.

const meta = { name: "kilonova", fps: 30 };

const CX = 32;
const CY = 32;
const TILT = 0.58; // ~33 deg diagonal tilt in sky plane
const COS_T = Math.cos(TILT);
const SIN_T = Math.sin(TILT);
const INCL = 0.65; // ~37 deg line-of-sight inclination
const COS_I = Math.cos(INCL);
const SIN_I = Math.sin(INCL);

// Ring parameters
const RING_A = 17.5; // semi-major axis along xp
const RING_B = RING_A * COS_I; // semi-minor axis along zp (~14.0 px)

// Precomputed coordinate arrays
const pixelZ = new Float32Array(WIDTH * HEIGHT);
const pixelX = new Float32Array(WIDTH * HEIGHT);
const pixelRe = new Float32Array(WIDTH * HEIGHT);
const pixelPhiEq = new Float32Array(WIDTH * HEIGHT);
const pixelDistCore = new Float32Array(WIDTH * HEIGHT);
const pixelMottle = new Float32Array(WIDTH * HEIGHT);

// Shell precomputations
const polarShell = new Float32Array(WIDTH * HEIGHT);
const polarDoppler = new Float32Array(WIDTH * HEIGHT);
const torusBase = new Float32Array(WIDTH * HEIGHT);
const cocoonBase = new Float32Array(WIDTH * HEIGHT);

// Sparse active index arrays
const torusBgIndices = [];
const polarIndices = [];
const torusFgIndices = [];

{
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const idx = y * WIDTH + x;
      const dx = x - CX;
      const dy = y - CY;
      const dCore = Math.hypot(dx, dy);
      pixelDistCore[idx] = dCore;

      const xp = dx * COS_T + dy * SIN_T;
      const zp = -dx * SIN_T + dy * COS_T;
      pixelX[idx] = xp;
      pixelZ[idx] = zp;

      const absZ = Math.abs(zp);
      const absX = Math.abs(xp);

      // 1. Equatorial Torus
      const re = Math.hypot(xp / RING_A, zp / RING_B);
      pixelRe[idx] = re;
      const phiEq = Math.atan2(zp / RING_B, xp / RING_A);
      pixelPhiEq[idx] = phiEq;

      if (re >= 0.55 && re <= 1.45) {
        const torusProfile = Math.exp(-Math.pow((re - 1.0) / 0.26, 2));
        torusBase[idx] = torusProfile;
        if (torusProfile > 0.02 && dCore <= 34.0) {
          if (zp < 0) {
            torusFgIndices.push(idx);
          } else {
            torusBgIndices.push(idx);
          }
        }
      }

      // 2. Polar Lobes
      if (absZ >= 1.2 && absZ <= 25.5) {
        const u = (absZ - 1.2) / 24.3;
        const wLobe = 8.8 * Math.pow(u, 0.46) * Math.pow(1.0 - u, 0.52) * 2.15;
        const fore = zp > 0 ? 1.06 : 0.94;
        const rTrans = absX / (wLobe * fore);

        if (rTrans <= 1.22) {
          const rim = Math.exp(-Math.pow((rTrans - 0.96) / 0.12, 2));
          const cav = Math.exp(-Math.pow((rTrans - 0.55) / 0.36, 2)) * 0.42;
          polarShell[idx] = rim * 1.28 + cav;

          const vlos = 0.22 * (zp > 0 ? 1 : -1) * COS_I;
          const gamma = 1.0 / Math.sqrt(1.0 - 0.22 * 0.22);
          polarDoppler[idx] = 1.0 / (gamma * (1.0 - vlos));

          if (re >= 0.75 && re <= 1.25 && rTrans >= 0.65) {
            cocoonBase[idx] = Math.exp(-Math.pow((re - 1.0) / 0.20, 2)) * Math.exp(-Math.pow((rTrans - 0.90) / 0.25, 2));
          }

          if (dCore <= 34.0) {
            polarIndices.push(idx);
          }
        }
      }

      // Cellular mottling & dust filament ridges
      const n1 = Math.abs(noise2(x * 0.22, y * 0.22));
      const n2 = Math.abs(noise2(x * 0.44 + 5.3, y * 0.44 - 3.7));
      pixelMottle[idx] = (1.0 - n1) * 0.62 + (1.0 - n2) * 0.38;
    }
  }
}

// Relativistic jet plasmoids (moving along polar axis)
const JET_KNOTS = [];
for (let i = 0; i < 28; i++) {
  JET_KNOTS.push({
    z: Math.random(),
    dir: Math.random() < 0.65 ? 1 : -1,
    speed: 13.0 + Math.random() * 9.0,
    wobble: Math.random() * Math.PI * 2,
    brightness: 0.6 + Math.random() * 0.4
  });
}

// Discrete ballistic r-process ejecta clumps
const CLUMPS = [];
for (let i = 0; i < 36; i++) {
  CLUMPS.push({
    dist: 3.0 + Math.random() * 25.0,
    angle: Math.random() * Math.PI * 2,
    speed: 7.0 + Math.random() * 9.0,
    brightness: 0.55 + Math.random() * 0.45,
    isPolar: Math.random() < 0.35
  });
}

function addSplat(x, y, r, g, b) {
  x |= 0; y |= 0;
  if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
  const p = getPixel(x, y);
  const pr = (p >> 16) & 255, pg = (p >> 8) & 255, pb = p & 255;
  setPixel(x, y, rgb(Math.min(255, pr + r), Math.min(255, pg + g), Math.min(255, pb + b)));
}

function render(t, dt) {
  fade(0.81);

  // Radioactive decay heating surges (beta-decay & nuclear fission heating)
  const surgeNoise = noise2(t * 0.08, 41.2);
  const surge = surgeNoise > 0.4 ? (surgeNoise - 0.4) / 0.6 : 0;

  // Accretion core turbulence & sub-second magnetic reconnection
  const coreTurb = 0.5 + 0.5 * Math.sin(t * 12.0 + Math.sin(t * 5.0));
  const coreBright = 0.85 + 0.35 * coreTurb + surge * 1.6;

  // Outward traveling thermal ionization wavefronts (wave speed ~ 9 px/s)
  const waveCycle = t * 1.8;

  // Fast trigonometric churn parameters
  const churnPhaseT = t * 1.5;

  // 1. Draw background equatorial torus first (far side, zp > 0)
  for (let k = 0; k < torusBgIndices.length; k++) {
    const idx = torusBgIndices[k];
    const x = idx & 63, y = idx >> 6;
    const dCore = pixelDistCore[idx];
    const mottle = pixelMottle[idx];

    const wavePhase = (dCore * 0.16 - waveCycle) % 1.0;
    const wavePulse = Math.exp(-Math.pow(wavePhase + (wavePhase < 0 ? 1 : 0) - 0.5, 2) * 22.0);
    const heatIllum = 0.72 + 0.28 * wavePulse * (1.0 + surge * 0.5);

    const tBase = torusBase[idx];
    const re = pixelRe[idx];
    const phiEq = pixelPhiEq[idx];
    const spiral = 0.5 + 0.5 * Math.sin(2.0 * phiEq - re * 5.0 + t * 0.8);
    const churn = 0.5 + 0.3 * Math.sin(x * 0.25 - churnPhaseT + y * 0.3) + 0.2 * Math.cos(y * 0.35 + churnPhaseT * 0.8);
    const tBright = tBase * (0.65 + 0.35 * spiral) * (0.7 + 0.3 * mottle) * (0.8 + 0.2 * churn) * heatIllum * 0.72;

    if (tBright > 0.02) {
      const rT = (tBright * 240) | 0;
      const gT = (tBright * lerp(35, 115, tBright)) | 0;
      const bT = (tBright * lerp(20, 40, tBright)) | 0;
      addSplat(x, y, rT >> 1, gT >> 1, bT >> 1);
    }
  }

  // 2. Draw Polar Lobes & Shock Cocoon (middle depth)
  for (let k = 0; k < polarIndices.length; k++) {
    const idx = polarIndices[k];
    const x = idx & 63, y = idx >> 6;
    const dCore = pixelDistCore[idx];
    const mottle = pixelMottle[idx];

    const wavePhase = (dCore * 0.16 - waveCycle) % 1.0;
    const wavePulse = Math.exp(-Math.pow(wavePhase + (wavePhase < 0 ? 1 : 0) - 0.5, 2) * 22.0);
    const heatIllum = 0.72 + 0.28 * wavePulse * (1.0 + surge * 0.5);

    const pShell = polarShell[idx];
    if (pShell > 0.02) {
      const doppler = polarDoppler[idx];
      const dBoost = Math.pow(doppler, 2.4);
      const absZ = Math.abs(pixelZ[idx]);
      const uZ = absZ / 25.5;

      const pBright = pShell * (0.65 + 0.35 * mottle) * dBoost * heatIllum * (1.0 - uZ * 0.25);

      if (pBright > 0.02) {
        const rP = (pBright * lerp(110, 240, pBright)) | 0;
        const gP = (pBright * lerp(180, 245, pBright)) | 0;
        const bP = (pBright * lerp(230, 255, pBright)) | 0;
        addSplat(x, y, rP >> 1, gP >> 1, bP >> 1);
      }
    }

    const cBase = cocoonBase[idx];
    if (cBase > 0.02) {
      const cBright = cBase * (0.75 + 0.25 * mottle) * heatIllum * (0.85 + surge * 0.6);
      if (cBright > 0.02) {
        const rC = (cBright * 255) | 0;
        const gC = (cBright * 175) | 0;
        const bC = (cBright * 55) | 0;
        addSplat(x, y, rC >> 1, gC >> 1, bC >> 1);
      }
    }
  }

  // 3. Draw Foreground equatorial torus (near side, zp < 0)
  for (let k = 0; k < torusFgIndices.length; k++) {
    const idx = torusFgIndices[k];
    const x = idx & 63, y = idx >> 6;
    const dCore = pixelDistCore[idx];
    const mottle = pixelMottle[idx];

    const wavePhase = (dCore * 0.16 - waveCycle) % 1.0;
    const wavePulse = Math.exp(-Math.pow(wavePhase + (wavePhase < 0 ? 1 : 0) - 0.5, 2) * 22.0);
    const heatIllum = 0.72 + 0.28 * wavePulse * (1.0 + surge * 0.5);

    const tBase = torusBase[idx];
    const re = pixelRe[idx];
    const phiEq = pixelPhiEq[idx];
    const spiral = 0.5 + 0.5 * Math.sin(2.0 * phiEq - re * 5.0 + t * 0.8);
    const churn = 0.5 + 0.3 * Math.sin(x * 0.25 - churnPhaseT + y * 0.3) + 0.2 * Math.cos(y * 0.35 + churnPhaseT * 0.8);
    const tBright = tBase * (0.65 + 0.35 * spiral) * (0.7 + 0.3 * mottle) * (0.8 + 0.2 * churn) * heatIllum;

    if (tBright > 0.02) {
      const rT = (tBright * 255) | 0;
      const gT = (tBright * lerp(45, 135, tBright)) | 0;
      const bT = (tBright * lerp(25, 45, tBright)) | 0;
      addSplat(x, y, rT >> 1, gT >> 1, bT >> 1);
    }
  }

  // 4. Relativistic Jet Knots along polar axis
  for (let i = 0; i < JET_KNOTS.length; i++) {
    const knot = JET_KNOTS[i];
    knot.z += (knot.speed / 26.0) * dt;
    if (knot.z > 1.0) {
      knot.z = 0.04 + Math.random() * 0.06;
      knot.dir = Math.random() < 0.65 ? 1 : -1;
      knot.speed = 13.0 + Math.random() * 9.0;
      knot.wobble = Math.random() * Math.PI * 2;
    }

    const dist = knot.z * 26.0;
    const coneW = 0.35 + Math.pow(knot.z, 0.7) * 2.0;
    const helix = Math.sin(t * 8.0 + knot.wobble) * coneW * 0.5;
    const xp = helix;
    const zp = dist * knot.dir;

    const px = (CX + xp * COS_T - zp * SIN_T) | 0;
    const py = (CY + xp * SIN_T + zp * COS_T) | 0;

    const isApproaching = knot.dir > 0;
    const doppler = isApproaching ? 1.5 : 0.65;
    const bright = knot.brightness * (1.0 - knot.z * 0.28) * doppler * (0.8 + surge * 0.7);

    const rK = (255 * bright) | 0;
    const gK = (isApproaching ? 235 * bright : 110 * bright) | 0;
    const bK = (isApproaching ? 255 * bright : 45 * bright) | 0;

    addSplat(px, py, rK, gK, bK);
    addSplat(px + 1, py, rK >> 2, gK >> 2, bK >> 2);
    addSplat(px - 1, py, rK >> 2, gK >> 2, bK >> 2);
    addSplat(px, py + 1, rK >> 2, gK >> 2, bK >> 2);
    addSplat(px, py - 1, rK >> 2, gK >> 2, bK >> 2);
  }

  // 5. Discrete Ballistic R-Process Clumps
  for (let i = 0; i < CLUMPS.length; i++) {
    const c = CLUMPS[i];
    c.dist += c.speed * dt;
    if (c.dist > 28.0) {
      c.dist = 2.0 + Math.random() * 3.0;
      c.angle = Math.random() * Math.PI * 2;
      c.speed = 7.0 + Math.random() * 9.0;
    }

    const cxp = Math.cos(c.angle) * c.dist;
    const czp = Math.sin(c.angle) * c.dist * (c.isPolar ? 1.25 : 0.60);
    const px = (CX + cxp * COS_T - czp * SIN_T) | 0;
    const py = (CY + cxp * SIN_T + czp * COS_T) | 0;

    const fadeNorm = Math.max(0, 1.0 - c.dist / 28.0);
    const bright = c.brightness * fadeNorm * (0.75 + 0.25 * Math.sin(t * 10.0 + i));

    let rC, gC, bC;
    if (c.isPolar) {
      rC = (180 * bright) | 0;
      gC = (230 * bright) | 0;
      bC = (255 * bright) | 0;
    } else {
      rC = (245 * bright) | 0;
      gC = (90 * bright * bright) | 0;
      bC = (28 * bright * bright) | 0;
    }

    addSplat(px, py, rC >> 1, gC >> 1, bC >> 1);
  }

  // 6. Central Coalescence Remnant
  const remnantGlow = coreBright * (1.2 + surge * 1.5);
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const d = Math.hypot(dx, dy);
      if (d > 3.0) continue;
      const g = Math.exp(-d * 1.5) * remnantGlow;
      addSplat(CX + dx, CY + dy, (255 * g) | 0, (240 * g) | 0, (215 * g) | 0);
    }
  }

  // Collimated optical flash spikes along the jet axis
  const spkLen = 5 + ((surge * 5) | 0);
  for (let s = 1; s <= spkLen; s++) {
    const spk = Math.exp(-s * 0.45) * remnantGlow * 0.55;
    const rS = (255 * spk) | 0, gS = (245 * spk) | 0, bS = (255 * spk) | 0;
    const sx1 = (CX - s * SIN_T) | 0, sy1 = (CY + s * COS_T) | 0;
    const sx2 = (CX + s * SIN_T) | 0, sy2 = (CY - s * COS_T) | 0;
    addSplat(sx1, sy1, rS >> 1, gS >> 1, bS >> 1);
    addSplat(sx2, sy2, rS >> 1, gS >> 1, bS >> 1);
  }
}
