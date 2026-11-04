/*@vfx
id: 40285ce8-56f1-416b-bb36-0dc1c7497f7e
title: Wilson Cloud Chamber
created: 2026-10-11
artist: Sinter (apprentice name)
lineage:
  - id: 2bba4eb5-cd9b-4f2a-bb27-b5929bd67d43
    relation: contrast
    note: rejects continuous flocking swarms for discrete, ballistic subatomic ionization events with distinct physical kinematic signatures
  - id: 3a997c07-9327-4c3e-8b5c-db10ca3fcd8d
    relation: inspiration
    note: borrowed the clearing field and diurnal lighting shift, but replaced the centralized radial glow with edge-to-edge stochastic nucleation
influences:
  - C.T.R. Wilson (1911 expansion cloud chamber)
  - Marietta Blau & Cecil Powell (subatomic particle emulsion tracks)
rationale: |
  A Wilson cloud chamber renders the invisible subatomic world through
  supersaturated alcohol vapor: charged particles leave nucleation trails
  of microscopic droplets as they ionize gas atoms along their trajectories.

  Unlike conventional particle systems that treat points as undifferentiated
  glowing sparks or flocking swarms, this piece models four physically distinct
  particle signatures under a transverse magnetic field:
  1. Alpha particles: heavy, straight, densely ionized amber tracks terminating
     in a vivid Bragg peak.
  2. Beta electrons: thin, tortuous cyan spirals whose Larmor radii tighten as
     they lose momentum, occasionally ejecting energetic delta-ray branches.
  3. Cosmic ray muons: relativistic minimum-ionizing needles piercing edge-to-edge
     in cobalt-blue.
  4. Neutral V-decays: sudden paired bifurcations in violet.

  The chilled vapor floor billows in slow convective eddies, illuminated by raking
  light that tracks the diurnal solar clock. The button triggers the chamber's
  high-voltage clearing field to sweep away ions, while audio beats inject secondary
  cosmic cascades.
@vfx*/

// wilson_cloud_chamber — buffer mode
// Physical subatomic ionization tracks condensing in a supersaturated vapor chamber.
// Pre-allocated particle pools to avoid GC pressure, bilinear-upsampled convection
// field for smooth vapor drift, and distinct kinematic equations per particle class.

const meta = { name: "wilson_cloud_chamber", fps: 30, inputs: ["audio", "button", "clock"] };

const MAX_DROPLETS = 800;
const poolX = new Float32Array(MAX_DROPLETS);
const poolY = new Float32Array(MAX_DROPLETS);
const poolVx = new Float32Array(MAX_DROPLETS);
const poolVy = new Float32Array(MAX_DROPLETS);
const poolLife = new Float32Array(MAX_DROPLETS);
const poolMaxLife = new Float32Array(MAX_DROPLETS);
const poolHue = new Float32Array(MAX_DROPLETS);
const poolSat = new Float32Array(MAX_DROPLETS);
const poolVal = new Float32Array(MAX_DROPLETS);
let dropletCount = 0;

let nextSpawnT = 0.15;

// Upsampled vapor field (17x17 grid = 289 noise evaluations per frame)
const MIST_GRID = 17;
const mistGrid = new Float32Array(MIST_GRID * MIST_GRID);

function updateMist(t) {
  for (let gy = 0; gy < MIST_GRID; gy++) {
    const yNorm = gy / (MIST_GRID - 1);
    for (let gx = 0; gx < MIST_GRID; gx++) {
      const xNorm = gx / (MIST_GRID - 1);
      mistGrid[gy * MIST_GRID + gx] = noise2(xNorm * 2.8 + t * 0.07, yNorm * 2.8 - t * 0.05);
    }
  }
}

function sampleMist(x, y) {
  const gxf = (x / (WIDTH - 1)) * (MIST_GRID - 1);
  const gyf = (y / (HEIGHT - 1)) * (MIST_GRID - 1);
  const gx0 = clamp(gxf | 0, 0, MIST_GRID - 1);
  const gy0 = clamp(gyf | 0, 0, MIST_GRID - 1);
  const gx1 = gx0 + 1 < MIST_GRID ? gx0 + 1 : gx0;
  const gy1 = gy0 + 1 < MIST_GRID ? gy0 + 1 : gy0;
  const fx = gxf - gx0, fy = gyf - gy0;
  const m00 = mistGrid[gy0 * MIST_GRID + gx0];
  const m10 = mistGrid[gy0 * MIST_GRID + gx1];
  const m01 = mistGrid[gy1 * MIST_GRID + gx0];
  const m11 = mistGrid[gy1 * MIST_GRID + gx1];
  const mx0 = m00 + (m10 - m00) * fx;
  const mx1 = m01 + (m11 - m01) * fx;
  return mx0 + (mx1 - mx0) * fy;
}

