import type { Mode, PitchClass } from '../types'

/**
 * Semitone interval sets (from tonic) for each supported mode.
 * Each is exactly 7 intervals. These are the canonical diatonic/heptatonic
 * scales used throughout the engine for diatonic membership and palette
 * construction.
 */
const SCALE_TABLE: Record<Mode, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  'natural-minor': [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  'harmonic-minor': [0, 2, 3, 5, 7, 8, 11],
  locrian: [0, 1, 3, 5, 6, 8, 10],
  'melodic-minor': [0, 2, 3, 5, 7, 9, 11],
  'harmonic-major': [0, 2, 4, 5, 7, 8, 11],
}

/** The 7 semitone intervals from the tonic for a given mode. */
export function scaleSemitones(mode: Mode): number[] {
  return [...SCALE_TABLE[mode]]
}

/** Normalise any integer to a pitch class 0–11. */
export function mod12(n: number): PitchClass {
  return ((n % 12) + 12) % 12
}

/** The 7 pitch classes of `mode` rooted at `root`. */
export function scalePitchClasses(root: PitchClass, mode: Mode): PitchClass[] {
  return scaleSemitones(mode).map((iv) => mod12(root + iv))
}

/**
 * 0-based scale degree of `pc` in the key, or null if non-diatonic.
 * Degree 0 = tonic, 1 = supertonic, … 6 = leading/subtonic.
 */
export function scaleDegreeOf(
  pc: PitchClass,
  root: PitchClass,
  mode: Mode,
): number | null {
  const pcs = scalePitchClasses(root, mode)
  const idx = pcs.indexOf(mod12(pc))
  return idx === -1 ? null : idx
}
