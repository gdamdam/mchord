import type { Chord, ChordFamily, PitchClass } from '../types'
import { mod12 } from './scales'

/**
 * Parse typed chord NAMES (e.g. "Cmaj7", "F#m7b5", "Bb13") into `Chord`s.
 *
 * This is the inverse of the display spelling in `spelling.ts`: names are read
 * ABSOLUTELY (a letter + accidental gives the root pitch class, a suffix gives
 * the family) — independent of the current key, since the user is naming real
 * chords to program into the slots. Recognises the common notations for every
 * ChordFamily; an unrecognised token returns null so callers can flag it.
 */

/** Natural-letter pitch classes (root note, before any accidental). */
const NOTE_PC: Record<string, number> = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }

/**
 * Suffix → family. Keys are matched case-sensitively AFTER unicode normalisation
 * (♯→#, ♭→b), because the only real ambiguity in chord symbols is upper-case "M"
 * (major) vs lower-case "m" (minor). Multiple spellings map to one family.
 */
const SUFFIX_TO_FAMILY: Record<string, ChordFamily> = {
  // triads
  '': 'maj', maj: 'maj', M: 'maj', ma: 'maj', major: 'maj',
  m: 'min', min: 'min', '-': 'min', minor: 'min',
  dim: 'dim', o: 'dim', '°': 'dim',
  aug: 'aug', '+': 'aug',
  sus2: 'sus2',
  sus4: 'sus4', sus: 'sus4',
  // sevenths
  maj7: 'maj7', M7: 'maj7', ma7: 'maj7', Δ: 'maj7', Δ7: 'maj7', 'maj7#5': 'maj7',
  m7: 'min7', min7: 'min7', '-7': 'min7',
  7: 'dom7', dom7: 'dom7',
  mM7: 'minMaj7', mMaj7: 'minMaj7', mmaj7: 'minMaj7', minMaj7: 'minMaj7',
  'm(maj7)': 'minMaj7', 'min(maj7)': 'minMaj7', '-maj7': 'minMaj7',
  // added / extended
  add9: 'add9', add2: 'add9',
  maj9: 'maj9', M9: 'maj9',
  m9: 'min9', min9: 'min9',
  9: 'dom9', dom9: 'dom9',
  6: '6', maj6: '6',
  m6: 'min6', min6: 'min6',
  // altered / colour
  m7b5: 'm7b5', min7b5: 'm7b5', 'm7-5': 'm7b5', '-7b5': 'm7b5', ø: 'm7b5', ø7: 'm7b5',
  '7b9': '7b9',
  '7#9': '7#9',
  13: '13',
  'maj7#11': 'maj7#11', 'M7#11': 'maj7#11', 'maj7(#11)': 'maj7#11',
  '7sus4': '7sus4', '7sus': '7sus4',
  5: '5',
}

/**
 * Parse a single chord name into a `Chord`, or null if it isn't recognised.
 * Whitespace around the token is ignored.
 */
export function parseChordName(raw: string): Chord | null {
  const s = raw.trim()
  if (!s) return null

  // Root: a letter A–G plus an optional single accidental.
  const m = /^([A-Ga-g])([#b♯♭]?)(.*)$/.exec(s)
  if (!m) return null
  const [, letter, acc, rest] = m

  let pc = NOTE_PC[letter.toLowerCase()]
  if (acc === '#' || acc === '♯') pc += 1
  else if (acc === 'b' || acc === '♭') pc -= 1

  // Suffix: normalise the two accidental glyphs, then look up the family.
  const suffix = rest.replace(/♯/g, '#').replace(/♭/g, 'b')
  const family = SUFFIX_TO_FAMILY[suffix]
  if (family === undefined) return null

  return { root: mod12(pc) as PitchClass, family }
}

/** One parsed token: the original text and its chord (null = unrecognised). */
export interface ParsedToken {
  token: string
  chord: Chord | null
}

/**
 * Split a line of chord names on whitespace/commas and parse each token.
 * Order is preserved so callers can map tokens 1:1 onto slots.
 */
export function parseChordLine(input: string): ParsedToken[] {
  return input
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .map((token) => ({ token, chord: parseChordName(token) }))
}
