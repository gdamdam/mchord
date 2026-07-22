import type { Chord, ChordFamily, Mode, PaletteChord, PitchClass } from '../types'
import { chordLabel } from './labels'
import { mod12, scalePitchClasses } from './scales'

/**
 * Build the harmonically-relevant chord palette for a key.
 *
 * Ordering principle: diatonic triads first (most stable, most used), then
 * common borrowed/modal chords, then a few useful chromatic options (secondary
 * dominants, Neapolitan, ♭VII). Stability/category in each label reflect how
 * "safe" a choice is, so the UI can colour accordingly — we do NOT pretend the
 * chromatic options are as stable as the diatonic ones.
 */

/**
 * The natural triad quality for each scale degree, computed from the actual
 * scale so it is correct for every mode (e.g. dorian gives a major IV, minor i).
 * We derive quality by measuring the third and fifth above each degree within
 * the diatonic collection.
 */
function diatonicTriadFamily(
  pcs: PitchClass[],
  degree: number,
): ChordFamily {
  const root = pcs[degree]
  const third = pcs[(degree + 2) % 7]
  const fifth = pcs[(degree + 4) % 7]
  const t = mod12(third - root) // 3 or 4
  const f = mod12(fifth - root) // 6, 7, or 8
  if (t === 4 && f === 7) return 'maj'
  if (t === 3 && f === 7) return 'min'
  if (t === 3 && f === 6) return 'dim'
  if (t === 4 && f === 8) return 'aug'
  // Fallback for unusual modal stacks: classify by third only.
  return t === 4 ? 'maj' : 'min'
}

/** The seventh-chord family that fits a diatonic degree, used optionally. */
function diatonicSeventhFamily(
  pcs: PitchClass[],
  degree: number,
): ChordFamily {
  const root = pcs[degree]
  const third = pcs[(degree + 2) % 7]
  const fifth = pcs[(degree + 4) % 7]
  const seventh = pcs[(degree + 6) % 7]
  const t = mod12(third - root)
  const f = mod12(fifth - root)
  const s = mod12(seventh - root)
  if (t === 4 && f === 7 && s === 11) return 'maj7'
  if (t === 3 && f === 7 && s === 10) return 'min7'
  if (t === 4 && f === 7 && s === 10) return 'dom7'
  if (t === 3 && f === 6 && s === 10) return 'm7b5' // half-diminished (ii in minor, vii in major)
  if (t === 3 && f === 6 && s === 9) return 'dim'
  if (t === 3 && f === 7 && s === 11) return 'minMaj7'
  return diatonicTriadFamily(pcs, degree)
}

/**
 * The 7 diatonic chords (triads by default) on each scale degree.
 * Triads are chosen as the default per the spec ("choose triads").
 */
export function diatonicChords(keyRoot: PitchClass, mode: Mode): Chord[] {
  const pcs = scalePitchClasses(keyRoot, mode)
  const out: Chord[] = []
  for (let d = 0; d < 7; d++) {
    out.push({ root: pcs[d], family: diatonicTriadFamily(pcs, d) })
  }
  return out
}

/** Diatonic seventh chords on each degree (exported for completeness/reuse). */
export function diatonicSevenths(keyRoot: PitchClass, mode: Mode): Chord[] {
  const pcs = scalePitchClasses(keyRoot, mode)
  const out: Chord[] = []
  for (let d = 0; d < 7; d++) {
    out.push({ root: pcs[d], family: diatonicSeventhFamily(pcs, d) })
  }
  return out
}

/**
 * Common borrowed/modal chords for a major or minor-ish key. We compute these
 * relative to the tonic. Examples for a major key: iv (minor subdominant),
 * ♭VII, ♭III, ♭VI (from the parallel minor), and the minor i (modal mixture).
 */
function borrowedChords(keyRoot: PitchClass, mode: Mode): Chord[] {
  const isMajorish =
    mode === 'major' ||
    mode === 'lydian' ||
    mode === 'mixolydian' ||
    mode === 'harmonic-major'
  const r = (semi: number, family: ChordFamily): Chord => ({
    root: mod12(keyRoot + semi),
    family,
  })
  if (isMajorish) {
    // Borrowed from parallel minor.
    return [
      r(5, 'min'), // iv
      r(10, 'maj'), // ♭VII
      r(3, 'maj'), // ♭III
      r(8, 'maj'), // ♭VI
      r(0, 'min'), // i (minor tonic, modal mixture)
    ]
  }
  // Minor-ish keys: borrow from parallel major / common modal swaps.
  return [
    r(5, 'maj'), // IV (Dorian-flavoured major subdominant)
    r(0, 'maj'), // I (Picardy / parallel major tonic)
    r(7, 'maj'), // V (raised-leading-tone dominant)
    r(2, 'dim'), // ii° (common in minor)
  ]
}

/**
 * A few useful chromatic chords: secondary dominants (V7/V, V7/ii, V7/vi),
 * Neapolitan (♭II), and ♭VII7. These are the lowest-stability palette entries.
 */
function chromaticChords(keyRoot: PitchClass, mode: Mode): Chord[] {
  const r = (semi: number, family: ChordFamily): Chord => ({
    root: mod12(keyRoot + semi),
    family,
  })
  const pcs = scalePitchClasses(keyRoot, mode)
  const out: Chord[] = []

  // Secondary dominants: dominant 7th a fifth above selected diatonic targets.
  // V/V (dominant of the dominant) — root = key + 2 (a 5th above the V).
  out.push({ root: mod12(keyRoot + 2), family: 'dom7' }) // V7/V
  // V/vi — dominant of the submediant. (scalePitchClasses always returns 7
  // degrees, so pcs[5] is always present — no length guard needed.)
  const vi = pcs[5]
  out.push({ root: mod12(vi + 7), family: 'dom7' }) // V7/vi
  // V/ii — dominant of the supertonic.
  out.push({ root: mod12(pcs[1] + 7), family: 'dom7' }) // V7/ii

  // Neapolitan ♭II (major triad on the lowered second).
  out.push(r(1, 'maj'))

  // ♭VII7 (backdoor-ish dominant), distinct from borrowed ♭VII triad.
  out.push(r(10, 'dom7'))

  return out
}

/** Wrap a chord with its key-contextual label. */
function toPaletteChord(chord: Chord, keyRoot: PitchClass, mode: Mode): PaletteChord {
  return { chord, label: chordLabel(chord, keyRoot, mode) }
}

/**
 * The ordered palette: diatonic first, then borrowed, then chromatic, with
 * duplicates (same root+family already present) removed while preserving order.
 */
export function paletteFor(keyRoot: PitchClass, mode: Mode): PaletteChord[] {
  const ordered: Chord[] = [
    ...diatonicChords(keyRoot, mode),
    ...borrowedChords(keyRoot, mode),
    ...chromaticChords(keyRoot, mode),
  ]
  const seen = new Set<string>()
  const out: PaletteChord[] = []
  for (const chord of ordered) {
    const key = `${chord.root}:${chord.family}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(toPaletteChord(chord, keyRoot, mode))
  }
  return out
}
