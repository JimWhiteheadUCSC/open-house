/*@vfx
id: bf195cc0-98e0-4486-9e51-65686191ced2
title: The Crown of Atolla
created: 2026-10-11
artist: Pytheas (apprentice name)
influences:
  - Ernst Haeckel
  - Edith Widder
rationale: |
  An interactive simulation of Atolla wyvillei, the coronate deep-sea jellyfish
  known for its brilliant bioluminescent "burglar alarm" displays in the bathypelagic
  zone. Atolla features a distinctive transverse coronate furrow, sixteen muscular
  pedalia, and one hypertrophied trailing tentacle used to snag prey.

  The piece implements hydrodynamic swimming mechanics: an asymmetric power stroke
  contracts the umbrella bell (narrowing the margin and providing forward momentum)
  followed by a viscous glide where the tentacles flare outward in the slipstream.
  Action potentials propagate as bioluminescent waves down each kinematic tentacle
  chain. Ambient marine snow and passing comb jellies (ctenophores with iridescent
  diffraction combs) frame the organism in the ocean abyss.

  Reactivity honors graceful degradation: in total quiet, Atolla breathes in a slow,
  meditative circadian drift governed by daylight; acoustic beats or tactile presses
  trigger the famous anti-predator burglar alarm display—a blinding pinwheel wave
  spinning across the margin designed in nature to attract larger tertiary predators.
@vfx*/

// The Crown of Atolla — buffer mode, reactive
// Bathypelagic coronate medusa (Atolla wyvillei) with kinematic tentacles,
// asymmetric hydrodynamic locomotion, and bioluminescent burglar-alarm reactivity.

const meta = { name: "crown_of_atolla", fps: 30, inputs: ["audio", "button", "clock", "env"] };

// --- Jellyfish Physics & Anatomy ---
let bx = 32, by = 26;
let bvx = 0, bvy = 0;
let bellAngle = 0;
let strokePhase = 0;
let alarmPulse = 0;

const TENTACLE_COUNT = 7;
const NORMAL_NODES = 14;
const LONG_NODES = 26;
let tentacles = [];

let ctenophores = [];
const SNOW_COUNT = 32;
let snow = [];

function setup() {
  tentacles = [];
  for (let i = 0; i < TENTACLE_COUNT; i++) {
    const isLong = (i === 3); // Middle tentacle is elongated trailing sensory one
    const nodeCount = isLong ? LONG_NODES : NORMAL_NODES;
    const nodes = [];
    const u = (i / (TENTACLE_COUNT - 1)) * 2 - 1; // -1 to 1 across rim
    for (let j = 0; j < nodeCount; j++) {
      nodes.push({ x: bx + u * 8, y: by + 6 + j * 1.8 });
    }
    tentacles.push({ u, isLong, nodes, phase: i * 0.6 });
  }

  ctenophores = [
    { x: 12, y: 16, vx: 0.9, vy: 0.35, phase: 0.0, r: 2.2 },
    { x: 52, y: 44, vx: -0.7, vy: -0.45, phase: 2.8, r: 2.8 },
  ];

  snow = [];
  for (let i = 0; i < SNOW_COUNT; i++) {
    snow.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      vy: 0.8 + Math.random() * 1.8,
      phase: Math.random() * Math.PI * 2,
      baseVal: 0.12 + Math.random() * 0.3,
    });
  }
}

function drawLine(x0, y0, x1, y1, col) {
  let dx = Math.abs(x1 - x0);
  let dy = Math.abs(y1 - y0);
  let sx = x0 < x1 ? 1 : -1;
  let sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let cx = x0, cy = y0;
  for (let step = 0; step < 40; step++) {
    setPixel(cx, cy, col);
    if (cx === x1 && cy === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; cx += sx; }
    if (e2 < dx) { err += dx; cy += sy; }
  }
}

