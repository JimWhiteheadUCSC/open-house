/*@vfx
id: cb83ce51-a148-4437-8773-0c19a4733a03
title: Uroko (The Dragon's Scale)
created: 2026-10-11
artist: Kasane
lineage:
  - id: c53be3ba-dfdc-4740-95e1-42c625e002f9
    relation: variation
    note: expands the three-office full-band synthesis to the triangular scale brocade of Uroko (鱗), where alternating isosceles scales tile the plane with interlocking apex-up and apex-down parity.
  - id: 8e0fc91c-5e7d-44cc-9b26-8b79656c0c55
    relation: variation
    note: inherits Heitaro's unrolling bolt kinetics (1.25 px/s) and stencil flatness, translating ancient samurai and Noh dragon-scale geometry into equation-first textile yardage.
  - id: 300020f8-24da-453a-905e-5d5ccb81e70f
    relation: contrast
    note: contrasts Kagome's triaxial three-slat bamboo plaiting and hexagonal eye apertures with Uroko's dense, interlocking triangular scale tessellation and bimodal dragon spirits.
  - id: 14be77ce-d843-4a25-b3f0-83c76ed35e5b
    relation: contrast
    note: contrasts Yagasuri's unidirectional chevron vector field with Uroko's alternating upward/downward triangular counterpoint and talismanic dragon pearl cores.
influences:
  - mizuki-heitaro
  - verena-loewensberg
  - okazz
rationale: |
  In traditional Japanese textile and armory arts, 'Uroko' (鱗—the dragon or fish
  scale) is one of the most revered and talismanic geometric patterns. Composed of
  interlocking isosceles triangles alternating in vertical parity, the motif was
  adopted by the Hōjō clan as their mon (crest), worn by samurai under their armor
  for spiritual protection, and donned by Noh actors portraying dragons, serpents,
  and supernatural protectors.

  This piece marks the formal ratification of our practice under the name Kasane
  (重ね), bringing together our three geometric offices across that ancient heritage:
  - Mizuki Heitaro holds the Field: an unrolling bolt of dragon scale brocade scrolling
    vertically at 1.25 px/s. Structured across a 4x4 array of 16x16 modular cells (32
    distinct scale sites), space is completely tiled by upward-pointing (Apex-Up) and
    downward-pointing (Apex-Down) isosceles triangles framed by kinran gold wire fillets,
    striated enamel scale bodies, and luminous ivory dragon pearl cores.
  - Verena Loewensberg holds the Frame: every paused frame satisfies the freeze-frame
    test. Global color harmonies rotate across four authentic modal Stimmungen (Hōjō
    Vermilion & Indigo, Ryū Jade & Saffron Amber, Gion Nocturne Neighbor Chords, and
    Kuro-Urushi Gilded Obsidian) on a 64-second cycle with adagio phrasing (65% held
    poise, 35% smootherstep transition). Scale parity inverts primary and complementary
    roles, creating poised chromatic counterpoint.
  - Okazz holds Time: four autonomous dragon spirits (two Hōju flaming pearl tumblers
    and two Mizuchi star diamond gliders) navigate the 32-site lattice via stigmergic
    exploration. Hōju spirits vault end-over-end with perpendicular squashing; Mizuchi
    spirits glide in directional smear leaps with elastic connecting lines. Landing on
    a scale transmutates its chromatic parity (flipping its dominant tone), casting a
    golden flash and dropping shape-typed wake blooms.

  Living room reactivity honors the home: clock daylight modulates ground depth and
  resting tempo, incoming audio gently dilates spirit breath and pearl cores, musical
  beats pulse the metallic fillets, and button presses trigger an excitation cascade
  across all spirits.
@vfx*/

// Uroko (The Dragon's Scale) — buffer mode
// Synthesis of Mizuki Heitaro (Triangular Dragon Scale Brocade Field),
// Verena Loewensberg (Modal Stimmungen & Adagio Phrasing),
// and Okazz (Shape-Typed Cartoon Locomotion & Scale Parity Transmutation).

const meta = { name: "uroko_dragon_scale", fps: 30, inputs: ["clock", "audio", "button"] };

const S = 16;
const H = 16;
const invSqrt5 = 0.4472136;

