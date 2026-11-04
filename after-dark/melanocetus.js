/*@vfx
id: 1395325e-c76b-49f6-835c-bdbde555e180
title: Melanocetus
created: 2026-10-10
artist: Tessera
influences: []
rationale: |
  A study in deep-sea bio-optics, raking bioluminescence, and predatory
  kinematics: a female humpback blackdevil (Melanocetus johnsonii) stalking
  the aphotic bathypelagic water column at 1,500 meters depth. Demonstrates
  symbiotic bacterial esca luminescence (Photobacterium) perched atop an
  arched illicium, raking specular highlights and grazing Fresnel rim lighting
  across ultra-black melanistic skin, needle-sharp interlocking translucent
  fangs, and a distensible elastic belly that glows with the digestion of
  swallowed bioluminescent prey. Features a dynamic kinematic strike state
  machine (luring, vacuum gape lunge, jaw snap, and glowing stomach digestion
  across three distinct prey organisms: lanternfish, bristlemouth, and sergestid
  prawn). Responsive to touch (manual predatory lunge strike), ambient audio
  (esca pulse frequency and jaw excitation), and cosmic clock (diurnal twilight
  water column modulation).
@vfx*/

// melanocetus — buffer mode with deep-sea bio-optics & predatory strike kinematics
// Demonstrates: symbiotic bacterial esca photogenesis with volumetric bloom corona,
// raking specular highlights and grazing Fresnel rim lighting on ultra-black melanistic skin,
// interlocking translucent needle fangs along curved oblique jaws,
// kinematic strike state machine (luring, vacuum gape lunge, jaw snap, glowing stomach digestion),
// distensible belly elasticity with multi-species prey cycling, and drifting marine snow.

const meta = { name: "melanocetus", fps: 30, inputs: ["audio", "button", "clock"] };

let escaX = 43, escaY = 16;
let jawOpen = 0.0;
let strikePhase = 0; // 0=lure, 1=strike, 2=snap, 3=digest
let phaseTimer = 0;
let fishX = 22, fishY = 34;

let prey = { x: 58, y: 22, vx: -1.3, vy: 0, swallowed: false, glow: 1.0, type: 0 };
const SNOW_COUNT = 36;
let snow = [];

// Static tooth anatomy definitions (hoisted to prevent per-frame allocations)
const UPPER_TEETH = [
  { xOff: 7, yOff: -2, len: 4, angle: 1.6 },
  { xOff: 10, yOff: -4, len: 6, angle: 1.8 },
  { xOff: 12, yOff: -5, len: 5, angle: 1.9 },
  { xOff: 14, yOff: -6, len: 4, angle: 2.0 }
];

const LOWER_TEETH = [
  { xOff: 5, yOff: 4, dropMult: 0.3, len: 5, angle: -1.2 },
  { xOff: 8, yOff: 2, dropMult: 0.5, len: 7, angle: -1.3 },
  { xOff: 11, yOff: 0, dropMult: 0.7, len: 9, angle: -1.4 },
  { xOff: 14, yOff: -2, dropMult: 0.9, len: 7, angle: -1.5 },
  { xOff: 16, yOff: -4, dropMult: 1.0, len: 5, angle: -1.6 }
];

const NEUROMASTS = [
  [-14, 0], [-11, -2], [-7, -4], [-3, -6], [2, -7], [7, -7]
];

function setup() {
  snow = [];
  for (let i = 0; i < SNOW_COUNT; i++) {
    snow.push({
      x: Math.random() * 64,
      y: Math.random() * 64,
      vy: 0.6 + Math.random() * 1.4,
      vx: (Math.random() - 0.5) * 0.4,
      b: 0.25 + Math.random() * 0.65
    });
  }
}

