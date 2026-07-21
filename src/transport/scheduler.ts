/**
 * scheduler — the lookahead transport driver ("two clocks" pattern).
 *
 * One clock is the audio sample clock (ctx.currentTime, supplied via `now()`);
 * the other is a coarse JS setInterval timer. On each tick we look a small
 * window into the future and schedule every note on/off whose onset falls in
 * that window, at absolute ctx times. This fully decouples musical timing from
 * React render timing — the UI never drives a single note.
 *
 * The timing math is extracted into the PURE `planWindow` function so it can be
 * tested deterministically without timers or audio. The `Scheduler` class is a
 * thin stateful shell around it.
 */
import type {
  NoteSink,
  PitchClass,
  Voicing,
  Direction,
  RhythmStyle,
} from '../types'
import { secondsPerBar, secondsPerBeat, swungBeatTime } from './clock'
import { playStyleEvents } from './playStyles'
import { makeRng } from './rng'

/** A fully-resolved note with absolute on/off ctx times. */
export interface ScheduledNote {
  midi: number
  velocity: number
  onTime: number
  offTime: number
}

/** One progression slot as the scheduler sees it. */
export interface SchedStep {
  voicing: Voicing | null
  /** Chord root (0–11) for bass lanes of split styles; null for a rest. */
  root?: PitchClass | null
  durationBars: number
}

/** Immutable state the planner needs. */
export interface PlanState {
  steps: SchedStep[]
  bpm: number
  beatsPerBar: number
  swing: number
  rhythm: RhythmStyle
  motion: number
  direction: Direction
  seed: number
  /** Number of leading slots to cycle; <= 0 means all of `steps`. */
  loopLength: number
  /** ctx time at which slot 0 (the first played step) began. */
  startTime: number
  /** Optional slot forced to begin a restarted random sequence. */
  randomFirstSlot?: number | null
}

/**
 * Resolve the order in which step indices are visited for a given direction.
 * Returns the index of the `n`-th played slot (0-based n). For 'random' we use
 * a seeded RNG advanced deterministically per played slot so the same seed +
 * step count always yields the same sequence (and no immediate repeats when
 * there is more than one slot).
 */
export function slotOrderIndex(
  n: number,
  count: number,
  direction: Direction,
  seed: number,
): number {
  if (count <= 1) return 0
  switch (direction) {
    case 'forward':
      return n % count
    case 'reverse':
      return ((count - 1 - (n % count)) + count) % count
    case 'pendulum': {
      // 0,1,..,count-1,count-2,..,1, then repeat. Period = 2*(count-1).
      const period = 2 * (count - 1)
      const p = n % period
      return p < count ? p : period - p
    }
    case 'random': {
      // Advance an RNG deterministically; avoid repeating the previous index.
      const rng = makeRng(seed)
      let prev = -1
      let idx = 0
      for (let i = 0; i <= n; i++) {
        let pick = rng.int(count)
        if (pick === prev) pick = (pick + 1 + rng.int(count - 1)) % count
        idx = pick
        prev = pick
      }
      return idx
    }
  }
}

/** Resolve random order after a forced first slot, preserving no-repeat behavior. */
function randomIndexAfterFirst(n: number, count: number, seed: number, first: number): number {
  if (count <= 1) return 0
  const rng = makeRng(seed)
  let prev = first
  let idx = first
  for (let i = 0; i <= n; i++) {
    let pick = rng.int(count)
    if (pick === prev) pick = (pick + 1 + rng.int(count - 1)) % count
    idx = pick
    prev = pick
  }
  return idx
}

function stateSlotIndex(state: PlanState, n: number, count: number): number {
  const forced = state.randomFirstSlot
  if (
    state.direction === 'random' &&
    forced !== null &&
    forced !== undefined &&
    forced >= 0 &&
    forced < count
  ) {
    return n === 0 ? forced : randomIndexAfterFirst(n - 1, count, state.seed, forced)
  }
  return slotOrderIndex(n, count, state.direction, state.seed)
}

/** Non-null voicing for a step, else []. */
function voicingOf(step: SchedStep | undefined): Voicing {
  return step?.voicing ?? []
}

/**
 * PURE planner. Given the full transport state and a time window
 * [fromTime, toTime), returns every ScheduledNote whose `onTime` lies in that
 * window. Walks played slots from `startTime` forward, computing each slot's
 * absolute start time from cumulative bar durations, and only materialises the
 * slots that overlap the window.
 */
