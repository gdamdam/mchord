import type { Chord, ChordFamily, Midi, PitchClass } from '../types'
import { mod12 } from './scales'

/**
 * Interval recipes (semitones from root, root = 0, ascending) for every
 * supported chord family. Extensions (9ths) are spelled above the octave so
 * voicing and spelling code can treat them as stacked thirds.
 */
const CHORD_TABLE: Record<ChordFamily, number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  aug: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  dom7: [0, 4, 7, 10],
  minMaj7: [0, 3, 7, 11],
  add9: [0, 4, 7, 14],
  maj9: [0, 4, 7, 11, 14],
  min9: [0, 3, 7, 10, 14],
  dom9: [0, 4, 7, 10, 14],
  '6': [0, 4, 7, 9],
  min6: [0, 3, 7, 9],
  m7b5: [0, 3, 6, 10], // half-diminished
  '7b9': [0, 4, 7, 10, 13], // ♭9 above the octave (stacked-third spelling)
  '7#9': [0, 4, 7, 10, 15], // ♯9 above the octave
  '13': [0, 4, 7, 10, 14, 21], // dom7 + 9th + 13th (11th omitted, as voiced)
  'maj7#11': [0, 4, 7, 11, 18], // ♯11 above the octave (Lydian)
  '7sus4': [0, 5, 7, 10],
  '5': [0, 7], // power chord
}

/** Semitones from the root (ascending, root = 0) for a chord family. */
export function chordIntervals(family: ChordFamily): number[] {
  return [...CHORD_TABLE[family]]
}

/**
 * Distinct pitch classes of a chord (order = stacked-third order, deduped while
 * preserving first occurrence). Extensions that collapse onto an existing pc are
 * dropped so callers get a clean pc set.
 */
export function chordPitchClasses(chord: Chord): PitchClass[] {
  const out: PitchClass[] = []
  for (const iv of chordIntervals(chord.family)) {
    const pc = mod12(chord.root + iv)
    if (!out.includes(pc)) out.push(pc)
  }
  return out
}

/** Root-position absolute MIDI notes, lowest note = `rootMidi`. */
export function chordMidiFromRoot(chord: Chord, rootMidi: Midi): Midi[] {
  return chordIntervals(chord.family).map((iv) => rootMidi + iv)
}

/** Transpose a chord by `semitones` (root mod 12); family unchanged. */
export function transposeChord(chord: Chord, semitones: number): Chord {
  return { root: mod12(chord.root + semitones), family: chord.family }
}
