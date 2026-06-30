import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Scheduler } from './scheduler'
import type { NoteSink, VoicedNote, Midi } from '../types'

const triad = (root: number) => [root, root + 4, root + 7]

class FakeSink implements NoteSink {
  ons: { note: VoicedNote; time: number }[] = []
  offs: { midi: Midi; time: number }[] = []
  panics = 0
  noteOn(note: VoicedNote, time: number): void {
    this.ons.push({ note: { ...note }, time })
  }
  noteOff(midi: Midi, time: number): void {
    this.offs.push({ midi, time })
  }
  allNotesOff(): void {
    this.panics++
  }
}

describe('Scheduler class', () => {
  let clock = 0
  const now = () => clock
  let sink: FakeSink

  beforeEach(() => {
    vi.useFakeTimers()
    clock = 0
    sink = new FakeSink()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  function advance(seconds: number, intervalMs = 25): void {
    const steps = Math.round((seconds * 1000) / intervalMs)
    for (let i = 0; i < steps; i++) {
      clock += intervalMs / 1000
      vi.advanceTimersByTime(intervalMs)
    }
  }

  it('schedules notes within the lookahead window after start', () => {
    const s = new Scheduler({ now, dispatch: sink, lookahead: 0.1, interval: 25 })
    s.setSteps([{ voicing: triad(60), durationBars: 1 }])
    s.setTempo(120)
    s.start(0)
    // priming tick scheduled the first hold block (onset at t=0)
    expect(sink.ons.length).toBe(3)
    expect(sink.ons.map((o) => o.note.midi).sort((a, b) => a - b)).toEqual([60, 64, 67])
    expect(s.playing).toBe(true)
    s.dispose()
  })

  it('keeps scheduling forward over time without re-firing past notes', () => {
    const s = new Scheduler({ now, dispatch: sink, lookahead: 0.1, interval: 25 })
    s.setSteps([
      { voicing: triad(60), durationBars: 1 }, // 0..2s
      { voicing: triad(62), durationBars: 1 }, // 2..4s
    ])
    s.setTempo(120)
    s.start(0)
    advance(4.2)
    const onTimes = [...new Set(sink.ons.map((o) => Math.round(o.time * 100) / 100))].sort(
      (a, b) => a - b,
    )
    // hold onsets at 0 and 2 (and 4 for the next loop of slot 0)
    expect(onTimes).toContain(0)
    expect(onTimes).toContain(2)
    // no duplicate scheduling of the t=0 block
    const atZero = sink.ons.filter((o) => o.time === 0)
    expect(atZero).toHaveLength(3)
    s.dispose()
  })

  it('stop() releases everything via allNotesOff and clears playing', () => {
    const s = new Scheduler({ now, dispatch: sink, lookahead: 0.1, interval: 25 })
    s.setSteps([{ voicing: triad(60), durationBars: 1 }])
    s.start(0)
    s.stop()
    expect(s.playing).toBe(false)
    expect(sink.panics).toBe(1)
    s.dispose()
  })

  it('onStep fires with the active slot index and clears unsubscribe', () => {
    const s = new Scheduler({ now, dispatch: sink, lookahead: 0.1, interval: 25 })
    s.setSteps([
      { voicing: triad(60), durationBars: 1 },
      { voicing: triad(62), durationBars: 1 },
    ])
    s.setTempo(120)
    const seen: number[] = []
    const unsub = s.onStep(({ index }) => seen.push(index))
    s.start(0)
    advance(2.2)
    expect(seen[0]).toBe(0)
    expect(seen).toContain(1)
    unsub()
    const lenBefore = seen.length
    advance(2.2)
    expect(seen.length).toBe(lenBefore)
    s.dispose()
  })

  it('triggerSlot with quantize=bar reports a queued index, then jumps on the boundary', () => {
    const s = new Scheduler({ now, dispatch: sink, lookahead: 0.1, interval: 25 })
    s.setSteps([
      { voicing: triad(60), durationBars: 1 }, // index 0
      { voicing: triad(62), durationBars: 1 }, // index 1
      { voicing: triad(64), durationBars: 1 }, // index 2
    ])
    s.setTempo(120) // bar = 2s
    const steps: { index: number; queued: number | null }[] = []
    s.onStep((info) => steps.push(info))
    s.start(0)
    // mid first bar, request jump to slot 2 on next bar (t=2)
    advance(0.5)
    s.triggerSlot(2, 'bar')
    expect(steps.some((x) => x.queued === 2)).toBe(true)
    advance(2.0)
    // after the boundary the active index should have become 2
    expect(steps.some((x) => x.index === 2 && x.queued === null)).toBe(true)
    s.dispose()
  })

  it('triggerSlot quantize=off jumps immediately', () => {
    const s = new Scheduler({ now, dispatch: sink, lookahead: 0.1, interval: 25 })
    s.setSteps([
      { voicing: triad(60), durationBars: 1 },
      { voicing: triad(62), durationBars: 1 },
    ])
    s.setTempo(120)
    const steps: { index: number; queued: number | null }[] = []
    s.onStep((info) => steps.push(info))
    s.start(0)
    advance(0.3)
    s.triggerSlot(1, 'off')
    advance(0.1)
    expect(steps.some((x) => x.index === 1)).toBe(true)
    s.dispose()
  })

  it('ignores triggerSlot for out-of-range indices', () => {
    const s = new Scheduler({ now, dispatch: sink, lookahead: 0.1, interval: 25 })
    s.setSteps([{ voicing: triad(60), durationBars: 1 }])
    s.start(0)
    s.triggerSlot(5, 'bar') // out of range, no throw
    s.triggerSlot(-1, 'bar')
    expect(s.playing).toBe(true)
    s.dispose()
  })

  it('setSeed makes random direction reproducible across two schedulers', () => {
    const mk = () => {
      const sk = new FakeSink()
      const s = new Scheduler({ now: () => clock, dispatch: sk, lookahead: 0.1, interval: 25 })
      s.setSteps(
        [
          { voicing: triad(60), durationBars: 1 },
          { voicing: triad(62), durationBars: 1 },
          { voicing: triad(64), durationBars: 1 },
        ],
        { seed: 123 },
      )
      s.setTempo(120)
      s.setDirection('random')
      return { s, sk }
    }
    clock = 0
    const a = mk()
    a.s.start(0)
    advance(6)
    a.s.dispose()
    const aSeq = a.sk.ons.map((o) => `${o.time}:${o.note.midi}`)

    clock = 0
    const b = mk()
    b.s.start(0)
    advance(6)
    b.s.dispose()
    const bSeq = b.sk.ons.map((o) => `${o.time}:${o.note.midi}`)
    expect(bSeq).toEqual(aSeq)
  })
})
