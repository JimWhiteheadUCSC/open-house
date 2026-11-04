/*@vfx
id: dfb0f7d5-5672-4253-86cb-1011c069f5ce
title: The Second Hand Is a Moon
created: 2026-10-13
artist: Solyanka (apprentice name)
lineage:
  - id: a6d3e226-2b2e-4810-b055-4ddb53fda402
    relation: inspiration
    note: the draft manifesto's central claim — time as material, not parameter —
      taken literally; where Ring Count stratified the last minutes into rings,
      this piece is a timepiece outright; first of the five ratification pieces
  - id: e53d741a-eb31-4ff3-9a74-f4db0b13a75b
    relation: contrast
    note: refuses clock-as-lighting; every prior piece used input.clock to re-chord
      or dim, here the clock is the content — the rotations ARE the hour and minute
  - id: 813cde1b-11a3-4a24-9d1b-1aceb82a3e69
    relation: inspiration
    note: one warm voice admitted to a cool field as event (the moon), after the
      stones; a piece must answer for its eighth minute, so an honest clockface
      needs its weather — sweeps, chimes, meteors, a tide
influences:
  - verena-loewensberg
  - okazz
  - mizuki-heitaro
rationale: |
  Thirteenth piece of the practice, the first to stand between the Ring Count
  draft and its ratification. The bestiary's last mother-effect claimed: vector
  balls / the dot sphere — as an instrument. A fibonacci dot-sphere yaws once
  per twelve hours, a brighter jewel riding it (the hour hand, legible against
  a fixed tick at twelve); an inner ring rolls once per hour (the minute hand);
  and the second hand is a moon — amber, the one warm voice the practice's
  cool fields admit, orbiting once per panel-minute on a whispered ghost orbit.
  Loewensberg holds the frame: chord of neighbors (teal to violet, never green),
  depth doing value's work, the jewel's near-white the chord's open note. Okazz
  holds the meter: the moon's orbit is the duty cycle, beats flare it, silence
  keeps a 4.5s chime, meridian sweeps of light round the sphere every 8 and 13
  seconds, rare meteors cross the instrument, and a three-swell luminance tide
  breathes through everything — an honest clockface cannot move its hands (the
  wall shows seconds, not hours), so a timepiece piece must carry its own
  weather. Heitaro's side taken in the standing argument: geometry is FOR
  something — ornament with a job, the household's time made celestial; a piece
  that can be read, like Bolt of Hours' bolt, at a glance and at a stare.
@vfx*/

// The Second Hand Is a Moon — buffer mode
// A celestial clock: a fibonacci dot-sphere yawing once per 12 hours (a
// brighter jewel rides it — the hour hand), an inner ring rolling once per
// hour (the minute hand), and a warm moon orbiting once per panel-minute
// (the second hand). The clock input is the content, not the lighting.

const meta = { name: "second_hand_moon", fps: 30, inputs: ["audio", "clock"] };

const TAU = Math.PI * 2;

// --- hour sphere ------------------------------------------------------------
const NP = 120;
const pX = new Float32Array(NP), pY = new Float32Array(NP), pZ = new Float32Array(NP);
const pH = new Float32Array(NP), pS = new Float32Array(NP), pV = new Float32Array(NP);
for (let i = 0; i < NP; i++) {
  const y = 1 - 2 * (i + 0.5) / NP;
  const r = Math.sqrt(1 - y * y);
  const a = i * 2.3999632;             // golden angle
  pX[i] = r * Math.cos(a); pY[i] = y; pZ[i] = r * Math.sin(a);
  pH[i] = 0.55 + 0.20 * (((i * 7) % NP) / NP);   // teal..violet, never green
  pS[i] = 0.55 + 0.25 * (((i * 11) % NP) / NP);
  pV[i] = 0.35 + 0.55 * (((i * 13) % NP) / NP);
}

// --- minute ring ------------------------------------------------------------
const NR = 22;
const rA = new Float32Array(NR);
for (let i = 0; i < NR; i++) rA[i] = TAU * i / NR;

// --- stars ------------------------------------------------------------------
const NS = 34;
const stX = new Float32Array(NS), stY = new Float32Array(NS);
const stW = new Float32Array(NS), stP = new Float32Array(NS), stH = new Float32Array(NS);
function hash(n) { return fract(Math.sin(n * 127.1 + 311.7) * 43758.5453); }
for (let i = 0; i < NS; i++) {
  stX[i] = 2 + 60 * hash(i * 3 + 1);
  stY[i] = 2 + 60 * hash(i * 3 + 2);
  stW[i] = 0.5 + 1.3 * hash(i * 3 + 3);
  stP[i] = TAU * hash(i * 7 + 4);
  stH[i] = 0.55 + 0.15 * hash(i * 5 + 5);
}

// --- state ------------------------------------------------------------------
let flareT0 = -10, flareAmp = 0, lastChime = -10;
let mt0 = -10, mX0 = 0, mY0 = 0, mDX = 0, mDY = 0, nextMeteor = 14;

