/**
 * playStyles — turns a chord (root + voice-led voicing) into timed note events
 * for one slot, according to a Style. Pure & deterministic.
 *
 * The eight original single-lane styles (hold/pulse/stab/offbeat/arps/broken)
 * are delegated to `rhythmEvents` unchanged. The new "split" styles are authored
 * as 1–3 LANES over a small model: each lane draws notes from the chord (root,
 * fifth, chord-tones, guide-tones, or top), places them at an octave, and fires
 * them on a 16-step bar mask (or as a cycled arp), with gate + velocity. Bass
 * lanes use the chord ROOT dropped to a low register; melodic lanes ride the
 * voice-led voicing so single-note lines move smoothly chord to chord.
 *
 * Output is the same beat-domain `RhythmEvent` the scheduler already consumes,
 * so nothing downstream changes — a "lane" is just more events.
 */
import type { Midi, PitchClass, RhythmStyle, Voicing } from '../types'
import { rhythmEvents, type RhythmEvent, type RhythmOpts } from './rhythm'
import { makeRng } from './rng'

const STEPS_PER_BAR = 16
/** Root/fifth lanes place the root at the octave nearest this MIDI (~E2). */
const BASS_ANCHOR = 40
/** Guide-tone lanes place tones at the octave nearest this MIDI (~E4). */
const MELODY_ANCHOR = 64

export interface PlayStyleOpts extends RhythmOpts {
  /** Seed for random arp order (deterministic). */
  seed?: number
}

type LaneSource = 'root' | 'fifth' | 'chordTones' | 'guideTones' | 'top'
type LaneMode = 'cycle' | 'chord'
type LaneOrder = 'up' | 'down' | 'updown' | 'asPlayed' | 'random'

interface Lane {
  source: LaneSource
  /** 'cycle' = one pool note per active step (arp/mono); 'chord' = all at once. */
  mode: LaneMode
  order?: LaneOrder
  /** Octave offset added to the resolved notes (bass negative, melody positive). */
  octave: number
  /** For cycle chordTones lanes: how many octaves the pool spans (default 1). */
  octaveSpan?: number
  /** 16-step gate mask (one bar); repeats for the slot's duration. */
  steps: boolean[]
  /** Per-step extra octave offset (length 16, default 0). */
  octaveJump?: number[]
  /** Gate length as a fraction of one step (>1 = held/overlap). */
  gate: number
  velocity: number
}

interface PlayStyleDef {
  lanes: Lane[]
}

// --- mask helpers ---------------------------------------------------------

function on(...idx: number[]): boolean[] {
  const s = new Array<boolean>(STEPS_PER_BAR).fill(false)
  for (const i of idx) s[i] = true
  return s
}
/** 16ths with the first 16th of each beat empty (the rolling-bass feel). */
function roll(): boolean[] {
  const s = new Array<boolean>(STEPS_PER_BAR).fill(true)
  for (let i = 0; i < STEPS_PER_BAR; i += 4) s[i] = false
  return s
}
const allSteps = (): boolean[] => new Array<boolean>(STEPS_PER_BAR).fill(true)
const eighths = (): boolean[] => on(0, 2, 4, 6, 8, 10, 12, 14)
/** Build a length-16 octave-jump array from a sparse {step: octaves} map. */
function jumps(map: Record<number, number>): number[] {
  const a = new Array<number>(STEPS_PER_BAR).fill(0)
  for (const k of Object.keys(map)) a[Number(k)] = map[Number(k)]
  return a
}

// --- authored split styles ------------------------------------------------

