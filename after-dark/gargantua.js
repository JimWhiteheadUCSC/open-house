/*@vfx
id: 5af7124f-bb5c-4b5f-bca3-87240d71d745
title: Gargantua
created: 2026-10-10
artist: Tessera (apprentice name)
influences: []
rationale: |
  A study in general relativistic ray optics and high-energy astrophysics:
  a supermassive Kerr black hole with a turbulent accretion disk viewed
  at high inclination, surrounded by gravitationally lensed dual arches
  and collimated Blandford-Znajek synchrotron jets. Demonstrates Luminet-style
  gravitational deflection of light rays over and under the event horizon,
  extreme relativistic Doppler beaming (blinding white-gold on the approaching
  limb transitioning to deep redshifted ruby on the receding limb),
  differential Keplerian rotation with magnetorotational instability (MRI)
  spirals, and an orbiting ISCO relativistic flare. Responsive to ambient
  audio (which drives accretion surges and jet shock knots), touch (tidal
  disruption shockwave), and the cosmic clock.
@vfx*/

// gargantua — buffer mode with general relativistic ray optics & accretion physics
// Demonstrates: Kerr frame-dragging shadow asymmetry, Luminet-style dual lensed arches,
// front equatorial disk occlusion, relativistic Doppler beaming & gravitational redshift,
// photon ring critical curve, Blandford-Znajek synchrotron jets, and interactive shockwaves.

const meta = { name: "gargantua", fps: 30, inputs: ["audio", "button", "clock"] };

const cx = 31.5, cy = 31.5;
const R_SHADOW = 8.2;
const R_ISCO = 7.2;
const R_OUT = 27.0;
const COS_I = 0.36;
const INV_COS_I = 1.0 / COS_I;
const SIN_I = Math.sqrt(1.0 - COS_I * COS_I);

// Precomputed thermal blackbody & synchrotron LUTs (256 entries each)
const DISK_LUT = new Int32Array(256);
const JET_LUT = new Int32Array(256);

// Precomputed background starfield
const STAR_COUNT = 36;
const starX = new Float32Array(STAR_COUNT);
const starY = new Float32Array(STAR_COUNT);
const starSpeed = new Float32Array(STAR_COUNT);
const starPhase = new Float32Array(STAR_COUNT);

{
  let s = 54321;
  function rnd() {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = s;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  }
  for (let i = 0; i < STAR_COUNT; i++) {
    starX[i] = rnd() * 64;
    starY[i] = rnd() * 64;
    starSpeed[i] = 1.2 + rnd() * 2.5;
    starPhase[i] = rnd() * Math.PI * 2;
  }
}

// Interactive flare & shockwave state
let shockwaveR = 0;
let shockwaveAmp = 0;
let beatKnot = 0;

function setup() {
  // 1. Build DISK_LUT: Continuous thermal blackbody progression
  // Low: smoldering ruby/crimson -> warm copper
  // Mid: incandescent amber -> golden saffron
  // High: warm gold -> blinding diamond white-hot core
  for (let i = 0; i < 256; i++) {
    const u = i / 255.0;
    if (u <= 0) {
      DISK_LUT[i] = 0;
      continue;
    }
    let h, s, v;
    if (u < 0.35) {
      const f = u / 0.35;
      h = lerp(0.005, 0.045, f);
      s = lerp(0.99, 0.94, f);
      v = lerp(0.12, 0.65, f * f);
    } else if (u < 0.70) {
      const f = (u - 0.35) / 0.35;
      h = lerp(0.045, 0.115, f);
      s = lerp(0.94, 0.68, f);
      v = lerp(0.65, 0.92, f);
    } else {
      const f = (u - 0.70) / 0.30;
      h = lerp(0.115, 0.138, f);
      s = lerp(0.68, 0.08, f * f);
      v = lerp(0.92, 1.0, f);
    }
    DISK_LUT[i] = hsv(h, s, v * v);
  }

  // 2. Build JET_LUT: Collimated synchrotron emission progression
  // Deep cobalt -> electric sapphire -> cyan shock knots -> ultraviolet white
  for (let i = 0; i < 256; i++) {
    const u = i / 255.0;
    if (u <= 0) {
      JET_LUT[i] = 0;
      continue;
    }
    const h = lerp(0.63, 0.54, u);
    const s = lerp(0.95, 0.14, u * u);
    const v = clamp(u * 1.1, 0, 1);
    JET_LUT[i] = hsv(h, s, v * v);
  }
}

