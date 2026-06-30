/**
 * The parameter shape that fully describes a single synth voice's timbre.
 *
 * `VoiceParams` is the *base* shape authored by a preset (see presets.ts).
 * `applyMacros` (macros.ts) takes a base `VoiceParams` plus the four
 * performance macros and returns a `ResolvedVoiceParams` — the same shape, with
 * macro-modulated fields nudged. The Voice class consumes `ResolvedVoiceParams`
 * to build / update its native node graph.
 *
 * Pure data only — no Web Audio types here, so presets and macros stay testable.
 */

import type { ADSR } from './dsp'

export type OscType = 'sine' | 'triangle' | 'sawtooth' | 'square'

export interface VoiceParams {
  /** Primary oscillator waveform. */
  oscType: OscType
  /** Number of detuned copies of the primary osc (1..3) for unison thickness. */
  oscCount: number
  /** Spread between detuned unison copies, in cents (0 = no detune). */
  detuneCents: number
  /** Sub-oscillator level relative to the main osc, 0..1 (0 = no sub). */
  subLevel: number
  /** Sub-oscillator waveform (usually sine or square one octave down). */
  subType: OscType

  /** Lowpass filter base cutoff in Hz. */
  filterCutoff: number
  /** Lowpass filter resonance (Q). */
  filterQ: number
  /**
   * Filter envelope amount in Hz added to the base cutoff at the envelope peak.
   * The filter follows the same ADSR shape as the amp but scaled by this.
   */
  filterEnvAmount: number

  /** Amplitude ADSR. */
  amp: ADSR

  /** Stereo spread, 0..1 — how far apart voices pan from centre. */
  stereoSpread: number

  /** Per-voice output gain (headroom trim), linear. Keep <= ~0.5 so a full
   *  chord summed across the pool never slams the master limiter. */
  gain: number

  /** Reverb / room send level, 0..1 (consumed by the master bus send). */
  reverbSend: number
}

/** Macro-resolved params have the identical shape; the alias documents intent
 *  at call sites (a resolved value has had macros applied and is clamped). */
export type ResolvedVoiceParams = VoiceParams
