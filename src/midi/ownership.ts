// Pure ref-counting active-note tracker. No I/O, no DOM.
//
// The ownership model is adapted from mpumpit's MidiRouter (AGPL-3.0), reduced
// to the single concern that guarantees no hung notes: when the SAME midi note
// is held by several overlapping sources, the underlying Note Off must be sent
// only once, when the LAST holder releases.
//
// mpumpit ref-counted by (part, engineNote) across input owner keys. mchord's
// output sink has a single channel and a single sounding pitch space, so we
// ref-count by `midi` alone: a count, not a set of owner keys.

import type { Midi } from '../types'

/**
 * Ref-counts which MIDI notes are currently sounding.
 *
 * `on(midi)` returns true only when the note transitioned silent→sounding
 * (so the caller should emit a Note On). `off(midi)` returns true only when the
 * note transitioned sounding→silent (emit a Note Off). Underflowing `off` on a
 * note that is not held is a no-op and returns false — late/duplicate Note Offs
 * can never drive the count negative or emit a spurious Note Off.
 */
export class NoteOwnership {
  // midi -> number of active holders (always >= 1 while present)
  private readonly counts = new Map<Midi, number>()

  /** Register a holder. Returns true if the note is newly sounding. */
  on(midi: Midi): boolean {
    const prev = this.counts.get(midi) ?? 0
    this.counts.set(midi, prev + 1)
    return prev === 0
  }

  /** Release a holder. Returns true if the note is now silent. */
  off(midi: Midi): boolean {
    const prev = this.counts.get(midi) ?? 0
    if (prev <= 0) return false // underflow safety: not held → nothing to do
    if (prev === 1) {
      this.counts.delete(midi)
      return true
    }
    this.counts.set(midi, prev - 1)
    return false
  }

  /** True if the note has at least one holder. */
  isSounding(midi: Midi): boolean {
    return (this.counts.get(midi) ?? 0) > 0
  }

  /** Number of distinct sounding notes. */
  get size(): number {
    return this.counts.size
  }

  /**
   * Drop all tracking and return every note that was sounding (for panic /
   * all-notes-off). The caller is responsible for emitting a Note Off for each.
   */
  clear(): Midi[] {
    const sounding = [...this.counts.keys()]
    this.counts.clear()
    return sounding
  }
}
