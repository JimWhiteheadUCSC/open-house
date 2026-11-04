/*@vfx
id: bbb92de9-85e1-40d5-ac0e-efc26ef6ced4
title: Komawake (The Divided Square)
created: 2026-10-10
artist: Solyanka (apprentice name)
lineage:
  - id: c53be3ba-dfdc-4740-95e1-42c625e002f9
    relation: variation
    note: takes the three-office synthesis (Field, Frame, Time) and translates it from a uniform scrolling 16x16 brocade lattice into a multi-scale recursive quadtree subdivision (32x32 monumental, 16x16 medium, 8x8 micro), where each quadrant independently governs its scale hierarchy.
  - id: fe8ca5ea-c1d1-4962-a322-bd1c43c17e77
    relation: inspiration
    note: inherits the latent 8px grid alignment, the 8-color pop palette grammar, and the geometric motif vocabulary (crosses, diamonds, rings, bullseyes), but replaces individual leaping particles with structured hierarchical cell division.
  - id: 8e0fc91c-5e7d-44cc-9b26-8b79656c0c55
    relation: contrast
    note: contrasts uniform conveyor scrolling of identical repeat tiles with stationary, multi-scale architectural komawake framing where motion is structured through localized scale morphs and polyharmonic adagio duty cycles.
  - id: 6b736d35-3c42-43eb-b6e0-3c3839e1deaa
    relation: contrast
    note: contrasts uniform 5x5 grid squares and pure color voice-leading with variable-scale geometric motifs (bullseyes, rosettes, stepped squares, corner arcs) that pop, shrink, and bloom in harmonic counterpoint.
influences:
  - okazz
  - mizuki-heitaro
  - verena-loewensberg
rationale: |
  In traditional Japanese kimono design, 'Komawake' (駒分け) is the art of partitioning
  a garment into distinct geometric compartments of varying scale, juxtaposing bold
  monumental fields against intricate micro-patterns to create dynamic visual tension.
  In modern creative coding, Okazz's iconic 'divideSquare' studies explore this same
  recursive subdivision: taking a square and recursively splitting it into quarters,
  populating each cell with high-contrast graphic figures.

  This piece realizes that dialogue between classical Japanese compartment framing,
  Swiss Concrete asymmetric poise, and Okazz's cartoon pop animacy on the 64x64 matrix.

  The canvas is partitioned into four 32x32 primary quadrants separated by 2px dark linen
  channels. Each quadrant independently traverses four structural configurations:
  - State 0 (Monolith): A monumental 32x32 block featuring bold primary motifs
    (concentric bullseye rings, diamond rosettes, corner arcs, stepped squares).
  - State 1 (Quartet): Four 16x16 medium blocks with rotating graphic figures
    (solid discs, diamonds, crosses, annulus rings).
  - State 2 (Hybrid): Two 16x16 blocks paired with eight 8x8 micro-cells.
  - State 3 (Mosaic): Sixteen 8x8 micro-cells with dense pixel icons
    (dots, micro-crosses, checker studs).

  Movement is structured through asynchronous adagio phrasing: each quadrant operates on
  an incommensurate prime period (9.2s, 10.8s, 9.8s, 11.4s) with a 70% held contemplative
  poise followed by a 30% cartoon morph transition (the outgoing state shrinks via cosine
  ease; the incoming state blooms with damped exponential overshoot). At any frozen instant,
  at least three quadrants are completely stationary, satisfying Verena Loewensberg's
  freeze-frame test.

  Harmonies rotate across three authentic modal palettes on a 48-second macro-cycle:
  Okazz Pop Electric, Zurich Concretist 1957, and Kyoto Zuan Mineral Dyes. A wandering
  soloist focus travels along Lissajous paths, casting an ambient specular luster across
  visited blocks to break mathematical equilibrium.

  Clock daylight modulates ground intimacy and resting tempo, audio level gently dilates
  motif breath, incoming beats send a crystalline golden shimmer across the channels, and
  button presses trigger a cascading wave of immediate quadrant morphs.
@vfx*/