function render(t, dt) {
  if (tentacles.length === 0) setup();

  fade(0.81);

  // Environmental and sensory inputs
  const daylight = input.clock.daylight;
  const audioLevel = input.audio.ok ? input.audio.level : 0;
  const beat = input.audio.ok && input.audio.beat;

  if (beat || input.button.pressed) {
    alarmPulse = 1.0;
  }
  if (alarmPulse > 0) {
    alarmPulse = Math.max(0, alarmPulse - dt * 0.7);
  }

  // --- Swim Pacemaker ---
  strokePhase += dt * (1.6 + audioLevel * 1.4);
  const cycle = strokePhase % (Math.PI * 2);
  const stroke = Math.max(0, Math.sin(cycle));
  const contraction = Math.pow(stroke, 2.0);

  // Bell dimensions
  const rx = 10.5 - contraction * 3.6;
  const ry = 8.2 + contraction * 3.2;

  // Hydrodynamic steering
  const steerTarget = noise2(t * 0.07, 2.1) * 0.32;
  bellAngle = lerp(bellAngle, steerTarget, dt * 1.4);
  const cosB = Math.cos(bellAngle);
  const sinB = Math.sin(bellAngle);

  // Forward thrust vector
  const forwardX = sinB;
  const forwardY = -cosB;

  const thrust = contraction * 19.0 * dt;
  bvx += forwardX * thrust;
  bvy += forwardY * thrust;

  // Negative buoyancy & current
  bvy += (3.6 + (1 - daylight) * 0.8) * dt;
  bvx += noise2(t * 0.1, 8.4) * 2.8 * dt;

  // Viscous fluid drag
  bvx *= Math.pow(0.81, dt * 30);
  bvy *= Math.pow(0.85, dt * 30);

  bx += bvx * dt;
  by += bvy * dt;

  if (bx < 15) bvx += (15 - bx) * 2.2 * dt;
  if (bx > 49) bvx -= (bx - 49) * 2.2 * dt;
  if (by < 13) bvy += (13 - by) * 2.5 * dt;
  if (by > 44) bvy -= (by - 44) * 3.2 * dt;

  const baseHue = alarmPulse > 0.05 ? lerp(0.56, 0.46, alarmPulse) : lerp(0.58, 0.53, daylight);

  // --- Render Umbrella Bell Dome ---
  for (let dy = -ry * 1.25; dy <= ry * 0.75; dy += 1.0) {
    for (let dx = -rx * 1.25; dx <= rx * 1.25; dx += 1.0) {
      const lx = dx;
      const ly = dy;

      const u = lx / rx;
      if (Math.abs(u) > 1.0) continue;

      const domeTop = -ry * Math.sqrt(Math.max(0, 1.0 - u * u * 0.95));
      const domeBottom = ry * 0.42 * (1.0 - u * u * 0.35);

      if (ly >= domeTop && ly <= domeBottom) {
        const wx = (bx + lx * cosB - ly * sinB) | 0;
        const wy = (by + lx * sinB + ly * cosB) | 0;
        if (wx < 0 || wx >= WIDTH || wy < 0 || wy >= HEIGHT) continue;

        const v = (ly - domeTop) / (domeBottom - domeTop);

        const distSideTop = Math.abs(u);
        const distTop = Math.max(0, 1 - (ly - domeTop) / 2.5);
        const distBottom = Math.max(0, 1 - (domeBottom - ly) / 2.0);
        const perimeter = Math.max(distSideTop * distSideTop, Math.max(distTop, distBottom));

        const furrow = Math.exp(-Math.pow(v - 0.44, 2) / 0.016);
        const ribAngle = Math.atan2(ly, lx);
        const rib = 0.5 + 0.5 * Math.cos(ribAngle * 16.0);
        const alarmWave = alarmPulse > 0.02 ? Math.max(0, Math.sin(ribAngle * 5 - t * 18.0)) * alarmPulse : 0;
        const meridianPulse = Math.max(0, Math.sin(v * 6.5 - t * 5.5));

        let brightness = (0.26 + perimeter * 0.65 + rib * 0.2 * (1 - furrow) + meridianPulse * 0.25 + alarmWave * 0.9) * (1.0 - furrow * 0.5);
        let hue = baseHue + perimeter * 0.03 + meridianPulse * 0.04 + alarmWave * 0.06;
        let sat = lerp(0.9, 0.7, perimeter);

        // Dark red/garnet stomach cavity
        const stomachDist = Math.hypot(lx * 1.4, ly + ry * 0.15);
        if (stomachDist < 4.2 && v < 0.72) {
          const sFrac = 1.0 - stomachDist / 4.2;
          const colGut = hsv(0.03, 0.95, sFrac * sFrac * 0.88);
          const colBell = hsv(hue, sat, brightness * brightness * 0.35);
          const r = Math.min(255, ((colGut >> 16) & 255) + ((colBell >> 16) & 255));
          const g = Math.min(255, ((colGut >> 8) & 255) + ((colBell >> 8) & 255));
          const b = Math.min(255, (colGut & 255) + (colBell & 255));
          setPixel(wx, wy, rgb(r, g, b));
        } else {
          setPixel(wx, wy, hsv(hue, sat, brightness * brightness));
        }
      }
    }
  }

  // --- Oral Arms ---
  for (let arm = -1; arm <= 1; arm += 2) {
    for (let k = 1; k <= 6; k++) {
      const armSway = Math.sin(t * 2.8 + k * 0.7 + arm) * 1.3;
      const ax = bx + arm * 2 + armSway;
      const ay = by + 2 + k * 1.5;
      const armGlow = (1 - k / 6) * 0.45;
      setPixel(ax | 0, ay | 0, hsv(0.04, 0.9, armGlow * armGlow));
    }
  }

  // --- Tentacles ---
  for (let i = 0; i < TENTACLE_COUNT; i++) {
    const tent = tentacles[i];
    const nodeCount = tent.nodes.length;

    // Rim attachment point
    const rimX = tent.u * (rx * 0.88);
    const rimY = ry * 0.42 * (1.0 - tent.u * tent.u * 0.35);
    const rootX = bx + rimX * cosB - rimY * sinB;
    const rootY = by + rimX * sinB + rimY * cosB;

    tent.nodes[0].x = rootX;
    tent.nodes[0].y = rootY;

    // During contraction: water stream pulls tentacles inward; during glide: outward flare
    const flareMult = lerp(2.5, 0.5, contraction);

    for (let j = 1; j < nodeCount; j++) {
      const prev = tent.nodes[j - 1];
      const cur = tent.nodes[j];
      const frac = j / nodeCount;

      const swayFreq = tent.isLong ? 2.2 : 3.0;
      const sway = Math.sin(t * swayFreq - j * 0.42 + tent.phase) * (1.2 + frac * 2.2);
      const fluidCurrent = noise2(cur.x * 0.05 + t * 0.1, cur.y * 0.05) * 1.8 * frac;

      const segLen = tent.isLong ? 2.0 : 1.7;
      const flareX = tent.u * flareMult * frac;
      const targetX = prev.x + flareX * 0.2 + forwardX * (-segLen * 0.3) + sway * 0.4 + fluidCurrent * 0.3;
      const targetY = prev.y + segLen;

      cur.x += (targetX - cur.x) * 12.0 * dt;
      cur.y += (targetY - cur.y) * 10.0 * dt;
    }

    // Render segments
    for (let j = 1; j < nodeCount; j++) {
      const n0 = tent.nodes[j - 1];
      const n1 = tent.nodes[j];
      const frac = j / nodeCount;

      const pulseSpeed = tent.isLong ? 7.0 : 5.0;
      const pulseWave = Math.sin(j * 0.5 - t * pulseSpeed + tent.phase);
      const pulseVal = Math.max(0, pulseWave);

      let brightness = (1.0 - frac * 0.5) * 0.35 + pulseVal * 0.65;
      if (tent.isLong) brightness = Math.min(1.0, brightness * 1.3 + alarmPulse * 0.5);

      const hue = baseHue + pulseVal * 0.06;
      const col = hsv(hue, 0.85, brightness * brightness);

      drawLine(n0.x | 0, n0.y | 0, n1.x | 0, n1.y | 0, col);

      if (tent.isLong && j % 3 === 0 && pulseVal > 0.35) {
        setPixel((n1.x + 1) | 0, n1.y | 0, hsv(hue + 0.04, 0.4, pulseVal * pulseVal));
      }
    }
  }

  // --- Background Secondary Organisms: Drifting Ctenophores ---
  for (let c = 0; c < ctenophores.length; c++) {
    const ct = ctenophores[c];
    ct.x += ct.vx * dt + Math.sin(t * 0.6 + ct.phase) * 0.5 * dt;
    ct.y += ct.vy * dt;

    if (ct.x < -4) ct.x = WIDTH + 4;
    if (ct.x > WIDTH + 4) ct.x = -4;
    if (ct.y < -4) ct.y = HEIGHT + 4;
    if (ct.y > HEIGHT + 4) ct.y = -4;

    const cx = ct.x | 0;
    const cy = ct.y | 0;
    const r = ct.r;

    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const d2 = (dx * dx) / (r * r) + (dy * dy) / ((r * 1.3) * (r * 1.3));
        if (d2 <= 1.0) {
          const combPhase = (dx * 0.5 + dy * 0.8 - t * 4.0);
          const rainbowHue = fract(0.3 + combPhase * 0.2);
          const shimmer = Math.pow(Math.max(0, Math.sin(combPhase)), 2);
          const ctVal = (0.15 + shimmer * 0.7) * (1.0 - d2 * 0.5);
          setPixel(cx + dx, cy + dy, hsv(rainbowHue, 0.65, ctVal * ctVal));
        }
      }
    }
  }

  // --- Marine Snow ---
  for (let i = 0; i < snow.length; i++) {
    const s = snow[i];
    s.y += s.vy * dt;
    s.x += Math.sin(t * 0.6 + s.phase) * 0.8 * dt;

    if (s.y >= HEIGHT) { s.y = 0; s.x = Math.random() * WIDTH; }
    if (s.x < 0) s.x = WIDTH - 1;
    if (s.x >= WIDTH) s.x = 0;

    const xi = s.x | 0;
    const yi = s.y | 0;
    const dist = Math.hypot(s.x - bx, s.y - by);
    const near = Math.max(0, 1 - dist / 24);
    const twinkle = 0.5 + 0.5 * Math.sin(t * 3.5 + s.phase);
    const val = (s.baseVal + near * 0.5 + alarmPulse * 0.3) * twinkle;

    setPixel(xi, yi, hsv(0.57, 0.35, val * val));
  }
}
