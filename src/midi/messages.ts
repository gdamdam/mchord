// Pure MIDI message byte builders and small helpers. No I/O, no DOM.
//
// Channel-voice messages are 3 bytes: [status | channel, data1, data2].
// We clamp every field into its valid range so a caller can never emit an
// out-of-spec byte (which some drivers silently drop or, worse, misinterpret).

import type { Midi } from '../types'

/** Status nibble for Note On (high nibble; OR with channel 0..15). */
const NOTE_ON_STATUS = 0x90
/** Status nibble for Note Off. */
const NOTE_OFF_STATUS = 0x80

/** System real-time: timing clock (24 PPQN). */
export const CLOCK = 0xf8
/** System real-time: start transport. */
export const START = 0xfa
/** System real-time: continue transport. */
export const CONTINUE = 0xfb
/** System real-time: stop transport. */
export const STOP = 0xfc

/** Clamp to an integer in [lo, hi]. */
function clampInt(value: number, lo: number, hi: number): number {
  // `| 0` after rounding keeps the result an integer even for fractional input.
  const rounded = Math.round(value)
  if (rounded < lo) return lo
  if (rounded > hi) return hi
  return rounded
}

/**
 * Map a normalised velocity 0..1 to a MIDI velocity 1..127.
 *
 * We never return 0: a Note On with velocity 0 is, by convention, a Note Off,
 * so the lowest *audible* velocity we emit is 1. Out-of-range input is clamped.
 */
export function velocityToMidi(v0to1: number): number {
  if (Number.isNaN(v0to1)) return 1
  const scaled = Math.round(v0to1 * 127)
  return clampInt(scaled, 1, 127)
}

/**
 * Bytes for a Note On. `channel` is 0..15, `midi` 0..127, velocity 0..127.
 * All fields are clamped. Velocity is passed through as-is (already 0..127) so
 * callers that intentionally want a velocity-0 "note off via note on" can.
 */
export function noteOnBytes(channel: number, midi: Midi, velocity0to127: number): number[] {
  const ch = clampInt(channel, 0, 15)
  const note = clampInt(midi, 0, 127)
  const vel = clampInt(velocity0to127, 0, 127)
  return [NOTE_ON_STATUS | ch, note, vel]
}

/** Bytes for a Note Off (release velocity 0). `channel` 0..15, `midi` 0..127. */
export function noteOffBytes(channel: number, midi: Midi): number[] {
  const ch = clampInt(channel, 0, 15)
  const note = clampInt(midi, 0, 127)
  return [NOTE_OFF_STATUS | ch, note, 0]
}