const SPLIT_STYLES: Partial<Record<RhythmStyle, PlayStyleDef>> = {
  'bass-melody': {
    lanes: [
      { source: 'root', mode: 'cycle', octave: 0, steps: on(0, 4, 8, 12), gate: 0.9, velocity: 0.8 },
      { source: 'guideTones', mode: 'cycle', order: 'asPlayed', octave: 1, steps: on(0, 4, 8, 12), gate: 0.9, velocity: 0.66 },
    ],
  },
  'house-bass-stab': {
    lanes: [
      { source: 'root', mode: 'cycle', octave: 0, steps: on(2, 6, 10, 14), octaveJump: jumps({ 6: 1, 14: 1 }), gate: 0.5, velocity: 0.82 },
      { source: 'chordTones', mode: 'chord', octave: 0, steps: on(2, 6, 10, 14), gate: 0.4, velocity: 0.68 },
    ],
  },
  'techno-roll': {
    lanes: [
      { source: 'root', mode: 'cycle', octave: 0, steps: roll(), gate: 0.5, velocity: 0.75 },
      { source: 'chordTones', mode: 'chord', octave: 0, steps: on(0), gate: 16, velocity: 0.4 },
    ],
  },
  'trance-arp': {
    lanes: [
      { source: 'root', mode: 'cycle', octave: 0, steps: roll(), gate: 0.4, velocity: 0.72 },
      { source: 'chordTones', mode: 'cycle', order: 'up', octave: 1, octaveSpan: 2, steps: allSteps(), gate: 0.5, velocity: 0.64 },
      { source: 'chordTones', mode: 'chord', octave: 0, steps: on(0), gate: 16, velocity: 0.4 },
    ],
  },
  'dub-skank': {
    lanes: [
      { source: 'root', mode: 'cycle', octave: -1, steps: on(0), gate: 16, velocity: 0.7 },
      { source: 'chordTones', mode: 'chord', octave: 0, steps: on(2, 6, 10, 14), gate: 0.3, velocity: 0.6 },
    ],
  },
  'synth-drive': {
    lanes: [
      { source: 'root', mode: 'cycle', octave: 0, steps: eighths(), octaveJump: jumps({ 2: 1, 6: 1, 10: 1, 14: 1 }), gate: 0.5, velocity: 0.8 },
      { source: 'chordTones', mode: 'cycle', order: 'updown', octave: 1, steps: eighths(), gate: 0.5, velocity: 0.66 },
      { source: 'chordTones', mode: 'chord', octave: 0, steps: on(0), gate: 16, velocity: 0.42 },
    ],
  },
  'lofi-broken': {
    lanes: [
      { source: 'root', mode: 'cycle', octave: 0, steps: on(0, 8), gate: 3, velocity: 0.68 },
      { source: 'chordTones', mode: 'cycle', order: 'up', octave: 0, octaveSpan: 2, steps: on(0, 3, 6, 10, 13), gate: 0.9, velocity: 0.6 },
    ],
  },
  'garage-2step': {
    lanes: [
      { source: 'root', mode: 'cycle', octave: 0, steps: on(0, 3, 6, 10, 13), octaveJump: jumps({ 6: 1, 13: 1 }), gate: 0.5, velocity: 0.8 },
      { source: 'chordTones', mode: 'chord', octave: 0, steps: on(2, 6, 10, 14), gate: 0.3, velocity: 0.66 },
    ],
  },
}

/** Set of styles handled by the lane engine (the rest delegate to rhythmEvents). */
export const SPLIT_STYLE_IDS = Object.keys(SPLIT_STYLES) as RhythmStyle[]

// --- note-pool resolution -------------------------------------------------

/** Place a pitch class at the octave nearest a target MIDI note. */
function placeNear(pc: number, target: number): number {
  const p = ((pc % 12) + 12) % 12
  return p + 12 * Math.round((target - p) / 12)
}

function resolvePool(lane: Lane, root: PitchClass | null, voicing: Voicing): Midi[] {
  const shift = lane.octave * 12
  switch (lane.source) {
    case 'root':
      return root === null ? [] : [placeNear(root, BASS_ANCHOR) + shift]
    case 'fifth':
      return root === null
        ? []
        : [placeNear(root, BASS_ANCHOR) + shift, placeNear(root + 7, BASS_ANCHOR) + shift]
    case 'top':
      return voicing.length ? [Math.max(...voicing) + shift] : []
    case 'chordTones': {
      if (!voicing.length) return []
      const up = [...voicing].sort((a, b) => a - b).map((m) => m + shift)
      const span = Math.max(1, lane.octaveSpan ?? 1)
      const pool: Midi[] = []
      for (let o = 0; o < span; o++) for (const m of up) pool.push(m + o * 12)
      return pool
    }
    case 'guideTones': {
      if (root === null || !voicing.length) return []
      const res: Midi[] = []
      for (const wants of [[4, 3], [11, 10, 9]]) {
        for (const w of wants) {
          if (voicing.some((m) => (((m - root) % 12) + 12) % 12 === w)) {
            res.push(placeNear(root + w, MELODY_ANCHOR) + shift)
            break
          }
        }
      }
      return res.length ? res : [placeNear(root, MELODY_ANCHOR) + shift]
    }
  }
}

