import { describe, expect, it } from 'vitest'
import { CLOCK, START, STOP, noteOffBytes, noteOnBytes, velocityToMidi } from './messages'

describe('messages: constants', () => {
  it('uses the standard system real-time status bytes', () => {
    expect(CLOCK).toBe(0xf8)
    expect(START).toBe(0xfa)
    expect(STOP).toBe(0xfc)
  })
})

describe('messages: noteOnBytes', () => {
  it('builds [0x90|ch, note, vel] for channel 0', () => {
    expect(noteOnBytes(0, 60, 100)).toEqual([0x90, 60, 100])
  })

  it('ORs the channel into the status byte', () => {
    expect(noteOnBytes(9, 36, 127)).toEqual([0x99, 36, 127])
    expect(noteOnBytes(15, 72, 1)).toEqual([0x9f, 72, 1])
  })

  it('clamps channel, note, and velocity into range', () => {
    expect(noteOnBytes(99, 200, 999)).toEqual([0x9f, 127, 127])
    expect(noteOnBytes(-5, -10, -10)).toEqual([0x90, 0, 0])
  })
})

describe('messages: noteOffBytes', () => {
  it('builds [0x80|ch, note, 0]', () => {
    expect(noteOffBytes(0, 60)).toEqual([0x80, 60, 0])
    expect(noteOffBytes(5, 64)).toEqual([0x85, 64, 0])
  })

  it('clamps channel and note', () => {
    expect(noteOffBytes(20, 130)).toEqual([0x8f, 127, 0])
  })
})

describe('messages: velocityToMidi', () => {
  it('maps 0..1 to 1..127, never 0', () => {
    expect(velocityToMidi(0)).toBe(1)
    expect(velocityToMidi(1)).toBe(127)
  })

  it('scales the midpoint', () => {
    expect(velocityToMidi(0.5)).toBe(Math.round(0.5 * 127)) // 64
  })

  it('clamps out-of-range and NaN', () => {
    expect(velocityToMidi(2)).toBe(127)
    expect(velocityToMidi(-1)).toBe(1)
    expect(velocityToMidi(Number.NaN)).toBe(1)
  })
})