// --- drawing helpers ----------------------------------------------------------
function addP(x, y, r, g, b, a) {
  if (a <= 0.004) return;
  const p = getPixel(x, y);
  setPixel(x, y, rgb(((p >> 16) & 255) + r * a, ((p >> 8) & 255) + g * a, (p & 255) + b * a));
}

function splat(x, y, r, g, b, a) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const fx = x - xi, fy = y - yi;
  addP(xi, yi, r, g, b, a * (1 - fx) * (1 - fy));
  addP(xi + 1, yi, r, g, b, a * fx * (1 - fy));
  addP(xi, yi + 1, r, g, b, a * (1 - fx) * fy);
  addP(xi + 1, yi + 1, r, g, b, a * fx * fy);
}

function dot(cx, cy, rad, r, g, b, bright) {
  const x0 = Math.max(0, (cx - rad - 1) | 0), x1 = Math.min(63, (cx + rad + 1) | 0);
  const y0 = Math.max(0, (cy - rad - 1) | 0), y1 = Math.min(63, (cy + rad + 1) | 0);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      const a = smoothstep(rad + 0.5, rad - 1.1, d) * bright;
      if (a > 0) addP(x, y, r, g, b, a);
    }
  }
}

function render(t, dt) {
  const dl = input.clock.daylight;
  const lvl = input.audio.ok ? input.audio.level : 0;

  // beats flare the moon; silence keeps its own slow chime
  if (input.audio.beat) { flareT0 = t; flareAmp = 0.5 + 0.5 * lvl; lastChime = t; }
  else if (t - lastChime > 4.5) { lastChime = t; if (t - flareT0 > 2.0) { flareT0 = t; flareAmp = 0.75; } }
  const flare = flareAmp * Math.exp(-(t - flareT0) * 1.8);

  // the tide: three incommensurate swells so no quarter-minute sits still
  const tide = 1 + 0.30 * Math.sin(t * 0.21 + 1.3) + 0.18 * Math.sin(t * 0.083) + 0.14 * Math.sin(t * 0.47);

  fill(hsv(0.70, 0.42, (0.016 + 0.05 * dl) * (0.7 + 0.5 * tide * 0.6)));

  // stars
  for (let i = 0; i < NS; i++) {
    const v = (0.03 + 0.14 * (0.5 + 0.5 * Math.sin(t * stW[i] + stP[i]))) * (0.7 + 0.5 * dl) * tide;
    setPixel(stX[i] | 0, stY[i] | 0, hsv(stH[i], 0.35, v > 1 ? 1 : v));
  }

  // the twelve o'clock tick — the instrument's fixed reference
  const tick = hsv(0.62, 0.3, (0.10 + 0.06 * dl) * tide);
  setPixel(32, 2, tick); setPixel(32, 3, tick);

  // ghost orbit — the moon's path, whispered
  const oc = hsv(0.68, 0.4, (0.045 + 0.02 * dl) * tide);
  const ocr = (oc >> 16) & 255, ocg = (oc >> 8) & 255, ocb = oc & 255;
  for (let k = 0; k < 48; k++) {
    const a = TAU * k / 48;
    addP((32 + 27.5 * Math.cos(a)) | 0, (32 + 16.5 * Math.sin(a)) | 0, ocr, ocg, ocb, 1);
  }

  // --- hour sphere: yaw = the hour, swayed but never drifting ----------------
  const hr = input.clock.hour;
  const hy = ((hr % 12) + 12) % 12;
  const yaw = TAU * hy / 12 + 0.13 * Math.sin(t * 0.021);
  const roll = 0.35 + 0.10 * Math.sin(t * 0.0163 + 2.1);
  const cyw = Math.cos(yaw), syw = Math.sin(yaw);
  const cro = Math.cos(roll), sro = Math.sin(roll);
  const breathe = 1 + 0.06 * Math.sin(t * 0.45) + 0.10 * flare;
  const RS = 21 * breathe;
  const sweep = TAU * (t / 8);
  const sweep2 = -TAU * (t / 13) + 2.0;
  const hueDrift = 0.02 * dl + t * 0.0004;
  const vScale = (0.85 + 0.35 * dl) * tide * (1 + 0.18 * lvl) * (1 + 1.3 * flare);

  for (let i = 0; i < NP; i++) {
    const x1 = pX[i] * cyw + pZ[i] * syw;
    const z1 = pZ[i] * cyw - pX[i] * syw;
    const x2 = x1 * cro - pY[i] * sro;
    const y2 = x1 * sro + pY[i] * cro;
    const depth = 0.30 + 0.70 * smoothstep(-1, 1, z1);
    const lon = Math.atan2(z1, x1);
    let d1 = lon - sweep; d1 -= TAU * Math.round(d1 / TAU);
    let d2 = lon - sweep2; d2 -= TAU * Math.round(d2 / TAU);
    const boost = 1.2 * Math.exp(-d1 * d1 / 0.5) + 0.7 * Math.exp(-d2 * d2 / 0.6);
    const tw = 1 + 0.30 * Math.sin(t * (0.7 + (i % 5) * 0.19) + i * 1.7);
    let v = pV[i] * depth * vScale * tw * (1 + boost);
    if (v > 1) v = 1;
    const c = hsv(pH[i] + hueDrift, pS[i], v);
    splat(32 + x2 * RS, 32 + y2 * RS, (c >> 16) & 255, (c >> 8) & 255, c & 255, 0.9);
  }

  // the jewel — the hour hand, one bright rider on the sphere
  {
    const x1 = cyw, z1 = -syw;
    const x2 = x1 * cro, y2 = x1 * sro;
    const depth = 0.45 + 0.55 * smoothstep(-1, 1, z1);
    let v = 0.9 * depth * tide * (1 + 0.5 * flare);
    if (v > 1) v = 1;
    const c = hsv(0.60, 0.22, v);
    dot(32 + x2 * RS, 32 + y2 * RS, 2.3, (c >> 16) & 255, (c >> 8) & 255, c & 255, 1);
  }

  // --- minute ring: one roll per hour, tilted --------------------------------
  const mang = TAU * fract(hr);
  const cmn = Math.cos(mang), smn = Math.sin(mang);
  const tilt = 0.55, cti = Math.cos(tilt), sti = Math.sin(tilt);
  const RR2 = 13.5 * breathe;
  for (let i = 0; i < NR; i++) {
    const ca = Math.cos(rA[i]), sa = Math.sin(rA[i]);
    const x1 = ca * cmn + sa * smn;
    const z1 = sa * cmn - ca * smn;
    const y2 = -z1 * sti;
    const z2 = z1 * cti;
    const depth = 0.30 + 0.70 * smoothstep(-1, 1, z2);
    const mk = i === 0;
    let v = (mk ? 0.95 : 0.55 + 0.30 * ((i % 3) / 3)) * depth * vScale * (1 + 0.6 * flare);
    if (!mk) v *= 1 + 0.18 * Math.sin(t * (0.8 + (i % 4) * 0.23) + i * 2.3);
    if (v > 1) v = 1;
    const c = hsv(0.52 + 0.08 * ((i % 4) / 4) + hueDrift, 0.6, v);
    if (mk) dot(32 + x1 * RR2, 32 + y2 * RR2, 1.9, (c >> 16) & 255, (c >> 8) & 255, c & 255, 1);
    else splat(32 + x1 * RR2, 32 + y2 * RR2, (c >> 16) & 255, (c >> 8) & 255, c & 255, 0.85);
  }

  // --- the moon: the second hand, one orbit per panel-minute -------------------
  const ma = TAU * (t / 44);
  for (let k = 6; k >= 0; k--) {
    const a2 = ma - k * 0.10;
    const mx = 32 + 27.5 * Math.cos(a2);
    const my = 32 + 16.5 * Math.sin(a2);
    const mz = Math.sin(a2);
    const depth = 0.45 + 0.55 * smoothstep(-1, 1, mz);
    let v = depth * (0.9 + 0.35 * lvl) * tide * (1 + 0.9 * flare);
    if (k > 0) v *= 0.55 * Math.pow(0.62, k);
    if (v > 1) v = 1;
    const c = hsv(0.075, 0.85, v);
    if (k === 0) dot(mx, my, 2.4, (c >> 16) & 255, (c >> 8) & 255, c & 255, 1);
    else splat(mx, my, (c >> 16) & 255, (c >> 8) & 255, c & 255, 0.8);
  }

  // meteors: rare sharp events crossing the instrument
  if (t >= nextMeteor) {
    mt0 = t;
    const side = (Math.random() * 4) | 0;
    const u = 6 + Math.random() * 52;
    mX0 = side === 0 ? u : side === 1 ? 58 : side === 2 ? u : 6;
    mY0 = side === 0 ? 6 : side === 1 ? u : side === 2 ? 58 : u;
    const tx = 32 + (Math.random() - 0.5) * 24;
    const ty = 32 + (Math.random() - 0.5) * 24;
    const dx = tx - mX0, dy = ty - mY0;
    const L = Math.sqrt(dx * dx + dy * dy) || 1;
    mDX = dx / L; mDY = dy / L;
    nextMeteor = t + 12 + Math.random() * 10;
  }
  const mage = t - mt0;
  if (mage < 0.55) {
    const hx = mX0 + mDX * mage * 95, hy2 = mY0 + mDY * mage * 95;
    for (let k = 5; k >= 0; k--) {
      const px = hx - mDX * k * 1.5, py = hy2 - mDY * k * 1.5;
      let v = (1 - mage / 0.55) * (k === 0 ? 0.95 : 0.5 * Math.pow(0.6, k));
      const c = hsv(0.58, 0.25, v);
      if (k === 0) dot(px, py, 1.6, (c >> 16) & 255, (c >> 8) & 255, c & 255, 1);
      else splat(px, py, (c >> 16) & 255, (c >> 8) & 255, c & 255, 0.8);
    }
  }
}
