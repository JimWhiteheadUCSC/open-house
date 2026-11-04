/*@vfx
id: ec2d7794-2c29-4875-826b-ac4c9e32f542
title: Mawari-dōrō
created: 2026-10-10
artist: Koushi (apprentice name)
influences:
  - mizuki-heitaro
  - verena-loewensberg
  - okazz
rationale: |
  A kinetic Japanese revolving shadow lantern (Mawari-dōrō / 走馬灯) and
  Kumiko architectural woodwork screen, uniting the three offices of
  our roster: Mizuki Heitaro (the field), Verena Loewensberg (the frame),
  and Okazz (time).
  
  In Edo-period Japan, Mawari-dōrō were seasonal lanterns constructed from
  delicate Hinoki wood frames and translucent washi paper. Rising heat from
  an interior candle turned a delicate paper turbine, revolving a cylindrical
  drum of cut-out silhouettes that cast moving shadows across the outer screen.
  
  1. Heitaro holds the FIELD: Traditional Japanese Kumiko woodwork partitioned
     into three architectural registers:
     - Upper Ramma: Vertical Koushi slats (y = 3..19).
     - Central Frieze: Intricate Asanoha (hemp-leaf) and diamond Kumiko fretwork
       (y = 22..42) evaluated via parametric taxicab and modular equations.
     - Lower Panel: Hishi-koushi diagonal diamond weave (y = 45..60).
     The entire screen is framed by dark Keyaki posts, a central stile, and
     polished brass Kanagu corner brackets that balance edge mass.
  
  2. Loewensberg holds the FRAME: Translucent washi paper optical logic.
     Light from an internal candle flame at (flameX, flameY) diffuses through
     the paper, transitioning smoothly from shaded washi to luminous golden
     ivory. Daylight and slow cycles modulate four authentic seasonal Stimmungs:
     Kogarashi (amber hearth), Tsukiyo (moonlit indigo), Tasogare (persimmon
     twilight), and Akebono (dawn rose & cedar). Every paused frame passes
     the freeze-frame test.
  
  3. Okazz holds TIME: The internal cylindrical drum rotates with gentle
     thermal convection, casting 4 projected folklore silhouettes across
     the screen:
     - Usagi: A leaping hare with squash-and-stretch hopping physics.
     - Chidori: A shorebird with flapping wings and bobbing flight.
     - Momiji: A swaying 5-lobed Japanese maple leaf.
     - Shippō: An interlocking circular crest rosette.
     Shadow sharpness scales with cylinder depth. On the exterior screen,
     a glowing Hotaru (firefly) rests on wooden stiles for 1.2–2.5s before
     leaping on easeInOutQuint arcs, ensuring perpetual open-system turnover.
  
  Reactivity: audio beats create thermal convective gusts that accelerate
  drum rotation and trigger firefly takeoffs, loudness adds brass luster,
  and button presses ignite a sudden draft of wind that flutters the flame.
@vfx*/

// mawari_doro — buffer mode, reactive
// Japanese revolving shadow lantern: Kumiko fretwork, backlit washi paper,
// cylindrical shadow drum, seasonal Stimmung, and roving Hotaru firefly.

const meta = {
  name: "mawari_doro",
  fps: 30,
  inputs: ["audio", "clock", "button"],
};

// --- Flame & Turbine State --------------------------------------------------
let flameX = 31.5, flameY = 32.0;
let flameFlicker = 1.0;
let draftWind = 0;

let drumAngle = 0;
let drumSpeed = 0.26; // radians per second (~24s per revolution)

// --- Shadow Figures on Revolving Drum ---------------------------------------
class ShadowFigure {
  constructor(angle, type, scale, yBase) {
    this.angle = angle;
    this.type = type;
    this.scale = scale;
    this.yBase = yBase;
    this.hopPhase = Math.random() * 6.28;
  }
}

const figures = [
  new ShadowFigure(0, 0, 3.2, 32),               // 0: Usagi (Leaping Hare)
  new ShadowFigure(Math.PI * 0.5, 1, 2.8, 27),   // 1: Chidori (Shorebird)
  new ShadowFigure(Math.PI * 1.0, 2, 3.0, 35),   // 2: Momiji (Maple Leaf)
  new ShadowFigure(Math.PI * 1.5, 3, 2.7, 30),   // 3: Shippō Rosette
];

// --- Hotaru (Outside Summer Firefly) ----------------------------------------
const hotaru = {
  x: 32, y: 32, toX: 32, toY: 32,
  state: "rest", timer: 0.6, restDur: 1.6, moveDur: 0.35,
  acts: 12,
};