export function planWindow(
  state: PlanState,
  fromTime: number,
  toTime: number,
): ScheduledNote[] {
  const { steps, bpm, beatsPerBar, swing, rhythm, motion, seed, loopLength } = state
  if (!steps.length || toTime <= fromTime) return []

  // The loop cycles the first `count` slots; the rest are parked (never played).
  const count = Math.max(1, Math.min(loopLength > 0 ? loopLength : steps.length, steps.length))

  const out: ScheduledNote[] = []
  const spb = secondsPerBeat(bpm)

  // Walk slots forward from startTime. Skip ahead cheaply until a slot can
  // overlap the window, then emit until we pass toTime.
  let slotStart = state.startTime
  let n = 0
  // Safety bound: never loop forever on absurd inputs.
  const maxSlots = 100000
  while (n < maxSlots) {
    const idx = stateSlotIndex(state, n, count)
    const step = steps[idx]
    const durBars = step?.durationBars ?? 1
    const slotLen = secondsPerBar(bpm, beatsPerBar) * durBars
    const slotEnd = slotStart + slotLen

    if (slotEnd <= fromTime) {
      // Entirely before the window — advance.
      slotStart = slotEnd
      n++
      continue
    }
    if (slotStart >= toTime) break // Entirely after — done.

    // This slot overlaps the window: materialise its events.
    const voicing = voicingOf(step)
    if (voicing.length) {
      const evs = playStyleEvents(step?.root ?? null, voicing, rhythm, {
        durationBars: durBars,
        beatsPerBar,
        swing,
        motion,
        seed,
      })
      for (const e of evs) {
        // Convert beat-domain onset to seconds, applying swing on off-beats.
        const onOffset = swingBeatSeconds(e.startBeat, swing, spb)
        const onTime = slotStart + onOffset
        if (onTime < fromTime || onTime >= toTime) continue
        const offTime = onTime + e.durBeats * spb
        out.push({ midi: e.midi, velocity: e.velocity, onTime, offTime })
      }
    }

    slotStart = slotEnd
    n++
  }

  out.sort((a, b) => a.onTime - b.onTime)
  return out
}

/**
 * PURE release planner. Note-ons are planned when their onset enters the
 * lookahead window, but releases are deliberately planned only when the
 * release itself enters the window. Keeping long note-offs out of Web Audio's
 * immutable future lets a live tempo change recalculate the remaining musical
 * duration of held notes.
 */
export function planOffWindow(
  state: PlanState,
  fromTime: number,
  toTime: number,
): ScheduledNote[] {
  const { steps, bpm, beatsPerBar, swing, rhythm, motion, seed, loopLength } = state
  if (!steps.length || toTime <= fromTime) return []

  const count = Math.max(1, Math.min(loopLength > 0 ? loopLength : steps.length, steps.length))
  const out: ScheduledNote[] = []
  const spb = secondsPerBeat(bpm)
  // Current styles extend at most one bar beyond a slot. Four bars keeps ample
  // headroom for future long gates while letting long-running sessions skip old
  // slots without regenerating every historical event on every timer tick.
  const maxReleaseTail = secondsPerBar(bpm, beatsPerBar) * 4
  let slotStart = state.startTime
  let n = 0
  const maxSlots = 100000

  // Events may extend beyond their slot (some authored gates intentionally
  // overlap), so retain preceding slots whose possible release tails can still
  // reach this window.
  while (n < maxSlots && slotStart < toTime) {
    const idx = stateSlotIndex(state, n, count)
    const step = steps[idx]
    const durBars = step?.durationBars ?? 1
    const slotLen = secondsPerBar(bpm, beatsPerBar) * durBars
    const slotEnd = slotStart + slotLen
    if (slotEnd + maxReleaseTail < fromTime) {
      slotStart = slotEnd
      n++
      continue
    }
    const voicing = voicingOf(step)
    if (voicing.length) {
      const evs = playStyleEvents(step?.root ?? null, voicing, rhythm, {
        durationBars: durBars,
        beatsPerBar,
        swing,
        motion,
        seed,
      })
      for (const e of evs) {
        const onTime = slotStart + swingBeatSeconds(e.startBeat, swing, spb)
        const offTime = onTime + e.durBeats * spb
        if (offTime < fromTime || offTime >= toTime) continue
        out.push({ midi: e.midi, velocity: e.velocity, onTime, offTime })
      }
    }
    slotStart = slotEnd
    n++
  }

  out.sort((a, b) => a.offTime - b.offTime)
  return out
}

