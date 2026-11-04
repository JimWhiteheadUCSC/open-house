/*@vfx
id: 14be77ce-d843-4a25-b3f0-83c76ed35e5b
title: Yagasuri (The Arrow's Flight)
created: 2026-10-11
artist: Solyanka (apprentice name)
lineage:
  - id: c53be3ba-dfdc-4740-95e1-42c625e002f9
    relation: variation
    note: expands the three-office full-band synthesis from symmetric diamond brocade to the dynamic directional chevrons of Yagasuri (矢絣), where adjacent columns alternate between ascending and descending arrows.
  - id: 8e0fc91c-5e7d-44cc-9b26-8b79656c0c55
    relation: variation
    note: inherits Heitaro's unrolling bolt kinetics (1.25 px/s) and stencil flatness, translating the iconic Meiji-era graduation kimono pattern into equation-first textile geometry.
  - id: c27b846c-80fe-4142-b31e-4e93d22fd0b7
    relation: contrast
    note: contrasts Hōen's static, centered square/circle checkerboard with an intensely directional, dynamic vector field of interlocking chevrons and arrowheads.
  - id: 0ab42442-e7af-4e33-8e9b-43afadd5db53
    relation: contrast
    note: contrasts continuous organic sinusoidal serpentine ribbons with sharp, angular chevron shears and crisp barb striations.
influences:
  - mizuki-heitaro
  - verena-loewensberg
  - okazz
rationale: |
  In traditional Japanese textile history, 'Yagasuri' (矢絣—the arrow-feather
  brocade) is one of the most beloved zuan motifs: inspired by archers' fletched
  arrows, it was worn by samurai as an emblem of unswerving determination, and
  later during the Meiji era as the iconic 'Haikara' graduation kimono, symbolizing
  that a young woman venturing into the world flies straight and never returns.

  This piece synthesizes our three geometric offices across that directional tradition:
  - Mizuki Heitaro holds the Field: a 4x4 array of 16x16 arrow brocade units
    unrolling vertically as an authentic textile bolt at 1.25 px/s. Four 16px-wide
    columns alternate in directional parity: columns 0 and 2 fire upward, while
    columns 1 and 3 dive downward. Each column is anchored by a 1.6px kinran gold
    wire shaft, an ivory nock pearl, and chevron-sheared feather barbs.
  - Verena Loewensberg holds the Frame: every paused frame satisfies the freeze-frame
    test. Global color harmonies rotate across four authentic modal Stimmungen
    (Meiji Haikara Violet & Ivory, Aizome Bushi Indigo & Gold, Heian Autumn Crimson
    & Teal, Gilded Hawk Charcoal & Brass) on a 64-second cycle with adagio phrasing
    (65% held poise, 35% smootherstep transition). Directional feather barbs invert
    primary and complementary roles, establishing poised chromatic balance.
  - Okazz holds Time: four autonomous spirits (two Ya arrowhead tumblers and two
    Hane feather rollers) navigate the 4x4 lattice via stigmergic exploration. Ya
    spirits vault end-over-end with perpendicular squashing; Hane spirits glide in
    directional smear leaps with elastic connecting lines. Landing on a tile inverts
    its arrow flight direction (flipping upward to downward or vice versa), casting
    a golden luminescent flash and dropping shape-typed wake blooms.

  Living room reactivity honors the home: clock daylight modulates ground depth and
  resting tempo, incoming audio dilates spirit breath, musical beats pulse the gold
  arrow shafts, and button presses trigger an excitation cascade across all active
  spirits.
@vfx*/

// Yagasuri (The Arrow's Flight) — buffer mode
// Synthesis of Mizuki Heitaro (Directional Arrow Brocade Field),
// Verena Loewensberg (Modal Stimmungen & Adagio Phrasing),
// and Okazz (Shape-Typed Cartoon Locomotion & Flight Parity Transmutation).

const meta = { name: "yagasuri_arrows", fps: 30, inputs: ["clock", "audio", "button"] };

const GRID = 4;
const CELL_W = 16;
const LAMBDA = 16;