function updateEntities(dt, audioLevel, beat, btn) {
  // Button press generates sudden draft of wind
  if (btn) {
    draftWind = 1.0;
  }
  if (draftWind > 0) {
    draftWind = Math.max(0, draftWind - dt * 2.2);
  }

  // Flame draft & flicker
  const baseFlicker = 0.94 + 0.12 * Math.sin(dt * 18.0 + Math.random() * 2.5);
  flameFlicker = (baseFlicker + audioLevel * 0.18) * (1.0 - draftWind * 0.45);
  flameX = 31.5 + 2.6 * Math.sin(dt * 2.3) + 1.2 * Math.cos(dt * 4.9) + (draftWind * 4.0);
  flameY = 32.0 + 1.8 * Math.cos(dt * 1.7) + 0.9 * Math.sin(dt * 3.7);

  // Drum rotation: audio beats provide thermal convective lift
  if (beat) {
    drumSpeed = 0.54;
    if (hotaru.state === "rest" && hotaru.timer > 0.4) {
      hotaru.timer = hotaru.restDur;
    }
  } else {
    drumSpeed = lerp(drumSpeed, 0.26, dt * 1.8);
  }

  const convection = 1.0 + audioLevel * 0.40 + draftWind * 0.8;
  drumAngle = (drumAngle + drumSpeed * convection * dt) % (Math.PI * 2);

  // Hotaru kinematics (Okazz rest-and-snap duty cycle)
  hotaru.timer += dt;
  if (hotaru.state === "rest") {
    if (hotaru.timer >= hotaru.restDur) {
      hotaru.state = "leap";
      hotaru.timer = 0;
      // Leap to discrete wooden rails or fretwork joints
      const stationsX = [4, 16, 31, 46, 59];
      const stationsY = [3, 21, 32, 43, 60];
      hotaru.toX = stationsX[(Math.random() * stationsX.length) | 0] + (Math.random() * 2 - 1);
      hotaru.toY = stationsY[(Math.random() * stationsY.length) | 0] + (Math.random() * 2 - 1);
      hotaru.moveDur = 0.30 + Math.random() * 0.10;
      hotaru.acts--;
      if (hotaru.acts <= 0) {
        hotaru.acts = 8 + ((Math.random() * 8) | 0);
      }
    }
  } else if (hotaru.state === "leap") {
    if (hotaru.timer >= hotaru.moveDur) {
      hotaru.x = hotaru.toX;
      hotaru.y = hotaru.toY;
      hotaru.state = "rest";
      hotaru.timer = 0;
      hotaru.restDur = 1.2 + Math.random() * 2.2;
    }
  }
}

// Distance evaluations for parametric silhouette types
function evalSilhouette(px, py, type, scale, hopU) {
  const invS = 1.0 / scale;
  const rx = px * invS;
  const ry = py * invS;

  if (type === 0) {
    // Usagi (Leaping Hare): body, head, long ears, front/back paws
    const stretchX = 1.0 + 0.24 * Math.sin(hopU * Math.PI);
    const squashY = 1.0 - 0.20 * Math.sin(hopU * Math.PI);
    const sx = rx / stretchX;
    const sy = ry / squashY;

    const dBody = Math.hypot(sx / 1.5, sy / 0.95);
    const dHead = Math.hypot(sx - 1.2, sy + 0.35);
    const dEar1 = Math.hypot((sx - 0.6) / 0.32, (sy + 1.8) / 1.3);
    const dEar2 = Math.hypot((sx - 0.1) / 0.32, (sy + 2.0) / 1.3);
    const dTail = Math.hypot(sx + 1.5, sy + 0.15) * 1.5;
    const dPawF = Math.hypot(sx - 1.1, sy - 0.85) * 1.6;
    const dPawB = Math.hypot(sx + 0.9, sy - 0.85) * 1.4;

    const dMin = Math.min(dBody, dHead * 1.25, dEar1, dEar2, dTail, dPawF, dPawB);
    return dMin < 1.0 ? (1.0 - dMin) : 0;
  } else if (type === 1) {
    // Chidori (Shorebird): chest, beak, flapping wings, fan tail
    const flap = Math.sin(hopU * Math.PI * 4.0) * 0.35;
    const dBody = Math.hypot(rx / 1.3, ry / 0.85);
    const dHead = Math.hypot(rx - 1.0, ry + 0.25);
    const dBeak = Math.hypot((rx - 1.7) / 0.5, (ry + 0.25) / 0.2);
    const dWing1 = Math.hypot((rx + 0.1) / 0.4, (ry + 1.2 + flap) / 1.2);
    const dWing2 = Math.hypot((rx + 0.4) / 0.4, (ry - 0.8 - flap * 0.5) / 0.9);
    const dTail = Math.hypot((rx + 1.3) / 0.5, ry / 0.3);

    const dMin = Math.min(dBody, dHead * 1.3, dBeak, dWing1, dWing2, dTail);
    return dMin < 1.0 ? (1.0 - dMin) : 0;
  } else if (type === 2) {
    // Momiji (Japanese Maple Leaf): 5 serrated lobes + stem
    const r = Math.hypot(rx, ry);
    const th = Math.atan2(ry, rx);
    const star = 0.55 + 0.45 * Math.cos(th * 5);
    const dLeaf = r / (star * 1.5);
    const dStem = (Math.abs(rx) < 0.25 && ry > 0.4 && ry < 1.8) ? 0.3 : 2.0;
    const dMin = Math.min(dLeaf, dStem);
    return dMin < 1.0 ? (1.0 - dMin) : 0;
  } else {
    // Shippō Rosette: 4-petaled geometric crest
    const r = Math.hypot(rx, ry);
    const th = Math.atan2(ry, rx);
    const petal = 0.60 + 0.40 * Math.cos(th * 4);
    const dPetal = r / (petal * 1.45);
    const dCore = Math.abs(r - 0.45) * 2.2;
    const dMin = Math.min(dPetal, dCore);
    return dMin < 1.0 ? (1.0 - dMin) : 0;
  }
}

