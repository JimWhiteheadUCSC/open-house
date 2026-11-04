/*@vfx
id: c95d9f08-d7b3-4337-b72d-29a4664f53e6
title: Vespers
created: 2026-10-13
artist: Dither (apprentice name)
lineage:
  - id: 2bba4eb5-cd9b-4f2a-bb27-b5929bd67d43
    relation: contrast
    note: every firefly wanders alone, a spark answerable to nothing; here no bird is itself - the hundred-and-ten move as one body, and the body is the subject. Wander kept (wind, noise), independence refused.
  - id: 786d950d-b998-470d-91c2-8bd1c692b0a3
    relation: inspiration
    note: the antagonist-event grammar - Fire Season's lightning is my falcon; a rare structured strike that reorganizes everything it touches, then is gone
  - id: f65335d1-47aa-49d2-bd62-90b6cc256c39
    relation: variation
    note: the shared weather grammar (rain tightens, daylight arcs the whole day) but inverted to the practice's first dark-on-light palette - a body of shadow against a bright dying sky, not fire on black
influences:
  - starling murmurations over reed beds at dusk, and the peregrine that comes to trouble them
  - the murmuration failure documented in knowledge/craft/attractors.md - boids merging to one lump under periodic stirring - answered here with strong separation, an ever-wandering thermal, an advancing spatial wind field, and a predator
  - demoscene boid/flocking effects; vespers, the evening office, when the birds settle
rationale: |
  Eleventh piece of the practice. The library falls, travels, spins,
  rises, interferes, flies, ripples, keeps watch, is inhabited and
  consumes - nothing in it GATHERS, and nothing is dark against the
  light. Vespers is a starling murmuration at dusk: a hundred and ten
  boids with strong separation orbiting a thermal that wanders on
  ever-advancing noise, stirred by a spatial wind field that also
  advances, so the system is externally forced and can never finish
  settling - the two fixes craft/attractors.md names for the earlier
  library's failed Murmuration, applied in work rather than in notes.
  A falcon stoops through on a wandering timer (a beat calls it early)
  and the flock bursts and re-forms. The birds are rendered as
  accumulated ink darkening the dusk sky - density, not dots, so the
  flock reads as one breathing body. The clock arcs the whole day:
  dawn streams them up off the reed bed, midday scatters them high
  and thin, dusk is the full murmuration, night settles them into
  the reeds with only an occasional hop. Rain tightens the flock;
  cloud dims the sky; audio level is agitation. In silence at midday
  it is just a few birds, high, minding their own business.
@vfx*/

// vespers — buffer mode, reactive (clock + env + audio)
// A starling murmuration at dusk. 110 boids: cohesion/alignment/strong
// separation, an orbited thermal wandering on ever-advancing noise, a
// spatially-varying advancing wind field (external forcing - no settle),
// and a falcon that stoops through on a wandering timer and scatters
// them. Rendered as ink density darkening the sky - the flock as one
// body. Clock arcs the day: dawn stream-up, thin midday, dusk
// murmuration, night roost in the reed bed.

const meta = { name: "vespers", fps: 30, inputs: ["clock", "env", "audio"] };

const NB = 110;
const birds = [];
for (let i = 0; i < NB; i++) {
  birds.push({
    x: 8 + Math.random() * 48, y: 16 + Math.random() * 30,
    vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12,
    rx: 7 + (i / NB) * 50 + (Math.random() - 0.5) * 2.5, ry: 55.5 + (i % 3)
  });
}

const INK = new Float32Array(4096);
const GLW = new Float32Array(4096);
for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
  const dx = x - 39, dy = y - 46;
  GLW[y * 64 + x] = Math.exp(-(dx * dx + dy * dy) / 210);
}
const SR = new Float32Array(64), SG = new Float32Array(64), SB = new Float32Array(64);

const stars = [];
for (let i = 0; i < 55; i++) stars.push({ x: (Math.random() * 64) | 0, y: (Math.random() * 42) | 0, ph: Math.random() * 6.28, rate: 0.4 + Math.random() * 1.6 });

const falcon = { on: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, timer: 10 + Math.random() * 14 };
let agit = 0;

