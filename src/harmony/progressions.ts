/**
 * Genre chord-progression library.
 *
 * Genres mirror the melodic-genre list from the sibling **mpump** catalog. Each
 * progression is stored key-agnostic: chords are a semitone `offset` from the
 * tonic plus a chord family, so a preset instantiates into any key.
 *
 * The library DATA (10 progressions per genre) was researched and compiled by a
 * fan-out of agents; the shapes and the instantiate helper live here.
 */
import type { Chord, ChordFamily, Mode, PitchClass } from '../types'
import { mod12 } from './scales'

/** Melodic genres, matching mpump's `s1.genres`. */
export const GENRES = [
  'techno',
  'acid-techno',
  'trance',
  'dub-techno',
  'idm',
  'edm',
  'drum-and-bass',
  'house',
  'breakbeat',
  'jungle',
  'garage',
  'ambient',
  'glitch',
  'electro',
  'downtempo',
  'dubstep',
  'lo-fi',
  'synthwave',
  'deep-house',
  'psytrance',
  'jazz',
  'pop',
  'cinematic',
  'gospel',
] as const
export type Genre = (typeof GENRES)[number]

export const GENRE_LABELS: Record<Genre, string> = {
  techno: 'Techno',
  'acid-techno': 'Acid Techno',
  trance: 'Trance',
  'dub-techno': 'Dub Techno',
  idm: 'IDM',
  edm: 'EDM',
  'drum-and-bass': 'Drum & Bass',
  house: 'House',
  breakbeat: 'Breakbeat',
  jungle: 'Jungle',
  garage: 'Garage',
  ambient: 'Ambient',
  glitch: 'Glitch',
  electro: 'Electro',
  downtempo: 'Downtempo',
  dubstep: 'Dubstep',
  'lo-fi': 'Lo-Fi',
  synthwave: 'Synthwave',
  'deep-house': 'Deep House',
  psytrance: 'Psytrance',
  jazz: 'Jazz',
  pop: 'Pop',
  cinematic: 'Cinematic',
  gospel: 'Gospel',
}

/** One chord of a preset: a semitone offset (0–11) above the tonic + a family. */
export interface ProgChord {
  offset: number
  family: ChordFamily
}

/** A named, key-agnostic chord progression. */
export interface ProgressionPreset {
  name: string
  /** Suggested mode; loading a preset may switch the scene to it. */
  mode?: Mode
  /** 1–8 chords; `null` is a rest slot. */
  chords: (ProgChord | null)[]
}

export type ProgressionLibrary = Record<Genre, ProgressionPreset[]>

/**
 * Instantiate a preset into concrete chords for a given key root. Offsets are
 * taken modulo 12 above the tonic; rests pass through as null.
 */
export function instantiateProgression(
  preset: ProgressionPreset,
  keyRoot: PitchClass,
): (Chord | null)[] {
  return preset.chords.map((c) =>
    c ? { root: mod12(keyRoot + c.offset), family: c.family } : null,
  )
}

// Data is generated in progressionData.ts (10 per genre) and re-exported here.
export { PROGRESSION_LIBRARY } from './progressionData'
