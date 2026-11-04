/*@vfx
id: 03586549-b639-4d68-9678-21b7d779f84a
title: Kagome Weave (Triaxial Bamboo Lattice Plate)
created: 2026-10-11
artist: Chusen
lineage:
  - id: 0963b306-a412-4623-850f-96b477e0c8ed
    relation: contrast
    note: Replaces 2-axial orthogonal chevron staves and vertical arrow shafts with a 3-axial triaxial Kagome weave of interlaced bamboo splints (0°, -60°, +60°) forming concentric hexagonal rosettes.
  - id: 7954f5bd-4b5b-43f8-8910-354f653e0758
    relation: contrast
    note: Replaces sinuous vertical vapor waveforms and isolated oval chambers with interlocking straight-splint triaxial basketry, alternating over-under interlacing crossings, and hexagonal jewel apertures.
  - id: 499066a2-9abe-4791-b24e-2db2ce68c5ac
    relation: inspiration
    note: Inherits the continuous kinetic textile bolt drift (1.2 px/s) and autonomous traveling defect hopping across the lattice to break wallpaper equilibrium, translating it into a 6-directional Kagome shuttle.
  - id: e7b33633-1301-41bc-a518-c2f562ff4c6a
    relation: inspiration
    note: Inherits Mizuki Heitaro's mathematical zuan repeat tradition, pochoir registration gutters, and decoupled coprime color chord cycling.
influences:
  - mizuki-heitaro
  - okazz
  - verena-loewensberg
rationale: |
  Kagome (籠目 - basket eye) is Japan's oldest and most revered triaxial
  woven pattern. Developed centuries ago in traditional bamboo craft
  (takezaiku), it is formed by interlacing three sets of parallel bamboo
  splints along three axes separated by 60 degrees: horizontal (0°),
  descending (-60°), and ascending (+60°). Where the three splints intersect,
  they weave over and under each other in a regular triaxial braid, leaving
  regular hexagonal apertures ("the eyes") flanked by equilateral triangular
  interstices. In Japanese folk belief and Shinto tradition, the six-pointed
  star geometry of the Kagome weave was placed above entrances as a talisman
  (kagome-mon) whose countless vigilant eyes turned away malevolent spirits.

  In his 1930 Abstract Pattern Portfolio, Mizuki Heitaro celebrated triaxial
  lattices as pure mathematical design: equations defining the intersection
  of three planar coordinate fields. This piece translates that ancient craft
  and modernist abstraction into a living kinetic plate on the 64x64 matrix:
  - Triaxial Lattice Geometry: Three sets of splints (pitch PITCH = 16 px,
    height H = 16 * sqrt(3) / 2 ≈ 13.856 px) partition the matrix into a
    seamless triaxial weave.
  - Basketry Interlacing Parity: At every crossing point, splints alternate
    over and under each other based on coordinate parity, creating genuine
    three-dimensional woven relief rather than flat graphic stripes.
  - Bamboo Splint Materiality: Each splint is rendered with tactile craft
    depth: a raw silk/bamboo pith highlight spine (d <= 0.75 px), a rich dyed
    bamboo body (w = 2.05 px), and a sumi charcoal registration edge
    (d near w) that prevents optical bleeding.
  - Hexagonal Concentric Jewel Eyes: Within each hexagonal aperture rests a
    three-tiered concentric talisman rosette—a silk ivory pupil, a Yamabuki
    gold iris, and a cinnabar vermilion star ring.

  The piece unites our three ancestral offices:
  1. Okazz's Rest-Dominant Chamber Respiration: Across the 4x4 array of
     hexagon eyes, each rosette breathes along pairwise coprime periods
     (3.8s to 7.8s) governed by Okazz's meter (72% poise hold, 28% quintic
     pulse), resting in composed stillness before expanding.
  2. The Autonomous Traveling Defect Shuttle: An autonomous defect hops
     between neighboring hexagon eyes along the 6 triangular directions. At
     the defect eye, the central jewel flares into incandescent diamond white
     and gold, while surrounding splints counterchange into radiant verdigris
     and coral, leaving fading phosphorescent wakes that mark its path.
  3. Verena Loewensberg's Harmonic Stimmung: The plate modulates across four
     authentic Japanese court, zuan, and modernist color chords (Imperial
     Court Akane & Celadon, Modernist Persimmon & Rokushō, Kasane no Irome
     Murasaki, and 1926 Pochoir Prussian & Saffron) over a 60-second macro
     progression.

  Clock daylight modulates ground warmth and bamboo sheen, while room bass
  deepens the central jewel collar and quantizes defect hops on musical beats.
  With the library reaching 22 kept pieces and fulfilling all criteria in
  knowledge/naming.md, this piece marks the ratification of the artist name
  Chusen (注染).
@vfx*/

