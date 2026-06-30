import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Midi, NoteSink, VoicedNote } from '../types'
import type { MidiOutput } from '../midi'
import { FanOutSink, TimedMidiSink } from './sinks'

class RecordingSink implements NoteSink {
  ons: Array<{ note: VoicedNote; time: number }> = []
  offs: Array<{ midi: Midi; time: number }> = []
  panics = 0
  noteOn(note: VoicedNote, time: number): void {
    this.ons.push({ note, time })
  }
  noteOff(midi: Midi, time: number): void {
    this.offs.push({ midi, time })
  }
  allNotesOff(): void {
    this.panics += 1
  }
}

describe('FanOutSink', () => {
  it('broadcasts every event to all sinks', () => {
    const a = new RecordingSink()
    const b = new RecordingSink()
    const fan = new FanOutSink([a, b])
    fan.noteOn({ midi: 60, velocity: 0.8 }, 1)
    fan.noteOff(60, 2)
    fan.allNotesOff()
    expect(a.ons).toEqual([{ note: { midi: 60, velocity: 0.8 }, time: 1 }])
    expect(b.ons).toEqual([{ note: { midi: 60, velocity: 0.8 }, time: 1 }])
    expect(a.offs).toEqual([{ midi: 60, time: 2 }])
    expect(a.panics).toBe(1)
    expect(b.panics).toBe(1)
  })
})

describe('TimedMidiSink', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const makeOut = () => {
    const sink = new RecordingSink()
    return { sink, out: sink as unknown as MidiOutput }
  }

  it('delivers a future note at the right wall-clock delay', () => {
    const { sink, out } = makeOut()
    const now = 10
    const timed = new TimedMidiSink(out, () => now)
    timed.noteOn({ midi: 64, velocity: 1 }, 10.5) // 500ms in the future
    expect(sink.ons).toHaveLength(0)
    vi.advanceTimersByTime(499)
    expect(sink.ons).toHaveLength(0)
    vi.advanceTimersByTime(2)
    expect(sink.ons).toEqual([{ note: { midi: 64, velocity: 1 }, time: 0 }])
  })

  it('delivers near/past times immediately', () => {
    const { sink, out } = makeOut()
    const timed = new TimedMidiSink(out, () => 5)
    timed.noteOn({ midi: 48, velocity: 0.5 }, 5) // now
    timed.noteOff(48, 4) // in the past
    expect(sink.ons).toHaveLength(1)
    expect(sink.offs).toHaveLength(1)
  })

  it('allNotesOff cancels pending timers so queued notes never sound', () => {
    const { sink, out } = makeOut()
    const now = 0
    const timed = new TimedMidiSink(out, () => now)
    timed.noteOn({ midi: 72, velocity: 1 }, 1) // 1s out
    timed.noteOff(72, 2)
    timed.allNotesOff()
    expect(sink.panics).toBe(1)
    vi.advanceTimersByTime(5000)
    // The queued on/off were cancelled — only the panic reached the port.
    expect(sink.ons).toHaveLength(0)
    expect(sink.offs).toHaveLength(0)
  })
})
