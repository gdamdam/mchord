import { describe, it, expect } from 'vitest'
import {
  planWindow,
  planOffWindow,
  slotOrderIndex,
  swingBeatSeconds,
  type PlanState,
  type SchedStep,
} from './scheduler'
import type { Direction } from '../types'

const triad = (root: number) => [root, root + 4, root + 7]

function stateWith(over: Partial<PlanState>): PlanState {
  return {
    steps: [
      { voicing: triad(60), durationBars: 1 },
      { voicing: triad(62), durationBars: 1 },
      { voicing: triad(64), durationBars: 1 },
    ],
    bpm: 120, // 2s/bar
    beatsPerBar: 4,
    swing: 0,
    rhythm: 'hold',
    motion: 0,
    direction: 'forward',
    seed: 42,
    loopLength: 0, // 0 = all slots
    startTime: 0,
    ...over,
  }
}

describe('planWindow — loop length', () => {
  // Distinct single-note voicings so each slot is identifiable in the output.
  const loopState = (over: Partial<PlanState>) =>
    stateWith({
      steps: [
        { voicing: [60], durationBars: 1 },
        { voicing: [62], durationBars: 1 },
        { voicing: [64], durationBars: 1 },
      ],
      ...over,
    })

  it('cycles only the first N slots; slots beyond loopLength never play', () => {
    // 4 bars at 2s/bar covers ordinals 0,1,2,3 → with loop=2: slots 0,1,0,1.
    const notes = planWindow(loopState({ loopLength: 2 }), 0, 8)
    const midis = new Set(notes.map((n) => n.midi))
    expect(midis.has(60)).toBe(true)
    expect(midis.has(62)).toBe(true)
    expect(midis.has(64)).toBe(false) // slot 2 is parked
  })

  it('loopLength 0 (or >= slot count) plays every slot', () => {
    const midis = new Set(planWindow(loopState({ loopLength: 0 }), 0, 6).map((n) => n.midi))
    expect(midis.has(64)).toBe(true)
  })

  it('loopLength larger than the slot count is clamped to all slots', () => {
    const midis = new Set(planWindow(loopState({ loopLength: 99 }), 0, 6).map((n) => n.midi))
    expect(midis.has(64)).toBe(true)
  })
})

describe('slotOrderIndex — directions', () => {
  it('forward', () => {
    const seq = Array.from({ length: 6 }, (_, n) => slotOrderIndex(n, 3, 'forward', 0))
    expect(seq).toEqual([0, 1, 2, 0, 1, 2])
  })
  it('reverse', () => {
    const seq = Array.from({ length: 6 }, (_, n) => slotOrderIndex(n, 3, 'reverse', 0))
    expect(seq).toEqual([2, 1, 0, 2, 1, 0])
  })
  it('pendulum bounces without repeating endpoints', () => {
    const seq = Array.from({ length: 8 }, (_, n) => slotOrderIndex(n, 4, 'pendulum', 0))
    expect(seq).toEqual([0, 1, 2, 3, 2, 1, 0, 1])
  })
  it('random is reproducible for a fixed seed', () => {
    const a = Array.from({ length: 10 }, (_, n) => slotOrderIndex(n, 4, 'random', 7))
    const b = Array.from({ length: 10 }, (_, n) => slotOrderIndex(n, 4, 'random', 7))
    expect(a).toEqual(b)
    // different seed → (very likely) different sequence
    const c = Array.from({ length: 10 }, (_, n) => slotOrderIndex(n, 4, 'random', 8))
    expect(c).not.toEqual(a)
  })
  it('random avoids immediate repeats', () => {
    const seq = Array.from({ length: 50 }, (_, n) => slotOrderIndex(n, 4, 'random', 99))
    for (let i = 1; i < seq.length; i++) expect(seq[i]).not.toBe(seq[i - 1])
  })
  it('single step always returns 0', () => {
    for (const d of ['forward', 'reverse', 'pendulum', 'random'] as Direction[]) {
      expect(slotOrderIndex(5, 1, d, 3)).toBe(0)
    }
  })

  it('random order is deterministic and cache-consistent under out-of-order, large-n access', () => {
    // Guards the incremental RNG-cursor cache (A3): out-of-order and repeated
    // queries must match a single from-scratch forward walk, for the same seed.
    const N = 600
    const forward = Array.from({ length: N }, (_, n) => slotOrderIndex(n, 5, 'random', 321))
    const reverse: number[] = []
    for (let n = N - 1; n >= 0; n--) reverse[n] = slotOrderIndex(n, 5, 'random', 321)
    expect(reverse).toEqual(forward)
    // No immediate repeats across the whole (long) sequence.
    for (let i = 1; i < N; i++) expect(forward[i]).not.toBe(forward[i - 1])
    // A different seed yields a different sequence.
    expect(Array.from({ length: 10 }, (_, n) => slotOrderIndex(n, 5, 'random', 322))).not.toEqual(
      forward.slice(0, 10),
    )
  })
})

