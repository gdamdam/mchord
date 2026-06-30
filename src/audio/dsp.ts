/**
 * Pure DSP / parameter helpers for the mchord audio engine.
 *
 * Everything here is free of Web Audio and the DOM so it can be unit-tested in
 * Node (vitest cannot instantiate an AudioContext). The AudioEngine, Voice,
 * MasterBus, presets and macros all share these primitives.
 */

/** Clamp `v` into the inclusive range [lo, hi]. */
export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

/** Clamp into [0, 1]. */
export function clamp01(v: number): number {
  return clamp(v, 0, 1)
}

/** Linear interpolation between a and b by t (t is NOT clamped). */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Exponential-ish interpolation in log space — useful for frequencies and
 *  times where perception is logarithmic. `a` and `b` must be > 0. */
export function expLerp(a: number, b: number, t: number): number {
  return a * Math.pow(b / a, t)
}

/** Decibels → linear amplitude. -Infinity dB → 0. */
export function dbToGain(db: number): number {
  return db <= -Infinity ? 0 : Math.pow(10, db / 20)
}

/** Linear amplitude → decibels. 0 (or negative) → -Infinity. */
export function gainToDb(gain: number): number {
  return gain <= 0 ? -Infinity : 20 * Math.log10(gain)
}

/** MIDI note number → frequency in Hz (A4 = 69 = 440 Hz, equal temperament). */
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

/** Cents → frequency ratio multiplier. */
export function centsToRatio(cents: number): number {
  return Math.pow(2, cents / 1200)
}

/** Velocity (0..1) → linear gain using a perceptual power curve. A pure linear
 *  map makes soft notes nearly silent; the 0.6 exponent keeps low velocities
 *  audible while preserving dynamic range. Result is clamped to [0, 1]. */
export function velocityToGain(velocity: number): number {
  return Math.pow(clamp01(velocity), 0.6)
}

/**
 * An ADSR envelope description. attack/decay/release are seconds; sustain is a
 * 0..1 level relative to peak.
 */
export interface ADSR {
  attack: number
  decay: number
  sustain: number
  release: number
}

/** Lower bound on any envelope segment time. AudioParam ramps to a value at
 *  exactly `now` are clamped to this so we never schedule a zero-length ramp
 *  (which clicks) and never hand a non-positive time constant to a curve. */
export const MIN_ENV_TIME = 0.002

/** Clamp an ADSR's segment times to sane, click-free ranges. Sustain → [0,1],
 *  attack/decay/release floored at MIN_ENV_TIME and capped to musical maxima. */
export function sanitizeADSR(env: ADSR): ADSR {
  return {
    attack: clamp(env.attack, MIN_ENV_TIME, 8),
    decay: clamp(env.decay, MIN_ENV_TIME, 8),
    sustain: clamp01(env.sustain),
    release: clamp(env.release, MIN_ENV_TIME, 12),
  }
}

/**
 * Convert a desired "reach ~99% in `seconds`" exponential approach into the
 * `timeConstant` argument that `AudioParam.setTargetAtTime` expects. setTarget
 * reaches ~63% in one time-constant and ~95% in three, so we use seconds/4.6
 * (≈ ln(100)) to approximate full settling within `seconds`.
 */
export function timeConstantFor(seconds: number): number {
  return Math.max(MIN_ENV_TIME, seconds) / 4.6
}