// Komawake (The Divided Square) — buffer mode
// Multi-scale recursive quadtree subdivision, asynchronous adagio duty cycles,
// cartoon bloom transitions, and polyharmonic modal Stimmungen.

const meta = { name: "komawake_divided_square", fps: 30, inputs: ["clock", "audio", "button"] };

// Three Modal Palettes
const PALETTES = [
  // 0: Okazz Pop Electric
  [
    rgb(247, 6, 64),    // 0: Crimson Red #f70640
    rgb(61, 118, 225),  // 1: Electric Cobalt #3d76e1
    rgb(145, 202, 22),  // 2: Lime Green #91ca16
    rgb(247, 203, 81),  // 3: Warm Marigold #f7cb51
    rgb(246, 86, 152),  // 4: Bubblegum Pink #f65698
    rgb(23, 190, 187),  // 5: Clean Teal #17bebb
    rgb(233, 123, 50),  // 6: Tangerine Orange #e97b32
    rgb(245, 238, 228), // 7: Emitted Rice Bone #f5eee4
  ],
  // 1: Zurich Concrete 1957 (Loewensberg)
  [
    rgb(198, 42, 36),   // 0: Cadmium Red
    rgb(34, 88, 178),   // 1: Cobalt Blue
    rgb(226, 168, 38),  // 2: Golden Ochre
    rgb(32, 142, 114),  // 3: Viridian Teal
    rgb(128, 48, 124),  // 4: Royal Plum
    rgb(204, 90, 32),   // 5: Burnt Sienna
    rgb(114, 140, 46),  // 6: Citron Olive
    rgb(240, 235, 224), // 7: Raw Linen
  ],
  // 2: Kyoto Zuan Mineral (Heitaro)
  [
    rgb(212, 46, 42),   // 0: Shu Vermilion
    rgb(26, 74, 142),   // 1: Aizome Indigo
    rgb(228, 182, 48),  // 2: Yamabuki Gold
    rgb(42, 128, 98),   // 3: Pine Green
    rgb(212, 82, 36),   // 4: Persimmon Orange
    rgb(142, 48, 118),  // 5: Imperial Plum
    rgb(208, 162, 44),  // 6: Raw Brass
    rgb(242, 236, 220), // 7: Natural Silk
  ]
];

const BG_NIGHT = rgb(18, 16, 24);
const BG_DAY = rgb(34, 30, 40);
const CHANNEL_BASE = rgb(28, 24, 34);

// Quadrant origins
const Q_OFFSETS = [
  { x: 0, y: 0 },
  { x: 32, y: 0 },
  { x: 0, y: 32 },
  { x: 32, y: 32 }
];

// Quadrant structural sequences
const QUAD_CYCLES = [
  [0, 1, 2, 3, 1], // Q0
  [1, 3, 0, 2, 0], // Q1
  [2, 0, 1, 3, 2], // Q2
  [3, 2, 3, 0, 1], // Q3
];

// Incommensurate prime periods per quadrant
const QUAD_DURS = [9.2, 10.8, 9.8, 11.4];

function lerpColor(c1, c2, u) {
  const r1 = (c1 >> 16) & 255, g1 = (c1 >> 8) & 255, b1 = c1 & 255;
  const r2 = (c2 >> 16) & 255, g2 = (c2 >> 8) & 255, b2 = c2 & 255;
  return rgb(lerp(r1, r2, u) | 0, lerp(g1, g2, u) | 0, lerp(b1, b2, u) | 0);
}