const meta = { name: "kagome_weave", fps: 30, inputs: ["clock", "audio"] };

const PITCH = 16;
const H = PITCH * Math.sqrt(3) * 0.5; // ~13.856406 px

// 4 Authentic Japanese & Modernist Color Chords (Loewensberg Stimmung)
const CHORDS = [
  // 0: Kasane no Irome Imperial Court (Aizome Indigo, Akane Vermilion, Yamabuki Gold, Seiji Celadon)
  {
    bg: [14, 18, 28],
    splint0: [226, 72, 42],       // Akane Vermilion
    splint1: [232, 178, 38],      // Yamabuki Gold
    splint2: [36, 164, 136],      // Seiji Celadon
    spine: [248, 244, 230],       // Raw silk
    sumi: [10, 12, 16],           // Sumi charcoal
    pupil: [250, 246, 235],
    iris: [240, 190, 42],
    ring: [210, 52, 40],
    defectSplint0: [242, 196, 44],
    defectSplint1: [38, 178, 148],
    defectSplint2: [228, 64, 52],
    defectIris: [255, 225, 70],
    defectRing: [42, 204, 168],
  },
  // 1: Modernist Kyoto Zuan (Charcoal, Persimmon, Pale Bamboo, Verdigris)
  {
    bg: [18, 22, 24],
    splint0: [232, 88, 36],       // Persimmon
    splint1: [240, 236, 220],     // Pale bamboo
    splint2: [34, 152, 124],      // Rokushō verdigris
    spine: [246, 244, 238],
    sumi: [10, 12, 14],
    pupil: [250, 248, 242],
    iris: [236, 178, 44],
    ring: [224, 76, 42],
    defectSplint0: [246, 192, 46],
    defectSplint1: [230, 68, 54],
    defectSplint2: [44, 184, 148],
    defectIris: [252, 220, 64],
    defectRing: [240, 192, 48],
  },
  // 2: Kasane no Irome Murasaki (Deep Plum, Wisteria, Amber Gold, Coral)
  {
    bg: [26, 16, 26],
    splint0: [156, 114, 182],     // Wisteria
    splint1: [236, 172, 40],      // Amber Gold
    splint2: [222, 60, 84],       // Benitobi Coral
    spine: [248, 242, 246],
    sumi: [14, 10, 14],
    pupil: [252, 246, 240],
    iris: [244, 192, 46],
    ring: [186, 44, 88],
    defectSplint0: [244, 196, 50],
    defectSplint1: [224, 54, 92],
    defectSplint2: [172, 124, 204],
    defectIris: [255, 228, 80],
    defectRing: [236, 72, 108],
  },
  // 3: 1926 Pochoir Prussian & Saffron (Prussian Blue, Saffron, Emerald, Cinnabar)
  {
    bg: [12, 22, 38],
    splint0: [234, 166, 34],      // Saffron
    splint1: [38, 168, 138],      // Emerald
    splint2: [228, 62, 46],       // Cinnabar
    spine: [246, 242, 230],
    sumi: [8, 14, 20],
    pupil: [250, 248, 244],
    iris: [242, 188, 42],
    ring: [34, 160, 130],
    defectSplint0: [228, 64, 48],
    defectSplint1: [248, 204, 46],
    defectSplint2: [44, 192, 154],
    defectIris: [255, 230, 80],
    defectRing: [236, 78, 54],
  }
];

function easeInOutQuint(x) {
  return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
}

// 4x4 array of hexagon eyes
let defect = {
  row: 1, col: 1,
  prevRow: 1, prevCol: 1,
  timer: 2.0,
  progress: 1.0,
};
const wakes = [];

function updateSim(t, dt) {
  // Audio beat reactivity: quantize defect takeoff on musical beat
  if (typeof input !== "undefined" && input.audio && input.audio.ok && input.audio.beat) {
    if (defect.progress >= 1.0 && defect.timer > 0.4) {
      defect.timer = 0;
    }
  }

  defect.timer -= dt;
  if (defect.progress < 1.0) {
    defect.progress = Math.min(1.0, defect.progress + dt / 0.45);
  }
  if (defect.timer <= 0) {
    wakes.push({ row: defect.row, col: defect.col, life: 1.0 });
    defect.prevRow = defect.row;
    defect.prevCol = defect.col;
    defect.progress = 0;

    // 6-directional triangular neighbor step
    const dRow = (Math.random() < 0.33) ? 0 : (Math.random() < 0.5 ? 1 : -1);
    let dCol = 0;
    if (dRow === 0) {
      dCol = Math.random() < 0.5 ? 1 : -1;
    } else {
      dCol = Math.random() < 0.5 ? 0 : ((defect.row % 2 === 0) ? -1 : 1);
    }
    defect.row = ((defect.row + dRow) % 4 + 4) % 4;
    defect.col = ((defect.col + dCol) % 4 + 4) % 4;
    defect.timer = 1.8 + Math.random() * 2.2;
  }

  for (let i = wakes.length - 1; i >= 0; i--) {
    wakes[i].life -= dt * 0.6;
    if (wakes[i].life <= 0) wakes.splice(i, 1);
  }
}

