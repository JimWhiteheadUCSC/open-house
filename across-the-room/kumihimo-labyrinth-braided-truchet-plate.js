/*@vfx
id: c5501e43-db89-4974-b701-66790d731eb6
title: Kumihimo Labyrinth (Braided Truchet Plate)
created: 2026-10-10
artist: Chusen (apprentice name)
lineage:
  - id: 922c6de6-f292-4d7e-8835-bc24ac63ebb4
    relation: contrast
    note: Replaces rigid axonometric 2:1 isometric cube tessellation and 3D optical illusions with curvilinear Truchet ribbon braids, continuous topological weaving, and Japanese kumihimo cord craft.
  - id: eeb81c7b-12f2-44ed-9dc2-35c2995b89f3
    relation: contrast
    note: Replaces vertical rectilinear architectural staves with organic meandering braided channels that interconnect across tile boundaries.
  - id: 499066a2-9abe-4791-b24e-2db2ce68c5ac
    relation: inspiration
    note: Inherits the traveling defect that counterchanges color across the lattice to break wallpaper equilibrium, translating it into a wandering kumihimo shuttle leaving golden wakes.
  - id: e7b33633-1301-41bc-a518-c2f562ff4c6a
    relation: inspiration
    note: Inherits Mizuki Heitaro's decoupled coprime motif-chord cycling and traditional Japanese textile palettes.
influences:
  - mizuki-heitaro
  - okazz
  - verena-loewensberg
rationale: |
  Mizuki Heitaro's 1930 Abstract Pattern Portfolio married Japanese textile
  heritage (Kyoto zuan-cho) with Western geometric abstraction. Among the
  most revered Japanese decorative textile traditions is Kumihimo (組紐)—the
  ancient art of braiding silk ribbons into interlaced ceremonial cords, cords
  that meander, cross, loop, and re-connect in endless topological variations.

  This piece realizes Kumihimo as an evolving kinetic Truchet ribbon lattice.
  The 64x64 matrix is partitioned into a 4x4 array of 16x16 tiles. Each tile
  carries two quarter-circle ribbon arcs of radius 8px (half-tile), whose ends
  meet tile borders at exact perpendicular midpoints. Because the boundary
  connections are invariant to 90-degree rotations, any orientation permutation
  forms continuous, seamless braided highways across the entire fabric.

  Rather than remaining a static textile weave, the labyrinth lives through
  three decoupled offices:
  1. Okazz's Escapement Locomotion: Each of the 16 tiles is governed by
     incommensurate, pairwise coprime rotation periods (5.3s to 12.2s). Tiles
     spend 74% of their period in serene, poised rest, then execute a crisp 0.26s
     quintic 90-degree rotational snap (alternating clockwise and counter-clockwise).
     This constantly mutates the global topology of the braid—opening loops,
     reconnecting meanders, and creating living calligraphy without breaking
     registration.
  2. The Autonomous Traveling Shuttle: An autonomous defect shuttle hops cell-to-cell
     across the 4x4 lattice. At the shuttle's current tile, ribbon colors counterchange
     into radiant golden silk, leaving fading phosphorescent wakes that trace the
     weaver's path across the bolt.
  3. Loewensberg's Harmonic Progression: The piece modulates across four authentic
     color chords (Aizome & Akane, Modernist Celadon & Persimmon, Imperial Court
     Murasaki, and 1926 Pochoir Prussian & Coral) over a 64-second macro progression.
     Ghost jacquard score lines and corner kento registration pins ground the digital
     matrix in the physical craft of Kyoto woodblock and pochoir printing.

  Clock daylight modulates the depth of the sumi ground, while room bass gently
  swells ribbon width and quantizes shuttle hops on musical beats.
@vfx*/

const meta = { name: "kumihimo_labyrinth", fps: 30, inputs: ["clock", "audio"] };

const TILE = 16;
const GRID = 4;

// 16 tiles with pairwise coprime rotation periods
const TILES = [];
for (let y = 0; y < GRID; y++) {
  for (let x = 0; x < GRID; x++) {
    const idx = y * GRID + x;
    const period = 5.3 + ((idx * 17) % 31) * 0.23; // 5.3s to 12.2s
    const phase = ((idx * 29) % 70) * 0.1;
    TILES.push({
      gx: x, gy: y,
      period, phase,
      baseOrient: (x ^ y) & 1,
      spinDir: ((x + y) & 1) ? 1 : -1,
    });
  }
}

const TILE_COS = new Float32Array(16);
const TILE_SIN = new Float32Array(16);
const TILE_ORIENT = new Int8Array(16);

function easeInOutQuint(x) {
  return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
}