function addDroplet(x, y, vx, vy, life, hue, sat, val) {
  if (dropletCount >= MAX_DROPLETS) return;
  const i = dropletCount++;
  poolX[i] = x;
  poolY[i] = y;
  poolVx[i] = vx;
  poolVy[i] = vy;
  poolLife[i] = life;
  poolMaxLife[i] = life;
  poolHue[i] = hue;
  poolSat[i] = sat;
  poolVal[i] = val;
}

function spawnAlpha(ox, oy, angle) {
  const len = 15 + Math.random() * 14;
  const numPts = (len * 2.4) | 0;
  const baseHue = 0.11 + Math.random() * 0.03; // amber
  for (let i = 0; i < numPts; i++) {
    const frac = i / numPts;
    const dist = frac * len;
    const px = ox + Math.cos(angle) * dist + (Math.random() - 0.5) * 0.5;
    const py = oy + Math.sin(angle) * dist + (Math.random() - 0.5) * 0.5;
    // Bragg peak: energy loss rises dramatically at the end of the track
    const bragg = 0.6 + 1.4 * Math.pow(frac, 2.5);
    const life = 2.2 + Math.random() * 0.8;
    addDroplet(px, py, (Math.random() - 0.5) * 1.0, (Math.random() - 0.5) * 1.0, life, baseHue, frac > 0.8 ? 0.35 : 0.75, bragg);
  }
}

function spawnBeta(ox, oy, angle) {
  let x = ox, y = oy, a = angle;
  const steps = 34 + (Math.random() * 22) | 0;
  const charge = Math.random() < 0.5 ? -1 : 1;
  let curvature = (0.07 + Math.random() * 0.10) * charge;
  const baseHue = 0.53 + Math.random() * 0.05; // cyan

  for (let i = 0; i < steps; i++) {
    const stepLen = 0.9;
    x += Math.cos(a) * stepLen;
    y += Math.sin(a) * stepLen;
    curvature *= 1.025; // Larmor radius shrinks as kinetic energy is lost
    a += curvature;
    if (Math.random() < 0.18) a += (Math.random() - 0.5) * 0.5; // Coulomb scatter
    if (x < 1 || x >= WIDTH - 1 || y < 1 || y >= HEIGHT - 1) break;

    const life = 2.0 + Math.random() * 0.8;
    const val = 0.75 + Math.random() * 0.35;
    addDroplet(x, y, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2, life, baseHue, 0.65, val);

    // Delta ray: secondary knock-on electron branching outward
    if (i === 14 && Math.random() < 0.45) {
      let dx = x, dy = y, da = a + (charge > 0 ? -1.2 : 1.2);
      for (let k = 0; k < 9; k++) {
        dx += Math.cos(da) * 0.75;
        dy += Math.sin(da) * 0.75;
        da += 0.25 * charge;
        addDroplet(dx, dy, 0, 0, 1.5, 0.58, 0.5, 0.7);
      }
    }
  }
}

