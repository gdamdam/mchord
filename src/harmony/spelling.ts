import type { Chord, Mode, PitchClass } from '../types'
import { chordIntervals } from './chords'
import { mod12, scalePitchClasses } from './scales'

/**
 * Enharmonic spelling.
 *
 * WHY a letter-grid approach: correct spelling depends on the key's accidental
 * direction (sharp keys vs flat keys) and on stacked-third logic for chords.
 * We model the 7 letter names (C D E F G A B) with their natural pitch classes,
 * then choose, for the key tonic, whether the key prefers sharps or flats, and
 * spell each pc as the letter+accidental that matches the key's signature.
 */

const SHARP = '♯' // ♯
const FLAT = '♭' // ♭
const DBL_SHARP = '×' // × (double sharp)
const DBL_FLAT = '♭♭' // ♭♭

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
const LETTER_PC: Record<(typeof LETTERS)[number], number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}

/**
 * Keys that conventionally use flats (by tonic pitch class, considering the
 * usual major-key circle of fifths). Sharp keys: G D A E B F#. Flat keys:
 * F Bb Eb Ab Db Gb. C is neutral (treated as sharp-leaning unless minor).
 */
const FLAT_TONIC_MAJOR = new Set<number>([5, 10, 3, 8, 1, 6]) // F Bb Eb Ab Db Gb

/** Build the accidental string for a given offset from a natural letter pc. */
function accidental(offset: number): string {
  if (offset === 0) return ''
  if (offset === 1) return SHARP
  if (offset === -1) return FLAT
  if (offset === 2) return DBL_SHARP
  if (offset === -2) return DBL_FLAT
  // Fallback (should not occur for tonal music): repeat sharps/flats.
  return offset > 0 ? SHARP.repeat(offset) : FLAT.repeat(-offset)
}

/** Does this key prefer flats for ambiguous (black-key) pitch classes? */
function keyPrefersFlats(keyRoot: PitchClass, mode: Mode): boolean {
  // The relative major's tonic determines the signature direction.
  // Compute relative-major tonic pc by mode offset, then test FLAT set.
  const REL_MAJOR_OFFSET: Record<Mode, number> = {
    major: 0,
    'natural-minor': 3, // Aeolian → up a minor third to its relative major
    dorian: 10, // Dorian on D → C major (down 2)
    mixolydian: 5, // Mixolydian on G → C major (down 7 / up 5)
    phrygian: 8, // Phrygian on E → C major
    lydian: 7, // Lydian on F → C major
    'harmonic-minor': 3, // treat like natural minor for signature direction
    locrian: 1, // Locrian on B → C major (relative major a semitone up)
    'melodic-minor': 3, // treat like natural minor for signature direction
    'harmonic-major': 0, // major tonic (lowered 6th doesn't flip the signature)
  }
  const relMajor = mod12(keyRoot + REL_MAJOR_OFFSET[mode])
  if (FLAT_TONIC_MAJOR.has(relMajor)) return true
  // F# / Gb (pc 6) major is ambiguous; minor keys lean flat for Bb-side roots.
  return false
}

/**
 * Letter index (0..6 into LETTERS) for the key's tonic. The tonic itself is
 * never one of the extreme enharmonics in a representable key, so the plain
 * natural-or-single-accidental rule is safe here (and avoids recursing into the
 * diatonic-degree logic that depends on this result).
 */
function tonicLetterIndex(keyRoot: PitchClass, flats: boolean): number {
  const p = mod12(keyRoot)
  for (let i = 0; i < LETTERS.length; i++) {
    if (LETTER_PC[LETTERS[i]] === p) return i
  }
  for (let i = 0; i < LETTERS.length; i++) {
    // Flat key: tonic is the letter above with a flat; sharp key: below+sharp.
    if (flats && mod12(LETTER_PC[LETTERS[i]] - 1) === p) return i
    if (!flats && mod12(LETTER_PC[LETTERS[i]] + 1) === p) return i
  }
  return 0
}

/**
 * Spell a single pitch class as a note name appropriate to the key.
 * Picks the letter whose natural pc is closest, then the accidental, biased by
 * whether the key uses sharps or flats.
 */
export function noteNameInKey(
  pc: PitchClass,
  keyRoot: PitchClass,
  mode: Mode,
): string {
  const p = mod12(pc)
  const flats = keyPrefersFlats(keyRoot, mode)

  // Diatonic pcs are spelled by the letter the key signature assigns to that
  // scale degree (tonic letter + degree, mod 7). This is what makes
  // 6+-accidental keys read correctly: e.g. G♭ major's 4th degree is C♭, not B.
  // The bare exact-natural short-circuit below is only safe for pcs the key
  // does NOT respell; using it unconditionally makes C♭/F♭/E♯/B♯ unreachable.
  const scalePcs = scalePitchClasses(keyRoot, mode)
  const degree = scalePcs.indexOf(p)
  if (degree !== -1) {
    const tonicLetterIdx = tonicLetterIndex(keyRoot, flats)
    const letter = LETTERS[(tonicLetterIdx + degree) % 7]
    return letter + accidental(signedOffset(LETTER_PC[letter], p))
  }

  // Natural note (non-diatonic): exact letter match.
  for (const L of LETTERS) {
    if (LETTER_PC[L] === p) return L
  }
  if (flats) {
    // Spell as the letter above with a flat (e.g. pc10 → B♭).
    for (const L of LETTERS) {
      if (mod12(LETTER_PC[L] - 1) === p) return L + FLAT
    }
  } else {
    // Spell as the letter below with a sharp (e.g. pc10 → A♯).
    for (const L of LETTERS) {
      if (mod12(LETTER_PC[L] + 1) === p) return L + SHARP
    }
  }
  // Unreachable for chromatic pcs, but be safe.
  return flats ? 'C' + FLAT : 'C' + SHARP
}