// 4 Seasonal Stimmung Chords (Verena Loewensberg Chromatic Stimmung)
const STIMMUNGEN = [
  // 0: Kogarashi (Winter Hearth / Amber Flame)
  {
    flameCore: [255, 240, 190],
    paperLight: [248, 205, 130],
    paperShade: [65, 42, 26],
    woodFrame: [52, 30, 18],
    woodKumiko: [105, 62, 36],
    brassKanagu: [240, 195, 65],
  },
  // 1: Tsukiyo (Moonlit Winter Shoji / Indigo Midnight)
  {
    flameCore: [255, 248, 220],
    paperLight: [235, 195, 140],
    paperShade: [48, 42, 60],
    woodFrame: [36, 28, 40],
    woodKumiko: [85, 68, 80],
    brassKanagu: [220, 205, 150],
  },
  // 2: Tasogare (Autumn Dusk / Persimmon Twilight)
  {
    flameCore: [255, 230, 160],
    paperLight: [245, 170, 95],
    paperShade: [70, 38, 25],
    woodFrame: [58, 28, 20],
    woodKumiko: [115, 60, 36],
    brassKanagu: [245, 180, 50],
  },
  // 3: Akebono (Dawn Cedar / Fresh Hinoki Rose & Ivory)
  {
    flameCore: [255, 248, 215],
    paperLight: [242, 205, 155],
    paperShade: [62, 48, 45],
    woodFrame: [48, 35, 28],
    woodKumiko: [110, 80, 55],
    brassKanagu: [235, 200, 85],
  },
];

function lerpCol(cA, cB, u) {
  return [
    lerp(cA[0], cB[0], u),
    lerp(cA[1], cB[1], u),
    lerp(cA[2], cB[2], u),
  ];
}

