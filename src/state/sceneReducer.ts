/**
 * App state: the current SceneState plus selection and a bounded undo/redo
 * history. Pure and synchronous — the reducer is the single place every scene
 * mutation flows through, which is what makes every mutation undoable.
 *
 * The audio engine, scheduler, and MIDI are side effects driven *from* this
 * state by the App component; they are never mutated inside the reducer.
 */
import { generateProgression, varyProgression, transposeChord } from '../harmony'
import { createDefaultScene } from '../persistence'
import type {
  Chord,
  Direction,
  MacroValues,
  Mode,
  PitchClass,
  PresetId,
  RhythmStyle,
  SceneState,
  SlotDuration,
  VoicingMode,
} from '../types'
import { SLOT_COUNT } from '../types'

/** Maximum number of undo steps kept. Bounds memory; older states are dropped. */
export const MAX_HISTORY = 64

export interface AppState {
  scene: SceneState
  /** Currently selected slot 0..SLOT_COUNT-1 (for keyboard navigation / editing). */
  selectedSlot: number
  past: SceneState[]
  future: SceneState[]
}

export type Action =
  | { type: 'setKey'; root: PitchClass }
  | { type: 'setMode'; mode: Mode }
  | { type: 'setSlotChord'; index: number; chord: Chord | null }
  | { type: 'setSlotDuration'; index: number; duration: SlotDuration }
  | { type: 'clearSlot'; index: number }
  | { type: 'setLoopLength'; length: number }
  | { type: 'selectSlot'; index: number }
  | { type: 'moveSelection'; delta: number }
  | { type: 'setVoicingMode'; mode: VoicingMode }
  | { type: 'setDirection'; dir: Direction }
  | { type: 'setRhythm'; style: RhythmStyle }
  | { type: 'setBpm'; bpm: number }
  | { type: 'setSwing'; swing: number }
  | { type: 'setPreset'; preset: PresetId }
  | { type: 'setMacro'; macro: keyof MacroValues; value: number }
  | { type: 'generate'; seed?: number }
  | { type: 'vary'; seed?: number }
  | { type: 'loadScene'; scene: SceneState }
  | { type: 'undo' }
  | { type: 'redo' }

/** Deterministically advance a seed so repeated generate/vary differ but replay. */
export function nextSeed(seed: number): number {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0
}

const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n))

export function createInitialState(scene: SceneState = createDefaultScene()): AppState {
  return { scene, selectedSlot: 0, past: [], future: [] }
}

/** Actions that change the scene and therefore push an undo checkpoint. */
const HISTORY_ACTIONS = new Set<Action['type']>([
  'setKey',
  'setMode',
  'setSlotChord',
  'setSlotDuration',
  'clearSlot',
  'setLoopLength',
  'setVoicingMode',
  'setDirection',
  'setRhythm',
  'setBpm',
  'setSwing',
  'setPreset',
  'setMacro',
  'generate',
  'vary',
])

/** Apply a scene-changing action, returning the next scene (no history work). */
function reduceScene(scene: SceneState, action: Action): SceneState {
  switch (action.type) {
    case 'setKey': {
      const root = ((action.root % 12) + 12) % 12
      const semitones = ((root - scene.keyRoot) % 12 + 12) % 12
      // Transpose the harmonic intent: move every chord with the key so the
      // progression sounds the same relative to the new tonic.
      const slots = scene.slots.map((slot) =>
        slot.chord ? { ...slot, chord: transposeChord(slot.chord, semitones) } : slot,
      )
      return { ...scene, keyRoot: root, slots }
    }
    case 'setMode':
      return { ...scene, mode: action.mode }
    case 'setSlotChord': {
      const slots = scene.slots.map((slot, i) =>
        i === action.index ? { ...slot, chord: action.chord } : slot,
      )
      return { ...scene, slots }
    }
    case 'setSlotDuration': {
      const slots = scene.slots.map((slot, i) =>
        i === action.index ? { ...slot, durationBars: action.duration } : slot,
      )
      return { ...scene, slots }
    }
    case 'clearSlot': {
      const slots = scene.slots.map((slot, i) =>
        i === action.index ? { ...slot, chord: null } : slot,
      )
      return { ...scene, slots }
    }
    case 'setLoopLength':
      return { ...scene, loopLength: clamp(Math.round(action.length), 1, SLOT_COUNT) }
    case 'setVoicingMode':
      return { ...scene, voicingMode: action.mode }
    case 'setDirection':
      return { ...scene, direction: action.dir }
    case 'setRhythm':
      return { ...scene, rhythm: action.style }
    case 'setBpm':
      return { ...scene, bpm: clamp(Math.round(action.bpm), 40, 240) }
    case 'setSwing':
      return { ...scene, swing: clamp(action.swing, 0, 1) }
    case 'setPreset':
      return { ...scene, preset: action.preset }
    case 'setMacro':
      return { ...scene, macros: { ...scene.macros, [action.macro]: clamp(action.value, 0, 1) } }
    case 'generate': {
      const seed = action.seed ?? nextSeed(scene.seed)
      const slots = generateProgression({ keyRoot: scene.keyRoot, mode: scene.mode, seed })
      return { ...scene, slots, seed }
    }
    case 'vary': {
      const seed = action.seed ?? nextSeed(scene.seed)
      const slots = varyProgression(scene.slots, { keyRoot: scene.keyRoot, mode: scene.mode, seed })
      return { ...scene, slots, seed }
    }
    default:
      return scene
  }
}

export function sceneReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'selectSlot':
      return { ...state, selectedSlot: clamp(action.index, 0, SLOT_COUNT - 1) }
    case 'moveSelection':
      return {
        ...state,
        // Wrap selection so arrow navigation never gets stuck at the edges.
        selectedSlot: ((state.selectedSlot + action.delta) % SLOT_COUNT + SLOT_COUNT) % SLOT_COUNT,
      }
    case 'loadScene':
      // Loading a saved/shared/imported scene starts a fresh history.
      return { scene: action.scene, selectedSlot: 0, past: [], future: [] }
    case 'undo': {
      const prev = state.past[state.past.length - 1]
      if (!prev) return state
      return {
        ...state,
        scene: prev,
        past: state.past.slice(0, -1),
        future: [state.scene, ...state.future].slice(0, MAX_HISTORY),
      }
    }
    case 'redo': {
      const next = state.future[0]
      if (!next) return state
      return {
        ...state,
        scene: next,
        past: [...state.past, state.scene].slice(-MAX_HISTORY),
        future: state.future.slice(1),
      }
    }
    default: {
      if (!HISTORY_ACTIONS.has(action.type)) return state
      const nextScene = reduceScene(state.scene, action)
      if (nextScene === state.scene) return state
      return {
        ...state,
        scene: nextScene,
        past: [...state.past, state.scene].slice(-MAX_HISTORY),
        future: [],
      }
    }
  }
}