/**
 * Convert a beat-domain onset into seconds with swing. We map the beat onset
 * onto the eighth-note grid used by clock.swungBeatTime: integer-and-half beats
 * are eighths; finer subdivisions (sixteenths, triplets) pass through straight
 * to keep arps/broken from being distorted, while their nearest eighth off-beat
 * still gets the swing push.
 */
export function swingBeatSeconds(startBeat: number, swing: number, spb: number): number {
  if (swing <= 0) return startBeat * spb
  // Is this onset exactly on an eighth grid position?
  const eighthIndex = startBeat * 2
  if (Math.abs(eighthIndex - Math.round(eighthIndex)) < 1e-9) {
    return swungBeatTime(Math.round(eighthIndex), swing, spb)
  }
  // Finer than an eighth: add the swing delay of the eighth slot it sits in.
  const baseEighth = Math.floor(eighthIndex)
  const swungBase = swungBeatTime(baseEighth, swing, spb)
  const straightBase = (baseEighth * spb) / 2
  const within = startBeat * spb - straightBase
  return swungBase + within
}

// ---------------------------------------------------------------------------
// Scheduler class
// ---------------------------------------------------------------------------

export interface SchedulerOpts {
  /** Returns the audio sample clock time (ctx.currentTime). */
  now: () => number
  dispatch: NoteSink
  /** Lookahead window in seconds (default 0.1). */
  lookahead?: number
  /** Timer interval in ms (default 25). */
  interval?: number
}

export interface SetStepsOpts {
  /** Seed for 'random' direction. */
  seed?: number
}

type StepCb = (info: { index: number; queued: number | null }) => void

export class Scheduler {
  private readonly now: () => number
  private readonly dispatch: NoteSink
  private readonly lookahead: number
  private readonly interval: number

  private timer: ReturnType<typeof setInterval> | null = null
  private _playing = false

  private steps: SchedStep[] = []
  private bpm = 120
  private beatsPerBar = 4
  private swing = 0
  private rhythm: RhythmStyle = 'hold'
  private motion = 0
  private direction: Direction = 'forward'
  private seed = 1
  /** Slots to cycle; 0 = all of `steps`. */
  private loopLength = 0

  /** ctx time slot 0 began. */
  private startTime = 0
  /** Up to where (ctx time) we have already scheduled. */
  private scheduledUntil = 0

  /** Active step bookkeeping for onStep callbacks. */
  private lastReportedSlotN = -1
  /** A queued live jump: slot index to jump to, and the ctx time to do it. */
  private pendingJump: { index: number; at: number; quantize: 'beat' | 'bar' | 'off' } | null = null
  /** A live random jump starts with this explicit slot, then resumes seeded random order. */
  private randomFirstSlot: number | null = null
  private stepCbs: StepCb[] = []

  constructor(opts: SchedulerOpts) {
    this.now = opts.now
    this.dispatch = opts.dispatch
    this.lookahead = opts.lookahead ?? 0.1
    this.interval = opts.interval ?? 25
  }

  setSteps(
    steps: { voicing: Voicing | null; root?: PitchClass | null; durationBars: number }[],
    opts?: SetStepsOpts,
  ): void {
    this.steps = steps.map((s) => ({
      voicing: s.voicing,
      root: s.root ?? null,
      durationBars: s.durationBars,
    }))
    if (opts?.seed !== undefined) this.seed = opts.seed
  }

  setSeed(seed: number): void {
    this.seed = seed
  }