function spawnMuon() {
  const edge = (Math.random() * 4) | 0;
  let x0 = 0, y0 = 0, x1 = 0, y1 = 0;
  if (edge === 0) { x0 = Math.random() * WIDTH; y0 = 0; x1 = Math.random() * WIDTH; y1 = HEIGHT - 1; }
  else if (edge === 1) { x0 = 0; y0 = Math.random() * HEIGHT; x1 = WIDTH - 1; y1 = Math.random() * HEIGHT; }
  else if (edge === 2) { x0 = Math.random() * WIDTH; y0 = HEIGHT - 1; x1 = Math.random() * WIDTH; y1 = 0; }
  else { x0 = WIDTH - 1; y0 = Math.random() * HEIGHT; x1 = 0; y1 = Math.random() * HEIGHT; }

  const dx = x1 - x0, dy = y1 - y0;
  const d = Math.hypot(dx, dy);
  const steps = (d * 1.8) | 0;
  const baseHue = 0.64; // cobalt

  for (let i = 0; i < steps; i++) {
    const f = i / steps;
    const px = x0 + dx * f + (Math.random() - 0.5) * 0.4;
    const py = y0 + dy * f + (Math.random() - 0.5) * 0.4;
    const life = 2.4 + Math.random() * 0.6;
    addDroplet(px, py, (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.8, life, baseHue, 0.4, 0.95);
  }
}

function spawnVTrack(ox, oy, angle) {
  const baseHue = 0.78; // violet
  for (let b = 0; b < 2; b++) {
    let x = ox, y = oy;
    let a = angle + (b === 0 ? 0.35 : -0.35);
    const curve = (b === 0 ? 0.06 : -0.06);
    const steps = 22 + (Math.random() * 10) | 0;
    for (let k = 0; k < steps; k++) {
      x += Math.cos(a) * 0.85;
      y += Math.sin(a) * 0.85;
      a += curve;
      if (x < 1 || x >= WIDTH - 1 || y < 1 || y >= HEIGHT - 1) break;
      addDroplet(x, y, 0, 0, 2.0, baseHue, 0.6, 0.8);
    }
  }
}

function addSplat(x, y, h, s, v) {
  const xi = x | 0;
  const yi = y | 0;
  if (xi < 0 || xi >= WIDTH || yi < 0 || yi >= HEIGHT) return;

  const coreCol = hsv(h, s, clamp(v * v, 0, 1));
  setPixel(xi, yi, coreCol);

  if (v > 0.4) {
    const haloV = clamp(v * v * 0.28, 0, 1);
    const haloCol = hsv(h, s * 0.8, haloV);
    if (xi > 0) setPixel(xi - 1, yi, haloCol);
    if (xi < WIDTH - 1) setPixel(xi + 1, yi, haloCol);
    if (yi > 0) setPixel(xi, yi - 1, haloCol);
    if (yi < HEIGHT - 1) setPixel(xi, yi + 1, haloCol);
  }
}

function render(t, dt) {
  fade(0.88);

  const daylight = input.clock.daylight;
  const lampHue = lerp(0.60, 0.10, daylight);
  const lampSat = lerp(0.85, 0.65, daylight);

  updateMist(t);

  // Soft raking light across cold vapor: oblique illumination from x=0
  for (let y = 0; y < HEIGHT; y += 2) {
    const vY = y / HEIGHT;
    for (let x = 0; x < WIDTH; x += 2) {
      const uX = x / WIDTH;
      const beam = (1.0 - uX * 0.5) * (0.8 + 0.2 * Math.cos(vY * 3.5 + t * 0.25));
      const mist = sampleMist(x, y);
      if (mist > 0.1) {
        const density = (mist - 0.1) * 1.1;
        const vaporV = clamp(density * beam * 0.28, 0, 0.4);
        const col = hsv(lampHue, lampSat, vaporV * vaporV);
        setPixel(x, y, col);
        setPixel(x + 1, y, col);
      }
    }
  }

  // Stochastic Poisson arrival of ionization events
  if (t >= nextSpawnT) {
    const roll = Math.random();
    if (roll < 0.35) {
      spawnAlpha(Math.random() * WIDTH, Math.random() * HEIGHT, Math.random() * Math.PI * 2);
    } else if (roll < 0.70) {
      spawnBeta(Math.random() * WIDTH, Math.random() * HEIGHT, Math.random() * Math.PI * 2);
    } else if (roll < 0.88) {
      spawnMuon();
    } else {
      spawnVTrack(Math.random() * WIDTH, Math.random() * HEIGHT, Math.random() * Math.PI * 2);
    }
    nextSpawnT = t + 0.2 + Math.random() * 0.45;
  }

  // Audio reactivity: beats provoke muon cascades or alpha disintegration
  if (input.audio.ok && input.audio.beat) {
    if (Math.random() < 0.5) spawnMuon();
    else {
      spawnAlpha(Math.random() * WIDTH, Math.random() * HEIGHT, Math.random() * Math.PI * 2);
    }
  }

  // Button: high-voltage clearing field accelerates ion recombination and clears droplets
  if (input.button.down) {
    for (let i = 0; i < dropletCount; i++) {
      poolLife[i] -= dt * 4.0;
    }
  }

  // Droplet convection, growth, dissipation, and rendering
  let active = 0;
  for (let i = 0; i < dropletCount; i++) {
    poolLife[i] -= dt;
    if (poolLife[i] <= 0) continue;

    const px = poolX[i];
    const py = poolY[i];
    const swirl = sampleMist(px, py);
    poolX[i] += (poolVx[i] * 0.35 + Math.cos(swirl * Math.PI) * 1.5) * dt;
    poolY[i] += (poolVy[i] * 0.35 + Math.sin(swirl * Math.PI) * 1.5 + 0.6) * dt;

    const curLife = poolLife[i];
    const maxLife = poolMaxLife[i];
    const lifeFrac = curLife / maxLife;

    // Condensation growth curve then gradual dissipation
    const fadeCurve = lifeFrac > 0.80 ? (1 - lifeFrac) / 0.20 : lifeFrac / 0.80;
    const v = poolVal[i] * fadeCurve;

    addSplat(poolX[i], poolY[i], poolHue[i], poolSat[i], v);

    if (active !== i) {
      poolX[active] = poolX[i];
      poolY[active] = poolY[i];
      poolVx[active] = poolVx[i];
      poolVy[active] = poolVy[i];
      poolLife[active] = poolLife[i];
      poolMaxLife[active] = poolMaxLife[i];
      poolHue[active] = poolHue[i];
      poolSat[active] = poolSat[i];
      poolVal[active] = poolVal[i];
    }
    active++;
  }
  dropletCount = active;
}
