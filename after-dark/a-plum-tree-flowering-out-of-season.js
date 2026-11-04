/*@vfx
id: 8027ac5c-e7fa-42af-962e-bf475adde6f4
title: A Plum Tree, Flowering Out of Season
created: 2026-10-14
artist: Retrace (apprentice name)
influences: ["ukiyo-e plum-blossom prints (Hiroshige)"]
rationale: |
  First session; apprentice name Retrace (the beam's blanking return -
  each session a retrace to the top of the frame; the practice is what
  persists). The archive had fields (Plasma Bloom), particles
  (Fireflies), sprite characters (Koi Pond), and a reactive glow
  (Tide Pool Lantern), but nothing structural: no persistent FORM with
  a life cycle. Mid-October is the wrong season for plum blossom, which
  is the point - the panel flowers when the garden cannot. A
  recursively grown tree (setup-time structure, a first for this
  library) sways hard under noise gusts; buds cycle dormant -> opening
  -> open -> fading -> one falling petal, on randomized timers plus
  ever-advancing noise, so the piece never settles into an attractor.
  Clock input only: blossoms burn lantern-bright at night, subdued by
  day; neutral input (daylight 0.5) is an intentional overcast dusk.
@vfx*/

// plum_out_of_season — buffer mode
// A recursively branched tree grown once in setup(), swaying under
// noise-driven gusts (one noise3 per branch tip, linear bend gradient
// along its length - tip moves several px, root not at all). Buds run
// a slow state machine (dormant -> opening -> open -> fading),
// releasing a single petal that flutters down. Randomized timers +
// ever-advancing noise keep it from settling. Clock: night = brighter
// blossoms. Validation note: subtle sway/shimmer reads as "frozen" to
// the temporal-variance gate - sway needs ~3+ px of tip travel and
// shimmer needs deep amplitude (0.35..1.0), not a tasteful +-15%.

const meta = { name: "plum_out_of_season", fps: 30, inputs: ["clock"] };

const MAX_BUDS = 56;
const MAX_PETALS = 40;
const branches = [];
const buds = [];
const petals = [];

function grow(x, y, angle, steps, depth) {
  const pts = [];
  let px = x, py = y, a = angle;
  for (let i = 0; i < steps; i++) {
    a += (Math.random() - 0.5) * 0.4;
    px += Math.cos(a) * 1.7;
    py += Math.sin(a) * 1.7;
    if (px < 2 || px > WIDTH - 3 || py < 2 || py > HEIGHT - 1) break;
    pts.push({ x: px, y: py });
  }
  const bi = branches.length;
  branches.push({ pts, depth, sw: 0 });
  if (pts.length === 0) return;

  if (depth < 5 && steps > 3) {
    const tip = pts[pts.length - 1];
    const kids = depth === 0 ? 2 : (Math.random() < 0.75 ? 2 : 1);
    for (let k = 0; k < kids; k++) {
      const dir = k === 0 ? 1 : -1;
      grow(tip.x, tip.y, a + dir * (0.35 + Math.random() * 0.45),
           steps * (0.6 + Math.random() * 0.15), depth + 1);
    }
    if (depth >= 1 && Math.random() < 0.35 && branches.length < 60) {
      const mid = pts[(pts.length * 0.5) | 0];
      grow(mid.x, mid.y, a + (Math.random() < 0.5 ? 1 : -1) * (0.6 + Math.random() * 0.5),
           steps * 0.45, depth + 1);
    }
  }

  if (depth >= 2) {
    for (let i = 1; i < pts.length; i += 2) {
      if (buds.length < MAX_BUDS && Math.random() < 0.75) {
        buds.push({
          bi, pi: i, state: 0, timer: Math.random() * 18, dur: 1,
          phase: Math.random() * 6.283, hue: 0.9 + Math.random() * 0.06,
        });
      }
    }
  }
}

function setup() {
  grow(WIDTH / 2, HEIGHT - 1, -Math.PI / 2, 14, 0);
}

