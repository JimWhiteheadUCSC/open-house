/*@vfx
id: 499066a2-9abe-4791-b24e-2db2ce68c5ac
title: Defect on the Kyoto Bolt
created: 2026-10-09
artist: Chusen (apprentice name)
lineage:
  - id: 35feb5ba-985f-4f64-8dfb-13f3bec71b08
    relation: contrast
    note: Rejects Plasma Bloom's amorphous continuous fields in favor of Mizuki Heitaro's discrete 16x16 stencil repeat and an intentional Okazz-style traveling defect.
influences:
  - mizuki-heitaro
  - okazz
  - verena-loewensberg
rationale: |
  Mizuki Heitaro published 99 geometric textile patterns in 1930 for
  commercial yardage; Verena Loewensberg tuned geometric color chords;
  Okazz gave discrete lattices cartoon gesture and duty-cycled rest.
  This piece brings the three offices together on an unrolling bolt of
  stencil cloth.

  A 16x16 half-drop repeat unrolls downward at 1.5 px/s. Its motifs are
  constructed from interlocking L1 and L-infinity distance equations
  (diamonds, stepped squares, central gems) rendered with soft stencil
  edges in a traditional Kyoto zuan-cho palette (deep indigo ground,
  persimmon vermilion, warm ochre, raw silk ivory). Daylight from the
  clock gently re-chords the palette from cool midnight to warm sunlit
  silk.

  To defy wallpaper equilibrium without breaking livability, a single
  traveling defect wanders the lattice. Governed by Okazz's rest-dominant
  meter, it rests for several seconds, then vaults to an adjacent cell in
  a 0.45s ease-out leap, leaving a fading wake behind it. On the defect
  tile, the palette counterchanges—vermilion and ivory invert, ochre
  flares to gold. On beat, the jump quantizes to the music; in silence,
  it explores the unrolling fabric at its own patient pace.
@vfx*/

const meta = { name: "defect_on_kyoto_bolt", fps: 30, inputs: ["clock", "audio"] };

const SPEED = 1.5; // pixels per second downward scroll

// --- simulation state --------------------------------------------------------

let lastT = null;

let defect = {
  col: 1,
  row: 2,
  prevCol: 1,
  prevRow: 2,
  progress: 1.0, // 0 to 1
  timer: 2.2,
};

let wakes = []; // array of { col, row, life }

// --- preallocated frame caches ----------------------------------------------

// 8 rows x 4 cols = 32 tiles cached per frame
// Each tile has:
// defectWeight (1 float)
// 4 color stops (4 x 3 floats = 12 floats: c0_r, c0_g, c0_b, c1_r, ...)
const CACHE_ROWS = 8;
const __tileWeights = new Float32Array(CACHE_ROWS * 4);
const __tileColors = new Float32Array(CACHE_ROWS * 4 * 12);

let __cacheT = null;

function __updateState(t, dt) {
  // If large time jump (e.g. validator skipping epochs), re-center defect
  if (dt > 1.0) {
    const centerRow = Math.floor((32 + t * SPEED) / 16);
    defect.row = centerRow;
    defect.prevRow = centerRow;
    defect.progress = 1.0;
    defect.timer = 2.0;
    wakes.length = 0;
    return;
  }

  // Audio beat trigger: quantize jump onset to beat if currently resting
  if (input.audio.ok && input.audio.beat && defect.progress >= 1.0) {
    defect.timer = 0;
  }

  defect.timer -= dt;
  if (defect.progress < 1.0) {
    defect.progress = Math.min(1.0, defect.progress + dt / 0.45); // 0.45s leap
  }

  // Defect screen position in Y:
  // Tile row screen center: screenY = row * 16 - t * SPEED + 8
  const screenY = defect.row * 16 - t * SPEED + 8;

  if (defect.timer <= 0) {
    // Record wake at the departing tile
    wakes.push({ col: defect.col, row: defect.row, life: 1.0 });

    defect.prevCol = defect.col;
    defect.prevRow = defect.row;
    defect.progress = 0.0;

    // Pick step direction (Okazz quantized 4-way hop):
    let dCol = 0;
    let dRow = 0;

    // Steer row to keep defect naturally centered on the visible 64px matrix
    if (screenY > 44) {
      dRow = -1; // swim upward relative to scrolling bolt
    } else if (screenY < 20) {
      dRow = 1;  // drift downward
    } else {
      const rPick = Math.random();
      dRow = rPick < 0.35 ? -1 : rPick < 0.7 ? 1 : 0;
    }

    // Step column
    const cPick = Math.random();
    dCol = cPick < 0.4 ? -1 : cPick < 0.8 ? 1 : 0;

    // Ensure we don't stand completely still
    if (dCol === 0 && dRow === 0) {
      dCol = Math.random() < 0.5 ? -1 : 1;
    }

    defect.col = ((defect.col + dCol) % 4 + 4) % 4;
    defect.row = defect.row + dRow;

    // Autonomous rest timer: 1.8s to 3.2s
    defect.timer = 1.8 + Math.random() * 1.4;
  }

  // Age wakes
  for (let i = wakes.length - 1; i >= 0; i--) {
    wakes[i].life -= dt * 0.45;
    if (wakes[i].life <= 0) {
      wakes.splice(i, 1);
    }
  }
}

