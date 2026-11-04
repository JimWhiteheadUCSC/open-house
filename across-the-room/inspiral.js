/*@vfx
id: eebec343-ad2a-4dbc-8fb4-5d424a9b9023
title: Inspiral
created: 2026-10-10
artist: Cinnabar (apprentice name)
lineage:
  - id: 73866e49-b8b4-48fa-bf90-8bee65998273
    relation: inspiration
    note: "Kept Kerr black hole shadow occlusion and relativistic Doppler boosting from Ergosphere, but expanded single-black-hole general relativity into the orbital dynamics of a binary supermassive black hole inspiral."
  - id: 179e6338-4a78-4ccc-8ea7-0fb53f159b7a
    relation: inspiration
    note: "Borrowed supersonic stream self-intersection shock physics and non-axisymmetric accretion mechanics from Tidal Disruption, transposing them into circumbinary cavity accretion streams and alternating minidisk impacts."
  - id: 35feb5ba-985f-4f64-8dfb-13f3bec71b08
    relation: contrast
    note: "Deliberately rejected full-field isotropic wave interference in favor of macroscopic gravitational binary choreography: an eccentric circumbinary cavity, twin orbiting event horizons, alternating Doppler-boosted minidisks, and quadrupole gravitational wave metric ripples."
influences:
  - "Numerical relativity simulations of binary black hole inspirals and gravitational wave emission (Pretorius 2005, Campanelli et al. 2006)"
  - "General relativistic magnetohydrodynamics (GRMHD) of circumbinary accretion disks and cavity stream feeding (Gold et al. 2014, Farris et al. 2014, d'Ascoli et al. 2018)"
  - "Laser Interferometer Gravitational-Wave Observatory (LIGO) and LISA gravitational wave inspiral chirp physics"
rationale: |
  Inspiral explores the gravitational dance and spacetime turbulence of a binary supermassive
  black hole system approaching coalescence. Two compact black holes orbit their mutual barycenter
  at relativistic velocities within an inclined orbital plane, carving out an eccentric circumbinary
  cavity ringed by a massive, turbulent accretion disk.

  From the inner rim of the circumbinary disk, twin supersonic accretion streams peel away at the
  orbital Lagrange points, funneling gas into an S-shaped bridge that feeds two distinct circum-single
  minidisks. As the binary orbits at a quarter the speed of light, relativistic Doppler beaming
  alternates between the two minidisks: the approaching black hole blazes in incandescent diamond-white
  and cyan, while the receding companion dims into deep cinnabar vermilion and ruby recombination.

  The orbital acceleration of the binary masses radiates quadrupole gravitational waves: expanding
  double-armed spacetime metric ripples that propagate outward through the disk and surrounding cosmic void.
  At the stream-minidisk impact interfaces, standing shock nozzles flare with intense thermal dissipation,
  while collimated bipolar micro-jets launch Doppler-beamed plasmoid knots out into deep space.
  Decoupling sub-second Keplerian spin, intermediate orbital Doppler reversal, stream clump transport,
  and stochastic accretion surges sustains a vibrant, non-collapsing attractor that never repeats.
@vfx*/

// inspiral — buffer mode
// Binary supermassive black hole inspiral: mutual barycenter, inclined circumbinary disk,
// cleared cavity, S-shaped stream feeding, twin orbiting event horizons with circum-single
// minidisks, alternating relativistic Doppler beaming, quadrupole gravitational wave ripples,
// stream impact shock nozzles, and collimated bipolar micro-jets.

const meta = { name: "inspiral", fps: 30 };

const CX = 32;
const CY = 32;

// Orbital geometry: inclination ~ 40 deg, sky tilt ~ 24 deg
const TILT = 0.42;
const COS_T = Math.cos(TILT);
const SIN_T = Math.sin(TILT);
const INCL = 0.70; // ~40 deg
const COS_I = Math.cos(INCL);
const SIN_I = Math.sin(INCL);

// Binary parameters: mass ratio q = 0.75, semi-major axis = 13.6 px
const SEP_A = 13.6;      // Total binary separation (px)
const MASS_Q = 0.75;     // Mass ratio M2 / M1
const R1 = SEP_A * (MASS_Q / (1.0 + MASS_Q)); // ~5.83 px from barycenter
const R2 = SEP_A * (1.0 / (1.0 + MASS_Q));    // ~7.77 px from barycenter
const OMEGA_ORB = 1.62;  // Orbital angular velocity (rad/s), T_orb ~ 3.88s