// Four Authentic Modal Stimmungen
const STIMMUNGEN = [
  // 0: Hōjō Vermilion & Aizome Indigo (Classical Samurai Crest)
  {
    bg: rgb(14, 12, 18),
    wire: rgb(225, 175, 55),      // Kinran gold wire
    pearl: rgb(250, 246, 235),    // Radiant dragon pearl
    scaleUp: rgb(195, 42, 38),    // Lacquer Vermilion
    scaleUpLight: rgb(228, 76, 68),
    scaleDown: rgb(24, 72, 152),  // Deep Aizome Indigo
    scaleDownLight: rgb(46, 106, 202),
    coreUp: rgb(242, 218, 128),   // Amber gold core
    coreDown: rgb(24, 28, 42),    // Midnight Sumi core
  },
  // 1: Ryū Jade & Yamabuki Amber (Water Dragon)
  {
    bg: rgb(12, 16, 16),
    wire: rgb(220, 170, 50),
    pearl: rgb(248, 244, 230),
    scaleUp: rgb(28, 136, 102),   // Imperial Jade
    scaleUpLight: rgb(48, 172, 134),
    scaleDown: rgb(218, 146, 36), // Saffron Amber
    scaleDownLight: rgb(244, 182, 64),
    coreUp: rgb(235, 230, 160),
    coreDown: rgb(18, 32, 28),
  },
  // 2: Gion Nocturne (Neighbor Chords)
  {
    bg: rgb(16, 12, 22),
    wire: rgb(215, 165, 95),
    pearl: rgb(242, 232, 240),
    scaleUp: rgb(118, 42, 164),   // Imperial Violet
    scaleUpLight: rgb(154, 76, 206),
    scaleDown: rgb(178, 48, 92),  // Madder Rose
    scaleDownLight: rgb(214, 78, 124),
    coreUp: rgb(220, 180, 210),
    coreDown: rgb(28, 16, 36),
  },
  // 3: Kuro-Urushi & Haku (Gilded Obsidian)
  {
    bg: rgb(12, 12, 14),
    wire: rgb(235, 185, 65),
    pearl: rgb(252, 248, 238),
    scaleUp: rgb(36, 38, 46),     // Charcoal Sumi
    scaleUpLight: rgb(64, 66, 78),
    scaleDown: rgb(208, 46, 38),  // Cadmium Vermilion
    scaleDownLight: rgb(238, 76, 68),
    coreUp: rgb(240, 215, 110),
    coreDown: rgb(18, 18, 22),
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
    wire: lerpColor(sA.wire, sB.wire, u),
    pearl: lerpColor(sA.pearl, sB.pearl, u),
    scaleUp: lerpColor(sA.scaleUp, sB.scaleUp, u),
    scaleUpLight: lerpColor(sA.scaleUpLight, sB.scaleUpLight, u),
    scaleDown: lerpColor(sA.scaleDown, sB.scaleDown, u),
    scaleDownLight: lerpColor(sA.scaleDownLight, sB.scaleDownLight, u),
    coreUp: lerpColor(sA.coreUp, sB.coreUp, u),
    coreDown: lerpColor(sA.coreDown, sB.coreDown, u),
  };

  if (daylight > 0.5) {
    const dayU = (daylight - 0.5) * 0.35;
    s.bg = lerpColor(s.bg, rgb(28, 25, 34), dayU);
    s.wire = lerpColor(s.wire, rgb(250, 215, 95), dayU);
  } else {
    const nightU = (0.5 - daylight) * 0.45;
    s.bg = lerpColor(s.bg, rgb(6, 5, 10), nightU);
  }

  return s;
}

// 32 Scale Sites (4x4 cells, 2 scales per cell: sub 0=Up, sub 1=Down)
const scaleParity = new Uint8Array(32);
const scaleTransmute = new Float32Array(32);
const lastVisited = new Float32Array(32);

