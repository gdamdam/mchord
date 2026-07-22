/**
 * Public surface of the mchord harmony engine.
 *
 * Pure music-theory: no React, no Web Audio, no DOM, no side effects, and no
 * randomness except via the seeded PRNG exported from `generation`. Every
 * function is deterministic in its inputs.
 */

export {
  scaleSemitones,
  scalePitchClasses,
  scaleDegreeOf,
  mod12,
} from './scales'

export {
  chordIntervals,
  chordPitchClasses,
  chordMidiFromRoot,
  transposeChord,
} from './chords'

export { noteNameInKey, spellChord, chordName } from './spelling'
export { parseChordName, parseChordLine, type ParsedToken } from './chordParse'

export {
  romanNumeral,
  chordCategory,
  chordStability,
  chordLabel,
} from './labels'

export {
  diatonicChords,
  diatonicSevenths,
  paletteFor,
} from './palette'

export { voiceChord, voiceProgression } from './voiceLeading'

export {
  makeRng,
  generateProgression,
  varyProgression,
} from './generation'

export {
  GENRES,
  GENRE_LABELS,
  PROGRESSION_LIBRARY,
  instantiateProgression,
} from './progressions'
export type { Genre, ProgChord, ProgressionPreset, ProgressionLibrary } from './progressions'