// 4 Traditional & Modernist Chusen Color Chords
const CHORDS = [
  // 0: Aizome & Akane (Deep Indigo, Vermilion, Raw Silk, Yamabuki Gold, Madder Plum)
  {
    bg: [16, 20, 26],
    ribbon: [218, 56, 40],
    highlight: [246, 242, 230],
    eye: [248, 204, 36],
    collar: [140, 32, 48],
    defectRibbon: [248, 196, 30],
  },
  // 1: Modernist Celadon & Persimmon (Sumi Slate, Persimmon, Bleached Linen, Verdigris, Pine)
  {
    bg: [20, 24, 24],
    ribbon: [224, 94, 32],
    highlight: [238, 240, 230],
    eye: [42, 164, 134],
    collar: [16, 80, 68],
    defectRibbon: [42, 180, 140],
  },
  // 2: Imperial Court Murasaki (Ebi-iro Plum, Yamabuki Gold, Torinoko Cream, Crimson, Dark Violet)
  {
    bg: [28, 16, 26],
    ribbon: [232, 178, 36],
    highlight: [248, 244, 232],
    eye: [216, 44, 76],
    collar: [100, 24, 52],
    defectRibbon: [224, 46, 82],
  },
  // 3: 1926 Pochoir Prussian & Coral (Prussian Blue, Coral Vermilion, Chalk, Cerulean, Navy)
  {
    bg: [14, 24, 40],
    ribbon: [228, 72, 88],
    highlight: [242, 240, 236],
    eye: [38, 172, 212],
    collar: [18, 76, 110],
    defectRibbon: [38, 180, 220],
  }
];

// Autonomous defect shuttle
let shuttle = {
  gx: 1, gy: 1,
  prevGx: 1, prevGy: 1,
  timer: 2.5,
  progress: 1.0,
};
const wakes = [];

function updateSim(t, dt) {
  // Audio beat reactivity: quantize takeoff on beat
  if (typeof input !== "undefined" && input.audio && input.audio.ok && input.audio.beat) {
    if (shuttle.progress >= 1.0 && shuttle.timer > 0.4) {
      shuttle.timer = 0;
    }
  }

  shuttle.timer -= dt;
  if (shuttle.progress < 1.0) {
    shuttle.progress = Math.min(1.0, shuttle.progress + dt / 0.45);
  }
  if (shuttle.timer <= 0) {
    wakes.push({ gx: shuttle.gx, gy: shuttle.gy, life: 1.0 });
    shuttle.prevGx = shuttle.gx;
    shuttle.prevGy = shuttle.gy;
    shuttle.progress = 0;

    const dirs = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
    const d = dirs[(Math.random() * dirs.length) | 0];
    shuttle.gx = clamp(shuttle.gx + d.dx, 0, 3);
    shuttle.gy = clamp(shuttle.gy + d.dy, 0, 3);
    shuttle.timer = 1.8 + Math.random() * 2.2;
  }
  for (let i = wakes.length - 1; i >= 0; i--) {
    wakes[i].life -= dt * 0.6;
    if (wakes[i].life <= 0) wakes.splice(i, 1);
  }
}

let lastSimT = null;

