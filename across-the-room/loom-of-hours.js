/*@vfx
id: 425eb2d2-c91f-4332-9f17-3f21a11d2296
title: Loom of Hours
created: 2026-10-12
artist: E-Line (apprentice name)
influences: [Greenberg-Hastings cyclic cellular automata]
rationale: |
  First cellular-automaton piece in the library. A cyclic CA was chosen
  specifically because it has no settling attractor: random noise
  self-organizes into rotating spirals that keep every cell cycling
  indefinitely, answering the long-run collapse trap in VFX_API.md.
  Palette drifts with clock.daylight (cool indigo at night, ember-warm
  by day); audio beats inject patches of fresh turbulence so the room
  can stir the loom.
@vfx*/

// loom_of_hours — buffer mode, cyclic cellular automaton
// A Greenberg-Hastings cyclic CA: every cell cycles through N states,
// advancing only when a neighbor is already one step ahead. From random
// noise this self-organizes into rotating spirals that sustain
// indefinitely — no attractor, no collapse. Demonstrates: typed-array
// double-buffered CA state, toroidal wrap via row-offset precomputation,
// fixed-timestep logic decoupled from frame rate, a per-frame state->
// color palette so per-pixel cost is one array index, clock-reactive
// palette drift, and beat-driven turbulence injection.

const meta = { name: "loom_of_hours", fps: 30, inputs: ["clock", "audio"] };

const N = 14;                    // cyclic states
const STEP_INTERVAL = 1 / 12;    // CA logic rate (Hz), decoupled from fps
const SPAN = 0.45;               // hue wheel span of the state ramp

const cur = new Uint8Array(WIDTH * HEIGHT);
const nxt = new Uint8Array(WIDTH * HEIGHT);
const pal = new Int32Array(N);

let acc = 0;

function setup() {
  for (let i = 0; i < cur.length; i++) cur[i] = (Math.random() * N) | 0;
}

// Cyclic (Greenberg-Hastings) rule, threshold 1, Moore neighborhood,
// toroidal wrap: a cell advances to state (s+1)%N if any neighbor is
// already there. With threshold 1 on 64x64 this never stabilizes —
// once spirals nucleate they keep every cell cycling forever.
function stepCA() {
  for (let y = 0; y < HEIGHT; y++) {
    const yc = y * WIDTH;
    const yu = (y === 0 ? HEIGHT - 1 : y - 1) * WIDTH;
    const yd = (y === HEIGHT - 1 ? 0 : y + 1) * WIDTH;
    for (let x = 0; x < WIDTH; x++) {
      const xl = x === 0 ? WIDTH - 1 : x - 1;
      const xr = x === WIDTH - 1 ? 0 : x + 1;
      const s = cur[yc + x];
      const eat = s + 1 === N ? 0 : s + 1;
      if (
        cur[yu + xl] === eat || cur[yu + x] === eat || cur[yu + xr] === eat ||
        cur[yc + xl] === eat || cur[yc + xr] === eat ||
        cur[yd + xl] === eat || cur[yd + x] === eat || cur[yd + xr] === eat
      ) {
        nxt[yc + x] = eat;
      } else {
        nxt[yc + x] = s;
      }
    }
  }
  cur.set(nxt);
}

function render(t, dt) {
  // Palette: state ramp across a constrained hue span, dark floor at
  // state 0, f*f perceptual value curve. Base hue follows daylight —
  // cool indigo at night, ember-warm by day — and drifts slowly with t
  // so the mood never repeats outright (hsv() wraps hue internally).
  const daylight = input.clock.daylight;
  const baseHue = lerp(0.62, 0.06, daylight) + t * 0.0025;
  for (let i = 0; i < N; i++) {
    const f = i / (N - 1);
    pal[i] = hsv(baseHue + f * SPAN, 0.85, 0.05 + 0.85 * f * f);
  }

  // Fixed-timestep CA: accumulate real time, step at 12 Hz regardless
  // of host frame rate, so the weave breathes at the same pace at 15 or
  // 60 fps.
  acc += dt;
  while (acc >= STEP_INTERVAL) { stepCA(); acc -= STEP_INTERVAL; }

  // Beats stir the loom: randomize a small patch so fresh spirals
  // nucleate out of the music. In silence the piece needs nothing.
  if (input.audio.beat) {
    const px = (Math.random() * (WIDTH - 8)) | 0;
    const py = (Math.random() * (HEIGHT - 8)) | 0;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        cur[(py + y) * WIDTH + px + x] = (Math.random() * N) | 0;
      }
    }
  }

  for (let y = 0; y < HEIGHT; y++) {
    const yc = y * WIDTH;
    for (let x = 0; x < WIDTH; x++) setPixel(x, y, pal[cur[yc + x]]);
  }
}