function drawBloom(x, y, hue, v, u) {
  if (v <= 0.02) return;
  setPixel(x, y, hsv(hue, 0.30, v));
  if (u > 0.45) {
    const pv = v * 0.75;
    setPixel(x + 1, y, hsv(hue, 0.55, pv));
    setPixel(x - 1, y, hsv(hue, 0.55, pv));
    setPixel(x, y + 1, hsv(hue, 0.55, pv));
    setPixel(x, y - 1, hsv(hue, 0.55, pv));
  }
  if (u > 0.85) {
    const dv = v * 0.35;
    setPixel(x + 1, y + 1, hsv(hue, 0.6, dv));
    setPixel(x - 1, y - 1, hsv(hue, 0.6, dv));
    setPixel(x + 1, y - 1, hsv(hue, 0.6, dv));
    setPixel(x - 1, y + 1, hsv(hue, 0.6, dv));
  }
}

function render(t, dt) {
  fill(rgb(2, 3, 9));

  const night = 1 - 0.45 * input.clock.daylight; // 1.0 at night, 0.55 midday
  const gust = 0.7 + 0.6 * (0.5 + 0.5 * noise2(t * 0.08, 3.7));

  // Branches: one noise3 per branch tip, bend gradient along its length.
  for (const br of branches) {
    const n = br.pts.length;
    if (n === 0) continue;
    const tip = br.pts[n - 1];
    br.sw = noise3(tip.x * 0.05, tip.y * 0.05, t * 0.22) * (1.3 + br.depth * 1.6) * gust;
    const bark = hsv(0.06, 0.45, 0.09 + br.depth * 0.02);
    for (let i = 0; i < n; i++) {
      const p = br.pts[i];
      setPixel((p.x + br.sw * (i / n)) | 0, p.y | 0, bark);
    }
  }

  // Buds and blossoms ride their branch's sway.
  for (const b of buds) {
    const br = branches[b.bi];
    const n = br.pts.length;
    if (n === 0) continue;
    const p = br.pts[b.pi];
    const x = (p.x + br.sw * (b.pi / n)) | 0;
    const y = p.y | 0;
    b.timer -= dt;
    if (b.state === 0) {
      setPixel(x, y, hsv(b.hue, 0.6, 0.10 * night));
      if (b.timer <= 0) { b.state = 1; b.dur = 0.7 + Math.random() * 0.7; b.timer = b.dur; }
    } else if (b.state === 1) {
      const u = 1 - b.timer / b.dur;
      drawBloom(x, y, b.hue, u * 0.95 * night, u);
      if (b.timer <= 0) { b.state = 2; b.timer = 2.5 + Math.random() * 5; }
    } else if (b.state === 2) {
      const shimmer = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 3.1 + b.phase));
      drawBloom(x, y, b.hue, 0.95 * night * shimmer, 1);
      if (b.timer <= 0) { b.state = 3; b.dur = 1.6; b.timer = b.dur; }
    } else {
      const u = b.timer / b.dur;
      drawBloom(x, y, b.hue, u * 0.8 * night, u);
      if (b.timer <= 0) {
        if (petals.length < MAX_PETALS) {
          petals.push({
            x, y, vx: (Math.random() - 0.5) * 2, vy: 1.5 + Math.random() * 2,
            phase: Math.random() * 6.283, life: 1,
          });
        }
        b.state = 0; b.timer = 3.5 + Math.random() * 9;
      }
    }
  }

  // Falling petals.
  for (let i = petals.length - 1; i >= 0; i--) {
    const p = petals[i];
    p.vy = Math.min(p.vy + 4 * dt, 6.5);
    p.x += (p.vx + Math.sin(t * 3 + p.phase) * 3.5) * dt;
    p.y += p.vy * dt;
    p.life -= dt * 0.25;
    if (p.life <= 0 || p.y > HEIGHT - 1) { petals.splice(i, 1); continue; }
    setPixel(p.x | 0, p.y | 0, hsv(0.95, 0.35, (0.12 + 0.5 * p.life) * night));
  }
}