  setTempo(bpm: number): void {
    // Rebase startTime so the current musical position (bars elapsed) is
    // preserved across a live tempo change. Without this, every slot boundary
    // is recomputed from startTime at the new bar length, reinterpreting the
    // whole elapsed timeline and jumping the active slot forward or backward
    // (e.g. on a BPM-slider drag or an incoming Link tempo update). Since bar
    // length is inversely proportional to bpm, the rebase is a simple ratio.
    if (this._playing && bpm > 0 && this.bpm > 0 && bpm !== this.bpm) {
      // The current lookahead has already been committed at the old tempo. Make
      // the new tempo effective exactly where that window ends, preserving phase
      // there; everything subsequently planned uses the new beat duration.
      const effectiveAt = Math.max(this.now(), this.scheduledUntil)
      this.startTime = effectiveAt - (effectiveAt - this.startTime) * (this.bpm / bpm)
      this.bpm = bpm
      if (this.pendingJump) {
        this.pendingJump.at = this.quantizedTime(effectiveAt, this.pendingJump.quantize)
      }
      return
    }
    this.bpm = bpm
  }

  setSwing(s: number): void {
    this.swing = Math.max(0, Math.min(1, s))
  }

  setRhythm(style: RhythmStyle): void {
    if (style === this.rhythm) return
    // Releases are regenerated from the current style on every lookahead tick.
    // Flush voices created by the previous style before replacing it, otherwise
    // their original note-offs disappear from the plan and can hang indefinitely.
    if (this._playing) this.dispatch.allNotesOff()
    this.rhythm = style
  }

  setDirection(dir: Direction): void {
    this.direction = dir
    this.randomFirstSlot = null
  }

  setMotion(m: number): void {
    this.motion = Math.max(0, Math.min(1, m))
  }

  /** Number of leading slots to loop. 0 (or out of range) means all slots. */
  setLoopLength(n: number): void {
    this.loopLength = Math.max(0, Math.floor(n))
  }

  get playing(): boolean {
    return this._playing
  }

  start(atTime?: number): void {
    if (this._playing) return
    const t = atTime ?? this.now()
    this.startTime = t
    this.scheduledUntil = t
    this.lastReportedSlotN = -1
    this.pendingJump = null
    this.randomFirstSlot = null
    this._playing = true
    // Prime immediately, then on interval.
    this.tick()
    this.timer = setInterval(() => this.tick(), this.interval)
  }

  stop(): void {
    if (!this._playing) return
    this._playing = false
    if (this.timer !== null) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.pendingJump = null
    this.dispatch.allNotesOff()
  }

  /**
   * Queue a live jump to `index` on the next beat/bar boundary (or immediately
   * for 'off'). The jump rebases the timeline so the target slot starts at the
   * boundary and continues playing forward from there.
   */
  triggerSlot(index: number, quantize: 'beat' | 'bar' | 'off' = 'bar'): void {
    // Only slots inside the loop can be jumped to; parked slots are ignored.
    if (index < 0 || index >= this.count()) return
    const now = this.now()
    const at = this.quantizedTime(now, quantize)
    this.pendingJump = { index, at, quantize }
    this.emitStep()
  }

  onStep(cb: StepCb): () => void {
    this.stepCbs.push(cb)
    return () => {
      this.stepCbs = this.stepCbs.filter((c) => c !== cb)
    }
  }

  dispose(): void {
    this.stop()
    this.stepCbs = []
  }

  // -- internals ----------------------------------------------------------

  /** Effective number of slots in the loop (0 when there are no steps). */
  private count(): number {
    if (this.steps.length === 0) return 0
    const L = this.loopLength > 0 ? this.loopLength : this.steps.length
    return Math.max(1, Math.min(L, this.steps.length))
  }

  private planState(): PlanState {
    return {
      steps: this.steps,
      bpm: this.bpm,
      beatsPerBar: this.beatsPerBar,
      swing: this.swing,
      rhythm: this.rhythm,
      motion: this.motion,
      direction: this.direction,
      seed: this.seed,
      loopLength: this.loopLength,
      startTime: this.startTime,
      randomFirstSlot: this.randomFirstSlot,
    }
  }

  private quantizedTime(now: number, quantize: 'beat' | 'bar' | 'off'): number {
    if (quantize === 'off') return now
    const grid = quantize === 'beat'
      ? secondsPerBeat(this.bpm)
      : secondsPerBar(this.bpm, this.beatsPerBar)
    const elapsed = now - this.startTime
    const k = Math.floor(elapsed / grid) + 1
    return this.startTime + k * grid
  }