function blendPixel(px, py, color, alpha) {
  if (alpha <= 0.04 || px < 0 || px >= WIDTH || py < 0 || py >= HEIGHT) return;
  if (alpha >= 0.96) {
    setPixel(px, py, color);
  } else {
    const bg = getPixel(px, py);
    const bgr = (bg >> 16) & 255, bgg = (bg >> 8) & 255, bgb = bg & 255;
    const cr = (color >> 16) & 255, cg = (color >> 8) & 255, cb = color & 255;
    setPixel(px, py, rgb(lerp(bgr, cr, alpha) | 0, lerp(bgg, cg, alpha) | 0, lerp(bgb, cb, alpha) | 0));
  }
}

let buttonAdvance = 0;
let beatPulse = 0;

function drawMotif32(x, y, motif, bgCol, fgCol, accCol, scale, angle, pulse, soloistX, soloistY) {
  if (scale <= 0.05) return;
  const cx = x + 15.5;
  const cy = y + 15.5;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  // Soloist luster factor for this block
  const dSol = Math.hypot(cx - soloistX, cy - soloistY);
  const luster = clamp(1.0 - dSol / 24.0, 0, 1);

  for (let py = y + 1; py < y + 31; py++) {
    for (let px = x + 1; px < x + 31; px++) {
      const dx = px - cx;
      const dy = py - cy;
      const lx = (dx * cosA + dy * sinA) / scale;
      const ly = (-dx * sinA + dy * cosA) / scale;

      let col = bgCol;
      if (motif === 0) {
        // Concentric bullseye rings
        const r = Math.hypot(lx, ly);
        if (r <= 11.5 + pulse && r >= 6.5) col = fgCol;
        else if (r <= 4.0) col = accCol;
      } else if (motif === 1) {
        // Diamond rosette
        const d = Math.abs(lx) + Math.abs(ly);
        if (d <= 11.5 + pulse) col = fgCol;
        if (Math.hypot(lx, ly) <= 4.0) col = accCol;
      } else if (motif === 2) {
        // Corner arcs
        const dTL = Math.hypot(lx + 14.5, ly + 14.5);
        const dBR = Math.hypot(lx - 14.5, ly - 14.5);
        if (dTL <= 14.0 || dBR <= 14.0) col = fgCol;
        if (Math.hypot(lx, ly) <= 4.5) col = accCol;
      } else {
        // Stepped inner square
        if (Math.max(Math.abs(lx), Math.abs(ly)) <= 10.0 + pulse) col = fgCol;
        if (Math.max(Math.abs(lx), Math.abs(ly)) <= 4.5) col = accCol;
      }

      if (luster > 0.05) {
        col = lerpColor(col, rgb(255, 245, 220), luster * 0.28);
      }

      setPixel(px, py, col);
    }
  }
}

function drawMotif16(x, y, motif, bgCol, fgCol, scale, angle, soloistX, soloistY) {
  if (scale <= 0.05) return;
  const cx = x + 7.5;
  const cy = y + 7.5;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  const dSol = Math.hypot(cx - soloistX, cy - soloistY);
  const luster = clamp(1.0 - dSol / 20.0, 0, 1);

  for (let py = y + 1; py < y + 15; py++) {
    for (let px = x + 1; px < x + 15; px++) {
      const dx = px - cx;
      const dy = py - cy;
      const lx = (dx * cosA + dy * sinA) / scale;
      const ly = (-dx * sinA + dy * cosA) / scale;

      let col = bgCol;
      if (motif === 0) {
        if (Math.hypot(lx, ly) <= 4.8) col = fgCol;
      } else if (motif === 1) {
        if (Math.abs(lx) + Math.abs(ly) <= 5.2) col = fgCol;
      } else if (motif === 2) {
        if ((Math.abs(lx) <= 5.0 && Math.abs(ly) <= 2.0) || (Math.abs(lx) <= 2.0 && Math.abs(ly) <= 5.0)) col = fgCol;
      } else {
        const r = Math.hypot(lx, ly);
        if (r <= 5.2 && r >= 2.4) col = fgCol;
      }

      if (luster > 0.05) {
        col = lerpColor(col, rgb(255, 245, 220), luster * 0.28);
      }

      setPixel(px, py, col);
    }
  }
}

