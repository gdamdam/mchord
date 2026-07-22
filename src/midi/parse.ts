// Pure inbound MIDI message decoder. No I/O, no DOM.
//
// Adapted from mpumpit's src/midi/parse.ts (AGPL-3.0). The mchord variant
// surfaces CC and clock as structured events (mpumpit folded CC120/123 into an
// "allNotesOff" kind) and tolerates junk buffers without throwing.
//
// Byte conventions: status & 0xf0 = message type, status & 0x0f = channel.
// A Note On with velocity 0 is treated as a Note Off (running-status idiom).
// Live Web MIDI always delivers a complete message with its status byte, so
// running status (used in offline .mid files) does not occur here.

import type { Midi } from '../types'

// Status nibbles
const NOTE_OFF = 0x80
const NOTE_ON = 0x90
const CONTROL_CHANGE = 0xb0

/** A decoded inbound MIDI message. `channel` is 0..15 (raw nibble). */
export type MidiEvent =
  | { type: 'noteon'; channel: number; midi: Midi; velocity: number }
  | { type: 'noteoff'; channel: number; midi: Midi }
  | { type: 'cc'; channel: number; controller: number; value: number }
  | { type: 'clock' }
  | { type: 'other' }

/**
 * Decode one raw MIDI message.
 *
 * - 0xF8..0xFC (system real-time: clock/start/continue/stop) → `clock`.
 * - 0xFD..0xFF (undefined / Active Sensing / Reset) → `other` (ignorable).
 * - 0xF0..0xF7 (system common / SysEx) → `other`.
 * - Note On with velocity 0 → `noteoff`.
 * - Control Change → `cc`.
 * - Everything else (aftertouch, pitch bend, program change) → `other`.
 *
 * Tolerates empty/short/junk buffers: a buffer that does not begin with a
 * status byte, or has no decodable type, returns `{ type: 'other' }`.
 */
export function parseMidiMessage(data: Uint8Array | number[]): MidiEvent {
  if (!data || data.length === 0) return { type: 'other' }

  const status = data[0] ?? 0

  // A status byte always has its high bit set. A buffer beginning with a data
  // byte (sliced payload or non-compliant driver) is not decodable.
  if ((status & 0x80) === 0) return { type: 'other' }

  // System real-time transport (single status byte): clock/start/continue/stop.
  // Active Sensing (0xFE) and Reset (0xFF) are NOT transport — they must not be
  // fed to clock-following logic — so only 0xF8..0xFC map to `clock`.
  if (status >= 0xf8 && status <= 0xfc) return { type: 'clock' }
  // Undefined real-time (0xFD), Active Sensing (0xFE), Reset (0xFF), and other
  // system common / SysEx (0xF0..0xF7) are all ignorable here.
  if (status >= 0xf0) return { type: 'other' }

  const type = status & 0xf0
  const channel = status & 0x0f

  switch (type) {
    case NOTE_ON: {
      const midi = (data[1] ?? 0) & 0x7f
      const velocity = (data[2] ?? 0) & 0x7f
      if (velocity === 0) return { type: 'noteoff', channel, midi }
      return { type: 'noteon', channel, midi, velocity }
    }
    case NOTE_OFF: {
      const midi = (data[1] ?? 0) & 0x7f
      return { type: 'noteoff', channel, midi }
    }
    case CONTROL_CHANGE: {
      const controller = (data[1] ?? 0) & 0x7f
      const value = (data[2] ?? 0) & 0x7f
      return { type: 'cc', channel, controller, value }
    }
    default:
      return { type: 'other' }
  }
}
