/**
 * Performance macros → voice parameter mapping.
 *
 * `applyMacros` is PURE: given a base `VoiceParams` (from a preset) and the four
 * `MacroValues`, it returns a new `ResolvedVoiceParams` with curated groups of
 * params nudged. It mutates nothing and is fully deterministic in its inputs, so
 * it is unit-testable without Web Audio.
 *
 * The macros are CURATED GROUPS, not 1:1 knobs:
 *   COLOR   → brightness: filter cutoff (up) + filter Q (slight up).
 *   SPREAD  → stereo image: stereo spread (up) + unison detune (up).
 *   TENSION → drive/edge: filter envelope amount (up) + resonance Q (up).
 *   MOTION  → consumed by the transport/scheduler layer, NOT here. Accepted in
 *             MacroValues and intentionally ignored.
 *
 * Each macro is 0..1 and the centre (0.5) is treated as "neutral-ish": the
 * mapping interpolates between a damped low end and an expanded high end around
 * the preset's authored value, so presets still sound like themselves at 0.5.
 */

import type { MacroValues } from '../types'
import { clamp, clamp01, expLerp, lerp } from './dsp'
import type { ResolvedVoiceParams, VoiceParams } from './voiceParams'

/** Multiplicative range a unit macro (0..1) sweeps a value across, centred so
 *  that macro = 0.5 ≈ the authored preset value. Returns the multiplier. */
function macroMul(macro: number, lowMul: number, highMul: number): number {
  // Two-segment lerp through 1.0 at macro = 0.5 so the preset's authored value
  // is preserved at the centre and the macro fans out symmetrically (in log
  // space for musically even motion).
  const m = clamp01(macro)
  if (m <= 0.5) return expLerp(lowMul, 1, m / 0.5)
  return expLerp(1, highMul, (m - 0.5) / 0.5)
}

/** Additive offset a unit macro sweeps, centred at 0 when macro = 0.5. */
function macroAdd(macro: number, lowAdd: number, highAdd: number): number {
  const m = clamp01(macro)
  if (m <= 0.5) return lerp(lowAdd, 0, m / 0.5)
  return lerp(0, highAdd, (m - 0.5) / 0.5)
}

/**
 * Apply the curated macro groups to a base voice param set.
 *
 * @param base The preset's authored params (not mutated).
 * @param m    The four performance macros, each 0..1. MOTION is ignored here.
 */
export function applyMacros(base: VoiceParams, m: MacroValues): ResolvedVoiceParams {
  // COLOR → brightness. Sweep cutoff ×0.45 (dark) … ×2.4 (bright); add a touch
  // of Q at the bright end so opening up also adds a little edge.
  const cutoff = clamp(base.filterCutoff * macroMul(m.color, 0.45, 2.4), 60, 18000)
  const colorQ = base.filterQ + macroAdd(m.color, 0, 0.6)

  // SPREAD → stereo image. Widen the pan field and the unison detune together.
  const stereoSpread = clamp01(base.stereoSpread * macroMul(m.spread, 0.4, 1.6))
  const detuneCents = clamp(base.detuneCents * macroMul(m.spread, 0.5, 2.0), 0, 80)

  // TENSION → edge / drive. Push the filter envelope sweep and resonance up so
  // higher tension reads as more aggressive, vocal, resonant movement.
  const filterEnvAmount = clamp(
    base.filterEnvAmount * macroMul(m.tension, 0.6, 1.8),
    0,
    8000,
  )
  const tensionQ = macroAdd(m.tension, 0, 2.2)

  // Q receives contributions from both COLOR and TENSION; clamp to a stable,
  // non-self-oscillating range so a hot macro combo can't ring out of control.
  const filterQ = clamp(colorQ + tensionQ, 0.2, 8)

  return {
    ...base,
    filterCutoff: cutoff,
    filterQ,
    filterEnvAmount,
    stereoSpread,
    detuneCents,
  }
}