// 4 Autonomous Dragon Spirits: 2 Hoju (Flaming Pearl tumblers) and 2 Mizuchi (Star Diamond gliders)
const walkers = [
  { c: 0, r: 0, sub: 0, prevC: 0, prevR: 0, prevSub: 0, targetC: 0, targetR: 0, targetSub: 0, type: 0, state: 'resting', timer: 0.4, dur: 0.42, gesture: 0, spinDir: 1 },
  { c: 2, r: 1, sub: 1, prevC: 2, prevR: 1, prevSub: 1, targetC: 2, targetR: 1, targetSub: 1, type: 1, state: 'resting', timer: 1.3, dur: 0.42, gesture: 1, spinDir: -1 },
  { c: 1, r: 2, sub: 0, prevC: 1, prevR: 2, prevSub: 0, targetC: 1, targetR: 2, targetSub: 0, type: 0, state: 'resting', timer: 2.1, dur: 0.42, gesture: 0, spinDir: 1 },
  { c: 3, r: 3, sub: 1, prevC: 3, prevR: 3, prevSub: 1, targetC: 3, targetR: 3, targetSub: 1, type: 1, state: 'resting', timer: 0.1, dur: 0.42, gesture: 1, spinDir: -1 },
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

function getScaleCenter(c, r, sub, scrollY) {
  const cellY = ((r * 16.0 + scrollY) % HEIGHT + HEIGHT) % HEIGHT;
  const xOff = (r & 1) ? 8.0 : 0.0;
  const cellX = ((c * 16.0 + xOff) % WIDTH + WIDTH) % WIDTH;
  const cy = sub === 0 ? ((cellY + 10.67) % HEIGHT) : ((cellY + 5.33) % HEIGHT);
  const cx = (cellX + 8.0) % WIDTH;
  return { x: cx, y: cy };
}

function drawSpirit(cx, cy, color, filletCol, rad, spiritType, squashX, squashY, angle) {
  const minX = Math.max(0, (cx - rad * 1.6 - 1) | 0);
  const maxX = Math.min(WIDTH - 1, (cx + rad * 1.6 + 1) | 0);
  const minY = Math.max(0, (cy - rad * 1.6 - 1) | 0);
  const maxY = Math.min(HEIGHT - 1, (cy + rad * 1.6 + 1) | 0);

  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  for (let py = minY; py <= maxY; py++) {
    for (let px = minX; px <= maxX; px++) {
      const dx = px - cx;
      const dy = py - cy;
      const lx = (dx * cosA + dy * sinA) / squashX;
      const ly = (-dx * sinA + dy * cosA) / squashY;

      let d = 0;
      if (spiritType === 0) {
        // Hoju Orb (Flaming Pearl)
        d = Math.hypot(lx, ly);
      } else {
        // Mizuchi Diamond (Celestial Star)
        d = Math.abs(lx) + Math.abs(ly);
      }

      if (d <= rad + 0.6) {
        if (d > rad) {
          blendPixel(px, py, rgb(8, 6, 12), 0.85);
        } else if (d > rad - 0.75) {
          blendPixel(px, py, filletCol, 0.98);
        } else if (d < rad * 0.38) {
          blendPixel(px, py, rgb(255, 252, 240), 0.98);
        } else {
          blendPixel(px, py, color, 0.95);
        }
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
  const scrollY = (t * scrollSpeed) % 64.0;

  const glintX = 32 + 22 * Math.sin(t * 0.20 + 0.4);
  const glintY = 32 + 18 * Math.cos(t * 0.15 + 1.1);

  for (let i = 0; i < 32; i++) {
    if (scaleTransmute[i] > 0) {
      scaleTransmute[i] = Math.max(0, scaleTransmute[i] - dt * 0.9);
    }
  }

  // Draw Uroko Dragon Scale Brocade Field
  for (let y = 0; y < HEIGHT; y++) {
    const worldY = (y + scrollY + 64) % 64;
    const r = (worldY / H) | 0;
    const v = worldY - r * H;
    const xOff = (r & 1) ? 8 : 0;

    for (let x = 0; x < WIDTH; x++) {
      const worldX = (x + xOff + 64) % 64;
      const c = (worldX / S) | 0;
      const u = worldX - c * S;

      const distApexV = v - 2 * Math.abs(u - 8);
      const isUp = distApexV >= 0;
      const sub = isUp ? 0 : 1;
      const scaleIdx = (r * 4 + c) * 2 + sub;
      const flipped = scaleParity[scaleIdx];

      let dEdge = 0;
      if (isUp) {
        const dDiag = distApexV * invSqrt5;
        const dBase = 16 - v;
        dEdge = Math.min(dDiag, dBase);
      } else {
        const dDiag = (-distApexV) * invSqrt5;
        const dBase = v;
        dEdge = Math.min(dDiag, dBase);
      }

      const dGlint = Math.hypot(x - glintX, y - glintY);
      const glintF = dGlint < 18.0 ? (1.0 - dGlint / 18.0) * 0.35 : 0;
      const transmuteGlow = scaleTransmute[scaleIdx];

      // Filigree border wire
      if (dEdge < 0.85) {
        let col = stim.wire;
        if (beatPulse > 0.05) col = lerpColor(col, rgb(255, 248, 220), beatPulse * 0.38);
        if (transmuteGlow > 0.02) col = lerpColor(col, rgb(255, 245, 210), transmuteGlow * 0.55);
        if (glintF > 0) col = lerpColor(col, rgb(255, 250, 230), glintF);
        setPixel(x, y, col);
        continue;
      }

      // Scale Body
      const isLeft = u < 8;
      const effectiveUp = flipped ? !isUp : isUp;
      const primaryCol = effectiveUp ? (isLeft ? stim.scaleUp : stim.scaleUpLight) : (isLeft ? stim.scaleDown : stim.scaleDownLight);
      const coreCol = effectiveUp ? stim.coreUp : stim.coreDown;

      let col;
      if (dEdge < 2.5) {
        const striation = 0.5 + 0.5 * Math.sin(dEdge * 6.0);
        col = lerpColor(primaryCol, stim.wire, striation * 0.15);
      } else if (dEdge < 3.25) {
        col = stim.wire; // inner wire
      } else if (dEdge < 4.2) {
        col = coreCol;
      } else {
        // Radiant pearl stud
        col = stim.pearl;
      }

      if (beatPulse > 0.05 && dEdge >= 3.25) {
        col = lerpColor(col, rgb(255, 252, 240), beatPulse * 0.3);
      }
      if (transmuteGlow > 0.02) {
        col = lerpColor(col, rgb(255, 245, 210), transmuteGlow * 0.5);
      }
      if (glintF > 0) {
        col = lerpColor(col, rgb(255, 245, 220), glintF * 0.4);
      }

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
          d = Math.hypot(px - b.cx, py - b.cy);
        } else {
          d = Math.abs(px - b.cx) + Math.abs(py - b.cy);
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
        const deltas = [
          [0, 0, w.sub ^ 1],
          [1, 0, 0], [1, 0, 1], [-1, 0, 0], [-1, 0, 1],
          [0, 1, 0], [0, 1, 1], [0, -1, 0], [0, -1, 1],
          [1, 1, 0], [-1, -1, 1]
        ];

        for (const [dc, dr, nSub] of deltas) {
          const nc = (w.c + dc + 4) % 4;
          const nr = (w.r + dr + 4) % 4;
          const nIdx = (nr * 4 + nc) * 2 + nSub;
          const dtSince = Math.max(0, t - lastVisited[nIdx]);
          const revPen = (nc === w.prevC && nr === w.prevR && nSub === w.prevSub) ? 0.25 : 1.0;
          const score = Math.pow(dtSince + 1.0, 1.8) * revPen;
          candidates.push({ c: nc, r: nr, sub: nSub, dist: Math.hypot(dc, dr) + 0.5, score });
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

        w.prevC = w.c;
        w.prevR = w.r;
        w.prevSub = w.sub;
        w.targetC = chosen.c;
        w.targetR = chosen.r;
        w.targetSub = chosen.sub;
        w.state = 'moving';
        w.gesture = Math.random() < 0.65 ? 0 : 1;
        w.dur = 0.38 + chosen.dist * 0.05;
        w.timer = w.dur;
        w.spinDir = Math.random() < 0.5 ? 1 : -1;

        const startPos = getScaleCenter(w.prevC, w.prevR, w.prevSub, scrollY);
        blooms.push({
          cx: startPos.x,
          cy: startPos.y,
          color: stim.wire,
          shapeType: w.type,
          life: 0.65,
          maxLife: 0.65,
        });
      }
    } else if (w.state === 'moving') {
      if (w.timer <= 0) {
        w.state = 'resting';
        w.prevC = w.c;
        w.prevR = w.r;
        w.prevSub = w.sub;
        w.c = w.targetC;
        w.r = w.targetR;
        w.sub = w.targetSub;

        const landIdx = (w.r * 4 + w.c) * 2 + w.sub;
        lastVisited[landIdx] = t;

        scaleParity[landIdx] = (scaleParity[landIdx] ^ 1);
        scaleTransmute[landIdx] = 1.0;

        const baseRest = lerp(2.2, 1.4, daylight);
        w.timer = baseRest + Math.random() * (baseRest * 1.3);
      }
    }
  }

  // Draw Smear Lines for Gesture 1
  for (let k = 0; k < walkers.length; k++) {
    const w = walkers[k];
    if (w.state === 'moving' && w.gesture === 1) {
      const prog = clamp(1.0 - (w.timer / w.dur), 0, 1);
      const u = easeInOutQuart(prog);

      const p0 = getScaleCenter(w.prevC, w.prevR, w.prevSub, scrollY);
      const p1 = getScaleCenter(w.targetC, w.targetR, w.targetSub, scrollY);

      let dx = p1.x - p0.x;
      let dy = p1.y - p0.y;
      if (dx > WIDTH / 2) dx -= WIDTH;
      if (dx < -WIDTH / 2) dx += WIDTH;
      if (dy > HEIGHT / 2) dy -= HEIGHT;
      if (dy < -HEIGHT / 2) dy += HEIGHT;

      const curX = p0.x + dx * u;
      const curY = p0.y + dy * u;

      const smearAlpha = Math.sin(prog * Math.PI) * 0.85;
      if (smearAlpha > 0.05) {
        drawLine(p0.x, p0.y, curX, curY, stim.wire, smearAlpha);
      }
    }
  }

  // Draw Spirits
  for (let k = 0; k < walkers.length; k++) {
    const w = walkers[k];
    const spiritCol = w.type === 0 ? stim.scaleUp : stim.scaleDown;

    if (w.state === 'resting') {
      const pos = getScaleCenter(w.c, w.r, w.sub, scrollY);
      drawSpirit(pos.x, pos.y, spiritCol, stim.wire, 3.8 + audioLvl * 0.5, w.type, 1.0, 1.0, 0);
    } else {
      const prog = clamp(1.0 - (w.timer / w.dur), 0, 1);
      const p0 = getScaleCenter(w.prevC, w.prevR, w.prevSub, scrollY);
      const p1 = getScaleCenter(w.targetC, w.targetR, w.targetSub, scrollY);

      let dx = p1.x - p0.x;
      let dy = p1.y - p0.y;
      if (dx > WIDTH / 2) dx -= WIDTH;
      if (dx < -WIDTH / 2) dx += WIDTH;
      if (dy > HEIGHT / 2) dy -= HEIGHT;
      if (dy < -HEIGHT / 2) dy += HEIGHT;

      if (w.gesture === 0) {
        const u = easeInOutQuint(prog);
        const mx = p0.x + dx * 0.5;
        const my = p0.y + dy * 0.5;
        const vx = p0.x - mx;
        const vy = p0.y - my;

        const theta = u * Math.PI * w.spinDir;
        const curX = mx + vx * Math.cos(theta) - vy * Math.sin(theta);
        const curY = my + vx * Math.sin(theta) + vy * Math.cos(theta);

        const squash = 1.0 - 0.40 * Math.sin(u * Math.PI);
        const angle = u * Math.PI * w.spinDir;
        drawSpirit(curX, curY, spiritCol, stim.wire, 3.8 + audioLvl * 0.5, w.type, squash, 1.0 / squash, angle);
      } else {
        const u = easeInOutQuart(prog);
        const curX = p0.x + dx * u;
        const curY = p0.y + dy * u;

        const travelAngle = Math.atan2(dy, dx);
        const stretch = 1.0 + 0.45 * Math.sin(prog * Math.PI);
        drawSpirit(curX, curY, spiritCol, stim.wire, 3.8 + audioLvl * 0.5, w.type, stretch, 1.0 / stretch, travelAngle);
      }
    }
  }
}