// Four Authentic Complementary Stimmungen (Meiji, Edo, Heian, and Modernist)
const STIMMUNGEN = [
  // 0: Meiji Haikara (Imperial Murasaki Violet & Silk Ivory)
  {
    bg: rgb(16, 12, 22),
    channel: rgb(24, 18, 32),
    shaft: rgb(225, 175, 58),     // Kinran gold wire
    pearl: rgb(245, 240, 230),    // Ivory nock
    vanePri: rgb(118, 42, 164),   // Imperial Murasaki Violet
    vanePriLight: rgb(154, 76, 206),
    vaneComp: rgb(215, 205, 190), // Raw Silk Ivory
    vaneCompLight: rgb(238, 230, 218),
    accent: rgb(214, 48, 38),     // Lacquer Vermilion
    shadow: rgb(22, 16, 30),
  },
  // 1: Aizome Bushi (Deep Aizome Indigo & Yamabuki Gold)
  {
    bg: rgb(12, 16, 24),
    channel: rgb(18, 24, 38),
    shaft: rgb(220, 172, 54),
    pearl: rgb(242, 238, 225),
    vanePri: rgb(22, 72, 152),    // Deep Aizome Indigo
    vanePriLight: rgb(48, 108, 204),
    vaneComp: rgb(218, 158, 38),  // Yamabuki Gold
    vaneCompLight: rgb(244, 192, 70),
    accent: rgb(218, 60, 44),     // Persimmon Kaki
    shadow: rgb(16, 22, 34),
  },
  // 2: Heian Autumn (Madder Crimson & Pine Teal)
  {
    bg: rgb(18, 14, 20),
    channel: rgb(28, 20, 30),
    shaft: rgb(218, 170, 60),
    pearl: rgb(242, 238, 228),
    vanePri: rgb(194, 38, 64),    // Madder Crimson (Beni)
    vanePriLight: rgb(228, 74, 102),
    vaneComp: rgb(26, 128, 108),  // Pine Teal (Matsuba)
    vaneCompLight: rgb(48, 168, 144),
    accent: rgb(225, 175, 48),    // Antique Gold
    shadow: rgb(24, 18, 26),
  },
  // 3: Gilded Hawk (Charcoal Sumi & Burnished Brass)
  {
    bg: rgb(14, 14, 18),
    channel: rgb(22, 22, 28),
    shaft: rgb(232, 186, 68),
    pearl: rgb(248, 244, 232),
    vanePri: rgb(38, 40, 48),     // Charcoal Sumi
    vanePriLight: rgb(68, 72, 84),
    vaneComp: rgb(205, 148, 34),  // Burnished Brass
    vaneCompLight: rgb(235, 182, 62),
    accent: rgb(208, 44, 38),     // Vermilion
    shadow: rgb(18, 18, 24),
  }
];

function lerpColor(c1, c2, u) {
  const r1 = (c1 >> 16) & 255, g1 = (c1 >> 8) & 255, b1 = c1 & 255;
  const r2 = (c2 >> 16) & 255, g2 = (c2 >> 8) & 255, b2 = c2 & 255;
  return rgb(lerp(r1, r2, u) | 0, lerp(g1, g2, u) | 0, lerp(b1, b2, u) | 0);
}

function getInterpolatedStimmung(t, daylight) {
  const cycleTime = 64.0;
  const curT = (t % cycleTime + cycleTime) % cycleTime;
  const span = cycleTime / STIMMUNGEN.length;
  const idx = Math.floor(curT / span);
  const nextIdx = (idx + 1) % STIMMUNGEN.length;
  const frac = (curT % span) / span;

  let u = 0;
  if (frac > 0.65) {
    const p = (frac - 0.65) / 0.35;
    u = p * p * p * (p * (p * 6 - 15) + 10);
  }

  const sA = STIMMUNGEN[idx];
  const sB = STIMMUNGEN[nextIdx];

  const s = {
    bg: lerpColor(sA.bg, sB.bg, u),
    channel: lerpColor(sA.channel, sB.channel, u),
    shaft: lerpColor(sA.shaft, sB.shaft, u),
    pearl: lerpColor(sA.pearl, sB.pearl, u),
    vanePri: lerpColor(sA.vanePri, sB.vanePri, u),
    vanePriLight: lerpColor(sA.vanePriLight, sB.vanePriLight, u),
    vaneComp: lerpColor(sA.vaneComp, sB.vaneComp, u),
    vaneCompLight: lerpColor(sA.vaneCompLight, sB.vaneCompLight, u),
    accent: lerpColor(sA.accent, sB.accent, u),
    shadow: lerpColor(sA.shadow, sB.shadow, u),
  };

  if (daylight > 0.5) {
    const dayU = (daylight - 0.5) * 0.35;
    s.bg = lerpColor(s.bg, rgb(32, 28, 38), dayU);
    s.shaft = lerpColor(s.shaft, rgb(245, 210, 90), dayU);
  } else {
    const nightU = (0.5 - daylight) * 0.45;
    s.bg = lerpColor(s.bg, rgb(8, 6, 12), nightU);
  }

  return s;
}