  /** Index of the currently-sounding played-slot ordinal, given a ctx time. */
  private slotNAt(t: number): number {
    if (!this.steps.length || t < this.startTime) return 0
    const count = this.count()
    let slotStart = this.startTime
    let n = 0
    const maxSlots = 100000
    while (n < maxSlots) {
      const idx = stateSlotIndex(this.planState(), n, count)
      const durBars = this.steps[idx]?.durationBars ?? 1
      const slotEnd = slotStart + secondsPerBar(this.bpm, this.beatsPerBar) * durBars
      if (t < slotEnd) return n
      slotStart = slotEnd
      n++
    }
    return n
  }

  private tick(): void {
    if (!this._playing) return
    const now = this.now()
    const horizon = now + this.lookahead

    // Apply a pending jump once we reach its boundary time. We only commit it
    // when its `at` is within the horizon so notes after it schedule correctly.
    if (this.pendingJump && this.pendingJump.at <= horizon) {
      this.applyJump(this.pendingJump.index, this.pendingJump.at)
      this.pendingJump = null
    }

    const from = Math.max(this.scheduledUntil, now)
    if (horizon > from) {
      // Resolve releases first. When a held pitch is retriggered exactly at a
      // chord boundary, AudioEngine can then bind the off to the old voice before
      // the new voice is allocated.
      const releases = planOffWindow(this.planState(), from, horizon)
      for (const note of releases) this.dispatch.noteOff(note.midi, note.offTime)
      const notes = planWindow(this.planState(), from, horizon)
      for (const note of notes) {
        this.dispatch.noteOn({ midi: note.midi, velocity: note.velocity }, note.onTime)
      }
      this.scheduledUntil = horizon
    }

    this.emitStep()
  }

  /**
   * Rebase the timeline so the played sequence restarts at `index` at time
   * `at`. We set startTime back by the cumulative duration of the played slots
   * preceding the target so that slot-ordinal 0 maps to `index` at `at`. For
   * 'forward' this is exact; for other directions we restart the sequence
   * (ordinal 0) but seed the order so it begins at the requested index.
   */
  private applyJump(index: number, at: number): void {
    if (this.direction === 'random') {
      // A seeded random stream is not guaranteed to visit every slot within any
      // finite search bound. Make the requested slot an explicit new first step,
      // then continue with the same seed while avoiding an immediate repeat.
      this.randomFirstSlot = index
      this.startTime = at
      this.scheduledUntil = Math.max(this.scheduledUntil, at)
      this.lastReportedSlotN = -1
      return
    }
    this.randomFirstSlot = null
    // Rebase the timeline so the requested slot is sounding at `at`, while
    // keeping the direction's pattern intact. We find the first ordinal `found`
    // in the (deterministic) order whose slot === `index`, then shift startTime
    // back by the cumulative duration of the preceding ordinals so that ordinal
    // `found` lands exactly at `at` and play continues forward from there.
    const count = this.count()
    const maxSlots = count * 4 + 8
    let found = 0
    for (let n = 0; n < maxSlots; n++) {
      if (slotOrderIndex(n, count, this.direction, this.seed) === index) {
        found = n
        break
      }
    }
    // Compute cumulative time of `found` slots from a fresh start, then set
    // startTime = at - thatCumulative so that ordinal `found` begins at `at`.
    let cumulative = 0
    for (let i = 0; i < found; i++) {
      const idx = slotOrderIndex(i, count, this.direction, this.seed)
      const durBars = this.steps[idx]?.durationBars ?? 1
      cumulative += secondsPerBar(this.bpm, this.beatsPerBar) * durBars
    }
    this.startTime = at - cumulative
    // Don't reschedule the past; ensure we don't double-fire notes before `at`.
    this.scheduledUntil = Math.max(this.scheduledUntil, at)
    this.lastReportedSlotN = -1
  }

  private emitStep(): void {
    const now = this.now()
    const n = this.slotNAt(now)
    if (n === this.lastReportedSlotN && this.pendingJumpUnchanged()) return
    this.lastReportedSlotN = n
    const index = this.steps.length
      ? stateSlotIndex(this.planState(), n, this.count())
      : 0
    const queued = this.pendingJump ? this.pendingJump.index : null
    for (const cb of this.stepCbs) cb({ index, queued })
  }

  private _lastQueued: number | null = null
  private pendingJumpUnchanged(): boolean {
    const q = this.pendingJump ? this.pendingJump.index : null
    if (q !== this._lastQueued) {
      this._lastQueued = q
      return false
    }
    return true
  }
}
