/*@vfx
id: eee9c4bb-885d-4054-8b01-0dcec85af25c
title: Square Symphony (Eight Movements in Color)
created: 2026-10-10
artist: Chusen (apprentice name)
lineage:
  - id: 24af49a8-b2ef-410d-810e-cbbc0dcc1e70
    relation: contrast
    note: Replaces 24af49a8's centrifugal swarm drift and free-floating action-point shapes with an architecturally grounded, multi-scale modular square packing on an 8x8 block lattice.
  - id: d8f55848-9b2f-4e67-820f-b1f9456d0aac
    relation: inspiration
    note: Extends d8f55848's 2x2 quadrant study into a full-canvas hierarchical tessellation where 32x32, 16x16, and 8x8 squares live together in asymmetric poise.
  - id: 0a9861a7-a071-48b9-ad57-ce3e8d93e527
    relation: contrast
    note: Replaces 0a9861a7's concentric polar mandala and clockwork ratchet escapements with rectilinear Japanese zuan tile counterpoint and Okazz's modular square gesture matrix.
influences:
  - okazz
  - verena-loewensberg
  - mizuki-heitaro
rationale: |
  In 2023, Okazz presented 'Square Symphony' at Bright Moments Tokyo: a
  generative system structured around modular square grids, exploring eight
  distinct movement behaviors and color interactions. This piece brings that
  masterwork into direct dialogue with Verena Loewensberg's concrete color poise
  and Mizuki Heitaro's zuan-cho pattern-book tradition.

  On an 8x8 block lattice (where each block is 8x8 pixels), the 64x64 panel is
  hierarchically partitioned into an asymmetric packing of squares:
  - One 32x32 monolithic anchor (4x4 blocks), grounding the composition with
    Loewensberg's structural poise.
  - Several 16x16 secondary squares (2x2 blocks), providing melodic counterpoint.
  - A field of 8x8 staccato blocks (1x1 block), adding rhythmic punctuation.

  Each square performs an autonomous kinetic routine drawn from Okazz's eight
  gesture languages:
  0. Quarter-Turn Staves: alternating colored stripes tumbling 90 degrees.
  1. Concentric Inset Frames: nested square rings pulsating in counter-rhythm.
  2. Checkerboard Phase Shift: micro-grids sliding horizontally and vertically.
  3. Greek Cross / X-Star Vault: 45-degree cross rotating within its cell.
  4. Diagonal Uroko Split: bisected triangles flipping across diagonals.
  5. Corner-Radius Morph: smooth breathing from circle to rounded square.
  6. Pinwheel Quadrant Tumbler: four asymmetric quadrants orbiting the cell center.
  7. Stepped Chevron / L-Bracket: geometric corner brackets rotating in 90-degree steps.

  Crucially, every square operates under Okazz's rest-dominant meter: holding its
  composed posture for 72% of its cycle, then executing a crisp quintic snap.
  Pairwise coprime periods (2.2s to 8.4s) ensure the tiles never modulate in unison.
  To break long-run wallpaper equilibrium, the composition unrolls through five
  coprime spatial packings and six modernist color chords across 36-second movements
  (an 18-minute non-repeating cycle). Clock daylight modulates the sumi registration
  gutters, while room audio quantizes tile snaps and resonates through inner gem cores.
@vfx*/

const meta = { name: "square_symphony", fps: 30, inputs: ["clock", "audio"] };

// Palettes: 6 modernist / zuan color chords with balanced luminosity
const PALETTES = [
  // 0: Okazz Pop
  [rgb(210, 24, 44), rgb(215, 172, 8), rgb(24, 76, 178), rgb(0, 150, 110), rgb(205, 202, 192), rgb(18, 20, 24)],
  // 1: Loewensberg 1960 Stimmung
  [rgb(195, 42, 36), rgb(205, 148, 28), rgb(32, 68, 138), rgb(118, 38, 62), rgb(208, 204, 192), rgb(22, 24, 28)],
  // 2: Saudé Pochoir 1926
  [rgb(22, 54, 118), rgb(38, 136, 114), rgb(202, 138, 26), rgb(186, 46, 36), rgb(210, 206, 194), rgb(16, 18, 22)],
  // 3: Aizome Modernist
  [rgb(18, 32, 68), rgb(184, 44, 40), rgb(44, 130, 112), rgb(206, 158, 32), rgb(208, 204, 192), rgb(16, 18, 20)],
  // 4: Bauhaus Constructivist
  [rgb(202, 32, 34), rgb(218, 182, 16), rgb(24, 82, 182), rgb(116, 120, 126), rgb(212, 210, 202), rgb(18, 20, 24)],
  // 5: Imperial Murasaki & Gold
  [rgb(112, 30, 68), rgb(202, 68, 38), rgb(208, 160, 30), rgb(34, 122, 106), rgb(212, 208, 196), rgb(22, 18, 22)],
];