function __rebuildFrameCache(t) {
  const daylight = input.clock.daylight;

  // Base palette (night to day)
  // Stop 0: Deep Indigo ground
  const p0_r = lerp(10, 18, daylight);
  const p0_g = lerp(14, 26, daylight);
  const p0_b = lerp(24, 42, daylight);

  // Stop 1: Persimmon vermilion
  const p1_r = lerp(160, 218, daylight);
  const p1_g = lerp(52, 76, daylight);
  const p1_b = lerp(34, 48, daylight);

  // Stop 2: Yamabuki ochre
  const p2_r = lerp(185, 232, daylight);
  const p2_g = lerp(138, 178, daylight);
  const p2_b = lerp(52, 68, daylight);

  // Stop 3: Raw silk ivory
  const p3_r = lerp(215, 248, daylight);
  const p3_g = lerp(202, 240, daylight);
  const p3_b = lerp(180, 226, daylight);

  // Counterchange defect palette (ivory & vermilion inverted, ochre flaring to gold)
  const q0_r = lerp(16, 26, daylight);
  const q0_g = lerp(22, 36, daylight);
  const q0_b = lerp(36, 54, daylight);

  const q1_r = lerp(225, 252, daylight); // ivory
  const q1_g = lerp(212, 244, daylight);
  const q1_b = lerp(190, 230, daylight);

  const q2_r = lerp(220, 255, daylight); // gold
  const q2_g = lerp(175, 215, daylight);
  const q2_b = lerp(60, 80, daylight);

  const q3_r = lerp(190, 235, daylight); // vermilion gem
  const q3_g = lerp(50, 70, daylight);
  const q3_b = lerp(35, 45, daylight);

  // Ease-out cubic curve for leap
  const ease = 1 - Math.pow(1 - defect.progress, 3);

  const baseRow = Math.floor(t * SPEED / 16);

  // Populate cache for visible and near-visible tile rows
  for (let ro = 0; ro < CACHE_ROWS; ro++) {
    const r = baseRow + ro;
    const rIdx = (r & 7);

    for (let c = 0; c < 4; c++) {
      let weight = 0;

      if (r === defect.row && c === defect.col) {
        weight = Math.max(weight, ease);
      }
      if (defect.progress < 1.0 && r === defect.prevRow && c === defect.prevCol) {
        weight = Math.max(weight, 1.0 - ease);
      }
      for (let i = 0; i < wakes.length; i++) {
        if (wakes[i].row === r && wakes[i].col === c) {
          weight = Math.max(weight, wakes[i].life * 0.55);
        }
      }

      const tileIdx = rIdx * 4 + c;
      __tileWeights[tileIdx] = weight;

      // Pre-blend color stops for this tile
      const cOffset = tileIdx * 12;
      __tileColors[cOffset + 0] = lerp(p0_r, q0_r, weight);
      __tileColors[cOffset + 1] = lerp(p0_g, q0_g, weight);
      __tileColors[cOffset + 2] = lerp(p0_b, q0_b, weight);

      __tileColors[cOffset + 3] = lerp(p1_r, q1_r, weight);
      __tileColors[cOffset + 4] = lerp(p1_g, q1_g, weight);
      __tileColors[cOffset + 5] = lerp(p1_b, q1_b, weight);

      __tileColors[cOffset + 6] = lerp(p2_r, q2_r, weight);
      __tileColors[cOffset + 7] = lerp(p2_g, q2_g, weight);
      __tileColors[cOffset + 8] = lerp(p2_b, q2_b, weight);

      __tileColors[cOffset + 9]  = lerp(p3_r, q3_r, weight);
      __tileColors[cOffset + 10] = lerp(p3_g, q3_g, weight);
      __tileColors[cOffset + 11] = lerp(p3_b, q3_b, weight);
    }
  }

  __cacheT = t;
}

