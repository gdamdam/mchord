import type { Chord, Mode, PitchClass, Slot, SlotDuration } from '../types'
import { SLOT_COUNT } from '../types'
import { diatonicChords } from './palette'

/**
 * Reproducible, musical progression generation.
 *
 * Determinism: all randomness comes from a seeded mulberry32 PRNG. Same
 * (keyRoot, mode, seed, length) → byte-identical Slots. Variation is likewise
 * pure in its inputs.
 *
 * Musicality: transitions are weighted by functional-harmony tendencies rather
 * than uniform — tonic prefers to move to subdominant/dominant, dominant pulls
 * back to tonic, etc. Weights are expressed over scale degrees (0..6).
 */

/** mulberry32 — small, fast, well-distributed 32-bit seeded PRNG. */
export function makeRng(seed: number): () => number {
  // Coerce to a 32-bit unsigned integer so any number seed is valid.
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Functional transition weights between scale degrees (rows = from, cols = to).
 * Indexes are 0-based degrees: 0=I,1=ii,2=iii,3=IV,4=V,5=vi,6=vii°.
 * Higher = more likely. Encodes common-practice tendencies:
 *  - I → IV/V/vi strong, ii ok.
 *  - ii → V (predominant→dominant) strong.
 *  - IV → V/I strong, ii ok.
 *  - V → I strong (resolution), vi (deceptive) some.
 *  - vi → IV/ii/V.
 *  - vii° → I (resolution).
 */
const TRANSITION: number[][] = [
  //   I    ii   iii  IV   V    vi   vii
  [1, 3, 1, 4, 4, 3, 1], // from I
  [1, 1, 1, 2, 5, 1, 2], // from ii
  [1, 1, 1, 3, 1, 4, 1], // from iii
  [3, 3, 1, 1, 5, 1, 2], // from IV
  [6, 1, 1, 1, 1, 3, 1], // from V (resolve to I, deceptive to vi)
  [2, 4, 1, 4, 3, 1, 1], // from vi
  [6, 1, 1, 1, 1, 1, 1], // from vii° → I
]

/** Weighted pick of an index from a weights array using the PRNG. */
function weightedPick(weights: number[], rng: () => number): number {
  let total = 0
  for (const w of weights) total += w
  let roll = rng() * total
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i]
    if (roll < 0) return i
  }
  return weights.length - 1
}

/**
 * Generate exactly SLOT_COUNT slots of weighted functional harmony.
 * Always starts on the tonic and ends with a dominant→tonic cadence so the
 * loop resolves musically. `length` (if < SLOT_COUNT) limits how many distinct
 * chord events fill the bars; remaining slots are still filled to SLOT_COUNT.
 */
export function generateProgression(opts: {
  keyRoot: PitchClass
  mode: Mode
  seed: number
  length?: number
}): Slot[] {
  const { keyRoot, mode, seed } = opts
  const rng = makeRng(seed)
  const diatonic = diatonicChords(keyRoot, mode)
  const length = Math.max(2, Math.min(SLOT_COUNT, opts.length ?? SLOT_COUNT))

  // Walk the degree chain.
  const degrees: number[] = [0] // start on tonic
  for (let i = 1; i < length; i++) {
    const from = degrees[i - 1]
    // Penultimate chord biases toward the dominant for a clean cadence.
    if (i === length - 1) {
      degrees.push(0) // final = tonic (cadence target)
      // Ensure the chord before the final tonic is a dominant or vii° — but
      // never clobber index 0, or a length-2 progression would start on V and
      // contradict the "always starts on the tonic" contract above.
      const pre = degrees[i - 1]
      if (pre !== 4 && pre !== 6 && i - 1 !== 0) degrees[i - 1] = 4
      break
    }
    degrees.push(weightedPick(TRANSITION[from], rng))
  }

  // Map degrees to chords.
  const chords: Chord[] = degrees.map((d) => diatonic[d])

  // Durations: mostly 1 bar; occasionally a 2-bar anchor on tonic/dominant.
  // Deterministic via the same rng stream.
  const slots: Slot[] = []
  for (let i = 0; i < SLOT_COUNT; i++) {
    if (i < chords.length) {
      const dur = pickDuration(degrees[i], rng)
      slots.push({ chord: chords[i], durationBars: dur })
    } else {
      // Fill remaining slots by repeating/looping the generated chords so the
      // result is always SLOT_COUNT and musically coherent.
      const src = chords[i % chords.length]
      slots.push({ chord: src, durationBars: 1 })
    }
  }
  return slots.slice(0, SLOT_COUNT)
}

/** Choose a slot duration with a sensible default-of-1-bar distribution. */
function pickDuration(degree: number, rng: () => number): SlotDuration {
  const roll = rng()
  // Tonic/dominant occasionally get a 2-bar anchor; everything mostly 1 bar.
  if ((degree === 0 || degree === 4) && roll > 0.8) return 2
  if (roll < 0.08) return 0.5
  return 1
}

/**
 * Produce a musical variation of an existing progression: substitute a few
 * non-cadential chords with diatonic neighbours (relative minor/major,
 * predominant swaps), while preserving the first slot (tonic anchor) and the
 * final cadence. Reproducible for the same (slots, key, mode, seed).
 */
export function varyProgression(
  slots: Slot[],
  opts: { keyRoot: PitchClass; mode: Mode; seed: number },
): Slot[] {
  const { keyRoot, mode, seed } = opts
  // Offset the seed so variation differs from generation but stays reproducible.
  const rng = makeRng((seed ^ 0x9e3779b9) >>> 0)
  const diatonic = diatonicChords(keyRoot, mode)

  // Common diatonic substitution map (degree → candidate substitute degrees).
  // I↔vi, IV↔ii, V↔iii (functional families share tones).
  const SUBS: Record<number, number[]> = {
    0: [5], // I → vi
    3: [1], // IV → ii
    4: [2, 6], // V → iii / vii° (lighter)
    5: [0], // vi → I
    1: [3], // ii → IV
    2: [4], // iii → V
  }

  // Find the index of the last non-null slot (cadence target) to preserve.
  let lastIdx = -1
  for (let i = slots.length - 1; i >= 0; i--) {
    if (slots[i].chord) {
      lastIdx = i
      break
    }
  }

  const degreeOf = (chord: Chord): number => {
    // Match root AND family: a borrowed/chromatic chord sharing a diatonic root
    // (e.g. V7/V is a dom7 on the same root as the diatonic ii) is NOT that
    // degree and must be left alone rather than substituted as if diatonic.
    const idx = diatonic.findIndex(
      (d) => d.root === chord.root && d.family === chord.family,
    )
    return idx
  }

  const out: Slot[] = slots.map((s) => ({ ...s }))
  for (let i = 0; i < out.length; i++) {
    const slot = out[i]
    if (!slot.chord) continue
    // Preserve the tonic anchor (first chord) and the final cadence chord.
    if (i === 0 || i === lastIdx || i === lastIdx - 1) continue
    const deg = degreeOf(slot.chord)
    const candidates = deg >= 0 ? SUBS[deg] : undefined
    if (!candidates || candidates.length === 0) continue
    // Substitute ~40% of eligible chords, deterministically.
    if (rng() < 0.4) {
      const choice = candidates[Math.floor(rng() * candidates.length)]
      out[i] = { ...slot, chord: diatonic[choice] }
    }
  }
  return out
}
