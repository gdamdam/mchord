import { describe, it, expect } from 'vitest'
import { rhythmEvents } from './rhythm'
import { RHYTHM_STYLES } from '../types'
import type { Voicing } from '../types'

const C = [60, 64, 67] as Voicing // C major triad
const base = { durationBars: 1, beatsPerBar: 4, swing: 0, motion: 0 }

function uniqStarts(evs: { startBeat: number }[]): number[] {
  return [...new Set(evs.map((e) => e.startBeat))].sort((a, b) => a - b)
}

describe('rhythmEvents — guards', () => {
  it('empty voicing → []', () => {
    for (const style of RHYTHM_STYLES) {
      expect(rhythmEvents([], style, base)).toEqual([])
    }
  })
  it('zero/negative duration → []', () => {
    expect(rhythmEvents(C, 'hold', { ...base, durationBars: 0 })).toEqual([])
  })
  it('is deterministic', () => {
    const a = rhythmEvents(C, 'arp-up', { ...base, motion: 0.8 })
    const b = rhythmEvents(C, 'arp-up', { ...base, motion: 0.8 })
    expect(a).toEqual(b)
  })
})

describe('hold', () => {
  it('one sustained block spanning the whole slot', () => {
    const evs = rhythmEvents(C, 'hold', { ...base, durationBars: 2 })
    expect(evs).toHaveLength(3) // one per note
    for (const e of evs) {
      expect(e.startBeat).toBe(0)
      expect(e.durBeats).toBe(8) // 2 bars * 4
    }
  })
})

describe('pulse', () => {
  it('block on every beat at motion 0 (4 beats × 3 notes)', () => {
    const evs = rhythmEvents(C, 'pulse', base)
    expect(uniqStarts(evs)).toEqual([0, 1, 2, 3])
    expect(evs).toHaveLength(12)
  })
  it('motion increases density to eighths then sixteenths', () => {
    const eighths = rhythmEvents(C, 'pulse', { ...base, motion: 0.5 })
    expect(uniqStarts(eighths)).toHaveLength(8)
    const sixteenths = rhythmEvents(C, 'pulse', { ...base, motion: 1 })
    expect(uniqStarts(sixteenths)).toHaveLength(16)
  })
})

describe('stab', () => {
  it('short blocks on each beat', () => {
    const evs = rhythmEvents(C, 'stab', base)
    expect(uniqStarts(evs)).toEqual([0, 1, 2, 3])
    for (const e of evs) expect(e.durBeats).toBeLessThan(0.5)
  })
})

describe('offbeat', () => {
  it('blocks on the &s (beat+0.5) at motion 0', () => {
    const evs = rhythmEvents(C, 'offbeat', base)
    expect(uniqStarts(evs)).toEqual([0.5, 1.5, 2.5, 3.5])
  })
  it('high motion adds the in-between sixteenth offbeats', () => {
    const evs = rhythmEvents(C, 'offbeat', { ...base, motion: 1 })
    expect(uniqStarts(evs)).toEqual([
      0.25, 0.5, 0.75, 1.25, 1.5, 1.75, 2.25, 2.5, 2.75, 3.25, 3.5, 3.75,
    ])
  })
})

describe('arp styles', () => {
  it('arp-up cycles low→high', () => {
    const evs = rhythmEvents(C, 'arp-up', base) // motion 0 → 1 beat steps → 4 steps
    expect(evs.map((e) => e.midi)).toEqual([60, 64, 67, 60])
    expect(uniqStarts(evs)).toEqual([0, 1, 2, 3])
  })
  it('arp-down cycles high→low', () => {
    const evs = rhythmEvents(C, 'arp-down', base)
    expect(evs.map((e) => e.midi)).toEqual([67, 64, 60, 67])
  })
  it('arp-updown bounces without repeating endpoints', () => {
    // 4 steps over [60,64,67] → up:60,64,67 then down(no endpoints):64 → 60,64,67,64
    const evs = rhythmEvents(C, 'arp-updown', base)
    expect(evs.map((e) => e.midi)).toEqual([60, 64, 67, 64])
  })
  it('motion speeds up the arp (more events)', () => {
    const slow = rhythmEvents(C, 'arp-up', { ...base, motion: 0 })
    const fast = rhythmEvents(C, 'arp-up', { ...base, motion: 1 })
    expect(fast.length).toBeGreaterThan(slow.length)
    expect(fast.length).toBe(16) // sixteenth steps over 1 bar
  })
})

describe('broken', () => {
  it('repeats a low/high/mid/high figure', () => {
    const evs = rhythmEvents(C, 'broken', base) // 4 steps
    // sorted [60,64,67]: low=60 high=67 mid=64 high=67
    expect(evs.map((e) => e.midi)).toEqual([60, 67, 64, 67])
  })
})

describe('velocity accents', () => {
  it('accents the bar downbeat over later beats', () => {
    const evs = rhythmEvents(C, 'pulse', base)
    const downbeat = evs.find((e) => e.startBeat === 0)!
    const beat3 = evs.find((e) => e.startBeat === 2)!
    expect(downbeat.velocity).toBeGreaterThan(beat3.velocity)
  })
})

describe('swing affects off-beat gate length', () => {
  it('shortens off-beat eighth durations when swing > 0', () => {
    const straight = rhythmEvents(C, 'pulse', { ...base, motion: 0.5, swing: 0 })
    const swung = rhythmEvents(C, 'pulse', { ...base, motion: 0.5, swing: 1 })
    const offStraight = straight.find((e) => e.startBeat === 0.5)!
    const offSwung = swung.find((e) => e.startBeat === 0.5)!
    expect(offSwung.durBeats).toBeLessThan(offStraight.durBeats)
    // on-beats unchanged
    const onStraight = straight.find((e) => e.startBeat === 0)!
    const onSwung = swung.find((e) => e.startBeat === 0)!
    expect(onSwung.durBeats).toBeCloseTo(onStraight.durBeats, 10)
  })
})