function generatePacking(seed) {
  const grid = new Int8Array(64);
  const squares = [];

  let s = (seed * 1337 + 7) >>> 0;
  function rnd() {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = s;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  }

  // Pre-seed one 32x32 square (4x4 blocks) for asymmetric poise anchor
  const bigX = ((rnd() * 5) | 0);
  const bigY = ((rnd() * 5) | 0);
  for (let dy = 0; dy < 4; dy++) {
    for (let dx = 0; dx < 4; dx++) {
      grid[(bigY + dy) * 8 + (bigX + dx)] = 1;
    }
  }
  squares.push({
    bx: bigX, by: bigY, sz: 4,
    x: bigX * 8, y: bigY * 8, w: 32, invW: 1.0 / 32,
    motion: (rnd() * 8) | 0,
    period: 4.8 + rnd() * 3.6,
    phase: rnd() * 10,
    colShift: (rnd() * 5) | 0,
  });

  // Proposed 16x16 (2x2 blocks)
  for (let att = 0; att < 60; att++) {
    const bx = (rnd() * 7) | 0;
    const by = (rnd() * 7) | 0;
    let ok = true;
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        if (grid[(by + dy) * 8 + (bx + dx)]) { ok = false; break; }
      }
      if (!ok) break;
    }
    if (ok) {
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          grid[(by + dy) * 8 + (bx + dx)] = 1;
        }
      }
      squares.push({
        bx, by, sz: 2,
        x: bx * 8, y: by * 8, w: 16, invW: 1.0 / 16,
        motion: (rnd() * 8) | 0,
        period: 3.2 + rnd() * 2.8,
        phase: rnd() * 10,
        colShift: (rnd() * 5) | 0,
      });
    }
  }

  // Fill remaining with 8x8 (1x1 block)
  for (let by = 0; by < 8; by++) {
    for (let bx = 0; bx < 8; bx++) {
      if (!grid[by * 8 + bx]) {
        grid[by * 8 + bx] = 1;
        squares.push({
          bx, by, sz: 1,
          x: bx * 8, y: by * 8, w: 8, invW: 1.0 / 8,
          motion: (rnd() * 8) | 0,
          period: 2.2 + rnd() * 2.2,
          phase: rnd() * 10,
          colShift: (rnd() * 5) | 0,
        });
      }
    }
  }

  return squares;
}

const PACKINGS = [
  generatePacking(101),
  generatePacking(202),
  generatePacking(303),
  generatePacking(404),
  generatePacking(505),
];

function easeInOutQuint(x) {
  return x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2;
}

let beatJolt = 0;