function pixel(x, y, t) {
  if (lastT === null) {
    lastT = t;
    const initialCenterRow = Math.floor((32 + t * SPEED) / 16);
    defect.row = initialCenterRow;
    defect.prevRow = initialCenterRow;
  }
  const dt = t - lastT;
  if (dt > 0.001) {
    __updateState(t, dt);
    lastT = t;
  }
  if (t !== __cacheT) {
    __rebuildFrameCache(t);
  }

  // Continuous scrolling coordinates
  const scrollY = y + t * SPEED;
  const tileRow = Math.floor(scrollY / 16);
  // Half-drop repeat: alternate rows offset by half tile (8 px)
  const shiftX = (tileRow & 1) ? 8 : 0;
  const scrollX = x + shiftX;
  const tileCol = ((Math.floor(scrollX / 16) % 4) + 4) % 4;

  const tileIdx = (tileRow & 7) * 4 + tileCol;
  const defectWeight = __tileWeights[tileIdx];

  // Tile-local coordinates centered at 0: range -8 to +8
  const u = (((scrollX % 16) + 16) % 16) - 8;
  const v = (((scrollY % 16) + 16) % 16) - 8;

  const ax = Math.abs(u);
  const ay = Math.abs(v);
  const dDiamond = ax + ay;
  const dSquare = Math.max(ax, ay);

  // Subtle breathing pulsation on defect and wake tiles
  const pulseSpeed = 6.0 + (input.audio.ok ? input.audio.level * 8.0 : 0);
  const pulseAmp = 0.5 + (input.audio.ok ? input.audio.bass * 0.3 : 0);
  const morph = defectWeight * (pulseAmp * (0.5 + 0.5 * Math.sin(t * pulseSpeed)));

  const rCenter = 2.4 + morph * 0.6;
  const rSquare = 4.4 - morph * 0.3;
  const rMid = 8.4 + morph * 0.5;

  // Anti-aliased stencil transitions (0.5px filter width)
  const w = 0.5;
  const sCenter = smoothstep(rCenter - w, rCenter + w, dDiamond);
  const sSquare = smoothstep(rSquare - w, rSquare + w, dSquare);
  const sMid = smoothstep(rMid - w, rMid + w, dDiamond);

  // Layer weights:
  // Layer 3: Central gem (raw silk ivory / flaring vermilion)
  const w3 = 1 - sCenter;
  // Layer 2: Stepped square (ochre / gold)
  const w2 = (1 - sSquare) * (1 - w3);
  // Layer 1: Diamond body (persimmon vermilion / ivory)
  const w1 = (1 - sMid) * (1 - w2 - w3);
  // Layer 0: Interlocking chevron ground (indigo / midnight)
  const w0 = 1 - (w1 + w2 + w3);

  const cOffset = tileIdx * 12;
  const r = w0 * __tileColors[cOffset + 0] + w1 * __tileColors[cOffset + 3] + w2 * __tileColors[cOffset + 6] + w3 * __tileColors[cOffset + 9];
  const g = w0 * __tileColors[cOffset + 1] + w1 * __tileColors[cOffset + 4] + w2 * __tileColors[cOffset + 7] + w3 * __tileColors[cOffset + 10];
  const b = w0 * __tileColors[cOffset + 2] + w1 * __tileColors[cOffset + 5] + w2 * __tileColors[cOffset + 8] + w3 * __tileColors[cOffset + 11];

  return rgb(r | 0, g | 0, b | 0);
}