describe('planWindow — forward correction (no catch-up)', () => {
  it('a window that starts mid-timeline emits only its own onsets, never backfilling skipped slots', () => {
    // startTime 0, 3 hold slots at 2s each → bar onsets at 0,2,4,6,8…
    // Simulate the clock having jumped forward (drift correction / tab wake):
    // the scheduler only ever queries the *current* window, so the skipped
    // onsets are gone for good — no burst of catch-up notes.
    const notes = planWindow(stateWith({}), 5.0, 6.2)
    const onTimes = [...new Set(notes.map((n) => n.onTime))].sort((a, b) => a - b)
    expect(onTimes).toEqual([6]) // only the bar boundary inside the window
    expect(onTimes.some((t) => t < 5.0)).toBe(false) // 0,2,4 are NOT replayed
    expect(notes.every((n) => n.onTime >= 5.0 && n.onTime < 6.2)).toBe(true)
  })
})

describe('planOffWindow — release lookahead', () => {
  it('emits a held chord only when its release enters the window', () => {
    const state = stateWith({})
    expect(planOffWindow(state, 0, 0.1)).toEqual([])
    const releases = planOffWindow(state, 1.9, 2.1)
    expect(releases).toHaveLength(3)
    expect(releases.every((note) => note.offTime === 2)).toBe(true)
  })

  it('finds authored notes whose gates extend beyond their slot', () => {
    const state = stateWith({
      rhythm: 'dnb-stab',
      steps: [
        { voicing: triad(60), root: 0, durationBars: 1 },
        { voicing: triad(62), root: 2, durationBars: 1 },
      ],
    })
    const releases = planOffWindow(state, 2, 3)
    expect(releases.some((note) => note.onTime < 2 && note.offTime >= 2)).toBe(true)
  })
})