// Circumbinary disk boundaries
const R_CAV = 13.8;      // Inner mean cavity radius (px)
const R_OUT = 28.5;      // Outer circumbinary disk radius (px)

// Precomputed LookUp Tables
const pixelType = new Uint8Array(WIDTH * HEIGHT); // 0=void, 1=cavity, 2=disk, 3=outer halo
const pixelRd = new Float32Array(WIDTH * HEIGHT);
const pixelPhid = new Float32Array(WIDTH * HEIGHT);
const pixelNormU = new Float32Array(WIDTH * HEIGHT);
const pixelDiskBase = new Float32Array(WIDTH * HEIGHT);
const pixelMottle = new Float32Array(WIDTH * HEIGHT);
const pixelDiskDoppBoost = new Float32Array(WIDTH * HEIGHT);
const pixelDiskDoppVal = new Float32Array(WIDTH * HEIGHT);
const pixelGwAmp = new Float32Array(WIDTH * HEIGHT);

// Static geometry precomputation at script load
{
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const idx = y * WIDTH + x;
      const dx = x - CX;
      const dy = y - CY;

      // Rotate into disk coordinate frame
      const xp = dx * COS_T + dy * SIN_T;
      const yp = -dx * SIN_T + dy * COS_T;

      // De-project for inclination
      const yd = yp / COS_I;
      const rd = Math.hypot(xp, yd);
      const phid = Math.atan2(yd, xp);

      pixelRd[idx] = rd;
      pixelPhid[idx] = phid;
      pixelGwAmp[idx] = (1.5 / Math.sqrt(Math.max(4.0, rd)));

      if (rd < R_CAV - 1.5) {
        pixelType[idx] = 1; // Pure cavity
      } else if (rd <= R_OUT) {
        pixelType[idx] = 2; // Circumbinary accretion disk
        const u = clamp((rd - R_CAV) / (R_OUT - R_CAV), 0, 1);
        pixelNormU[idx] = u;

        // Radial surface brightness: peaked near cavity wall, gradual falloff
        const peakProfile = Math.pow(u, 0.22) * Math.pow(1.0 - u, 0.72) * 2.15;
        pixelDiskBase[idx] = peakProfile;

        // Static turbulent mottle
        const n1 = Math.abs(noise2(x * 0.20, y * 0.20));
        const n2 = Math.abs(noise2(x * 0.40 + 5.2, y * 0.40 - 3.8));
        pixelMottle[idx] = (1.0 - n1) * 0.65 + (1.0 - n2) * 0.35;

        // Circumbinary Keplerian velocity & Doppler boosting:
        // v_rot ~ 0.30 * sqrt(R_CAV / rd)
        const vRot = 0.30 * Math.sqrt(R_CAV / Math.max(8.0, rd));
        const vLos = vRot * Math.sin(phid) * SIN_I;
        const dopp = clamp(1.0 / (1.0 - vLos), 0.65, 1.55);
        pixelDiskDoppVal[idx] = dopp;
        pixelDiskDoppBoost[idx] = Math.pow(dopp, 2.2);
      } else {
        pixelType[idx] = 3; // Outer halo & gravitational wave ripple propagation zone
        const uHalo = Math.max(0, 1.0 - (rd - R_OUT) / 12.0);
        pixelDiskBase[idx] = uHalo;
      }
    }
  }
}

// Discrete gas clumps streaming across cavity from circumbinary rim to minidisks
const CLUMP_COUNT = 34;
const streamClumps = [];
for (let i = 0; i < CLUMP_COUNT; i++) {
  streamClumps.push({
    streamIdx: i % 2, // 0 = feeding M1, 1 = feeding M2
    progress: Math.random(),
    speed: 0.38 + Math.random() * 0.28,
    wobble: Math.random() * Math.PI * 2,
    bright: 0.60 + Math.random() * 0.40
  });
}