function render(t, dt) {
  const daylight = (typeof input !== "undefined" && input.clock) ? input.clock.daylight : 0.5;
  const bass = (typeof input !== "undefined" && input.audio && input.audio.ok) ? input.audio.bass : 0;

  const delta = (lastSimT === null) ? dt : (t - lastSimT);
  if (delta > 0.5) {
    const steps = 30;
    const subDt = 0.05;
    for (let st = 0; st < steps; st++) {
      updateSim(t - (steps - st) * subDt, subDt);
    }
  } else if (delta > 0.001) {
    updateSim(t, delta);
  }
  lastSimT = t;

  // Macro Chord progression: 64s cycle across 4 chords
  const pChord = (t % 64) / 64;
  const rawC = pChord * CHORDS.length;
  const cIdx = Math.floor(rawC);
  const fracC = rawC - cIdx;
  const easeC = easeInOutQuint(fracC);
  const chord0 = CHORDS[cIdx % CHORDS.length];
  const chord1 = CHORDS[(cIdx + 1) % CHORDS.length];

  function blendCol(arr0, arr1, u) {
    return [
      lerp(arr0[0], arr1[0], u) | 0,
      lerp(arr0[1], arr1[1], u) | 0,
      lerp(arr0[2], arr1[2], u) | 0
    ];
  }

  const curBg = blendCol(chord0.bg, chord1.bg, easeC);
  const curRibbon = blendCol(chord0.ribbon, chord1.ribbon, easeC);
  const curHighlight = blendCol(chord0.highlight, chord1.highlight, easeC);
  const curEye = blendCol(chord0.eye, chord1.eye, easeC);
  const curCollar = blendCol(chord0.collar, chord1.collar, easeC);
  const curDefect = blendCol(chord0.defectRibbon, chord1.defectRibbon, easeC);

  // Daylight modulation on ground warmth
  const bgR = lerp(curBg[0] - 4, curBg[0] + 6, daylight) | 0;
  const bgG = lerp(curBg[1] - 4, curBg[1] + 6, daylight) | 0;
  const bgB = lerp(curBg[2] - 4, curBg[2] + 4, daylight) | 0;
  const colBg = rgb(bgR, bgG, bgB);

  // Ghost lattice score
  const colGhost = rgb(bgR + 10, bgG + 12, bgB + 16);
  const colSumi = rgb(10, 12, 16);
  const colPin = rgb(235, 195, 50);

  fill(colBg);

  // Ghost jacquard lattice: diagonal score
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      if (((x + y) & 7) === 0 || ((x - y) & 7) === 0) {
        setPixel(x, y, colGhost);
      }
    }
  }

  // Precompute angles and weights for 16 tiles
  const defectWeight = new Float32Array(16);
  const easeHop = 1 - Math.pow(1 - shuttle.progress, 3);
  const sCurIdx = shuttle.gy * 4 + shuttle.gx;
  const sPrevIdx = shuttle.prevGy * 4 + shuttle.prevGx;
  defectWeight[sCurIdx] = Math.max(defectWeight[sCurIdx], easeHop);
  if (shuttle.progress < 1.0) {
    defectWeight[sPrevIdx] = Math.max(defectWeight[sPrevIdx], 1.0 - easeHop);
  }
  for (let w = 0; w < wakes.length; w++) {
    const wIdx = wakes[w].gy * 4 + wakes[w].gx;
    defectWeight[wIdx] = Math.max(defectWeight[wIdx], wakes[w].life * 0.7);
  }

  for (let i = 0; i < 16; i++) {
    const tile = TILES[i];
    const warp = noise2(tile.gx * 0.5, tile.gy * 0.5 + t * 0.03) * 1.5;
    const localT = t + tile.phase + warp;
    const cycle = (localT % tile.period) / tile.period;
    const step = Math.floor(localT / tile.period);

    let snapU = 0;
    if (cycle > 0.74) {
      const rawU = (cycle - 0.74) / 0.26;
      snapU = easeInOutQuint(rawU);
    }
    const totalAngle = (step + snapU) * (Math.PI * 0.5) * tile.spinDir;
    TILE_COS[i] = Math.cos(totalAngle);
    TILE_SIN[i] = Math.sin(totalAngle);
    TILE_ORIENT[i] = tile.baseOrient;
  }

  const ribbonThick = 3.3 + bass * 0.4;
  const eyeR = 1.0 + bass * 0.3;

  // Render 4096 pixels
  for (let y = 0; y < 64; y++) {
    const gy = y >> 4;
    const ly = y & 15;
    const rowOffset = gy << 2;

    for (let x = 0; x < 64; x++) {
      const gx = x >> 4;
      const lx = x & 15;
      const tIdx = rowOffset | gx;

      const cos = TILE_COS[tIdx];
      const sin = TILE_SIN[tIdx];
      const orient = TILE_ORIENT[tIdx];
      const defW = defectWeight[tIdx];

      const dx = lx - 7.5;
      const dy = ly - 7.5;
      const clx = dx * cos + dy * sin + 7.5;
      const cly = -dx * sin + dy * cos + 7.5;

      let d1, d2;
      if (orient === 0) {
        const d1x = clx + 0.5;
        const d1y = cly + 0.5;
        d1 = Math.sqrt(d1x * d1x + d1y * d1y);
        const d2x = 16 - (clx + 0.5);
        const d2y = 16 - (cly + 0.5);
        d2 = Math.sqrt(d2x * d2x + d2y * d2y);
      } else {
        const d1x = 16 - (clx + 0.5);
        const d1y = cly + 0.5;
        d1 = Math.sqrt(d1x * d1x + d1y * d1y);
        const d2x = clx + 0.5;
        const d2y = 16 - (cly + 0.5);
        d2 = Math.sqrt(d2x * d2x + d2y * d2y);
      }

      const distRibbon = Math.min(Math.abs(d1 - 8.0), Math.abs(d2 - 8.0));
      const cdx = clx - 7.5;
      const cdy = cly - 7.5;
      const dCenter = Math.sqrt(cdx * cdx + cdy * cdy);

      if (distRibbon <= ribbonThick) {
        if (distRibbon > ribbonThick - 0.8) {
          setPixel(x, y, colSumi);
        } else if (distRibbon <= 0.9) {
          setPixel(x, y, rgb(curHighlight[0], curHighlight[1], curHighlight[2]));
        } else {
          // Counterchange ribbon color if defect shuttle is visiting
          if (defW > 0.05) {
            const r = lerp(curRibbon[0], curDefect[0], defW) | 0;
            const g = lerp(curRibbon[1], curDefect[1], defW) | 0;
            const b = lerp(curRibbon[2], curDefect[2], defW) | 0;
            setPixel(x, y, rgb(r, g, b));
          } else {
            setPixel(x, y, rgb(curRibbon[0], curRibbon[1], curRibbon[2]));
          }
        }
      } else if (dCenter <= 2.2 + bass * 0.4) {
        if (dCenter <= eyeR) {
          setPixel(x, y, rgb(curEye[0], curEye[1], curEye[2]));
        } else {
          setPixel(x, y, rgb(curCollar[0], curCollar[1], curCollar[2]));
        }
      }
    }
  }

  // Margin kento registration ticks and grid intersection pins
  for (let gy = 0; gy <= 64; gy += 16) {
    for (let gx = 0; gx <= 64; gx += 16) {
      const px = gx === 64 ? 63 : gx;
      const py = gy === 64 ? 63 : gy;
      setPixel(px, py, colPin);
    }
  }
}
