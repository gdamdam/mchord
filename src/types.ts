/**
 * mchord shared contracts.
 *
 * This file is the single source of truth for every cross-module type. The
 * harmony engine, audio engine, transport/scheduler, MIDI layer, persistence,
 * sharing codec, reducer, and UI all import from here. Modules may define their
 * own *internal* types, but anything that crosses a module boundary lives here.
 *
 * Keep this file dependency-free and pure (no React, no Web Audio, no DOM).
 */

// ---------------------------------------------------------------------------
// Pitch primitives
// ---------------------------------------------------------------------------

/** A pitch class 0–11 where 0 = C, 1 = C#/Db, … 11 = B. */
export type PitchClass = number

/** A MIDI note number 0–127, where 60 = middle C (C4). */
export type Midi = number

/** An ordered list of MIDI notes, low → high, ready to sound. */
export type Voicing = Midi[]

// ---------------------------------------------------------------------------
// Keys & modes
// ---------------------------------------------------------------------------

export const MODES = [
  'major',
  'natural-minor',
  'dorian',
  'mixolydian',
  'phrygian',
  'lydian',
  'harmonic-minor',
] as const
export type Mode = (typeof MODES)[number]

// ---------------------------------------------------------------------------
// Chords
// ---------------------------------------------------------------------------

/**
 * The supported chord families. Keys are stable string ids used in persisted
 * state and share URLs — never rename without a migration.
 */
export const CHORD_FAMILIES = [
  'maj',
  'min',
  'dim',
  'aug',
  'sus2',
  'sus4',
  'maj7',
  'min7',
  'dom7',
  'minMaj7',
  'add9',
  'maj9',
  'min9',
  'dom9',
  '6',
  'min6',
] as const
export type ChordFamily = (typeof CHORD_FAMILIES)[number]

/** A chord independent of register or voicing: a root pitch class + a family. */
export interface Chord {
  /** Root pitch class 0–11. */
  root: PitchClass
  family: ChordFamily
}

/** Diatonic-relatedness category, used to colour the palette by stability. */
export type ChordCategory = 'diatonic' | 'borrowed' | 'chromatic'

/**
 * Human-facing labels for a chord *in the context of the current key*. The
 * harmony engine produces these; the UI renders them. `stability` is 0–1 where
 * 1 is maximally stable/consonant/diatonic and 0 is maximally tense/chromatic.
 */
export interface ChordLabel {
  /** Roman numeral with quality, e.g. "ii7", "V7", "♭VII". */
  roman: string
  /** Absolute chord name, key-appropriate spelling, e.g. "Dm7", "F♯dim". */
  name: string
  /** Compact note spelling, space separated, e.g. "D F A C". */
  notes: string
  /** 0–1 stability/consonance hint (1 = most stable). */
  stability: number
  category: ChordCategory
}

/** An entry in the harmonically-relevant chord palette. */
export interface PaletteChord {
  chord: Chord
  label: ChordLabel
}

// ---------------------------------------------------------------------------
// Voicing
// ---------------------------------------------------------------------------

export const VOICING_MODES = ['root', 'close', 'smooth', 'wide', 'bass'] as const
export type VoicingMode = (typeof VOICING_MODES)[number]

/**
 * Inputs to the voice-leading engine. Macro values (0–1) bend the result:
 * TENSION adds/upper-extends tones, SPREAD opens the voicing wider, COLOR
 * shifts chord-tone emphasis. The engine MUST be deterministic in these inputs.
 */
export interface VoicingOptions {
  mode: VoicingMode
  /** Preferred centre of the voicing as a MIDI note (default 60 = C4). */
  center?: Midi
  /** Lowest acceptable MIDI note (default 36 = C2). */
  minMidi?: Midi
  /** Highest acceptable MIDI note (default 84 = C6). */
  maxMidi?: Midi
  /** Macro influences, each 0–1. */
  tension?: number
  spread?: number
  color?: number
}

// ---------------------------------------------------------------------------
// Progression
// ---------------------------------------------------------------------------

/** Slot duration in bars. */
export const SLOT_DURATIONS = [0.5, 1, 2, 4] as const
export type SlotDuration = (typeof SLOT_DURATIONS)[number]

/** A single progression slot. A null chord means the slot is empty. */
export interface Slot {
  chord: Chord | null
  durationBars: SlotDuration
}

/** Number of progression slots. */
export const SLOT_COUNT = 8

/**
 * Bounds for the global octave shift, in octaves. The shift offsets the voicing
 * register anchor (center/min/max) by 12 semitones each. ±2 keeps the resulting
 * MIDI window comfortably inside 0–127 at both extremes.
 */
export const OCTAVE_SHIFT_MIN = -2
export const OCTAVE_SHIFT_MAX = 2

export const DIRECTIONS = ['forward', 'reverse', 'pendulum', 'random'] as const
export type Direction = (typeof DIRECTIONS)[number]

// ---------------------------------------------------------------------------
// Rhythm / articulation
// ---------------------------------------------------------------------------

export const RHYTHM_STYLES = [
  'hold',
  'pulse',
  'stab',
  'offbeat',
  'arp-up',
  'arp-down',
  'arp-updown',
  'broken',
  // Split styles (v1.2) — multi-lane bass + melody/arp performances. Appended so
  // existing persisted/shared indices stay stable.
  'bass-melody',
  'house-bass-stab',
  'techno-roll',
  'trance-arp',
  'dub-skank',
  'synth-drive',
  'lofi-broken',
  'garage-2step',
  // v1.3 — extended arps, strum, melodic, ostinato, euclidean, more splits.
  'arp-converge',
  'arp-diverge',
  'arp-thumb',
  'arp-octaves',
  'strum-folk',
  'strum-updown',
  'harp-roll',
  'guide-comp',
  'top-line',
  'pedal-line',
  'alberti',
  'gallop',
  'cell-roller',
  'euclid-3',
  'euclid-5',
  'euclid-7',
  'ambient-drone',
  'dubstep-sub',
  'downtempo-roll',
  'psy-roller',
  'dnb-stab',
] as const
export type RhythmStyle = (typeof RHYTHM_STYLES)[number]