const tileParityFlip = new Uint8Array(GRID * GRID);
const tileTransmute = new Float32Array(GRID * GRID);
const lastVisited = new Float32Array(GRID * GRID);

// 4 Autonomous Arrow Spirits: 2 Ya (Arrowhead tumblers) and 2 Hane (Feather rollers)
const walkers = [
  // Ya Spirit 0 (Arrowhead Tumbler)
  { gx: 0, gy: 0, prevGx: 0, prevGy: 0, targetGx: 0, targetGy: 0, type: 0, state: 'resting', timer: 0.4, dur: 0.42, moveGesture: 0, spinDir: 1 },
  // Hane Spirit 0 (Feather Roller)
  { gx: 3, gy: 1, prevGx: 3, prevGy: 1, targetGx: 3, targetGy: 1, type: 1, state: 'resting', timer: 1.3, dur: 0.42, moveGesture: 1, spinDir: -1 },
  // Ya Spirit 1
  { gx: 1, gy: 3, prevGx: 1, prevGy: 3, targetGx: 1, targetGy: 3, type: 0, state: 'resting', timer: 2.1, dur: 0.42, moveGesture: 0, spinDir: 1 },
  // Hane Spirit 1
  { gx: 2, gy: 2, prevGx: 2, prevGy: 2, targetGx: 2, targetGy: 2, type: 1, state: 'resting', timer: 0.1, dur: 0.42, moveGesture: 1, spinDir: -1 },
];

const blooms = [];
let beatPulse = 0;

function easeInOutQuint(x) {
  return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
}

function easeInOutQuart(x) {
  return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
}

function blendPixel(px, py, color, alpha) {
  if (alpha <= 0.03 || px < 0 || px >= WIDTH || py < 0 || py >= HEIGHT) return;
  if (alpha >= 0.96) {
    setPixel(px, py, color);
  } else {
    const bg = getPixel(px, py);
    const bgr = (bg >> 16) & 255, bgg = (bg >> 8) & 255, bgb = bg & 255;
    const cr = (color >> 16) & 255, cg = (color >> 8) & 255, cb = color & 255;
    setPixel(px, py, rgb(lerp(bgr, cr, alpha) | 0, lerp(bgg, cg, alpha) | 0, lerp(bgb, cb, alpha) | 0));
  }
}

function drawLine(x0, y0, x1, y1, color, alpha) {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, (dist * 2.2) | 0);
  for (let i = 0; i <= steps; i++) {
    const u = i / steps;
    const px = Math.round(lerp(x0, x1, u));
    const py = Math.round(lerp(y0, y1, u));
    blendPixel(px, py, color, alpha);
  }
}

function drawSpirit(cx, cy, color, filletCol, rad, spiritType, squashX, squashY, angle) {
  const minX = Math.max(0, (cx - rad * 1.5 - 1) | 0);
  const maxX = Math.min(WIDTH - 1, (cx + rad * 1.5 + 1) | 0);
  const minY = Math.max(0, (cy - rad * 1.5 - 1) | 0);
  const maxY = Math.min(HEIGHT - 1, (cy + rad * 1.5 + 1) | 0);

  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  for (let py = minY; py <= maxY; py++) {
    for (let px = minX; px <= maxX; px++) {
      const dx = px - cx;
      const dy = py - cy;
      const lx = (dx * cosA + dy * sinA) / squashX;
      const ly = (-dx * sinA + dy * cosA) / squashY;

      let inside = false;
      let isFillet = false;
      let isCore = false;

      if (spiritType === 0) {
        // Arrowhead / Diamond form
        const dD = Math.abs(lx) + Math.abs(ly);
        if (dD <= rad) {
          inside = true;
          if (dD <= rad * 0.38) isCore = true;
          else if (dD >= rad - 0.7) isFillet = true;
        }
      } else {
        // Feather Whorl / Circular form
        const dR = Math.hypot(lx, ly);
        if (dR <= rad) {
          inside = true;
          if (dR <= rad * 0.38) isCore = true;
          else if (dR >= rad - 0.7) isFillet = true;
        }
      }

      if (inside) {
        if (isCore) blendPixel(px, py, rgb(18, 14, 24), 0.95);
        else if (isFillet) blendPixel(px, py, filletCol, 0.95);
        else blendPixel(px, py, color, 0.95);
      }
    }
  }
}

