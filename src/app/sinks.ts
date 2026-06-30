/**
 * NoteSink composition for the live instrument.
 *
 * The scheduler dispatches voiced notes to a single NoteSink. We fan that out to
 * the audio engine (always) and the MIDI output (when a port is selected). The
 * MIDI output has no sample clock, so its sink translates the scheduler's
 * absolute audio-clock times into setTimeout delays so MIDI lands at roughly the
 * same moment as the audio.
 */
import type { Midi, NoteSink, VoicedNote } from '../types'
import type { MidiOutput } from '../midi'

/** Broadcasts every note to several sinks at once. */
export class FanOutSink implements NoteSink {
  constructor(private readonly sinks: NoteSink[]) {}
  noteOn(note: VoicedNote, time: number): void {
    for (const s of this.sinks) s.noteOn(note, time)
  }
  noteOff(midi: Midi, time: number): void {
    for (const s of this.sinks) s.noteOff(midi, time)
  }
  allNotesOff(): void {
    for (const s of this.sinks) s.allNotesOff()
  }
}

/**
 * Delivers MIDI at the scheduler's intended audio-clock time by converting
 * `time - now` into a timer delay. Tracks pending timers so allNotesOff() can
 * cancel them — otherwise a queued note could sound after a panic/stop.
 */
export class TimedMidiSink implements NoteSink {
  private readonly timers = new Set<ReturnType<typeof setTimeout>>()
  constructor(
    private readonly out: MidiOutput,
    private readonly now: () => number,
  ) {}

  private schedule(time: number, run: () => void): void {
    const delayMs = (time - this.now()) * 1000
    if (delayMs <= 1) {
      run()
      return
    }
    const id = setTimeout(() => {
      this.timers.delete(id)
      run()
    }, delayMs)
    this.timers.add(id)
  }

  noteOn(note: VoicedNote, time: number): void {
    this.schedule(time, () => this.out.noteOn(note, 0))
  }
  noteOff(midi: Midi, time: number): void {
    this.schedule(time, () => this.out.noteOff(midi, 0))
  }
  allNotesOff(): void {
    for (const id of this.timers) clearTimeout(id)
    this.timers.clear()
    this.out.allNotesOff()
  }
}
