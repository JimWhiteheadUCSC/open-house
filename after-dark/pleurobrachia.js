/*@vfx
id: e8cd39e9-104d-4977-b109-432dbfcef6ca
title: Pleurobrachia
created: 2026-10-11
artist: Kento (apprentice name)
influences: []
rationale: |
  A solitary sea gooseberry (Pleurobrachia pileus) drifting through the
  bathypelagic dark. Eight meridional comb rows (ctenes) beat in metachronal
  waves, refracting light into running rainbow diffraction bands across a
  translucent gelatinous bell. Two long tentacles fringed with delicate
  lateral tentilla trail in pelagic fluid currents, animated via Verlet-style
  link relaxation, fluid drag, and drifting microcurrent turbulence.
  Bioluminescence responds to touch and sound: beats pulse photocytes along
  the meridians, while holding the button triggers defensive contraction
  and a statocyst alarm flash.
@vfx*/

const meta = { name: "pleurobrachia", fps: 30, inputs: ["audio", "button", "clock"] };

const TENTACLE_SEGS = 24;
let t1 = [], t2 = [];
let snow = [];
let sparks = [];
let flashEnergy = 0;
let lastHeldSeconds = 0;

function setup() {
  t1 = [];
  t2 = [];
  for (let i = 0; i < TENTACLE_SEGS; i++) {
    t1.push({ x: 32, y: 30 + i * 1.5, vx: 0, vy: 0 });
    t2.push({ x: 32, y: 30 + i * 1.5, vx: 0, vy: 0 });
  }
  snow = [];
  for (let i = 0; i < 24; i++) {
    snow.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      s: 0.8 + Math.random() * 1.6,
      b: 0.10 + Math.random() * 0.20,
      phase: Math.random() * Math.PI * 2
    });
  }
  sparks = [];
  flashEnergy = 0;
}
setup();

function addPixel(x, y, r, g, b) {
  if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
  const cur = getPixel(x, y);
  const cr = (cur >> 16) & 255;
  const cg = (cur >> 8) & 255;
  const cb = cur & 255;
  const nr = cr + r;
  const ng = cg + g;
  const nb = cb + b;
  setPixel(x, y, rgb(nr > 255 ? 255 : nr, ng > 255 ? 255 : ng, nb > 255 ? 255 : nb));
}

function splat(px, py, r, g, b) {
  const x0 = Math.floor(px), y0 = Math.floor(py);
  const fx = px - x0, fy = py - y0;
  const w00 = (1 - fx) * (1 - fy);
  const w10 = fx * (1 - fy);
  const w01 = (1 - fx) * fy;
  const w11 = fx * fy;
  addPixel(x0, y0, (r * w00) | 0, (g * w00) | 0, (b * w00) | 0);
  addPixel(x0 + 1, y0, (r * w10) | 0, (g * w10) | 0, (b * w10) | 0);
  addPixel(x0, y0 + 1, (r * w01) | 0, (g * w01) | 0, (b * w01) | 0);
  addPixel(x0 + 1, y0 + 1, (r * w11) | 0, (g * w11) | 0, (b * w11) | 0);
}