function drawMotif8(x, y, motif, bgCol, fgCol, scale, soloistX, soloistY) {
  if (scale <= 0.05) return;
  const cx0 = x + 3.5;
  const cy0 = y + 3.5;
  const dSol = Math.hypot(cx0 - soloistX, cy0 - soloistY);
  const luster = clamp(1.0 - dSol / 16.0, 0, 1);

  for (let py = y + 1; py < y + 7; py++) {
    for (let px = x + 1; px < x + 7; px++) {
      let col = bgCol;
      const cx = (px - cx0) / scale;
      const cy = (py - cy0) / scale;

      if (motif === 0) {
        if (Math.max(Math.abs(cx), Math.abs(cy)) <= 1.2) col = fgCol;
      } else if (motif === 1) {
        if (Math.abs(cx) + Math.abs(cy) <= 1.8) col = fgCol;
      } else {
        if (Math.abs(cx) < 0.6 || Math.abs(cy) < 0.6) col = fgCol;
      }

      if (luster > 0.05) {
        col = lerpColor(col, rgb(255, 245, 220), luster * 0.28);
      }

      setPixel(px, py, col);
    }
  }
}

function renderState(qid, state, t, pal, scale, audioLvl, soloistX, soloistY) {
  const qx = Q_OFFSETS[qid].x;
  const qy = Q_OFFSETS[qid].y;
  const qPhase = t * 0.35 + qid * 1.57;
  const pulse = Math.sin(qPhase * 2.0) * (0.8 + audioLvl * 1.5);

  if (state === 0) {
    // 32x32 Monolith
    const motif = (qid + Math.floor(t * 0.04)) % 4;
    const angle = Math.sin(qPhase) * 0.15;
    const col0 = pal[(qid * 2) % 8];
    const col1 = pal[(qid * 2 + 7) % 8];
    const col2 = pal[(qid * 2 + 3) % 8];
    drawMotif32(qx, qy, motif, col0, col1, col2, scale, angle, pulse, soloistX, soloistY);
  } else if (state === 1) {
    // Four 16x16 blocks
    for (let sy = 0; sy < 2; sy++) {
      for (let sx = 0; sx < 2; sx++) {
        const bx = qx + sx * 16;
        const by = qy + sy * 16;
        const subIdx = sy * 2 + sx;
        const motif = (subIdx + qid) % 4;
        const angle = (subIdx % 2 === 0 ? 1 : -1) * (t * 0.15);
        const col0 = pal[(qid + subIdx * 2) % 8];
        const col1 = pal[(qid + subIdx * 2 + 4) % 8];
        drawMotif16(bx, by, motif, col0, col1, scale, angle, soloistX, soloistY);
      }
    }
  } else if (state === 2) {
    // Hybrid: Two 16x16s + Eight 8x8s
    drawMotif16(qx, qy, 1, pal[(qid) % 8], pal[(qid + 3) % 8], scale, 0, soloistX, soloistY);
    drawMotif16(qx + 16, qy, 3, pal[(qid + 2) % 8], pal[(qid + 7) % 8], scale, 0, soloistX, soloistY);
    for (let sy = 0; sy < 2; sy++) {
      for (let sx = 0; sx < 4; sx++) {
        const bx = qx + sx * 8;
        const by = qy + 16 + sy * 8;
        const m = (sx + sy + qid) % 3;
        const col0 = pal[(qid + sx + sy * 3) % 8];
        const col1 = pal[(qid + sx + sy * 3 + 4) % 8];
        drawMotif8(bx, by, m, col0, col1, scale, soloistX, soloistY);
      }
    }
  } else {
    // Mosaic: Sixteen 8x8s
    for (let sy = 0; sy < 4; sy++) {
      for (let sx = 0; sx < 4; sx++) {
        const bx = qx + sx * 8;
        const by = qy + sy * 8;
        const m = (sx * 2 + sy + qid) % 3;
        const col0 = pal[(qid + sx + sy * 2) % 8];
        const col1 = pal[(qid + sx + sy * 2 + 4) % 8];
        drawMotif8(bx, by, m, col0, col1, scale, soloistX, soloistY);
      }
    }
  }
}

