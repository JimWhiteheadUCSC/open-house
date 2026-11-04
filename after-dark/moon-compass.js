/*@vfx
id: ea393169-33eb-4247-bcf9-591b6cb67f58
title: Moon Compass
created: 2026-10-14
artist: Matiz (apprentice name)
influences: ["transverse orientation in nocturnal moths (celestial-compass navigation)", "Sottham & Schafer 1937; Dacke et al. 2013"]
rationale: |
  First original piece after studying the four seed exemplars (plasma
  field, particle swarm, sprite world, reactive lantern). It combines
  modes the seeds kept separate — a full-field ambient sky (pixel
  thinking) plus stateful characters (buffer thinking) — and makes the
  state machine, not the sprite, the subject: moths orbit by transverse
  orientation while the moon is visible; when a drifting cloud bank
  dims it past a threshold they lose their compass and scatter into
  noise-driven search, recapturing orbit when the moon returns. Audio
  reactivity follows the biology: loud treble (bat-band frequencies)
  makes moths skitter and flip orbit direction; beats flutter the
  stars. In silence the piece is a complete night: moon, halo, cloud
  banks, orbiting moths. Buffer-mode cost was handled by gridding the
  two full-field noise fields to 9x9 samples/frame with bilinear
  upsampling (the pixel-mode upsampling idiom, ported to buffer mode)
  and precomputing fixed-palette channel ratios instead of per-pixel
  hsv() calls; noise2 survives only in the ~80px moon disc, where
  texture frequency is high.
@vfx*/

// moon_compass — buffer mode, audio-reactive
// Moths navigate by the moon: they hold a fixed angle to it and so
// circle it. Clouds keep stealing their compass; they scatter and
// search until it returns. Loud treble (bat-band) makes them skitter.
// Silence degrades gracefully to a complete, breathing night sky.

const meta = { name: "moon_compass", fps: 30, inputs: ["audio"] };

const MX = 32, MY = 28, MR = 5.5; // moon center + disc radius
const CXS = 0.052, CYS = 0.075, CDT = 0.12; // cloud field scales
const NG = 9; // sky/cloud sample grid per axis (8px spacing)

const MOTH_UP = sprite(
  { b: rgb(226, 210, 176), w: rgb(190, 172, 138) },
  `
  w.b.w
  ww ww
  w...w
  `);
const MOTH_DOWN = sprite(
  { b: rgb(226, 210, 176), w: rgb(190, 172, 138) },
  `
  .....
  ww ww
  w.b.w
  `);
const MOTH_FRAMES = [MOTH_UP, MOTH_DOWN];

const STARS = [];
for (let i = 0; i < 12; i++) {
  STARS.push({
    x: (Math.random() * WIDTH) | 0,
    y: (Math.random() * HEIGHT) | 0,
    ph: Math.random() * 6.283,
    rt: 0.2 + Math.random() * 0.5,
  });
}

let moths = [];
let beatT = 0;

// Per-frame sky/cloud grids: the two full-field noise layers vary
// slowly across the panel, so sample them 9x9 and bilinearly upsample
// (the pixel-mode value-noise idiom, applied in buffer mode).
const __sky = new Float64Array(NG * NG);
const __cld = new Float64Array(NG * NG);
let __ct = -1;

function __rebuildSky(t) {
  for (let gy = 0; gy < NG; gy++) {
    const v = (gy / (NG - 1)) * 63;
    for (let gx = 0; gx < NG; gx++) {
      const u = (gx / (NG - 1)) * 63;
      __sky[gy * NG + gx] = noise3(u * 0.045, v * 0.045, t * 0.02);
      const a = noise3(u * CXS, v * CYS - 1.7, t * CDT);
      const b = noise3(u * CXS * 2.3 + 31.4, v * CYS * 2.3, t * CDT * 1.9);
      __cld[gy * NG + gx] = a * 0.68 + b * 0.32;
    }
  }
  __ct = t;
}