function render(t, dt) {
  fade(0.85);

  const daylight = input.clock.daylight;
  const audioLevel = input.audio.ok ? input.audio.level : 0;
  const bass = input.audio.ok ? input.audio.bass : 0;

  // Background Bathypelagic Water Column (deep aphotic void at night, deep blue by day)
  if (daylight > 0.05) {
    const dVal = (daylight * 10) | 0;
    for (let y = 0; y < 64; y += 4) {
      const grad = (1.0 - y / 64) * 0.6 + 0.4;
      const b = (dVal * grad) | 0;
      const g = (b * 0.4) | 0;
      const r = (b * 0.15) | 0;
      for (let x = 0; x < 64; x += 4) {
        setPixel(x, y, rgb(r, g, b));
      }
    }
  }

  // --- Kinematic Strike State Machine ---
  phaseTimer += dt;

  // Button interaction: immediate predatory lunge strike
  if (input.button.pressed && strikePhase === 0) {
    strikePhase = 1;
    phaseTimer = 0;
    prey.x = fishX + 18;
  }

  if (strikePhase === 0) {
    // 0. Luring: esca bobs gently, jaws breathe, prey approaches
    jawOpen = 0.12 + 0.10 * Math.sin(t * 1.6);
    fishX = 22 + Math.sin(t * 0.8) * 0.8;
    fishY = 34 + Math.cos(t * 0.6) * 0.6;

    const targetY = escaY + 5;
    prey.y += (targetY - prey.y) * 1.5 * dt;
    prey.x += prey.vx * dt;

    if (prey.x < escaX + 2.0) {
      // Trigger vacuum strike!
      strikePhase = 1;
      phaseTimer = 0;
    }
  } else if (strikePhase === 1) {
    // 1. Strike Lunge & Gaping Vacuum Suction
    jawOpen = Math.min(1.0, phaseTimer * 6.0);
    fishX += 28.0 * dt; // explosive forward lunge
    prey.x -= 26.0 * dt; // sucked into mouth cavity
    prey.y += (fishY - prey.y) * 9.0 * dt;

    if (phaseTimer > 0.28) {
      strikePhase = 2; // snap shut!
      phaseTimer = 0;
      prey.swallowed = true;
    }
  } else if (strikePhase === 2) {
    // 2. Snap Shut: jaws violently clamp shut with esca alarm flash
    jawOpen = Math.max(0, 1.0 - phaseTimer * 7.0);
    fishX -= 14.0 * dt; // backward recoil
    if (phaseTimer > 0.40) {
      strikePhase = 3;
      phaseTimer = 0;
    }
  } else if (strikePhase === 3) {
    // 3. Digest: distended belly slowly digests glowing prey
    jawOpen = 0.08 + 0.06 * Math.sin(t * 2.0);
    fishX += (22 - fishX) * 1.2 * dt; // drift back to stalking lair
    fishY += (34 - fishY) * 1.2 * dt;
    prey.glow = Math.max(0, 1.0 - phaseTimer * 0.15);

    if (phaseTimer > 7.0) {
      // Reset cycle with a new prey organism
      strikePhase = 0;
      phaseTimer = 0;
      prey.type = (prey.type + 1) % 3;
      prey.x = 62;
      prey.y = 22 + (Math.random() - 0.5) * 8;
      prey.swallowed = false;
      prey.glow = 1.0;
    }
  }

  // Esca position and organic bobbing
  const bobFreq = 1.8 + audioLevel * 2.2;
  const bobX = Math.sin(t * bobFreq) * 1.8 + Math.cos(t * 3.7) * 0.7;
  const bobY = Math.cos(t * 1.4) * 2.2 + Math.sin(t * 2.9) * 0.8;
  const whipX = (strikePhase === 1) ? -4.5 : 0;
  escaX = fishX + 21 + bobX + whipX;
  escaY = fishY - 18 + bobY;

  const cx = fishX, cy = fishY;

  // --- 1. Anglerfish Body (Globose head, distensible belly, raking light) ---
  for (let py = 18; py <= 53; py++) {
    const dy = py - cy;
    for (let px = 5; px <= 43; px++) {
      const dx = px - cx;

      const rx = dx > 0 ? 14.5 : 17.5;
      // Belly distends when prey is inside
      const bellyDistend = (prey.swallowed && prey.glow > 0.05 && dy > 0 && dx < 2) ? prey.glow * 4.2 : 0;
      const ry = dy > 0 ? (15.0 + bellyDistend) : 13.5;

      const dNorm = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);

      // Curved oblique mouth cleft
      const cleftY = (cy + 4) - (dx - 2) * 0.65;
      const mouthGap = jawOpen * 7.5;
      const inMouth = (dx >= 3 && dx <= 14 && py >= (cleftY - mouthGap * 0.4) && py <= (cleftY + mouthGap * 0.8));

      if (dNorm <= 1.05 && !inMouth) {
        const lx = escaX - px;
        const ly = escaY - py;
        const dEsca = Math.hypot(lx, ly);
        const invD = 1.0 / (dEsca + 0.1);

        const nx = dx / rx;
        const ny = dy / ry;
        const dot = (nx * lx + ny * ly) * invD;
        const lightDist = Math.max(0, 1.0 - dEsca / 40.0);

        // A. Direct raking specular highlight on cranial crest and snout
        let spec = 0;
        if (dot > 0.05 && lightDist > 0.05) {
          spec = Math.pow(dot * lightDist, 2.3) * 2.2;
        }

        // B. Grazing dorsal rim light (Fresnel scattering along upper silhouette)
        let rim = 0;
        if (dNorm > 0.72 && dNorm <= 1.05) {
          const edgeDist = (dNorm - 0.72) / 0.33;
          const rimFacing = Math.max(0, -ny * 0.75 + nx * 0.45);
          rim = edgeDist * rimFacing * lightDist * 1.5;
        }

        // C. Velvety melanistic skin baseline (deep slate-charcoal with indigo undertone)
        const bodyDepth = (1.0 - dNorm);
        const ambientSlate = clamp(bodyDepth * 16 + lightDist * 7, 3, 26);

        let r = (ambientSlate * 0.35 + spec * 28 + rim * 32) | 0;
        let g = (ambientSlate * 0.65 + spec * 145 + rim * 175) | 0;
        let b = (ambientSlate * 1.10 + spec * 210 + rim * 245) | 0;

        // D. Dermal Spinules: microscopic denticles catching glints
        const spinule = Math.sin(px * 4.1 + py * 5.9);
        if (spinule > 0.84 && lightDist > 0.22) {
          const sGlint = (spinule - 0.84) * 6.0 * lightDist;
          r = clamp(r + ((sGlint * 45) | 0), 0, 255);
          g = clamp(g + ((sGlint * 185) | 0), 0, 255);
          b = clamp(b + ((sGlint * 245) | 0), 0, 255);
        }

        // E. Swallowed Prey Bioluminescent Stomach Translucency
        if (prey.swallowed && prey.glow > 0.05) {
          const stomachDx = px - (cx - 3);
          const stomachDy = py - (cy + 6);
          const dStomach = Math.hypot(stomachDx, stomachDy);
          if (dStomach < 8.0) {
            const sGlow = (1.0 - dStomach / 8.0) * prey.glow * 0.75;
            let pr = 45, pg = 175, pb = 240;
            if (prey.type === 1) { pr = 30; pg = 230; pb = 140; } // emerald bristlemouth
            else if (prey.type === 2) { pr = 240; pg = 50; pb = 90; } // ruby sergestid prawn
            r = clamp(r + ((sGlow * pr) | 0), 0, 255);
            g = clamp(g + ((sGlow * pg) | 0), 0, 255);
            b = clamp(b + ((sGlow * pb) | 0), 0, 255);
          }
        }

        setPixel(px, py, rgb(clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255)));
      }
    }
  }

  // --- 2. Lateral Line System (Neuromast sensory organs) ---
  for (let i = 0; i < NEUROMASTS.length; i++) {
    const nx = cx + NEUROMASTS[i][0];
    const ny = cy + NEUROMASTS[i][1];
    const dEsca = Math.hypot(escaX - nx, escaY - ny);
    const glint = Math.max(0, 1.0 - dEsca / 36.0) * (0.75 + 0.25 * Math.sin(t * 3.0 + i));
    setPixel(nx, ny, rgb((glint * 45) | 0, (glint * 175) | 0, (glint * 245) | 0));
  }

  // --- 3. Pectoral Fin (Fan paddle on lower flank) ---
  const pecBaseX = cx - 3;
  const pecBaseY = cy + 5;
  const pecSway = Math.sin(t * 2.8) * 1.5;
  for (let ray = 0; ray < 5; ray++) {
    const ru = (ray / 4.0) - 0.5;
    for (let l = 1; l <= 5; l++) {
      const fx = (pecBaseX - l * 0.8) | 0;
      const fy = (pecBaseY + ru * 4 + l * 0.5 + pecSway) | 0;
      const fLum = 0.20 + 0.12 * Math.sin(t * 2.0 + ray);
      setPixel(fx, fy, rgb((fLum * 25) | 0, (fLum * 95) | 0, (fLum * 145) | 0));
    }
  }

  // --- 4. Caudal Fin (Tail fin rays wagging in current) ---
  const tailBaseX = (cx - 17) | 0;
  const tailBaseY = cy;
  const tailWag = Math.sin(t * 3.4) * (strikePhase === 1 ? 4.5 : 2.2);
  for (let ray = 0; ray < 7; ray++) {
    const ru = (ray / 6.0) - 0.5;
    for (let l = 1; l <= 6; l++) {
      const tx = (tailBaseX - l * 1.1) | 0;
      const ty = (tailBaseY + ru * (8 + l * 1.2) + tailWag * (l / 6.0)) | 0;
      const tLum = 0.18 + 0.10 * Math.sin(t * 2.0 + ray);
      setPixel(tx, ty, rgb((tLum * 22) | 0, (tLum * 90) | 0, (tLum * 140) | 0));
    }
  }

  // --- 5. Illicium (The Fishing Rod Spine from Snout to Esca) ---
  const rootX = cx + 6, rootY = cy - 10;
  const ctrlX = (rootX + escaX) * 0.5 - 5.0;
  const ctrlY = Math.min(rootY, escaY) - 9.0;

  for (let s = 0; s <= 28; s++) {
    const u = s / 28.0;
    const invU = 1.0 - u;
    const ix = (invU * invU * rootX + 2 * invU * u * ctrlX + u * u * escaX) | 0;
    const iy = (invU * invU * rootY + 2 * invU * u * ctrlY + u * u * escaY) | 0;
    const lum = 0.35 + 0.65 * u * u;
    setPixel(ix, iy, rgb((lum * 60) | 0, (lum * 190) | 0, (lum * 245) | 0));
  }

  // --- 6. Interlocking Needle Fangs Along Jaws ---
  // Upper Jaw
  for (let i = 0; i < UPPER_TEETH.length; i++) {
    const tooth = UPPER_TEETH[i];
    const baseX = cx + tooth.xOff;
    const baseY = cy + tooth.yOff;
    for (let l = 0; l <= tooth.len; l++) {
      const tx = (baseX + Math.cos(tooth.angle) * l) | 0;
      const ty = (baseY + Math.sin(tooth.angle) * l) | 0;
      const dEsca = Math.hypot(escaX - tx, escaY - ty);
      const glint = Math.max(0, 1.0 - dEsca / 28.0) * (0.85 + 0.15 * Math.sin(t * 4.0 + l));
      setPixel(tx, ty, rgb((glint * 220) | 0, (glint * 245) | 0, (glint * 255) | 0));
    }
  }

  // Lower Jaw (Recurved needle teeth extending with jaw drop)
  const jawDrop = jawOpen * 7.5;
  for (let i = 0; i < LOWER_TEETH.length; i++) {
    const tooth = LOWER_TEETH[i];
    const baseX = cx + tooth.xOff;
    const baseY = cy + tooth.yOff + jawDrop * tooth.dropMult;
    for (let l = 0; l <= tooth.len; l++) {
      const tx = (baseX + Math.cos(tooth.angle) * l) | 0;
      const ty = (baseY + Math.sin(tooth.angle) * l) | 0;
      const dEsca = Math.hypot(escaX - tx, escaY - ty);
      const glint = Math.max(0, 1.0 - dEsca / 28.0) * (0.85 + 0.15 * Math.cos(t * 5.0 + l));
      setPixel(tx, ty, rgb((glint * 225) | 0, (glint * 250) | 0, (glint * 255) | 0));
    }
  }

  // --- 7. Degenerate Milky Cornea (Eye) ---
  setPixel(cx + 3, cy - 8, rgb(55, 105, 135));
  setPixel(cx + 4, cy - 8, rgb(180, 230, 255)); // glint

  // --- 8. Esca (The Glowing Bulb & Crown Papillae) ---
  const ex = escaX | 0;
  const ey = escaY | 0;
  const flashBoost = (strikePhase === 2) ? 1.6 : 1.0;
  const pulse = (0.85 + 0.15 * Math.sin(t * 7.5)) * flashBoost;

  // Volumetric Esca Glow Aura
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      const d2 = dx * dx + dy * dy;
      if (d2 <= 16.0) {
        const fall = (1.0 - d2 / 16.0) * pulse;
        const er = clamp((fall * 70) | 0, 0, 255);
        const eg = clamp((fall * 225) | 0, 0, 255);
        const eb = clamp((fall * 255) | 0, 0, 255);
        const px = ex + dx;
        const py = ey + dy;
        if (px >= 0 && px < 64 && py >= 0 && py < 64) {
          setPixel(px, py, rgb(er, eg, eb));
        }
      }
    }
  }
  // Core diamond white photophore
  setPixel(ex, ey, rgb(255, 255, 255));
  setPixel(ex + 1, ey, rgb(235, 255, 255));
  setPixel(ex - 1, ey, rgb(235, 255, 255));
  setPixel(ex, ey + 1, rgb(235, 255, 255));
  setPixel(ex, ey - 1, rgb(235, 255, 255));

  // Trailing Esca Crown Papillae Filaments
  for (let f = 0; f < 4; f++) {
    const fAngle = 0.1 + f * 0.7 + Math.sin(t * 3.5 + f) * 0.4;
    const fx1 = (ex + Math.cos(fAngle) * 3) | 0;
    const fy1 = (ey + Math.sin(fAngle) * 3) | 0;
    const fx2 = (ex + Math.cos(fAngle + 0.25) * 6) | 0;
    const fy2 = (ey + Math.sin(fAngle + 0.25) * 6) | 0;
    setPixel(fx1, fy1, rgb(95, 230, 255));
    setPixel(fx2, fy2, rgb(48, 175, 240));
  }

  // --- 9. Prey Organisms (When Swimming Outside Stomach) ---
  if (!prey.swallowed) {
    const px = prey.x | 0;
    const py = prey.y | 0;
    if (prey.type === 0) {
      // Myctophum Lanternfish
      setPixel(px - 2, py, rgb(35, 50, 80));
      setPixel(px - 1, py, rgb(55, 80, 130));
      setPixel(px, py, rgb(80, 115, 165));
      setPixel(px + 1, py, rgb(105, 145, 205));
      setPixel(px + 2, py, rgb(135, 185, 245));
      // Ventral photophore pearl organs
      setPixel(px - 1, py + 1, rgb(70, 220, 255));
      setPixel(px, py + 1, rgb(70, 220, 255));
      setPixel(px + 1, py + 1, rgb(110, 240, 255));
      const wagY = py + (Math.sin(t * 14.0) * 1.5) | 0;
      setPixel(px - 3, wagY, rgb(45, 70, 110));
    } else if (prey.type === 1) {
      // Cyclothone Bristlemouth
      setPixel(px - 3, py, rgb(20, 40, 30));
      setPixel(px - 2, py, rgb(30, 65, 45));
      setPixel(px - 1, py, rgb(50, 100, 70));
      setPixel(px, py, rgb(70, 140, 95));
      setPixel(px + 1, py, rgb(110, 210, 140));
      setPixel(px + 1, py - 1, rgb(120, 255, 160)); // emerald suborbital organ
    } else {
      // Sergestes Scarlet Prawn
      setPixel(px - 2, py, rgb(90, 25, 30));
      setPixel(px - 1, py, rgb(140, 35, 45));
      setPixel(px, py, rgb(190, 50, 60));
      setPixel(px + 1, py, rgb(230, 70, 80));
      setPixel(px + 2, py - 1, rgb(255, 140, 160)); // sensory antennae
      setPixel(px, py + 1, rgb(60, 210, 255)); // cyan photophore
    }
  }

  // --- 10. Marine Snow with Strike Suction Vortex ---
  for (let i = 0; i < SNOW_COUNT; i++) {
    const s = snow[i];
    s.y += s.vy * dt;
    s.x += s.vx * dt;

    if (strikePhase === 1) {
      // Suction vortex toward mouth during vacuum strike
      const mouthX = cx + 14;
      const mouthY = cy + 2;
      const dx = mouthX - s.x;
      const dy = mouthY - s.y;
      const d = Math.hypot(dx, dy);
      if (d < 26.0) {
        s.x += (dx / d) * 18.0 * dt;
        s.y += (dy / d) * 18.0 * dt;
      }
    }

    if (s.y >= 64) { s.y = 0; s.x = Math.random() * 64; }
    if (s.x < 0) s.x += 64;
    if (s.x >= 64) s.x -= 64;

    const sx = s.x | 0;
    const sy = s.y | 0;
    if (sx >= 0 && sx < 64 && sy >= 0 && sy < 64) {
      const dEsca = Math.hypot(escaX - sx, escaY - sy);
      const snowLight = Math.max(0, 1.0 - dEsca / 30.0);
      const b = (s.b + snowLight * 0.7);
      const sb = clamp((b * 165) | 0, 0, 255);
      setPixel(sx, sy, rgb((sb * 0.4) | 0, (sb * 0.75) | 0, sb));
    }
  }
}