function render(t, dt) {
  if (dt > 0.06) dt = 0.06;
  const day = clamp(input.clock.daylight, 0, 1);
  const rain = input.env.ok ? clamp(input.env.rain, 0, 1) : 0.1;
  const cloud = input.env.ok ? clamp(input.env.cloud, 0, 1) : 0.3;
  const level = input.audio.ok ? clamp(input.audio.level, 0, 1) : 0;
  agit += (level - agit) * Math.min(1, dt * 2);

  // the day's arc: night -> dusk -> day, dusk the wide middle band
  const k1 = smoothstep(0.02, 0.5, day);
  const k2 = smoothstep(0.45, 0.95, day);
  const duskF = k1 * (1 - k2);
  const night = 1 - k1;
  const dim = 1 - cloud * 0.25;

  // sky ramps: night indigo / dusk ember / pale day, per row
  for (let y = 0; y < 64; y++) {
    const g = y / 63;
    let dr, dg, db;
    if (g < 0.55) { const u = g / 0.55; dr = lerp(46, 128, u); dg = lerp(40, 74, u); db = lerp(84, 96, u); }
    else { const u = (g - 0.55) / 0.45; dr = lerp(128, 238, u); dg = lerp(74, 142, u); db = lerp(96, 78, u); }
    const nr = lerp(4, 15, g), ng = lerp(6, 17, g), nb = lerp(16, 32, g);
    const ar = lerp(142, 212, g), ag = lerp(176, 224, g), ab = lerp(214, 230, g);
    SR[y] = lerp(lerp(nr, dr, k1), ar, k2) * dim;
    SG[y] = lerp(lerp(ng, dg, k1), ag, k2) * dim;
    SB[y] = lerp(lerp(nb, db, k1), ab, k2) * dim;
  }

  const act = smoothstep(0.05, 0.22, day);   // roosted by night, flying by day

  // the thermal the flock works around: wanders on ever-advancing noise
  const tcx = 32 + 22 * noise2(t * 0.021, 7.7);
  const tcy = 26 + 13 * noise2(7.7, t * 0.019);

  // the falcon: rare, structured, gone again; a beat calls it early
  falcon.timer -= dt * (1 + agit);
  if (input.audio.ok && input.audio.beat && act > 0.3 && !falcon.on) falcon.timer = Math.min(falcon.timer, 0.01);
  if (!falcon.on && falcon.timer <= 0 && act > 0.3) {
    falcon.on = true;
    const dir = Math.random() < 0.5 ? 1 : -1;
    falcon.x = dir > 0 ? -4 : 68;
    falcon.y = tcy + (Math.random() - 0.5) * 16;
    falcon.vx = dir * (46 + Math.random() * 22);
    falcon.vy = (Math.random() - 0.5) * 10;
    falcon.life = 2.4;
  }
  if (falcon.on) {
    falcon.x += falcon.vx * dt; falcon.y += falcon.vy * dt; falcon.life -= dt;
    if (falcon.life <= 0 || falcon.x < -6 || falcon.x > 70) { falcon.on = false; falcon.timer = 16 + Math.random() * 26; }
  }

  const cohK = 0.6 + rain * 0.9;   // rain tightens the flock
  const maxV = (30 + agit * 14) * (0.35 + 0.65 * act);

  for (let i = 0; i < NB; i++) {
    const b = birds[i];
    let cX = 0, cY = 0, aVX = 0, aVY = 0, sX = 0, sY = 0, nn = 0;
    for (let j = 0; j < NB; j++) {
      if (j === i) continue;
      const o = birds[j];
      const dx = b.x - o.x, dy = b.y - o.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 110) {
        nn++; cX += o.x; cY += o.y; aVX += o.vx; aVY += o.vy;
        if (d2 < 20 && d2 > 0.001) { sX += dx / d2; sY += dy / d2; }
      }
    }
    let fx = 0, fy = 0;
    if (nn > 0) {
      const inv = 1 / nn;
      // anisotropic cohesion: vertical pull stronger than horizontal,
      // so the body reads wider than tall, like the real thing
      fx += (cX * inv - b.x) * cohK;
      fy += (cY * inv - b.y) * cohK * 1.6;
      fx += (aVX * inv - b.vx) * 0.8;
      fy += (aVY * inv - b.vy) * 0.8;
      fx += sX * 30; fy += sY * 30;
    }
    // the thermal: weak proportional pull (no target radius - cohesion
    // and separation set the flock's size), plus a mild swirl
    let dx = tcx - b.x, dy = tcy - b.y;
    let L = Math.sqrt(dx * dx + dy * dy); if (L < 0.001) L = 0.001;
    const ux = dx / L, uy = dy / L;
    fx += dx * 0.10 - uy * 5.5;
    fy += dy * 0.16 + ux * 5.5;
    // wind: spatially varying, ever advancing - the external forcing
    fx += noise2(b.x * 0.06, b.y * 0.06 + t * 0.12) * 13;
    fy += noise2(b.y * 0.06 + 31.7, b.x * 0.06 - t * 0.1) * 8;
    if (falcon.on) {
      dx = b.x - falcon.x; dy = b.y - falcon.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 420) {
        const d = Math.sqrt(d2) + 0.5;
        const f = 300 / (d2 + 6);
        fx += (dx / d) * f; fy += (dy / d) * f;
      }
    }
    fx *= act; fy *= act;
    const rp = 1 - act;
    if (rp > 0.01) {   // roost pull, fading in as the light goes
      fx += (b.rx - b.x) * 1.6 * rp;
      fy += (b.ry - b.y) * 3.0 * rp;
    }
    // soft sky bounds
    if (b.x < 6) fx += (6 - b.x) * 2.4; else if (b.x > 57) fx -= (b.x - 57) * 2.4;
    if (b.y < 4) fy += (4 - b.y) * 2.4; else if (b.y > 57) fy -= (b.y - 57) * 3.0;

    b.vx += fx * dt; b.vy += fy * dt;
    const damp = Math.exp(-(1.1 + rp * 3.5) * dt);
    b.vx *= damp; b.vy *= damp;
    const sp = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    if (sp > maxV) { const s = maxV / sp; b.vx *= s; b.vy *= s; }
    else if (act > 0.5 && sp < 3 && sp > 0.001) { const s = 3 / sp; b.vx *= s; b.vy *= s; }
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (act < 0.05 && Math.random() < 0.0015) b.vy -= 22;   // a night hop
  }

  // ink: the flock as density, not dots
  for (let i = 0; i < 4096; i++) INK[i] = 0;
  for (let i = 0; i < NB; i++) {
    const b = birds[i];
    const xi = b.x | 0, yi = b.y | 0;
    if (xi < 1 || xi > 62 || yi < 1 || yi > 62) continue;
    const k = yi * 64 + xi;
    INK[k] += 1;
    INK[k - 1] += 0.4; INK[k + 1] += 0.4; INK[k - 64] += 0.4; INK[k + 64] += 0.4;
    INK[k - 65] += 0.15; INK[k - 63] += 0.15; INK[k + 63] += 0.15; INK[k + 65] += 0.15;
  }

  const gR = 235 * duskF, gG = 120 * duskF, gB = 45 * duskF;
  for (let y = 0; y < 64; y++) {
    const row = y * 64;
    const sr = SR[y], sg = SG[y], sb = SB[y];
    for (let x = 0; x < 64; x++) {
      const i = row + x;
      const gl = GLW[i];
      const v = 1 / (1 + INK[i] * 0.85);
      setPixel(x, y, rgb((sr + gR * gl) * v, (sg + gG * gl) * v, (sb + gB * gl) * v));
    }
  }

  // the reed bed: a dark band the flock roosts into
  for (let y = 57; y < 64; y++) {
    const f = (y - 56) / 8;
    for (let x = 0; x < 64; x++) {
      const i = y * 64 + x;
      const v = 1 / (1 + INK[i] * 0.85);
      const dark = 0.32 - f * 0.18;
      setPixel(x, y, rgb(SR[y] * dark * (0.4 + 0.6 * v), SG[y] * dark * (0.4 + 0.6 * v), SB[y] * dark * (0.4 + 0.6 * v)));
    }
  }

  if (falcon.on) {
    const xi = falcon.x | 0, yi = falcon.y | 0;
    setPixel(xi, yi, rgb(2, 2, 4)); setPixel(xi - 1, yi, rgb(4, 4, 8));
    setPixel(xi + 1, yi, rgb(4, 4, 8)); setPixel(xi, yi + 1, rgb(4, 4, 8));
  }

  if (night > 0.5) {
    const sa = (night - 0.5) * 2 * (1 - cloud * 0.6);
    for (const s of stars) {
      const tw = 0.5 + 0.5 * Math.sin(t * s.rate + s.ph);
      const vv = sa * (0.2 + 0.6 * tw * tw);
      if (vv < 0.06) continue;
      setPixel(s.x, s.y, rgb(vv * 190, vv * 198, vv * 232));
    }
  }
}