let lastSimT = null;
let curBg = [0, 0, 0];
let curSplint0 = [0, 0, 0], curSplint1 = [0, 0, 0], curSplint2 = [0, 0, 0];
let curSpine = [0, 0, 0], curSumi = [0, 0, 0];
let curPupil = [0, 0, 0], curIris = [0, 0, 0], curRing = [0, 0, 0];
let curDef0 = [0, 0, 0], curDef1 = [0, 0, 0], curDef2 = [0, 0, 0];
let curDefIris = [0, 0, 0], curDefRing = [0, 0, 0];

const cellDefect = new Float32Array(16);
const cellPulse = new Float32Array(16);
let g_daylight = 0.5;
let g_bass = 0.0;
let __cacheT = null;

function __updateFrame(t) {
  const delta = (lastSimT === null) ? 0.033 : (t - lastSimT);
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

  g_daylight = (typeof input !== "undefined" && input.clock) ? input.clock.daylight : 0.5;
  g_bass = (typeof input !== "undefined" && input.audio && input.audio.ok) ? input.audio.bass : 0;

  // Macro progression (60s cycle across 4 chords)
  const pChord = (t % 60) / 60;
  const rawC = pChord * CHORDS.length;
  const cIdx = Math.floor(rawC);
  const fracC = rawC - cIdx;
  const easeC = easeInOutQuint(fracC);
  const ch0 = CHORDS[cIdx % CHORDS.length];
  const ch1 = CHORDS[(cIdx + 1) % CHORDS.length];

  function blend(a, b, u) {
    return [
      lerp(a[0], b[0], u) | 0,
      lerp(a[1], b[1], u) | 0,
      lerp(a[2], b[2], u) | 0
    ];
  }

  curBg = blend(ch0.bg, ch1.bg, easeC);
  curSplint0 = blend(ch0.splint0, ch1.splint0, easeC);
  curSplint1 = blend(ch0.splint1, ch1.splint1, easeC);
  curSplint2 = blend(ch0.splint2, ch1.splint2, easeC);
  curSpine = blend(ch0.spine, ch1.spine, easeC);
  curSumi = blend(ch0.sumi, ch1.sumi, easeC);
  curPupil = blend(ch0.pupil, ch1.pupil, easeC);
  curIris = blend(ch0.iris, ch1.iris, easeC);
  curRing = blend(ch0.ring, ch1.ring, easeC);
  curDef0 = blend(ch0.defectSplint0, ch1.defectSplint0, easeC);
  curDef1 = blend(ch0.defectSplint1, ch1.defectSplint1, easeC);
  curDef2 = blend(ch0.defectSplint2, ch1.defectSplint2, easeC);
  curDefIris = blend(ch0.defectIris, ch1.defectIris, easeC);
  curDefRing = blend(ch0.defectRing, ch1.defectRing, easeC);

  // Defect weights across 16 cells
  cellDefect.fill(0);
  const easeHop = 1 - Math.pow(1 - defect.progress, 3);
  const curIdx = defect.row * 4 + defect.col;
  const prevIdx = defect.prevRow * 4 + defect.prevCol;
  cellDefect[curIdx] = Math.max(cellDefect[curIdx], easeHop);
  if (defect.progress < 1.0) {
    cellDefect[prevIdx] = Math.max(cellDefect[prevIdx], 1.0 - easeHop);
  }
  for (let w = 0; w < wakes.length; w++) {
    const widx = wakes[w].row * 4 + wakes[w].col;
    cellDefect[widx] = Math.max(cellDefect[widx], wakes[w].life * 0.75);
  }

  // Okazz rest-dominant respiration per hexagon eye (16 cells)
  for (let i = 0; i < 16; i++) {
    const period = 3.8 + (i * 17 % 23) * 0.18;
    const phase = (i * 31 % 41) * 0.2;
    const cycle = ((t + phase) % period) / period;
    let snap = 0;
    if (cycle > 0.72) {
      const rawU = (cycle - 0.72) / 0.28;
      snap = Math.sin(rawU * Math.PI);
    }
    cellPulse[i] = snap * 0.9 + cellDefect[i] * 0.6 + g_bass * 0.4;
  }

  __cacheT = t;
}