function __grid(g, x, y) {
  const gxf = (x / 63) * (NG - 1);
  const gyf = (y / 63) * (NG - 1);
  const gx0 = gxf | 0, gy0 = gyf | 0;
  const gx1 = gx0 + 1 < NG ? gx0 + 1 : gx0;
  const gy1 = gy0 + 1 < NG ? gy0 + 1 : gy0;
  const fx = gxf - gx0, fy = gyf - gy0;
  const n00 = g[gy0 * NG + gx0], n10 = g[gy0 * NG + gx1];
  const n01 = g[gy1 * NG + gx0], n11 = g[gy1 * NG + gx1];
  const nx0 = n00 + (n10 - n00) * fx;
  const nx1 = n01 + (n11 - n01) * fx;
  return nx0 + (nx1 - nx0) * fy;
}

function blendMax(a, b) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return rgb(ar > br ? ar : br, ag > bg ? ag : bg, ab > bb ? ab : bb);
}

function addMoth(i) {
  moths.push({
    ang: Math.random() * 6.283,
    r: 12 + i * 3.5 + Math.random() * 3, // orbit radius (px), spring-targeted per moth
    vr: 0,
    s: (Math.random() < 0.5 ? -1 : 1) * (6.5 + Math.random() * 3), // px/s tangential
    seed: i * 17.31 + 3.7,
    flap: Math.random() * 10,
    search: false,
  });
}

function setup() {
  for (let i = 0; i < 4; i++) addMoth(i);
}