function render(t, dt) {
  const daylight = (typeof input !== "undefined" && input.clock) ? input.clock.daylight : 0.5;
  const bass = (typeof input !== "undefined" && input.audio && input.audio.ok) ? input.audio.bass : 0;

  if (typeof input !== "undefined" && input.audio && input.audio.ok && input.audio.beat) {
    beatJolt = 0.6;
  }
  if (beatJolt > 0) {
    beatJolt = Math.max(0, beatJolt - dt * 3.5);
  }

  const EPOCH_DUR = 36.0;
  const epoch = Math.floor(t / EPOCH_DUR);
  const epochT = t - epoch * EPOCH_DUR;
  const packIdx = epoch % PACKINGS.length;
  const nextPackIdx = (epoch + 1) % PACKINGS.length;
  const pal = PALETTES[epoch % PALETTES.length];
  const nextPal = PALETTES[(epoch + 1) % PALETTES.length];

  const gutterBase = pal[5];
  const gR = clamp(lerp(((gutterBase >> 16) & 255) - 4, ((gutterBase >> 16) & 255) + 6, daylight) | 0, 0, 255);
  const gG = clamp(lerp(((gutterBase >> 8) & 255) - 4, ((gutterBase >> 8) & 255) + 6, daylight) | 0, 0, 255);
  const gB = clamp(lerp((gutterBase & 255) - 4, (gutterBase & 255) + 4, daylight) | 0, 0, 255);
  const cGutter = rgb(gR, gG, gB);

  const isTransition = epochT > (EPOCH_DUR - 3.0);
  const transU = isTransition ? (epochT - (EPOCH_DUR - 3.0)) / 3.0 : 0;
  const transEase = easeInOutQuint(transU);

  const curSquares = PACKINGS[packIdx];

  for (const sq of curSquares) {
    const warp = noise2(sq.bx * 0.35, t * 0.015) * 2.5;
    const localT = t + sq.phase + warp + beatJolt * 0.15;
    const cycle = (localT % sq.period) / sq.period;
    const curStep = Math.floor(localT / sq.period);

    let u = 0;
    if (cycle > 0.72) {
      const rawU = (cycle - 0.72) / 0.28;
      u = easeInOutQuint(rawU);
    }

    const c1 = pal[(sq.colShift + 0) % 5];
    const c2 = pal[(sq.colShift + 1) % 5];
    const c3 = pal[(sq.colShift + 2) % 5];

    const scale = isTransition ? Math.max(0, 1.0 - transEase) : 1.0;
    const hw = (sq.w * scale) * 0.5;
    const cx = sq.x + sq.w * 0.5;
    const cy = sq.y + sq.w * 0.5;
    const invW = sq.invW;
    const motion = sq.motion;
    const w = sq.w;

    let cosA = 1, sinA = 0;
    let param1 = 0, param2 = 0, param3 = 0;
    let bVal1 = false;

    if (motion === 0) {
      const ang = (curStep + u) * (Math.PI * 0.5);
      cosA = Math.cos(ang); sinA = Math.sin(ang);
      param1 = (w >= 16) ? 4 : 2;
      param2 = (0.12 + bass * 0.04) * (0.12 + bass * 0.04);
    } else if (motion === 1) {
      const pulse = Math.sin(u * Math.PI) * 0.08 + bass * 0.03;
      param1 = 0.36 + pulse;
      param2 = 0.18 + pulse * 0.5;
      bVal1 = (curStep & 1) === 0;
    } else if (motion === 2) {
      const N = (w >= 16) ? 4 : 2;
      param1 = N;
      param2 = ((curStep & 1) === 0 ? u : 0) * (1.0 / N);
      param3 = ((curStep & 1) === 1 ? u : 0) * (1.0 / N);
    } else if (motion === 3) {
      const ang = (curStep + u) * (Math.PI * 0.25);
      cosA = Math.cos(ang); sinA = Math.sin(ang);
      param1 = 0.15 + 0.03 * Math.sin(u * Math.PI) + bass * 0.02;
      param2 = (param1 * 0.8) * (param1 * 0.8);
    } else if (motion === 4) {
      const ang = (Math.PI * 0.25) + (curStep + u) * (Math.PI * 0.5);
      cosA = Math.cos(ang); sinA = Math.sin(ang);
      param1 = 0.05 + bass * 0.02;
    } else if (motion === 5) {
      param1 = 0.5 - 0.5 * Math.cos((curStep + u) * Math.PI);
      param2 = 0.18 + bass * 0.05;
    } else if (motion === 6) {
      const ang = (curStep + u) * (Math.PI * 0.5);
      cosA = Math.cos(ang); sinA = Math.sin(ang);
    } else {
      const corner = (curStep + (u > 0.5 ? 1 : 0)) % 4;
      const ang = corner * (Math.PI * 0.5);
      cosA = Math.cos(ang); sinA = Math.sin(ang);
    }

    for (let py = sq.y; py < sq.y + sq.w; py++) {
      if (py < 0 || py >= HEIGHT) continue;
      const dy = py - cy;
      for (let px = sq.x; px < sq.x + sq.w; px++) {
        if (px < 0 || px >= WIDTH) continue;
        const dx = px - cx;

        if (px === sq.x || px === sq.x + sq.w - 1 || py === sq.y || py === sq.y + sq.w - 1) {
          setPixel(px, py, cGutter);
          continue;
        }

        if (Math.abs(dx) > hw || Math.abs(dy) > hw) {
          setPixel(px, py, cGutter);
          continue;
        }

        const nx = (px - sq.x + 0.5) * invW - 0.5;
        const ny = (py - sq.y + 0.5) * invW - 0.5;

        let col = c1;
        if (motion === 0) {
          const rx = nx * cosA + ny * sinA;
          const sIdx = Math.floor((rx + 0.5) * param1);
          if (w >= 16 && (nx * nx + ny * ny < param2)) col = c3;
          else col = ((sIdx & 1) === 0) ? c1 : c2;
        } else if (motion === 1) {
          const d = Math.max(Math.abs(nx), Math.abs(ny));
          if (d >= param1) col = bVal1 ? c1 : c2;
          else if (d >= param2) col = bVal1 ? c2 : c1;
          else col = c3;
        } else if (motion === 2) {
          const cxN = Math.floor((nx + 0.5 + param2) * param1);
          const cyN = Math.floor((ny + 0.5 + param3) * param1);
          if (w >= 16 && (cxN === 1 || cxN === 2) && (cyN === 1 || cyN === 2) && (nx * nx + ny * ny < 0.0196)) col = c3;
          else col = ((cxN + cyN) & 1) === 0 ? c1 : c2;
        } else if (motion === 3) {
          const rx = nx * cosA + ny * sinA;
          const ry = -nx * sinA + ny * cosA;
          const inCross = Math.abs(rx) <= param1 || Math.abs(ry) <= param1;
          if (inCross) {
            col = (nx * nx + ny * ny < param2) ? c3 : c1;
          } else {
            col = c2;
          }
        } else if (motion === 4) {
          const val = nx * cosA + ny * sinA;
          if (w >= 16 && Math.abs(val) < param1) col = c3;
          else col = val > 0 ? c1 : c2;
        } else if (motion === 5) {
          const r = Math.sqrt(nx * nx + ny * ny);
          const dBox = Math.max(Math.abs(nx), Math.abs(ny));
          const d = lerp(r * 1.12, dBox, param1);
          if (d <= 0.42) {
            col = (d <= param2) ? c3 : c1;
          } else {
            col = c2;
          }
        } else if (motion === 6) {
          const rx = nx * cosA + ny * sinA;
          const ry = -nx * sinA + ny * cosA;
          const quad = (rx >= 0 ? 1 : 0) + (ry >= 0 ? 2 : 0);
          const qx = Math.abs(rx) - 0.25;
          const qy = Math.abs(ry) - 0.25;
          const qrSq = qx * qx + qy * qy;
          if (quad === 0) col = c1;
          else if (quad === 1) col = qrSq < 0.0256 ? c2 : c1;
          else if (quad === 2) col = (qx > 0 || qy > 0) ? c3 : c2;
          else col = qrSq < 0.0196 ? c1 : c3;
        } else {
          const rx = nx * cosA + ny * sinA;
          const ry = -nx * sinA + ny * cosA;
          const ld = Math.max(rx, ry);
          if (ld > 0.14) col = c1;
          else if (ld > -0.14) col = c2;
          else col = c3;
        }

        setPixel(px, py, col);
      }
    }
  }

  // Next movement bloom during transition
  if (isTransition && transEase > 0.02) {
    const nextSquares = PACKINGS[nextPackIdx];
    for (const sq of nextSquares) {
      const c1 = nextPal[(sq.colShift + 0) % 5];
      const c2 = nextPal[(sq.colShift + 1) % 5];
      const c3 = nextPal[(sq.colShift + 2) % 5];

      const scale = transEase;
      const hw = (sq.w * scale) * 0.5;
      const cx = sq.x + sq.w * 0.5;
      const cy = sq.y + sq.w * 0.5;
      const invW = sq.invW;
      const motion = sq.motion;
      const w = sq.w;

      let cosA = 1, sinA = 0;
      let param1 = 0, param2 = 0, param3 = 0;
      let bVal1 = false;

      if (motion === 0) {
        param1 = (w >= 16) ? 4 : 2;
        param2 = 0.0144;
      } else if (motion === 1) {
        param1 = 0.36; param2 = 0.18; bVal1 = true;
      } else if (motion === 2) {
        param1 = (w >= 16) ? 4 : 2; param2 = 0; param3 = 0;
      } else if (motion === 3) {
        cosA = 0.92388; sinA = 0.38268;
        param1 = 0.15; param2 = 0.0144;
      } else if (motion === 4) {
        cosA = 0.7071; sinA = 0.7071; param1 = 0.05;
      } else if (motion === 5) {
        param1 = 0; param2 = 0.18;
      } else if (motion === 6) {
        cosA = 1; sinA = 0;
      } else {
        cosA = 1; sinA = 0;
      }

      const minY = Math.max(sq.y, Math.floor(cy - hw));
      const maxY = Math.min(sq.y + sq.w - 1, Math.ceil(cy + hw));
      const minX = Math.max(sq.x, Math.floor(cx - hw));
      const maxX = Math.min(sq.x + sq.w - 1, Math.ceil(cx + hw));

      for (let py = minY; py <= maxY; py++) {
        if (py < 0 || py >= HEIGHT) continue;
        for (let px = minX; px <= maxX; px++) {
          if (px < 0 || px >= WIDTH) continue;
          if (px === sq.x || px === sq.x + sq.w - 1 || py === sq.y || py === sq.y + sq.w - 1) {
            setPixel(px, py, cGutter);
            continue;
          }
          const nx = (px - sq.x + 0.5) * invW - 0.5;
          const ny = (py - sq.y + 0.5) * invW - 0.5;

          let col = c1;
          if (motion === 0) {
            const rx = nx * cosA + ny * sinA;
            const sIdx = Math.floor((rx + 0.5) * param1);
            if (w >= 16 && (nx * nx + ny * ny < param2)) col = c3;
            else col = ((sIdx & 1) === 0) ? c1 : c2;
          } else if (motion === 1) {
            const d = Math.max(Math.abs(nx), Math.abs(ny));
            if (d >= param1) col = bVal1 ? c1 : c2;
            else if (d >= param2) col = bVal1 ? c2 : c1;
            else col = c3;
          } else if (motion === 2) {
            const cxN = Math.floor((nx + 0.5 + param2) * param1);
            const cyN = Math.floor((ny + 0.5 + param3) * param1);
            if (w >= 16 && (cxN === 1 || cxN === 2) && (cyN === 1 || cyN === 2) && (nx * nx + ny * ny < 0.0196)) col = c3;
            else col = ((cxN + cyN) & 1) === 0 ? c1 : c2;
          } else if (motion === 3) {
            const rx = nx * cosA + ny * sinA;
            const ry = -nx * sinA + ny * cosA;
            const inCross = Math.abs(rx) <= param1 || Math.abs(ry) <= param1;
            if (inCross) {
              col = (nx * nx + ny * ny < param2) ? c3 : c1;
            } else {
              col = c2;
            }
          } else if (motion === 4) {
            const val = nx * cosA + ny * sinA;
            if (w >= 16 && Math.abs(val) < param1) col = c3;
            else col = val > 0 ? c1 : c2;
          } else if (motion === 5) {
            const r = Math.sqrt(nx * nx + ny * ny);
            const dBox = Math.max(Math.abs(nx), Math.abs(ny));
            const d = lerp(r * 1.12, dBox, param1);
            if (d <= 0.42) {
              col = (d <= param2) ? c3 : c1;
            } else {
              col = c2;
            }
          } else if (motion === 6) {
            const rx = nx * cosA + ny * sinA;
            const ry = -nx * sinA + ny * cosA;
            const quad = (rx >= 0 ? 1 : 0) + (ry >= 0 ? 2 : 0);
            const qx = Math.abs(rx) - 0.25;
            const qy = Math.abs(ry) - 0.25;
            const qrSq = qx * qx + qy * qy;
            if (quad === 0) col = c1;
            else if (quad === 1) col = qrSq < 0.0256 ? c2 : c1;
            else if (quad === 2) col = (qx > 0 || qy > 0) ? c3 : c2;
            else col = qrSq < 0.0196 ? c1 : c3;
          } else {
            const rx = nx * cosA + ny * sinA;
            const ry = -nx * sinA + ny * cosA;
            const ld = Math.max(rx, ry);
            if (ld > 0.14) col = c1;
            else if (ld > -0.14) col = c2;
            else col = c3;
          }

          setPixel(px, py, col);
        }
      }
    }
  }
}