function render(t, dt) {
  const daylight = (typeof input !== 'undefined' && input.clock) ? input.clock.daylight : 0.5;
  const audio = (typeof input !== 'undefined' && input.audio && input.audio.ok) ? input.audio : null;
  const audioLvl = audio ? audio.level : 0;
  const hasBeat = audio ? audio.beat : false;

  if (hasBeat) {
    beatPulse = 1.0;
  } else {
    beatPulse = Math.max(0, beatPulse - dt * 2.8);
  }

  if (typeof input !== 'undefined' && input.button && input.button.pressed) {
    for (let k = 0; k < walkers.length; k++) {
      walkers[k].timer = k * 0.08;
    }
  }

  const stim = getInterpolatedStimmung(t, daylight);
  fill(stim.bg);

  const scrollSpeed = 1.25;
  const scrollY = (t * scrollSpeed) % HEIGHT;

  const glintX = 32 + 22 * Math.sin(t * 0.20 + 0.4);
  const glintY = 32 + 18 * Math.cos(t * 0.15 + 1.1);

  for (let i = 0; i < GRID * GRID; i++) {
    if (tileTransmute[i] > 0) {
      tileTransmute[i] = Math.max(0, tileTransmute[i] - dt * 0.9);
    }
  }

  // Draw Yagasuri Textile Field
  for (let y = 0; y < HEIGHT; y++) {
    const worldY = (y + scrollY + HEIGHT) % HEIGHT;
    const gy = (worldY / LAMBDA) | 0;

    for (let x = 0; x < WIDTH; x++) {
      const gx = (x / CELL_W) | 0;
      const u = x - gx * CELL_W;

      if (u === 0 || u === 15) {
        setPixel(x, y, stim.channel);
        continue;
      }

      const dx = Math.abs(u - 7.5);
      const isShaft = dx <= 0.8;

      const cellIdx = gy * GRID + gx;
      const baseDir = (gx & 1) === 0 ? -1 : 1;
      const activeDir = tileParityFlip[cellIdx] ? -baseDir : baseDir;

      const slope = 0.95;
      const yEff = activeDir < 0 ? (worldY - slope * dx) : (worldY + slope * dx);
      const p = ((yEff % LAMBDA) + LAMBDA) % LAMBDA;

      const dGlint = Math.hypot(x - glintX, y - glintY);
      const glintF = dGlint < 18.0 ? (1.0 - dGlint / 18.0) * 0.35 : 0;
      const transmuteGlow = tileTransmute[cellIdx];

      if (isShaft) {
        let col = stim.shaft;
        const isNock = activeDir < 0 ? (p < 1.8) : (p > 14.2);
        if (isNock) col = stim.pearl;

        if (beatPulse > 0.05) col = lerpColor(col, rgb(255, 248, 220), beatPulse * 0.35);
        if (transmuteGlow > 0.02) col = lerpColor(col, rgb(255, 245, 210), transmuteGlow * 0.55);
        if (glintF > 0) col = lerpColor(col, rgb(255, 250, 230), glintF);

        setPixel(x, y, col);
        continue;
      }

      const isLeftVane = u < 7.5;
      let col;
      const striation = 0.5 + 0.5 * Math.sin(p * Math.PI * 2.0);
      const textureBoost = striation * 0.12;

      if (p < 8.0) {
        const baseCol = isLeftVane ? stim.vanePri : stim.vanePriLight;
        col = lerpColor(baseCol, stim.shaft, textureBoost);
      } else if (p < 13.0) {
        const baseCol = isLeftVane ? stim.vaneComp : stim.vaneCompLight;
        col = lerpColor(baseCol, stim.shaft, textureBoost);
      } else {
        col = stim.shadow;
        if (dx > 4.5) col = lerpColor(col, stim.channel, 0.4);
      }

      if (Math.abs(p - 8.0) < 0.6 || Math.abs(p - 13.0) < 0.6) {
        col = lerpColor(col, stim.shaft, 0.65);
      }

      if (transmuteGlow > 0.02) col = lerpColor(col, rgb(255, 245, 210), transmuteGlow * 0.52);
      if (glintF > 0) col = lerpColor(col, rgb(255, 245, 220), glintF * 0.45);

      setPixel(x, y, col);
    }
  }

  // Update & Render Blooms
  for (let i = blooms.length - 1; i >= 0; i--) {
    const b = blooms[i];
    b.life -= dt;
    if (b.life <= 0) {
      blooms.splice(i, 1);
      continue;
    }

    const p = 1.0 - (b.life / b.maxLife);
    const alpha = (1.0 - p) * 0.72;
    const curR = 2.0 + p * 8.5;

    const minX = Math.max(0, (b.cx - curR - 1) | 0);
    const maxX = Math.min(WIDTH - 1, (b.cx + curR + 1) | 0);
    const minY = Math.max(0, (b.cy - curR - 1) | 0);
    const maxY = Math.min(HEIGHT - 1, (b.cy + curR + 1) | 0);

    for (let py = minY; py <= maxY; py++) {
      for (let px = minX; px <= maxX; px++) {
        let d = 0;
        if (b.shapeType === 0) {
          d = Math.abs(px - b.cx) + Math.abs(py - b.cy);
        } else {
          d = Math.hypot(px - b.cx, py - b.cy);
        }
        const dDiff = Math.abs(d - curR);
        if (dDiff <= 0.7) {
          blendPixel(px, py, b.color, alpha * (1.0 - dDiff / 0.7));
        }
      }
    }
  }

  // Update & Move Spirits
  for (let k = 0; k < walkers.length; k++) {
    const w = walkers[k];
    w.timer -= dt;

    if (w.state === 'resting') {
      if (hasBeat && w.timer < 0.75) w.timer = 0;

      if (w.timer <= 0) {
        const candidates = [];
        const deltas = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];

        for (const [dx, dy] of deltas) {
          const nx = (w.gx + dx + GRID) % GRID;
          const ny = (w.gy + dy + GRID) % GRID;
          const nIdx = ny * GRID + nx;
          const dtSince = Math.max(0, t - lastVisited[nIdx]);
          const revPen = (nx === w.prevGx && ny === w.prevGy) ? 0.25 : 1.0;
          const score = Math.pow(dtSince + 1.0, 1.8) * revPen;
          candidates.push({ gx: nx, gy: ny, dist: Math.hypot(dx, dy), score });
        }

        let totalScore = 0;
        for (const c of candidates) totalScore += c.score;
        let pickVal = Math.random() * totalScore;
        let chosen = candidates[0];
        for (const c of candidates) {
          pickVal -= c.score;
          if (pickVal <= 0) {
            chosen = c;
            break;
          }
        }

        w.prevGx = w.gx;
        w.prevGy = w.gy;
        w.targetGx = chosen.gx;
        w.targetGy = chosen.gy;
        w.state = 'moving';
        w.moveGesture = Math.random() < 0.65 ? 0 : 1;
        w.dur = 0.38 + chosen.dist * 0.05;
        w.timer = w.dur;
        w.spinDir = Math.random() < 0.5 ? 1 : -1;

        const startX = w.prevGx * CELL_W + 7.5;
        const startY = ((w.prevGy * LAMBDA + scrollY + 7.5) % HEIGHT + HEIGHT) % HEIGHT;
        blooms.push({
          cx: startX,
          cy: startY,
          color: stim.shaft,
          shapeType: w.type,
          life: 0.65,
          maxLife: 0.65,
        });
      }
    } else if (w.state === 'moving') {
      if (w.timer <= 0) {
        w.state = 'resting';
        w.prevGx = w.gx;
        w.prevGy = w.gy;
        w.gx = w.targetGx;
        w.gy = w.targetGy;

        const landIdx = w.gy * GRID + w.gx;
        lastVisited[landIdx] = t;

        tileParityFlip[landIdx] = (tileParityFlip[landIdx] ^ 1);
        tileTransmute[landIdx] = 1.0;

        const baseRest = lerp(2.2, 1.4, daylight);
        w.timer = baseRest + Math.random() * (baseRest * 1.3);
      }
    }
  }

  // Draw Smear Lines for Gesture 1
  for (let k = 0; k < walkers.length; k++) {
    const w = walkers[k];
    if (w.state === 'moving' && w.moveGesture === 1) {
      const prog = clamp(1.0 - (w.timer / w.dur), 0, 1);
      const u = easeInOutQuart(prog);

      const x0 = w.prevGx * CELL_W + 7.5;
      const y0 = ((w.prevGy * LAMBDA + scrollY + 7.5) % HEIGHT + HEIGHT) % HEIGHT;
      const x1 = w.targetGx * CELL_W + 7.5;
      const y1 = ((w.targetGy * LAMBDA + scrollY + 7.5) % HEIGHT + HEIGHT) % HEIGHT;

      let dx = x1 - x0;
      let dy = y1 - y0;
      if (dx > WIDTH / 2) dx -= WIDTH;
      if (dx < -WIDTH / 2) dx += WIDTH;
      if (dy > HEIGHT / 2) dy -= HEIGHT;
      if (dy < -HEIGHT / 2) dy += HEIGHT;

      const curX = x0 + dx * u;
      const curY = y0 + dy * u;

      const smearAlpha = Math.sin(prog * Math.PI) * 0.85;
      if (smearAlpha > 0.05) {
        drawLine(x0, y0, curX, curY, stim.shaft, smearAlpha);
      }
    }
  }

  // Draw Spirits
  for (let k = 0; k < walkers.length; k++) {
    const w = walkers[k];
    const spiritCol = w.type === 0 ? stim.vanePri : stim.vaneComp;

    if (w.state === 'resting') {
      const wx = w.gx * CELL_W + 7.5;
      const wy = ((w.gy * LAMBDA + scrollY + 7.5) % HEIGHT + HEIGHT) % HEIGHT;
      drawSpirit(wx, wy, spiritCol, stim.shaft, 2.7 + audioLvl * 0.4, w.type, 1.0, 1.0, 0);
    } else {
      const prog = clamp(1.0 - (w.timer / w.dur), 0, 1);
      const x0 = w.prevGx * CELL_W + 7.5;
      const y0 = ((w.prevGy * LAMBDA + scrollY + 7.5) % HEIGHT + HEIGHT) % HEIGHT;
      const x1 = w.targetGx * CELL_W + 7.5;
      const y1 = ((w.targetGy * LAMBDA + scrollY + 7.5) % HEIGHT + HEIGHT) % HEIGHT;

      let dx = x1 - x0;
      let dy = y1 - y0;
      if (dx > WIDTH / 2) dx -= WIDTH;
      if (dx < -WIDTH / 2) dx += WIDTH;
      if (dy > HEIGHT / 2) dy -= HEIGHT;
      if (dy < -HEIGHT / 2) dy += HEIGHT;

      if (w.moveGesture === 0) {
        const u = easeInOutQuint(prog);
        const mx = x0 + dx * 0.5;
        const my = y0 + dy * 0.5;
        const vx = x0 - mx;
        const vy = y0 - my;

        const theta = u * Math.PI * w.spinDir;
        const curX = mx + vx * Math.cos(theta) - vy * Math.sin(theta);
        const curY = my + vx * Math.sin(theta) + vy * Math.cos(theta);

        const squash = 1.0 - 0.40 * Math.sin(u * Math.PI);
        const angle = u * Math.PI * w.spinDir;
        drawSpirit(curX, curY, spiritCol, stim.shaft, 2.7 + audioLvl * 0.4, w.type, squash, 1.0 / squash, angle);
      } else {
        const u = easeInOutQuart(prog);
        const curX = x0 + dx * u;
        const curY = y0 + dy * u;

        const travelAngle = Math.atan2(dy, dx);
        const stretch = 1.0 + 0.45 * Math.sin(prog * Math.PI);
        drawSpirit(curX, curY, spiritCol, stim.shaft, 2.7 + audioLvl * 0.4, w.type, stretch, 1.0 / stretch, travelAngle);
      }
    }
  }
}