function render(t, dt) {
  if (t !== __ct) __rebuildSky(t);

  const treble = input.audio.ok ? input.audio.treble : 0;
  const level = input.audio.ok ? input.audio.level : 0;
  if (input.audio.ok && input.audio.beat) beatT = 0.45;
  if (beatT > 0) beatT -= dt;

  // moon slow-brighten cycle, ~63 s
  const bright = 0.55 + 0.45 * Math.sin(t * 0.1 + 1.3);

  // --- full-field night sky + moonlit cloud banks (gridded, bilinear) ---
  // Palette is fixed (indigo), so channel ratios are precomputed
  // instead of per-pixel hsv() calls: hsv(0.63, 0.62, v) = v*(97,132,255).
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const nb = 0.5 + 0.5 * __grid(__sky, x, y);
      let v = 0.016 + 0.04 * nb * nb;
      const c = __grid(__cld, x, y);
      if (c > 0.35) {
        const s = smoothstep(0.35, 0.9, c);
        v += 0.055 * s * s * (0.35 + 0.65 * bright);
      }
      const vi = v * 255;
      setPixel(x, y, (((vi * 0.38) | 0) << 16) | (((vi * 0.516) | 0) << 8) | (vi | 0));
    }
  }

  // How much of the moon the cloud is hiding, sampled at its center.
  // This one scalar drives both the render and the moths' compass.
  const dim = clamp(1 - smoothstep(0.32, 0.78, __grid(__cld, MX, MY)) * 0.88, 0.10, 1);

  // --- moon halo (additive via max-blend; amber, fixed channel ratios) ---
  {
    const R = 22;
    const y0 = MY - R > 0 ? MY - R : 0, y1 = MY + R < 63 ? MY + R : 63;
    const x0 = MX - R > 0 ? MX - R : 0, x1 = MX + R < 63 ? MX + R : 63;
    const hscale = 0.34 * dim * (0.55 + 0.45 * bright);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x - MX, dy = y - MY;
        const d2 = dx * dx + dy * dy;
        if (d2 > 484) continue;
        const d = Math.sqrt(d2);
        const f = 1 - (d - 4.5) / 17.5;
        if (f <= 0) continue;
        const hv = hscale * f * f;
        if (hv <= 0.004) continue;
        const hi = hv * 255;
        setPixel(x, y, blendMax(getPixel(x, y), ((hi | 0) << 16) | (((hi * 0.61) | 0) << 8) | ((hi * 0.5) | 0)));
      }
    }
  }

  // --- stars (over the halo so they stay sharp; beats flutter them) ---
  const flutter = 1 + (beatT > 0 ? beatT * 0.8 : 0);
  for (let i = 0; i < STARS.length; i++) {
    const st = STARS[i];
    const w = 0.5 + 0.5 * Math.sin(t * st.rt * 6.283 * flutter + st.ph);
    const v = (0.05 + 0.11 * w * w) * 255;
    setPixel(st.x, st.y, blendMax(getPixel(st.x, st.y), (((v * 0.7) | 0) << 16) | (((v * 0.82) | 0) << 8) | (v | 0)));
  }

  // --- moon disc (real noise2 here: the texture frequency is high) ---
  {
    const ri = (MR + 1) | 0;
    const dscale = dim * (0.5 + 0.5 * bright);
    for (let y = MY - ri; y <= MY + ri; y++) {
      if (y < 0 || y > 63) continue;
      for (let x = MX - ri; x <= MX + ri; x++) {
        if (x < 0 || x > 63) continue;
        const dx = x - MX, dy = y - MY;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > MR) continue;
        const tex = 0.72 + 0.28 * (0.5 + 0.5 * noise2(x * 0.3 + t * 0.02, y * 0.3));
        const mv = (0.5 + 0.32 * (1 - d / MR)) * tex * dscale;
        const mi = mv * 255;
        setPixel(x, y, blendMax(getPixel(x, y), ((mi | 0) << 16) | (((mi * 0.625) | 0) << 8) | ((mi * 0.62) | 0)));
      }
    }
  }

  // --- moths: orbit by transverse orientation while the moon is out;
  //     scatter into noise-driven search when the cloud dims it ---
  for (let i = 0; i < moths.length; i++) {
    const m = moths[i];

    if (!m.search && dim < 0.45) m.search = true; // compass lost
    else if (m.search && dim > 0.62) {            // compass found (hysteresis)
      m.search = false;
      m.s = (Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 3.5);
    }

    // Bat-band avoidance: loud treble makes moths skitter and flip orbits.
    let skit = 0;
    if (level > 0.35) {
      skit = (level - 0.35) * (0.5 + treble) * 2.6;
      if (treble > 0.5 && Math.random() < treble * dt * 2.5) m.s = -m.s;
    }

    if (m.search) {
      const steer = noise3(m.ang * 3.1 + m.seed, m.r * 0.21, t * 0.5);
      m.s += (steer * 9 - m.s * 1.6) * dt;
      m.vr += (noise3(m.seed, t * 0.4, m.ang) * 8 - m.vr * 1.4) * dt;
    } else {
      const r0 = 11 + i * 3.2;
      m.vr += ((r0 - m.r) * 0.55 - m.vr * 0.9) * dt; // soft spring to own orbit radius
      m.vr += noise3(m.seed, m.ang * 2.0, t * 0.7) * (5 + skit * 9) * dt;
      if (Math.random() < dt * 0.06) m.s = -m.s; // occasional lazy loop-reversal
    }
    m.r += m.vr * dt;
    if (m.r < 7) { m.r = 7; if (m.vr < 0) m.vr = -m.vr * 0.6; }
    if (m.r > 28) { m.r = 28; if (m.vr > 0) m.vr = -m.vr * 0.6; }

    const dir = m.s >= 0 ? 1 : -1;
    m.ang += dir * (Math.abs(m.s) * (1 + skit) / m.r) * dt; // constant px/s tangential speed

    m.flap += dt * (7 + Math.abs(m.s) * 0.4 + skit * 9);

    const wob = Math.sin(m.flap * 1.7) * 1.3;
    const ca = Math.cos(m.ang), sa = Math.sin(m.ang);
    const px = MX + ca * (m.r + wob);
    const py = MY + sa * (m.r + wob) * 0.82; // slight ellipse for perspective

    // Moths are moonlit: they dim when the cloud does, and flicker as
    // their wings catch the light.
    const db = 0.45 + 0.55 * dim;
    const lit = 0.75 + 0.25 * Math.sin(m.flap * 3.7);
    blit(MOTH_FRAMES[(m.flap | 0) & 1], (px | 0) - 2, (py | 0) - 1, {
      brightness: db * lit,
      flipX: dir * ca < 0,
    });
  }
}