function render(t, dt) {
  const audioOk = input && input.audio && input.audio.ok;
  const audioLevel = audioOk ? input.audio.level : 0;
  const audioBass = audioOk ? input.audio.bass : 0;
  const audioBeat = audioOk ? input.audio.beat : false;

  const btnDown = input && input.button && input.button.down;
  const btnReleased = input && input.button && input.button.released;
  const daylight = input && input.clock ? input.clock.daylight : 0.5;

  if (btnDown && input.button) lastHeldSeconds = input.button.heldSeconds;

  // Reactivity: beats and touches generate luminescence
  if (audioBeat) {
    flashEnergy = Math.min(flashEnergy + 0.5, 1.2);
    for (let i = 0; i < 4; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 6 + Math.random() * 12;
      sparks.push({
        x: 32 + (Math.random() - 0.5) * 12,
        y: 28 + (Math.random() - 0.5) * 16,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        life: 1.0,
        hue: 0.48 + Math.random() * 0.1
      });
    }
  }

  if (btnDown) {
    flashEnergy = Math.min(flashEnergy + dt * 1.8, 1.5);
  }
  if (btnReleased) {
    flashEnergy = Math.min(flashEnergy + 0.6, 1.5);
    lastHeldSeconds = 0;
  }
  if (flashEnergy > 0) {
    flashEnergy = Math.max(0, flashEnergy - dt * 1.2);
  }

  // Smooth trail persistence
  fade(0.85);

  // Abyss ambient tint
  const bgBlue = lerp(1, 5, daylight);
  const bgGreen = lerp(0, 2, daylight);
  if (bgBlue > 0) {
    const bgCol = rgb(0, bgGreen | 0, bgBlue | 0);
    for (let y = 0; y < HEIGHT; y += 4) {
      for (let x = 0; x < WIDTH; x += 4) {
        if (getPixel(x, y) === 0) setPixel(x, y, bgCol);
      }
    }
  }

  // Pelagic trajectory: slow, multi-harmonic wandering
  const cx = 32 + 15 * Math.sin(t * 0.083) + 7 * Math.sin(t * 0.179);
  const cy = 25 + 10 * Math.sin(t * 0.067 + 1.1) + 4 * Math.cos(t * 0.123);
  const yaw = t * 0.28 + 0.35 * Math.sin(t * 0.091);
  const tilt = 0.28 * Math.sin(t * 0.107) + 0.14 * Math.sin(t * 0.223);

  const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
  const cosT = Math.cos(tilt), sinT = Math.sin(tilt);

  // Marine snow motes drifting through water column
  for (const m of snow) {
    m.y += m.s * dt;
    m.x += noise2(m.x * 0.04, m.y * 0.04 + t * 0.05) * 3.5 * dt;
    if (m.y >= HEIGHT) { m.y = 0; m.x = Math.random() * WIDTH; }
    if (m.x < 0) m.x = WIDTH - 1;
    if (m.x >= WIDTH) m.x = 0;
    const flicker = 0.5 + 0.5 * Math.sin(t * 1.6 + m.phase);
    const val = m.b * flicker * flicker;
    const c = hsv(0.58, 0.4, val);
    const cr = (c >> 16) & 255, cg = (c >> 8) & 255, cb = c & 255;
    addPixel(m.x | 0, m.y | 0, cr, cg, cb);
  }

  // Bioluminescent sparks from beats
  sparks = sparks.filter(s => s.life > 0);
  for (const s of sparks) {
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vx *= 0.92;
    s.vy *= 0.92;
    s.life -= dt * 1.3;
    if (s.life > 0) {
      const bCol = hsv(s.hue, 0.5, s.life * s.life * 0.8);
      const cr = (bCol >> 16) & 255, cg = (bCol >> 8) & 255, cb = bCol & 255;
      splat(s.x, s.y, cr, cg, cb);
    }
  }

  const H = 22, R_MAX = 10.0;

  // Translucent mesoglea body volume
  for (let u = 0.15; u <= 0.85; u += 0.08) {
    const rLayer = R_MAX * Math.pow(Math.sin(u * Math.PI), 0.62) * (1 - 0.12 * u) * 0.72;
    const yLocal = (u - 0.48) * H;
    const steps = 10;
    for (let s = 0; s < steps; s++) {
      const a = (s / steps) * Math.PI * 2;
      const x0 = rLayer * Math.cos(a), z0 = rLayer * Math.sin(a);
      const x1 = x0 * cosY + z0 * sinY;
      const z1 = -x0 * sinY + z0 * cosY;
      const y1 = yLocal;
      const x2 = x1 * cosT - y1 * sinT;
      const y2 = x1 * sinT + y1 * cosT;
      const px = cx + x2, py = cy + y2;
      const bodyC = hsv(0.55, 0.75, 0.05 + 0.04 * flashEnergy);
      splat(px, py, (bodyC >> 16) & 255, (bodyC >> 8) & 255, bodyC & 255);
    }
  }

  // Internal gastric cavity / infundibulum glow
  const corePulse = (0.35 + 0.2 * Math.sin(t * 1.5) + audioLevel * 0.35 + flashEnergy * 0.4);
  for (let u = 0.15; u <= 0.85; u += 0.05) {
    const yLocal = (u - 0.48) * H;
    const px = cx - yLocal * sinT;
    const py = cy + yLocal * cosT;
    const coreC = hsv(0.52, 0.65, corePulse * (1 - Math.abs(u - 0.48) * 1.5));
    const cr = (coreC >> 16) & 255, cg = (coreC >> 8) & 255, cb = coreC & 255;
    splat(px, py, (cr * 0.45) | 0, (cg * 0.45) | 0, (cb * 0.45) | 0);
  }

  // Apical organ (statocyst) at the aboral pole
  const aboralY = -0.48 * H;
  const apoX = cx - aboralY * sinT;
  const apoY = cy + aboralY * cosT;
  const apoSpark = 0.65 + 0.25 * Math.sin(t * 4.5) + flashEnergy * 0.5;
  const apoC = hsv(0.48, 0.25, Math.min(1, apoSpark));
  splat(apoX, apoY, (apoC >> 16) & 255, (apoC >> 8) & 255, apoC & 255);

  // 8 Comb Rows (ciliary meridians) with metachronal wave & diffraction
  const waveSpeed = 4.8 + audioBass * 4.0;
  for (let k = 0; k < 8; k++) {
    const phi = k * (Math.PI / 4);
    const cosP = Math.cos(phi), sinP = Math.sin(phi);

    for (let u = 0.08; u <= 0.92; u += 0.035) {
      const rProfile = R_MAX * Math.pow(Math.sin(u * Math.PI), 0.62) * (1 - 0.12 * u);
      const x0 = rProfile * cosP;
      const z0 = rProfile * sinP;
      const y0 = (u - 0.48) * H;

      const x1 = x0 * cosY + z0 * sinY;
      const z1 = -x0 * sinY + z0 * cosY;
      const y1 = y0;

      const x2 = x1 * cosT - y1 * sinT;
      const y2 = x1 * sinT + y1 * cosT;
      const z2 = z1;

      const px = cx + x2;
      const py = cy + y2;

      // Metachronal wave propagating aboral -> oral
      const wavePhase = u * 9.5 - t * waveSpeed + k * 0.38;
      let wave = Math.cos(wavePhase);
      wave = wave > 0 ? Math.pow(wave, 3.0) : 0;

      const depthNorm = z2 / R_MAX; // -1 (far) to +1 (near)
      let intensity, sat, hue;

      if (depthNorm >= 0) {
        // Front hemisphere: diffraction iridescence
        intensity = 0.18 + 0.42 * depthNorm + wave * 0.65 + flashEnergy * 0.5;
        // Hue shifts along spectral diffraction: emerald, cyan, azure, violet
        hue = fract(0.52 + 0.18 * Math.sin(wavePhase * 0.6 + t * 0.25 + k * 0.15));
        sat = 0.8 - 0.25 * wave;
      } else {
        // Back hemisphere: translucent oceanic body pass-through
        intensity = (0.08 + 0.14 * (1 + depthNorm) + wave * 0.15 + flashEnergy * 0.2) * 0.4;
        hue = 0.62 + 0.04 * depthNorm;
        sat = 0.88;
      }

      intensity = clamp(intensity, 0, 1);
      const col = hsv(hue, sat, intensity * intensity);
      const cr = (col >> 16) & 255, cg = (col >> 8) & 255, cb = col & 255;
      splat(px, py, cr, cg, cb);
    }
  }

  // Tentacle base anchors (tentacle sheaths at u = 0.62)
  const uAnc = 0.62;
  const rAnc = R_MAX * Math.pow(Math.sin(uAnc * Math.PI), 0.62) * (1 - 0.12 * uAnc);
  const yAnc0 = (uAnc - 0.48) * H;

  function getAnchor(phi) {
    const x0 = rAnc * Math.cos(phi), z0 = rAnc * Math.sin(phi);
    const x1 = x0 * cosY + z0 * sinY;
    const y1 = yAnc0;
    return { x: cx + (x1 * cosT - y1 * sinT), y: cy + (x1 * sinT + y1 * cosT) };
  }

  const anc1 = getAnchor(Math.PI * 0.5);
  const anc2 = getAnchor(Math.PI * 1.5);

  function updateTentacle(tList, anc, dirSign) {
    tList[0].x = anc.x;
    tList[0].y = anc.y;

    const targetDist = btnDown ? 0.9 : 1.7;

    for (let i = 1; i < tList.length; i++) {
      const seg = tList[i];
      const prev = tList[i - 1];

      // Pelagic fluid drag and ambient microcurrents
      seg.vy += (4.2 + (btnDown ? -1.8 : 0)) * dt;
      const nDrift = noise2(seg.x * 0.05 + t * 0.08, seg.y * 0.05 + dirSign * 2.0) * 8.0;
      seg.vx += nDrift * dt;

      seg.vx *= 0.89;
      seg.vy *= 0.89;
      seg.x += seg.vx * dt;
      seg.y += seg.vy * dt;

      // Distance constraint
      const dx = seg.x - prev.x, dy = seg.y - prev.y;
      const d = Math.hypot(dx, dy);
      if (d > targetDist && d > 0.0001) {
        const factor = (d - targetDist) / d;
        seg.x -= dx * factor * 0.72;
        seg.y -= dy * factor * 0.72;
      }

      // Draw tentacle segment
      const progress = i / tList.length;
      const brightness = (1 - progress * 0.55) * 0.5 + flashEnergy * 0.3;
      const tHue = 0.50 + 0.07 * progress;
      const tCol = hsv(tHue, 0.7, brightness * brightness);
      splat(seg.x, seg.y, (tCol >> 16) & 255, (tCol >> 8) & 255, tCol & 255);

      // Lateral tentilla
      if (i > 3 && i % 2 === 0) {
        const curlPhase = t * 1.8 + i * 0.4 + dirSign;
        const branchLen = (2.4 + 1.2 * Math.sin(curlPhase)) * (btnDown ? 0.5 : 1.0);
        const bx = seg.x + dirSign * branchLen * Math.cos(curlPhase * 0.7);
        const by = seg.y + branchLen * 0.5 * Math.sin(curlPhase);
        const bCol = hsv(0.53, 0.55, brightness * 0.3);
        splat(bx, by, (bCol >> 16) & 255, (bCol >> 8) & 255, bCol & 255);
      }
    }
  }

  updateTentacle(t1, anc1, -1);
  updateTentacle(t2, anc2, 1);
}