function render(t, dt) {
  const daylight = input.clock.daylight;
  const audioLevel = input.audio.ok ? input.audio.level : 0;
  const bass = input.audio.ok ? input.audio.bass : 0;

  // Background deep cosmic void: pitch black at midnight, deep indigo at midday
  let bgCol = 0;
  if (daylight > 0.05) {
    const dVal = (daylight * 12) | 0;
    bgCol = rgb((dVal * 0.3) | 0, (dVal * 0.5) | 0, dVal);
  }
  fill(bgCol);

  // Button interaction: Tidal disruption flare & gravitational shockwave
  if (input.button.pressed) {
    shockwaveR = R_ISCO;
    shockwaveAmp = 1.6;
  }

  if (shockwaveAmp > 0.01) {
    shockwaveR += dt * 20.0;
    shockwaveAmp *= Math.pow(0.35, dt);
  } else {
    shockwaveAmp = 0;
  }

  // Audio beat pulse drives synchrotron shock knots along jets
  if (input.audio.beat) {
    beatKnot = 1.0;
  }
  if (beatKnot > 0.02) {
    beatKnot *= Math.pow(0.20, dt);
  } else {
    beatKnot = 0;
  }

  // --- 1. Background Deflected Stars (Gravitational Microlensing) ---
  for (let i = 0; i < STAR_COUNT; i++) {
    const sx = starX[i] - cx;
    const sy = starY[i] - cy;
    const sR = Math.sqrt(sx * sx + sy * sy);
    if (sR > R_SHADOW * 1.3) {
      // Einstein deflection: apparent position shifted radially outward
      const defl = 18.0 / sR;
      const appX = (cx + sx * (1.0 + defl / sR)) | 0;
      const appY = (cy + sy * (1.0 + defl / sR)) | 0;
      if (appX >= 0 && appX < 64 && appY >= 0 && appY < 64) {
        const tw = Math.sin(t * starSpeed[i] + starPhase[i]);
        if (tw > 0.45) {
          const b = ((tw - 0.45) * 1.8 * 255) | 0;
          setPixel(appX, appY, rgb((b * 0.55) | 0, (b * 0.75) | 0, b));
        }
      }
    }
  }

  // --- 2. Collimated Blandford-Znajek Synchrotron Jets ---
  const jetActivity = 1.0 + audioLevel * 1.1 + bass * 0.8;
  for (let y = 0; y < 64; y++) {
    const dy = y - cy;
    const absDy = Math.abs(dy);
    if (absDy > R_SHADOW * 0.72) {
      const jetSign = dy < 0 ? -1 : 1;
      const jetWidth = 1.3 + absDy * 0.11;
      const helix = Math.sin(absDy * 0.42 - t * 6.5 * jetSign) * (jetWidth * 0.65);

      for (let x = 0; x < 64; x++) {
        const dx = x - cx;
        const dJet = Math.abs(dx - helix);
        if (dJet < jetWidth * 1.5) {
          const core = 1.0 - dJet / (jetWidth * 1.5);
          const knotWave = Math.sin(absDy * 0.65 - t * 8.5 * jetSign);
          const knot = Math.max(0, knotWave) * 0.8;
          const altFade = Math.pow(1.0 - absDy / 33.0, 0.4);

          let jLum = (core * core * 0.55 + knot) * altFade * jetActivity;
          if (beatKnot > 0.05) jLum += beatKnot * core * 0.55;

          const lutIdx = clamp((jLum * 180) | 0, 0, 255);
          if (lutIdx > 5) {
            setPixel(x, y, JET_LUT[lutIdx]);
          }
        }
      }
    }
  }

  // --- 3. Accretion Disk, Gravitational Lensing & Kerr Shadow ---
  for (let y = 0; y < 64; y++) {
    const dy = y - cy;
    for (let x = 0; x < 64; x++) {
      const dx = x - cx;
      const R = Math.sqrt(dx * dx + dy * dy);

      // Kerr frame-dragging shadow asymmetry (approaching side is squashed on left)
      const shadowR = R_SHADOW * (1.0 - 0.12 * (dx / (R + 0.05)));

      let hitDisk = false;
      let diskR = 0;
      let diskPhi = 0;
      let lensedWeight = 1.0;
      let isSecondary = false;

      // Primary front disk (dy >= 0, passing across in front of the black hole)
      if (dy >= 0) {
        const yDisk = dy * INV_COS_I;
        const rDirect = Math.sqrt(dx * dx + yDisk * yDisk);
        if (rDirect >= R_ISCO && rDirect <= R_OUT) {
          hitDisk = true;
          diskR = rDirect;
          diskPhi = Math.atan2(yDisk, dx);
          lensedWeight = 1.0;
        }

        // Secondary underside lensed arch (light bent under the hole)
        if (!hitDisk && dy > shadowR * 0.95 && dy < shadowR * 1.85) {
          const lensedDy = (dy - shadowR) * 2.4 + shadowR;
          const rLensed = Math.sqrt(dx * dx + lensedDy * lensedDy * 2.25);
          if (rLensed >= R_ISCO && rLensed <= R_OUT * 0.85) {
            hitDisk = true;
            diskR = rLensed;
            diskPhi = Math.atan2(-lensedDy, dx);
            lensedWeight = 0.55;
            isSecondary = true;
          }
        }
      } else {
        // Gravitationally lensed top arch (dy < 0, over the top of the hole)
        const archBend = 1.0 + 0.48 * Math.exp(-(R - shadowR) * 0.22);
        const yDisk = (dy * 1.32) * archBend;
        const rLensed = Math.sqrt(dx * dx * 1.1 + yDisk * yDisk);
        if (rLensed >= R_ISCO && rLensed <= R_OUT) {
          hitDisk = true;
          diskR = rLensed;
          diskPhi = Math.atan2(yDisk, dx);
          lensedWeight = clamp(1.3 - (rLensed - R_ISCO) / (R_OUT - R_ISCO), 0.5, 1.35);
        }
      }

      // Inside Event Horizon Shadow Void
      if (!hitDisk && R < shadowR) {
        setPixel(x, y, 0);
        continue;
      }

      if (hitDisk) {
        // Relativistic Keplerian Velocity
        const beta = clamp(Math.sqrt(9.5 / diskR), 0.12, 0.58);

        // Line-of-sight velocity projection:
        // Left side (dx < 0) is approaching (+v_los)
        // Right side (dx > 0) is receding (-v_los)
        const v_los = -(dx / diskR) * SIN_I * beta;

        // Relativistic Doppler Beaming
        const gamma = 1.0 / Math.sqrt(Math.max(0.01, 1.0 - beta * beta));
        const doppler = 1.0 / (gamma * (1.0 - v_los));
        const beaming = Math.pow(doppler, 2.2);

        // Gravitational Redshift
        const gRed = Math.sqrt(Math.max(0.08, 1.0 - 5.8 / diskR));

        // Radial Emissivity Profile (Page-Thorne standard thin accretion disk)
        const u = clamp((diskR - R_ISCO) / (R_OUT - R_ISCO), 0, 1);
        const profile = Math.pow(Math.sin(u * Math.PI * 0.85 + 0.15), 1.2) * Math.exp(-u * 1.6);

        // Differential Keplerian rotation & Magnetorotational Instability (MRI) spirals
        const omega = 12.0 / Math.pow(diskR, 1.45);
        const spiralPhi = diskPhi * 2.0 - t * omega * 2.8 - diskR * 0.72;
        const turb = noise2(diskR * 0.32 - t * 0.32, diskPhi * 1.5 + t * omega);
        const mri = 0.78 + 0.22 * Math.sin(spiralPhi) + 0.16 * turb;

        // Orbiting Relativistic Flare (hotspot sheared along ISCO)
        const spotOmega = 12.0 / Math.pow(R_ISCO + 1.2, 1.45);
        const spotPhi = (t * spotOmega * 2.8) % (Math.PI * 2);
        let dPhi = Math.abs(diskPhi - spotPhi);
        if (dPhi > Math.PI) dPhi = Math.PI * 2 - dPhi;
        const spot = Math.exp(-(dPhi * dPhi * 4.5 + Math.pow(diskR - (R_ISCO + 1.2), 2) * 1.1)) * 2.2;

        // Interactive shockwave amplification
        let shockwaveFactor = 1.0;
        if (shockwaveAmp > 0.05) {
          const dShock = Math.abs(diskR - shockwaveR);
          if (dShock < 3.0) {
            shockwaveFactor += shockwaveAmp * (1.0 - dShock / 3.0) * 1.5;
          }
        }

        // Ambient audio swell
        const audioSwell = 1.0 + audioLevel * 0.9 + bass * 0.7;

        let totalI = (profile * mri + spot) * beaming * gRed * lensedWeight * shockwaveFactor * audioSwell;
        if (isSecondary) totalI *= 0.52;

        // Map intensity to precomputed DISK_LUT
        const lutIdx = clamp((totalI * 135) | 0, 0, 255);
        if (lutIdx > 0) {
          setPixel(x, y, DISK_LUT[lutIdx]);
        }
      }

      // Thin Photon Sphere Ring (n=1 critical curve at shadow boundary)
      if (R >= shadowR && R <= shadowR * 1.16) {
        const ringDist = Math.abs(R - shadowR * 1.06) / (shadowR * 0.10);
        if (ringDist < 1.0) {
          const ringAlpha = (1.0 - ringDist * ringDist) * 0.95;
          const ringBoost = clamp(1.4 - (dx / R) * 0.9, 0.3, 2.5);
          const rv = ringAlpha * ringBoost * 0.92;
          const prev = getPixel(x, y);
          const prevV = ((prev >> 16) & 255) / 255;
          if (rv > prevV) {
            setPixel(x, y, rgb((rv * 255) | 0, (rv * 235) | 0, (rv * 190) | 0));
          }
        }
      }
    }
  }
}