/** Order a cycle pool. `asPlayed` preserves pool order (e.g. guide tones 3rd→7th). */
function orderPool(pool: Midi[], order: LaneOrder): Midi[] {
  const sorted = [...pool].sort((a, b) => a - b)
  switch (order) {
    case 'down':
      return [...sorted].reverse()
    case 'updown':
      return sorted.length <= 2 ? sorted : [...sorted, ...sorted.slice(1, -1).reverse()]
    case 'asPlayed':
    case 'random':
      return pool
    default:
      return sorted
  }
}

/** MOTION densifies only chord-tone arp lanes (adds steps → never removes). */
function densify(lane: Lane, motion: number): boolean[] {
  if (lane.source !== 'chordTones' || lane.mode !== 'cycle') return lane.steps
  const m = Math.max(0, Math.min(1, motion))
  if (m >= 0.67) return allSteps()
  if (m >= 0.34) {
    const s = [...lane.steps]
    for (let i = 0; i < STEPS_PER_BAR; i += 2) s[i] = true
    return s
  }
  return lane.steps
}

function velocityFor(beatPos: number, beatsPerBar: number, base: number): number {
  const inBar = ((beatPos % beatsPerBar) + beatsPerBar) % beatsPerBar
  let v: number
  if (inBar === 0) v = base + 0.18
  else if (Number.isInteger(inBar)) v = base + 0.06
  else v = base - 0.06
  return Math.max(0.05, Math.min(1, v))
}

function isOffbeatEighth(beatPos: number): boolean {
  const frac = beatPos - Math.floor(beatPos)
  return Math.abs(frac - 0.5) < 1e-9
}

function laneEvents(
  lane: Lane,
  root: PitchClass | null,
  voicing: Voicing,
  opts: PlayStyleOpts,
  rng: { int: (n: number) => number },
): RhythmEvent[] {
  const beatsPerBar = opts.beatsPerBar ?? 4
  const totalBeats = opts.durationBars * beatsPerBar
  const pool = resolvePool(lane, root, voicing)
  if (!pool.length) return []

  const ordered = lane.mode === 'cycle' ? orderPool(pool, lane.order ?? 'up') : pool
  const mask = densify(lane, opts.motion)
  const beatPerStep = beatsPerBar / STEPS_PER_BAR
  const bars = Math.ceil(totalBeats / beatsPerBar)
  const events: RhythmEvent[] = []
  let cursor = 0

  for (let bar = 0; bar < bars; bar++) {
    for (let s = 0; s < STEPS_PER_BAR; s++) {
      if (!mask[s]) continue
      const beat = bar * beatsPerBar + s * beatPerStep
      if (beat >= totalBeats - 1e-9) continue
      const jump = (lane.octaveJump?.[s] ?? 0) * 12
      const dur = Math.max(0.02, lane.gate * beatPerStep)
      const vel = velocityFor(beat, beatsPerBar, lane.velocity)
      if (lane.mode === 'chord') {
        for (const m of pool) events.push({ midi: m + jump, velocity: vel, startBeat: beat, durBeats: dur })
      } else {
        const midi =
          (lane.order ?? 'up') === 'random'
            ? ordered[rng.int(ordered.length)]
            : ordered[cursor++ % ordered.length]
        events.push({ midi: midi + jump, velocity: vel, startBeat: beat, durBeats: dur })
      }
    }
  }
  return events
}

/**
 * Generate the note events for a slot. Original single-lane styles delegate to
 * `rhythmEvents`; split styles use the lane engine (and need the chord root).
 */
export function playStyleEvents(
  root: PitchClass | null,
  voicing: Voicing,
  style: RhythmStyle,
  opts: PlayStyleOpts,
): RhythmEvent[] {
  // No voiced chord → a rest, regardless of root (matches rhythmEvents + the
  // scheduler's own voicing.length gate).
  if (!voicing.length) return []

  const def = SPLIT_STYLES[style]
  if (!def) return rhythmEvents(voicing, style, opts)

  const beatsPerBar = opts.beatsPerBar ?? 4
  if (opts.durationBars * beatsPerBar <= 0) return []
  const rng = makeRng(opts.seed ?? 1)
  const events: RhythmEvent[] = []
  for (const lane of def.lanes) events.push(...laneEvents(lane, root, voicing, opts, rng))

  if (opts.swing > 0) {
    for (const e of events) {
      if (isOffbeatEighth(e.startBeat)) e.durBeats = Math.max(0.02, e.durBeats * (1 - 0.2 * opts.swing))
    }
  }
  events.sort((a, b) => a.startBeat - b.startBeat)
  return events
}