/**
 * Spell a chord's tones as stacked thirds where practical.
 *
 * WHY: musicians expect a triad/7th to use alternating letters (C E G, D F A).
 * We pick a starting letter for the root (consistent with the key), then for
 * each successive chord interval choose the letter that lands closest to the
 * "expected" stacked-third letter while matching the actual pitch class. This
 * yields readable spellings like C–E♭–G for Cm and B♭–D–F for B♭. For sus/9
 * shapes the stacked-third assumption bends gracefully (we fall back to the
 * nearest letter to the target pc).
 */
export function spellChord(
  chord: Chord,
  keyRoot: PitchClass,
  mode: Mode,
): string[] {
  const ivs = chordIntervals(chord.family)
  const rootName = noteNameInKey(chord.root, keyRoot, mode)
  const rootLetterIdx = LETTERS.indexOf(rootName[0] as (typeof LETTERS)[number])
  const out: string[] = [rootName]

  // Map each interval onto a target letter index using its diatonic step span.
  // Thirds → +2 letters, fifths → +4, sevenths → +6, ninths → +8 (=+1 mod 7).
  // We classify by nearest "generic interval" from the semitone size.
  for (let i = 1; i < ivs.length; i++) {
    const semis = ivs[i]
    const targetPc = mod12(chord.root + semis)
    const letterStep = genericStepForSemitone(semis)
    const letterIdx = (rootLetterIdx + letterStep) % 7
    const letter = LETTERS[letterIdx]
    const offset = signedOffset(LETTER_PC[letter], targetPc)
    out.push(letter + accidental(offset))
  }
  return out
}

/**
 * Generic letter-step (0-based, mod 7) for a chord interval's semitone size.
 * WHY explicit cases: tonal spelling cares about the *generic* interval, which
 * the semitone count alone is ambiguous about (6 semitones can be ♯4 or ♭5).
 * In chord context the only family using 6 semitones is dim, where it is a
 * diminished FIFTH (step 4), so we map 6 → 4 here. A 5 (perfect 4th, sus4) →
 * step 3. The 9 (6th) → step 5; 10/11 (7ths) → step 6; 14 (9th) → step 1.
 */
function genericStepForSemitone(semis: number): number {
  switch (semis) {
    case 1:
    case 2:
      return 1 // 2nd (sus2 / add tone)
    case 3:
    case 4:
      return 2 // 3rd
    case 5:
      return 3 // perfect 4th (sus4)
    case 6:
      return 4 // diminished 5th (dim chords)
    case 7:
    case 8:
      return 4 // perfect / augmented 5th
    case 9:
      return 5 // 6th
    case 10:
    case 11:
      return 6 // minor / major 7th
    case 13:
    case 14:
    case 15:
      return 1 // 9th (♭9/9/♯9) = 2nd letter, octave above
    case 18:
      return 3 // ♯11 = 4th letter, octave above (maj7♯11)
    case 21:
      return 5 // 13th = 6th letter, octave above
    default:
      return Math.round((semis / 12) * 7) % 7
  }
}

/** Smallest signed offset (−2..+2) to move letterPc onto targetPc, mod 12. */
function signedOffset(letterPc: number, targetPc: number): number {
  let d = mod12(targetPc - letterPc)
  if (d > 6) d -= 12
  return d
}

/** Family → display suffix used by absolute chord names. */
const FAMILY_SUFFIX: Record<Chord['family'], string> = {
  maj: '',
  min: 'm',
  dim: 'dim',
  aug: 'aug',
  sus2: 'sus2',
  sus4: 'sus4',
  maj7: 'maj7',
  min7: 'm7',
  dom7: '7',
  minMaj7: 'm(maj7)',
  add9: 'add9',
  maj9: 'maj9',
  min9: 'm9',
  dom9: '9',
  '6': '6',
  min6: 'm6',
  m7b5: 'm7♭5',
  '7b9': '7♭9',
  '7#9': '7♯9',
  '13': '13',
  'maj7#11': 'maj7♯11',
  '7sus4': '7sus4',
  '5': '5',
}

/** Absolute, key-appropriate chord name, e.g. "Dm7", "F♯dim", "B♭maj7". */
export function chordName(
  chord: Chord,
  keyRoot: PitchClass,
  mode: Mode,
): string {
  return noteNameInKey(chord.root, keyRoot, mode) + FAMILY_SUFFIX[chord.family]
}