describe('planWindow — bar durations & ordering', () => {
  it('emits hold blocks at correct slot start times (forward)', () => {
    // 3 slots × 1 bar × 2s = slots start at 0,2,4
    const notes = planWindow(stateWith({}), 0, 6)
    // hold → 3 notes per slot, 3 slots = 9 notes
    expect(notes).toHaveLength(9)
    const onTimes = [...new Set(notes.map((n) => n.onTime))].sort((a, b) => a - b)
    expect(onTimes).toEqual([0, 2, 4])
    // first slot is C major (60,64,67)
    const first = notes.filter((n) => n.onTime === 0).map((n) => n.midi).sort((a, b) => a - b)
    expect(first).toEqual([60, 64, 67])
  })

  it('respects multi-bar slot durations', () => {
    const st = stateWith({
      steps: [
        { voicing: triad(60), durationBars: 2 }, // 0..4
        { voicing: triad(62), durationBars: 1 }, // 4..6
      ],
    })
    const notes = planWindow(st, 0, 6)
    const onTimes = [...new Set(notes.map((n) => n.onTime))].sort((a, b) => a - b)
    expect(onTimes).toEqual([0, 4])
    const second = notes.filter((n) => n.onTime === 4).map((n) => n.midi).sort((a, b) => a - b)
    expect(second).toEqual([62, 66, 69])
  })

  it('reverse direction reverses slot content order', () => {
    const notes = planWindow(stateWith({ direction: 'reverse' }), 0, 6)
    const at0 = notes.filter((n) => n.onTime === 0).map((n) => n.midi).sort((a, b) => a - b)
    expect(at0).toEqual(triad(64).sort((a, b) => a - b)) // last slot first
  })

  it('pendulum order over the window', () => {
    // 3 slots pendulum: 0,1,2,1,0,1,... starts 0,2,4,6,8
    const notes = planWindow(stateWith({ direction: 'pendulum' }), 0, 10)
    const rootOf = (t: number) =>
      Math.min(...notes.filter((n) => n.onTime === t).map((n) => n.midi))
    expect(rootOf(0)).toBe(60)
    expect(rootOf(2)).toBe(62)
    expect(rootOf(4)).toBe(64)
    expect(rootOf(6)).toBe(62)
    expect(rootOf(8)).toBe(60)
  })

  it('random direction is reproducible across calls (same seed)', () => {
    const a = planWindow(stateWith({ direction: 'random', seed: 5 }), 0, 12)
    const b = planWindow(stateWith({ direction: 'random', seed: 5 }), 0, 12)
    expect(a).toEqual(b)
  })

  it('window filters: only onsets in [from,to) are returned', () => {
    const all = planWindow(stateWith({}), 0, 6)
    const mid = planWindow(stateWith({}), 2, 4)
    expect(mid.every((n) => n.onTime >= 2 && n.onTime < 4)).toBe(true)
    expect(mid).toHaveLength(3) // only the middle slot's 3 hold notes
    // sub-window union is a subset of full
    expect(all.length).toBeGreaterThan(mid.length)
  })

  it('off/on times: offTime = onTime + dur', () => {
    const notes = planWindow(stateWith({}), 0, 2)
    for (const n of notes) expect(n.offTime).toBeGreaterThan(n.onTime)
    // hold over 1 bar = 4 beats × 0.5s = 2s
    expect(notes[0].offTime - notes[0].onTime).toBeCloseTo(2, 6)
  })

  it('null voicing slot produces no notes', () => {
    const st = stateWith({
      steps: [
        { voicing: null, durationBars: 1 } as SchedStep,
        { voicing: triad(62), durationBars: 1 },
      ],
    })
    const notes = planWindow(st, 0, 4)
    expect(notes.every((n) => n.onTime >= 2)).toBe(true)
  })

  it('empty steps → []', () => {
    expect(planWindow(stateWith({ steps: [] }), 0, 10)).toEqual([])
  })

  it('output is sorted by onTime', () => {
    const notes = planWindow(stateWith({ rhythm: 'arp-up', motion: 1 }), 0, 6)
    for (let i = 1; i < notes.length; i++) {
      expect(notes[i].onTime).toBeGreaterThanOrEqual(notes[i - 1].onTime)
    }
  })
})

describe('planWindow — swing & quantization boundaries', () => {
  it('exposes the same swing conversion for stopped previews', () => {
    expect(swingBeatSeconds(0.5, 0, 0.5)).toBeCloseTo(0.25)
    expect(swingBeatSeconds(0.5, 1, 0.5)).toBeCloseTo(0.25 + 0.5 / 3)
  })

  it('swing pushes off-beat onsets later in time', () => {
    const straight = planWindow(stateWith({ rhythm: 'pulse', motion: 0.5, swing: 0 }), 0, 2)
    const swung = planWindow(stateWith({ rhythm: 'pulse', motion: 0.5, swing: 1 }), 0, 2)
    // off-beat eighth at beat 0.5 → 0.25s straight; swung later
    const offStraight = straight.find((n) => Math.abs(n.onTime - 0.25) < 1e-9)
    expect(offStraight).toBeTruthy()
    const swungOff = swung.find((n) => n.onTime > 0.25 && n.onTime < 0.5)
    expect(swungOff).toBeTruthy()
    // on-beat at 0 unchanged
    expect(swung.some((n) => Math.abs(n.onTime - 0) < 1e-9)).toBe(true)
  })

  it('slot boundaries fall on exact bar multiples', () => {
    const notes = planWindow(stateWith({ rhythm: 'pulse' }), 0, 6)
    const slotStarts = [0, 2, 4]
    for (const s of slotStarts) {
      expect(notes.some((n) => Math.abs(n.onTime - s) < 1e-9)).toBe(true)
    }
  })
})