// Collimated bipolar micro-jets launched outside the minidisk
const JET_COUNT = 24;
const jetPlasmoids = [];
for (let i = 0; i < JET_COUNT; i++) {
  jetPlasmoids.push({
    bhIdx: i % 2,
    dist: 3.5 + Math.random() * 22.0,
    dir: Math.random() < 0.62 ? -1 : 1, // -1 = approaching jet, Doppler boosted
    speed: 13.0 + Math.random() * 9.0,
    wobble: Math.random() * Math.PI * 2,
    bright: 0.55 + Math.random() * 0.45
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
  fade(0.80);

  // 1. Orbital Kinematics of the Binary around the mutual Barycenter
  const phiOrb = OMEGA_ORB * t;
  const cosOrb = Math.cos(phiOrb);
  const sinOrb = Math.sin(phiOrb);

  // Position of M1 (Primary, larger)
  const x1Orb = -R1 * cosOrb;
  const y1Orb = -R1 * sinOrb;
  const sx1 = CX + (x1Orb * COS_T - (y1Orb * COS_I) * SIN_T);
  const sy1 = CY + (x1Orb * SIN_T + (y1Orb * COS_I) * COS_T);

  // Position of M2 (Secondary, smaller)
  const x2Orb = R2 * cosOrb;
  const y2Orb = R2 * sinOrb;
  const sx2 = CX + (x2Orb * COS_T - (y2Orb * COS_I) * SIN_T);
  const sy2 = CY + (x2Orb * SIN_T + (y2Orb * COS_I) * COS_T);

  // Relativistic orbital velocity projection onto line of sight
  // v_los ~ v_orb * sin(i) * sin(phi_orb)
  const vLos1 = -sinOrb * SIN_I * 0.36; // Approaching when sinOrb > 0
  const vLos2 = +sinOrb * SIN_I * 0.40; // Approaching when sinOrb < 0

  // Doppler factors: delta = 1 / (gamma * (1 - v_los))
  const doppler1 = clamp(1.0 / (1.0 - vLos1), 0.52, 1.95);
  const doppler2 = clamp(1.0 / (1.0 - vLos2), 0.52, 1.95);
  const boost1 = Math.pow(doppler1, 2.7);
  const boost2 = Math.pow(doppler2, 2.7);

  // Stochastic viscous accretion surge modulation
  const surgeNoise = noise2(t * 0.08, 33.7);
  const surge = surgeNoise > 0.40 ? (surgeNoise - 0.40) / 0.60 : 0;

  // Cavity precession frequency: eccentric cavity precesses slowly at ~0.12 * OMEGA_ORB
  const phiPrec = OMEGA_ORB * 0.12 * t;

  // Quadrupole Gravitational Wave propagation speed
  const gwWaveSpeed = 16.0; // Wave speed in px/s
  const invGwSpeed = 1.0 / gwWaveSpeed;
  const twoOmega = 2.0 * OMEGA_ORB;

  // 2. Circumbinary Disk and Gravitational Wave Ripples
  for (let idx = 0; idx < WIDTH * HEIGHT; idx++) {
    const type = pixelType[idx];
    if (type < 2) continue; // Skip void & cavity immediately

    const x = idx & 63, y = idx >> 6;
    const rd = pixelRd[idx];
    const phid = pixelPhid[idx];

    // Quadrupole gravitational wave metric ripple (two-armed expanding spiral)
    const waveArg = 2.0 * phid - twoOmega * (t - rd * invGwSpeed);
    const gwRipple = Math.cos(waveArg);
    const metricWarp = pixelGwAmp[idx] * gwRipple;

    if (type === 2) {
      // Circumbinary Accretion Disk
      const baseProfile = pixelDiskBase[idx];
      const mottle = pixelMottle[idx];
      const diskDopp = pixelDiskDoppVal[idx];
      const dopplerBoost = pixelDiskDoppBoost[idx];

      // Two-armed spiral density waves driven by binary orbital resonance (m = 2)
      const spiralPhase = 2.0 * phid - 3.4 * (rd / R_CAV) - 2.0 * phiOrb;
      const spiralDensity = Math.pow(0.5 + 0.5 * Math.cos(spiralPhase), 2.2);

      // Eccentric cavity boundary modulation: r_cavity(phi) has m=1 eccentric mode
      const cavEcc = 0.18 * Math.cos(phid - phiPrec);
      const effU = clamp((rd - (R_CAV * (1.0 + cavEcc))) / (R_OUT - R_CAV), 0, 1);
      if (effU <= 0) continue; // Inside eccentric cavity!

      // Cavity edge lump / hot spot orbiting at cavity frequency
      const cavLump = Math.exp(-Math.pow(effU / 0.12, 2)) * (0.5 + 0.5 * Math.cos(phid - phiOrb + 1.2));

      // Fast hydrodynamic churn (sum of sines instead of noise2)
      const churn = 0.5 + 0.3 * Math.sin(rd * 0.7 - t * 1.5 + phid * 3.0) + 0.2 * Math.cos(rd * 1.2 + t * 0.9 - phid * 2.0);

      const surface = (baseProfile * (0.55 + 0.45 * spiralDensity) * (0.80 + 0.20 * mottle) * (0.85 + 0.15 * churn)
                       + cavLump * 0.45) * dopplerBoost * (1.0 + metricWarp * 0.28) * (0.85 + surge * 0.4);

      if (surface > 0.02) {
        // Temperature gradient: approaching limb is gold/amber/cyan, receding is cinnabar ruby
        let rD, gD, bD;
        if (diskDopp > 1.15) {
          // Approaching side: hot golden amber and white-gold core
          const w = (diskDopp - 1.15) * 2.5;
          rD = clamp((surface * 255) | 0, 0, 255);
          gD = clamp((surface * lerp(175, 230, w)) | 0, 0, 255);
          bD = clamp((surface * lerp(50, 170, w)) | 0, 0, 255);
        } else {
          // Receding side: deep cinnabar ruby and smoky carmine
          const w = clamp((1.15 - diskDopp) * 2.22, 0, 1);
          rD = clamp((surface * lerp(230, 140, w)) | 0, 0, 255);
          gD = clamp((surface * lerp(85, 20, w)) | 0, 0, 255);
          bD = clamp((surface * lerp(22, 10, w)) | 0, 0, 255);
        }
        addSplat(x, y, rD >> 1, gD >> 1, bD >> 1);
      }
    } else {
      // Outer Halo (type === 3): Gravitational wave spacetime metric ripples in cosmic dust
      const haloBase = pixelDiskBase[idx];
      const waveGlow = Math.max(0, gwRipple) * haloBase * 0.32 * (0.8 + surge * 0.4);
      if (waveGlow > 0.015) {
        // Ethereal violet-cyan gravitational wave ripples
        const rW = (waveGlow * 135) | 0;
        const gW = (waveGlow * 85) | 0;
        const bW = (waveGlow * 210) | 0;
        addSplat(x, y, rW >> 1, gW >> 1, bW >> 1);
      }
    }
  }

  // 3. Continuous S-shaped Accretion Stream Spines
  for (let sIdx = 0; sIdx < 2; sIdx++) {
    const isM1 = sIdx === 0;
    const launchAngle = phiOrb + (isM1 ? 0.62 : Math.PI + 0.62);
    const targetX = isM1 ? x1Orb : x2Orb;
    const targetY = isM1 ? y1Orb : y2Orb;
    const rStart = R_CAV * 0.94;
    const xStart = rStart * Math.cos(launchAngle);
    const yStart = rStart * Math.sin(launchAngle);
    const dBoost = isM1 ? doppler1 : doppler2;

    for (let step = 0; step <= 24; step++) {
      const s = step * 0.04167; // s = step / 24.0
      const twist = Math.sin(s * Math.PI) * 0.48;
      const curX = lerp(xStart, targetX, s) + Math.cos(launchAngle + Math.PI * 0.5) * twist * 4.2;
      const curY = lerp(yStart, targetY, s) + Math.sin(launchAngle + Math.PI * 0.5) * twist * 4.2;

      const px = CX + (curX * COS_T - (curY * COS_I) * SIN_T);
      const py = CY + (curX * SIN_T + (curY * COS_I) * COS_T);

      const spineBright = (0.28 + 0.45 * s) * dBoost * (0.8 + surge * 0.4);
      const rS = clamp((spineBright * 230) | 0, 0, 255);
      const gS = clamp((spineBright * 115) | 0, 0, 255);
      const bS = clamp((spineBright * 28) | 0, 0, 255);
      addSplat(px | 0, py | 0, rS >> 1, gS >> 1, bS >> 1);
    }
  }

  // Discrete Clumps moving along the streams
  for (let i = 0; i < streamClumps.length; i++) {
    const c = streamClumps[i];
    c.progress += (c.speed + surge * 0.25) * dt;
    if (c.progress > 1.0) {
      c.progress = 0.02 + Math.random() * 0.06;
      c.wobble = Math.random() * Math.PI * 2;
      c.bright = 0.60 + Math.random() * 0.40;
    }

    const s = c.progress;
    const isM1 = c.streamIdx === 0;

    const launchAngle = phiOrb + (isM1 ? 0.62 : Math.PI + 0.62);
    const targetX = isM1 ? x1Orb : x2Orb;
    const targetY = isM1 ? y1Orb : y2Orb;

    const rStart = R_CAV * 0.94;
    const xStart = rStart * Math.cos(launchAngle);
    const yStart = rStart * Math.sin(launchAngle);

    const twist = Math.sin(s * Math.PI) * 0.48;
    const curX = lerp(xStart, targetX, s) + Math.cos(launchAngle + Math.PI * 0.5) * twist * 4.2;
    const curY = lerp(yStart, targetY, s) + Math.sin(launchAngle + Math.PI * 0.5) * twist * 4.2;

    const px = CX + (curX * COS_T - (curY * COS_I) * SIN_T);
    const py = CY + (curX * SIN_T + (curY * COS_I) * COS_T);

    const accel = 0.7 + s * 1.3;
    const dBoost = isM1 ? doppler1 : doppler2;
    const bright = c.bright * accel * (0.85 + surge * 0.6) * dBoost;

    // Stagnation impact nozzle shock flash at s ~ 0.94
    if (s > 0.88) {
      const flash = Math.exp(-Math.pow((s - 0.94) / 0.05, 2)) * 1.9;
      const rF = clamp((bright * 240 + flash * 255) | 0, 0, 255);
      const gF = clamp((bright * 140 + flash * 235) | 0, 0, 255);
      const bF = clamp((bright * 40 + flash * 255) | 0, 0, 255);
      addSplat(px | 0, py | 0, rF, gF, bF);
      addSplat((px + 1) | 0, py | 0, rF >> 2, gF >> 2, bF >> 2);
      addSplat((px - 1) | 0, py | 0, rF >> 2, gF >> 2, bF >> 2);
    } else {
      const rS = clamp((bright * 245) | 0, 0, 255);
      const gS = clamp((bright * 125) | 0, 0, 255);
      const bS = clamp((bright * 35) | 0, 0, 255);
      addSplat(px | 0, py | 0, rS >> 1, gS >> 1, bS >> 1);
    }
  }

  // 4. Collimated Bipolar Micro-Jets
  const jetCos = -SIN_T * SIN_I;
  const jetSin = COS_T * SIN_I;
  for (let i = 0; i < jetPlasmoids.length; i++) {
    const p = jetPlasmoids[i];
    p.dist += p.speed * dt;
    if (p.dist > 25.0) {
      p.dist = 3.6 + Math.random() * 2.0;
      p.dir = Math.random() < 0.62 ? -1 : 1;
      p.speed = 13.0 + Math.random() * 9.0;
    }

    const isM1 = p.bhIdx === 0;
    const originX = isM1 ? sx1 : sx2;
    const originY = isM1 ? sy1 : sy2;

    const jx = originX + jetCos * p.dist * p.dir;
    const jy = originY + jetSin * p.dist * p.dir;

    const isApproaching = p.dir < 0;
    const dBoost = isApproaching ? (isM1 ? doppler1 : doppler2) * 1.3 : 0.6;
    const fadeNorm = Math.max(0, 1.0 - p.dist / 25.0);
    const bright = p.bright * fadeNorm * dBoost * (0.8 + surge * 0.5);

    const rJ = clamp((bright * (isApproaching ? 220 : 240)) | 0, 0, 255);
    const gJ = clamp((bright * (isApproaching ? 240 : 100)) | 0, 0, 255);
    const bJ = clamp((bright * (isApproaching ? 255 : 30)) | 0, 0, 255);

    addSplat(jx | 0, jy | 0, rJ, gJ, bJ);
  }

  // 5. Orbiting Circum-Single Minidisks & Event Horizons
  // Render M1 minidisk (larger, primary)
  const R_MINI1 = 3.6;
  const R_SHADOW1 = 1.35;
  for (let dy = -5; dy <= 5; dy++) {
    for (let dx = -5; dx <= 5; dx++) {
      const px = (sx1 + dx) | 0;
      const py = (sy1 + dy) | 0;
      if (px < 0 || px >= WIDTH || py < 0 || py >= HEIGHT) continue;

      const d = Math.hypot(dx, dy);

      if (d > R_SHADOW1 && d <= R_MINI1) {
        // Circum-single minidisk
        const uDisk = (d - R_SHADOW1) / (R_MINI1 - R_SHADOW1);
        const photonRing = Math.exp(-Math.pow(uDisk / 0.18, 2)) * 1.45;
        const diskGlow = Math.exp(-uDisk * 1.5);
        const miniSpin = 0.5 + 0.5 * Math.sin(t * 12.0 + Math.atan2(dy, dx) * 2.0);

        const intensity = (diskGlow * 0.75 + photonRing + miniSpin * 0.25) * boost1 * (1.0 + surge * 0.5);

        let rM, gM, bM;
        if (doppler1 > 1.15) {
          // Approaching limb: incandescent diamond-white, cyan, and gold
          const w = (doppler1 - 1.15) / 0.75;
          rM = clamp((intensity * 255) | 0, 0, 255);
          gM = clamp((intensity * lerp(190, 245, w)) | 0, 0, 255);
          bM = clamp((intensity * lerp(90, 255, w)) | 0, 0, 255);
        } else {
          // Receding limb: dimmed cinnabar vermilion and ruby
          rM = clamp((intensity * 230) | 0, 0, 255);
          gM = clamp((intensity * 75) | 0, 0, 255);
          bM = clamp((intensity * 22) | 0, 0, 255);
        }
        addSplat(px, py, rM >> 1, gM >> 1, bM >> 1);
      }
    }
  }

  // Render M2 minidisk (smaller, secondary)
  const R_MINI2 = 2.9;
  const R_SHADOW2 = 1.05;
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      const px = (sx2 + dx) | 0;
      const py = (sy2 + dy) | 0;
      if (px < 0 || px >= WIDTH || py < 0 || py >= HEIGHT) continue;

      const d = Math.hypot(dx, dy);

      if (d > R_SHADOW2 && d <= R_MINI2) {
        // Circum-single minidisk
        const uDisk = (d - R_SHADOW2) / (R_MINI2 - R_SHADOW2);
        const photonRing = Math.exp(-Math.pow(uDisk / 0.18, 2)) * 1.35;
        const diskGlow = Math.exp(-uDisk * 1.6);
        const miniSpin = 0.5 + 0.5 * Math.sin(t * 14.0 + Math.atan2(dy, dx) * 2.0);

        const intensity = (diskGlow * 0.75 + photonRing + miniSpin * 0.25) * boost2 * (1.0 + surge * 0.5);

        let rM, gM, bM;
        if (doppler2 > 1.15) {
          // Approaching limb: incandescent diamond-white, cyan, and gold
          const w = (doppler2 - 1.15) / 0.75;
          rM = clamp((intensity * 255) | 0, 0, 255);
          gM = clamp((intensity * lerp(190, 245, w)) | 0, 0, 255);
          bM = clamp((intensity * lerp(90, 255, w)) | 0, 0, 255);
        } else {
          // Receding limb: dimmed cinnabar vermilion and ruby
          rM = clamp((intensity * 230) | 0, 0, 255);
          gM = clamp((intensity * 75) | 0, 0, 255);
          bM = clamp((intensity * 22) | 0, 0, 255);
        }
        addSplat(px, py, rM >> 1, gM >> 1, bM >> 1);
      }
    }
  }

  // 6. Strict Event Horizon Occlusion (rendered absolute last for pure black shadows)
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (Math.hypot(dx, dy) <= R_SHADOW1) {
        const px = (sx1 + dx) | 0, py = (sy1 + dy) | 0;
        if (px >= 0 && px < WIDTH && py >= 0 && py < HEIGHT) setPixel(px, py, 0);
      }
      if (Math.hypot(dx, dy) <= R_SHADOW2) {
        const px = (sx2 + dx) | 0, py = (sy2 + dy) | 0;
        if (px >= 0 && px < WIDTH && py >= 0 && py < HEIGHT) setPixel(px, py, 0);
      }
    }
  }
}