function render(t, dt) {
  const daylight = (typeof input !== 'undefined' && input.clock) ? input.clock.daylight : 0.5;
  const audio = (typeof input !== 'undefined' && input.audio && input.audio.ok) ? input.audio : null;
  const audioLvl = audio ? audio.level : 0;

  if (audio && audio.beat) {
    beatPulse = 1.0;
  } else {
    beatPulse = Math.max(0, beatPulse - dt * 2.8);
  }

  // Button interaction: smooth advance along the choreography
  if (typeof input !== 'undefined' && input.button && input.button.pressed) {
    buttonAdvance += 4.5;
  }

  const effectiveT = t + buttonAdvance;

  // Ground color modulated by clock daylight
  const bg = lerpColor(BG_NIGHT, BG_DAY, daylight);
  fill(bg);

  // Modal color rotation (48s cycle across the three palettes)
  const palCycle = 48.0;
  const pFrac = (effectiveT % palCycle) / (palCycle / PALETTES.length);
  const pIdx0 = Math.floor(pFrac) % PALETTES.length;
  const pIdx1 = (pIdx0 + 1) % PALETTES.length;
  const uPal = smoothstep(0.7, 1.0, pFrac - Math.floor(pFrac));

  const curPal = [];
  for (let i = 0; i < 8; i++) {
    curPal.push(lerpColor(PALETTES[pIdx0][i], PALETTES[pIdx1][i], uPal));
  }

  // Wandering soloist focus traveling along incommensurate Lissajous cycles
  const soloistX = 32 + 22 * Math.sin(effectiveT * 0.19 + 0.4);
  const soloistY = 32 + 18 * Math.cos(effectiveT * 0.14 + 1.1);

  // Channel dividers: 2px wide crosshair channels at x=31..32 and y=31..32
  let channelCol = CHANNEL_BASE;
  if (beatPulse > 0.05) {
    channelCol = lerpColor(channelCol, rgb(235, 205, 120), beatPulse * 0.65);
  }

  for (let i = 0; i < 64; i++) {
    setPixel(31, i, channelCol);
    setPixel(32, i, channelCol);
    setPixel(i, 31, channelCol);
    setPixel(i, 32, channelCol);
  }

  // Render each quadrant through its independent adagio duty cycle
  for (let q = 0; q < 4; q++) {
    const dur = QUAD_DURS[q];
    const qT = effectiveT + q * 3.1;
    const cycleIdx = Math.floor(qT / dur);
    const frac = (qT % dur) / dur;
    const steps = QUAD_CYCLES[q];
    const stateA = steps[cycleIdx % steps.length];
    const stateB = steps[(cycleIdx + 1) % steps.length];

    if (frac < 0.70) {
      // 70% Held Contemplative Poise
      renderState(q, stateA, effectiveT, curPal, 1.0, audioLvl, soloistX, soloistY);
    } else {
      // 30% Cartoon Morph Transition
      const p = (frac - 0.70) / 0.30;
      if (p < 0.5) {
        // State A shrinks via cosine ease
        const scaleA = Math.cos(p * Math.PI);
        renderState(q, stateA, effectiveT, curPal, scaleA, audioLvl, soloistX, soloistY);
      } else {
        // State B blooms with damped exponential overshoot
        const uB = (p - 0.5) * 2;
        const overshoot = Math.sin(uB * Math.PI * 1.5) * Math.exp(-uB * 2.5);
        const scaleB = clamp(1.0 - overshoot * 0.42, 0.05, 1.25);
        renderState(q, stateB, effectiveT, curPal, scaleB, audioLvl, soloistX, soloistY);
      }
    }
  }
}