// ---------------------------------------------------------------------------
// Sound
// ---------------------------------------------------------------------------

/** Built-in sound presets. Stable ids (persisted / shared) — never rename. */
export const PRESET_IDS = [
  'warm-poly',
  'glass',
  'dub-chord',
  'felt',
  'air-choir',
  'hollow',
  'analog-brass',
  'soft-organ',
  'foghorn',
  'uk-sub',
  'tine-ep',
  'string-ens',
  'nylon-pluck',
  'vibes',
  'clav',
] as const
export type PresetId = (typeof PRESET_IDS)[number]

/** The four performance macros, each 0–1. */
export interface MacroValues {
  tension: number
  spread: number
  motion: number
  color: number
}

// ---------------------------------------------------------------------------
// Tuning (12-note microtuning applied to the chromatic pitch classes)
// ---------------------------------------------------------------------------

/**
 * Where the 12-entry cents table is anchored: which pitch class carries the
 * table's degree-0 offset (normally 0¢ — sitting exactly on 12-TET). 'key'
 * follows the scene's keyRoot (JI/maqam intent: the tonic is always pure);
 * 'fixed' pins the table to one pitch class regardless of key — pc 0 (C) is
 * the historically-authentic choice for well-temperaments and the compat
 * behaviour of every pre-anchor scene/link.
 */
export type TuningAnchor = { mode: 'key' } | { mode: 'fixed'; pc: PitchClass }

/**
 * A 12-note microtuning. `centsOffset[pc]` is added (in cents) to the 12-TET
 * frequency of pitch class `pc` (pc = midi % 12); the array is always length 12.
 * All-zero is exactly 12-TET, so it is the byte-identical default. `name` is the
 * display label (a builtin's name or an imported `.scl`'s description). `anchor`
 * rotates the table before it reaches the engine (see resolveCentsOffset). This
 * is the only tuning surface mchord carries — arbitrary-N scales are out of scope.
 */
export interface SceneTuning {
  name: string
  centsOffset: number[]
  anchor: TuningAnchor
}

// ---------------------------------------------------------------------------
// Scene (the complete, serializable performance state)
// ---------------------------------------------------------------------------

/**
 * Current persisted/shared scene schema version. Bump on any breaking change to
 * SceneState and add a migration in the persistence layer.
 *
 * v2: added `loopLength` (migration defaults it to SLOT_COUNT = full loop).
 * v3: added `octaveShift` (migration defaults it to 0 = no shift).
 * v4: added `tuning` (migration defaults it to 12-TET = all-zero, byte-identical).
 * v5: added `tuning.anchor` (migration defaults it to Fixed C — the pre-anchor
 *     behaviour, so old scenes sound bit-identical; new scenes follow the key).
 */
export const SCENE_VERSION = 5

/**
 * The complete performance scene. This is the unit that is persisted to
 * localStorage, exported as JSON, and encoded into share URLs. It MUST stay
 * JSON-serializable and free of runtime objects.
 */
export interface SceneState {
  version: number
  /** Key root pitch class 0–11. */
  keyRoot: PitchClass
  mode: Mode
  /** Exactly SLOT_COUNT slots. */
  slots: Slot[]
  /**
   * Number of slots included in the playback loop, 1..SLOT_COUNT. The transport
   * cycles slots 0..loopLength-1; slots beyond it are "parked" — still editable
   * and auditionable, but not played in the loop.
   */
  loopLength: number
  voicingMode: VoicingMode
  direction: Direction
  rhythm: RhythmStyle
  /** Beats per minute. */
  bpm: number
  /** Swing amount 0–1 (0 = straight). */
  swing: number
  preset: PresetId
  macros: MacroValues
  /** Deterministic seed for generation / variation / random direction. */
  seed: number
  /**
   * Global octave transposition of the whole progression, in octaves
   * (OCTAVE_SHIFT_MIN..OCTAVE_SHIFT_MAX, 0 = no shift). Applied at voicing time
   * by offsetting the register anchor — chords themselves stay octave-less.
   */
  octaveShift: number
  /**
   * Active 12-note microtuning. Retunes the final pitch→Hz mapping only; the
   * harmony/voice-leading engine is unaffected. Defaults to 12-TET (all-zero).
   */
  tuning: SceneTuning
}

// ---------------------------------------------------------------------------
// Note delivery (shared by the audio engine and MIDI output)
// ---------------------------------------------------------------------------

/** A voiced note ready to sound. */
export interface VoicedNote {
  midi: Midi
  /** Normalised velocity 0–1. */
  velocity: number
}

/**
 * A destination for voiced notes. Both the audio engine and the MIDI output
 * implement this so the scheduler can broadcast the *same* voiced notes to all
 * sinks at the same sample-accurate time.
 *
 * Note ownership: `noteOff(midi)` releases the matching held note. Sinks must
 * tolerate overlapping `noteOn` for the same midi (ref-count or
 * retrigger) and guarantee that a corresponding `noteOff` is eventually
 * honoured — no hung notes. `time` is an AudioContext currentTime value in
 * seconds; sinks without a sample clock (MIDI) may treat past/near times as now.
 */
export interface NoteSink {
  noteOn(note: VoicedNote, time: number): void
  noteOff(midi: Midi, time: number): void
  /** Immediately release everything (panic / all-notes-off). */
  allNotesOff(): void
}