function pixel(x, y, t) {
  if (t !== __cacheT) {
    __updateFrame(t);
  }

  // Downward drift of woven bolt: 1.2 px/s
  const yWarp = y + t * 1.2;

  // Triaxial coordinates
  const a0 = yWarp / H;
  const a1 = -x / PITCH + 0.5 * yWarp / H;
  const a2 =  x / PITCH + 0.5 * yWarp / H;

  const f0 = a0 - 0.5;
  const f1 = a1 - 0.5;
  const f2 = a2 - 0.5;

  const n0 = Math.round(f0);
  const n1 = Math.round(f1);
  const n2 = Math.round(f2);

  const d0 = Math.abs(f0 - n0) * H;
  const d1 = Math.abs(f1 - n1) * H;
  const d2 = Math.abs(f2 - n2) * H;

  const w = 2.05; // splint half-width
  const in0 = d0 < w;
  const in1 = d1 < w;
  const in2 = d2 < w;

  // Triaxial interlacing parity
  let top = -1;
  if (in0 && in1 && in2) {
    top = 0;
  } else if (in0 && in1) {
    top = ((n0 - n1) & 1) === 0 ? 0 : 1;
  } else if (in1 && in2) {
    top = ((n1 - n2) & 1) === 0 ? 1 : 2;
  } else if (in2 && in0) {
    top = ((n2 - n0) & 1) === 0 ? 2 : 0;
  } else if (in0) top = 0;
  else if (in1) top = 1;
  else if (in2) top = 2;

  // Hexagon eye centers
  const hx_a0 = Math.round(a0);
  const hx_a1 = Math.round(a1);
  const hx_a2 = hx_a0 - hx_a1;
  const hexDy = yWarp - hx_a0 * H;
  const hexDx = x - (hx_a2 - 0.5 * hx_a0) * PITCH;
  const distHex = Math.hypot(hexDx, hexDy);

  const rowId = ((hx_a0 % 4) + 4) % 4;
  const colBase = (hx_a0 % 2 === 0) ? hx_a2 : (hx_a2 - 0.5);
  const colId = ((Math.floor(colBase) % 4) + 4) % 4;
  const cellId = rowId * 4 + colId;

  const pulse = cellPulse[cellId];
  const defW = cellDefect[cellId];

  // Negative space (apertures)
  if (top === -1) {
    // Hexagonal aperture jewel rosette
    const rEye = 3.8 + pulse * 0.6 + defW * 0.7;
    if (distHex < rEye) {
      if (distHex < 1.2) {
        if (defW > 0.05) {
          return rgb(255, 255, 250);
        }
        return rgb(curPupil[0], curPupil[1], curPupil[2]);
      }
      if (distHex < 2.3 + pulse * 0.4) {
        if (defW > 0.05) {
          const r = lerp(curIris[0], curDefIris[0], defW) | 0;
          const g = lerp(curIris[1], curDefIris[1], defW) | 0;
          const b = lerp(curIris[2], curDefIris[2], defW) | 0;
          return rgb(r, g, b);
        }
        return rgb(curIris[0], curIris[1], curIris[2]);
      }
      if (defW > 0.05) {
        const r = lerp(curRing[0], curDefRing[0], defW) | 0;
        const g = lerp(curRing[1], curDefRing[1], defW) | 0;
        const b = lerp(curRing[2], curDefRing[2], defW) | 0;
        return rgb(r, g, b);
      }
      return rgb(curRing[0], curRing[1], curRing[2]);
    }
    // Ground in triangular and outer crevices with daylight warmth
    const bgR = lerp(curBg[0] - 4, curBg[0] + 6, g_daylight) | 0;
    const bgG = lerp(curBg[1] - 4, curBg[1] + 6, g_daylight) | 0;
    const bgB = lerp(curBg[2] - 4, curBg[2] + 4, g_daylight) | 0;
    return rgb(bgR, bgG, bgB);
  }

  // Splint rendering with bamboo anatomy
  const dTop = top === 0 ? d0 : top === 1 ? d1 : d2;
  const edgeDist = w - dTop;

  // 1. Sumi registration border
  if (edgeDist < 0.65) {
    return rgb(curSumi[0], curSumi[1], curSumi[2]);
  }

  // 2. Raw silk / bamboo pith highlight spine
  if (dTop < 0.75 + g_bass * 0.15) {
    if (defW > 0.05) {
      return rgb(255, 255, 245);
    }
    return rgb(curSpine[0], curSpine[1], curSpine[2]);
  }

  // 3. Splint body color (Akane / Yamabuki / Seiji) with defect counterchange
  let sc = top === 0 ? curSplint0 : top === 1 ? curSplint1 : curSplint2;
  let sdef = top === 0 ? curDef0 : top === 1 ? curDef1 : curDef2;

  if (defW > 0.05) {
    const r = lerp(sc[0], sdef[0], defW) | 0;
    const g = lerp(sc[1], sdef[1], defW) | 0;
    const b = lerp(sc[2], sdef[2], defW) | 0;
    return rgb(r, g, b);
  }
  return rgb(sc[0], sc[1], sc[2]);
}