// --- Frame Render -----------------------------------------------------------
function render(t, dt) {
  const stepDt = dt || 0.033;
  const daylight = input.clock.daylight !== undefined ? input.clock.daylight : 0.5;
  const audioLevel = input.audio.ok ? input.audio.level : 0;
  const beat = input.audio.ok && input.audio.beat;
  const btn = input.button && input.button.pressed;

  updateEntities(stepDt, audioLevel, beat, btn);

  // Stimmung progression: 4 seasonal chords modulated by daylight and slow cycle
  const stimmCycle = (t * 0.005) % 1.0;
  const stimmPos = (daylight * 2.0 + stimmCycle * 4.0) % 4.0;
  const sIdxA = Math.floor(stimmPos);
  const sIdxB = (sIdxA + 1) % 4;
  const sFrac = stimmPos - sIdxA;

  const stA = STIMMUNGEN[sIdxA];
  const stB = STIMMUNGEN[sIdxB];

  const colFlame = lerpCol(stA.flameCore, stB.flameCore, sFrac);
  const colPaperL = lerpCol(stA.paperLight, stB.paperLight, sFrac);
  const colPaperS = lerpCol(stA.paperShade, stB.paperShade, sFrac);
  const colFrame = lerpCol(stA.woodFrame, stB.woodFrame, sFrac);
  const colKumiko = lerpCol(stA.woodKumiko, stB.woodKumiko, sFrac);
  const colKanagu = lerpCol(stA.brassKanagu, stB.brassKanagu, sFrac);

  // Project active shadows on revolving cylinder
  const activeShadows = [];
  for (let i = 0; i < figures.length; i++) {
    const f = figures[i];
    const curAng = (f.angle + drumAngle) % (Math.PI * 2);
    const depthCos = Math.cos(curAng);
    if (depthCos > -0.15) {
      const projX = 31.5 + 23.0 * Math.sin(curAng);
      let hopY = 0;
      const hopU = (t * 2.2 + f.hopPhase) % 1.0;
      if (f.type === 0) {
        hopY = -4.5 * Math.sin(hopU * Math.PI);
      } else if (f.type === 1) {
        hopY = 2.2 * Math.sin(t * 3.6 + f.hopPhase);
      } else if (f.type === 2) {
        hopY = 1.6 * Math.cos(t * 2.1 + f.hopPhase);
      }

      const projY = f.yBase + hopY;
      const shadowWeight = clamp((depthCos + 0.15) / 1.15, 0, 1.0) * 0.88;
      activeShadows.push({
        x: projX,
        y: projY,
        type: f.type,
        scale: f.scale * (0.85 + 0.25 * depthCos),
        weight: shadowWeight,
        hopU: hopU,
      });
    }
  }

  // Hotaru screen position
  let hotaruX, hotaruY;
  if (hotaru.state === "rest") {
    hotaruX = hotaru.x; hotaruY = hotaru.y;
  } else {
    const u = clamp(hotaru.timer / hotaru.moveDur, 0, 1);
    const eu = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
    hotaruX = lerp(hotaru.x, hotaru.toX, eu);
    hotaruY = lerp(hotaru.y, hotaru.toY, eu);
  }

  // Rasterize 64x64 frame
  for (let y = 0; y < HEIGHT; y++) {
    const isRailT = y < 3;
    const isRailB = y >= 61;
    const isRailM1 = (y === 20 || y === 21);
    const isRailM2 = (y === 43 || y === 44);
    const isFrameY = isRailT || isRailB || isRailM1 || isRailM2;

    const dyFlame = y - flameY;
    const dyFlame2 = dyFlame * dyFlame;
    const dyHotaru = y - hotaruY;
    const dyHotaru2 = dyHotaru * dyHotaru;

    for (let x = 0; x < WIDTH; x++) {
      const idx = (y * WIDTH + x) * 3;

      // 1. Structural Posts & Muntins
      const isPostL = x < 3;
      const isPostR = x >= 61;
      const isPostM = (x === 31 || x === 32);
      const isFrame = isFrameY || isPostL || isPostR || isPostM;

      // Brass Kanagu corner brackets
      const isCornerTL = (x < 7 && y < 7) && (x < 3 || y < 3);
      const isCornerTR = (x >= 57 && y < 7) && (x >= 61 || y < 3);
      const isCornerBL = (x < 7 && y >= 57) && (x < 3 || y >= 61);
      const isCornerBR = (x >= 57 && y >= 57) && (x >= 61 || y >= 61);
      const isCenterT = (x >= 30 && x <= 33 && y < 5);
      const isCenterB = (x >= 30 && x <= 33 && y >= 59);
      const isKanagu = isCornerTL || isCornerTR || isCornerBL || isCornerBR || isCenterT || isCenterB;

      // 2. Translucent Washi Paper Backlighting
      const dxFlame = x - flameX;
      const distFlame = Math.sqrt(dxFlame * dxFlame + dyFlame2);
      const flameFalloff = Math.exp(-distFlame * 0.042) * flameFlicker;
      const coreBoost = Math.exp(-distFlame * 0.12) * 0.35;

      // 3. Shadow silhouettes evaluated on paper
      let totalShadow = 0;
      for (let s = 0; s < activeShadows.length; s++) {
        const sh = activeShadows[s];
        const dxS = x - sh.x;
        const dyS = y - sh.y;
        if (Math.abs(dxS) < 11 && Math.abs(dyS) < 11) {
          const sil = evalSilhouette(dxS, dyS, sh.type, sh.scale, sh.hopU);
          if (sil > 0) {
            totalShadow = Math.max(totalShadow, sil * sh.weight);
          }
        }
      }
      totalShadow = clamp(totalShadow, 0, 1.0);

      // 4. Kumiko Latticework in Interior Panels
      let isKumiko = false;
      let kumikoHighlight = false;

      if (!isFrame) {
        if (y >= 22 && y <= 42) {
          // Central Kumiko Frieze: Asanoha / Kikkō diamond lattice
          const kx = (x < 31 ? (x - 3) : (x - 33)) % 9;
          const ky = (y - 22) % 9;
          if (kx === 0 || ky === 0) {
            isKumiko = true;
            if (kx === 0 && ky === 0) kumikoHighlight = true;
          }
          if (Math.abs(kx - ky) <= 0.6 || Math.abs(kx - (8 - ky)) <= 0.6) {
            isKumiko = true;
          }
          const dDia = Math.abs(kx - 4) + Math.abs(ky - 4);
          if (Math.abs(dDia - 4) <= 0.6) {
            isKumiko = true;
          }
        } else if (y >= 3 && y <= 19) {
          // Upper Ramma: Vertical Koushi slats
          const sx = (x - 3) % 4;
          if (sx === 0) isKumiko = true;
        } else if (y >= 45 && y <= 60) {
          // Lower Panel: Hishi-koushi diagonal diamond weave
          const lx = (x + y) % 6;
          const ly = (x - y + 64) % 6;
          if (lx === 0 || ly === 0) isKumiko = true;
        }
      }

      // 5. Hotaru (Firefly) point light on outer screen
      const dxHotaru = x - hotaruX;
      const dHotaru2 = dxHotaru * dxHotaru + dyHotaru2;
      let hotaruGlow = 0;
      if (dHotaru2 < 18.0) {
        hotaruGlow = Math.exp(-Math.sqrt(dHotaru2) * 0.75) * (0.85 + 0.25 * Math.sin(t * 7.5));
      }

      // 6. Color Synthesis
      let r, g, b;

      if (isKanagu) {
        // Polished brass corner Kanagu
        const shine = (x + y) % 3 === 0 ? 1.15 : 0.95;
        r = clamp(colKanagu[0] * shine * (1.0 + audioLevel * 0.25), 0, 255);
        g = clamp(colKanagu[1] * shine * (1.0 + audioLevel * 0.25), 0, 255);
        b = clamp(colKanagu[2] * shine * (1.0 + audioLevel * 0.25), 0, 255);
      } else if (isFrame) {
        // Dark Keyaki frame with bevel highlights
        const isBevel = (x === 1 || x === 62 || y === 1 || y === 62 || x === 31 || y === 20 || y === 43);
        const frameLuster = isBevel ? 1.35 : 0.90;
        r = clamp(colFrame[0] * frameLuster, 0, 255);
        g = clamp(colFrame[1] * frameLuster, 0, 255);
        b = clamp(colFrame[2] * frameLuster, 0, 255);
      } else if (isKumiko) {
        // Hinoki cypress wood strips backlit by washi paper
        const trans = flameFalloff * 0.32;
        const woodShine = kumikoHighlight ? 1.25 : 1.0;
        r = clamp((colKumiko[0] * woodShine + colFlame[0] * trans * 0.5) * (1.0 - totalShadow * 0.38), 0, 255);
        g = clamp((colKumiko[1] * woodShine + colFlame[1] * trans * 0.5) * (1.0 - totalShadow * 0.38), 0, 255);
        b = clamp((colKumiko[2] * woodShine + colFlame[2] * trans * 0.5) * (1.0 - totalShadow * 0.38), 0, 255);
      } else {
        // Translucent Washi paper aperture
        const paperRad = clamp(flameFalloff * (1.0 - totalShadow * 0.82) + coreBoost, 0, 1.2);
        r = lerp(colPaperS[0], colPaperL[0], paperRad);
        g = lerp(colPaperS[1], colPaperL[1], paperRad);
        b = lerp(colPaperS[2], colPaperL[2], paperRad);

        // Core flame illumination boost
        if (distFlame < 16.0) {
          const coreMix = Math.exp(-distFlame * 0.16) * (1.0 - totalShadow * 0.6);
          r = lerp(r, colFlame[0], coreMix);
          g = lerp(g, colFlame[1], coreMix);
          b = lerp(b, colFlame[2], coreMix);
        }
      }

      // Add Hotaru firefly light splat (warm incandescent golden-green glow)
      if (hotaruGlow > 0.05) {
        r = clamp(r + 210 * hotaruGlow, 0, 255);
        g = clamp(g + 235 * hotaruGlow, 0, 255);
        b = clamp(b + 80 * hotaruGlow, 0, 255);
      }

      __FB[idx] = r | 0;
      __FB[idx + 1] = g | 0;
      __FB[idx + 2] = b | 0;
    }
  }
}
