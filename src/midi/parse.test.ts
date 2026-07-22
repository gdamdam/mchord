import { describe, expect, it } from 'vitest'
import { parseMidiMessage } from './parse'

describe('parse: note messages', () => {
  it('decodes a Note On', () => {
    expect(parseMidiMessage([0x90, 60, 100])).toEqual({
      type: 'noteon',
      channel: 0,
      midi: 60,
      velocity: 100,
    })
  })

  it('extracts the channel nibble', () => {
    expect(parseMidiMessage([0x95, 64, 80])).toMatchObject({ channel: 5 })
    expect(parseMidiMessage([0x9f, 64, 80])).toMatchObject({ channel: 15 })
  })

  it('treats Note On with velocity 0 as Note Off', () => {
    expect(parseMidiMessage([0x90, 60, 0])).toEqual({ type: 'noteoff', channel: 0, midi: 60 })
  })

  it('decodes an explicit Note Off', () => {
    expect(parseMidiMessage([0x83, 48, 64])).toEqual({ type: 'noteoff', channel: 3, midi: 48 })
  })
})

describe('parse: control change', () => {
  it('decodes a CC', () => {
    expect(parseMidiMessage([0xb0, 7, 127])).toEqual({
      type: 'cc',
      channel: 0,
      controller: 7,
      value: 127,
    })
  })

  it('decodes all-notes-off (CC 123) as a cc event', () => {
    expect(parseMidiMessage([0xb2, 123, 0])).toEqual({
      type: 'cc',
      channel: 2,
      controller: 123,
      value: 0,
    })
  })
})

describe('parse: clock & transport', () => {
  it('decodes timing clock', () => {
    expect(parseMidiMessage([0xf8])).toEqual({ type: 'clock' })
  })

  it('decodes start/stop/continue as clock', () => {
    expect(parseMidiMessage([0xfa])).toEqual({ type: 'clock' })
    expect(parseMidiMessage([0xfb])).toEqual({ type: 'clock' })
    expect(parseMidiMessage([0xfc])).toEqual({ type: 'clock' })
  })

  it('classifies Active Sensing (0xFE) and Reset (0xFF) as ignorable, not clock', () => {
    // These are not transport messages; routing them to clock-followers is wrong.
    expect(parseMidiMessage([0xfe])).toEqual({ type: 'other' })
    expect(parseMidiMessage([0xff])).toEqual({ type: 'other' })
  })
})

describe('parse: junk tolerance', () => {
  it('returns other for an empty buffer', () => {
    expect(parseMidiMessage([])).toEqual({ type: 'other' })
    expect(parseMidiMessage(new Uint8Array(0))).toEqual({ type: 'other' })
  })

  it('returns other for a buffer starting with a data byte (no status)', () => {
    expect(parseMidiMessage([60, 100])).toEqual({ type: 'other' })
  })

  it('returns other for SysEx / system-common', () => {
    expect(parseMidiMessage([0xf0, 1, 2, 0xf7])).toEqual({ type: 'other' })
    expect(parseMidiMessage([0xf1, 0])).toEqual({ type: 'other' })
  })

  it('returns other for unsupported channel-voice (pitch bend)', () => {
    expect(parseMidiMessage([0xe0, 0, 64])).toEqual({ type: 'other' })
  })

  it('masks data bytes to 7 bits and tolerates short note buffers', () => {
    expect(parseMidiMessage([0x90, 0xff, 0xff])).toEqual({
      type: 'noteon',
      channel: 0,
      midi: 127,
      velocity: 127,
    })
    expect(parseMidiMessage([0x90])).toEqual({ type: 'noteoff', channel: 0, midi: 0 })
  })

  it('accepts a Uint8Array', () => {
    expect(parseMidiMessage(new Uint8Array([0x90, 60, 100]))).toMatchObject({ type: 'noteon' })
  })
})
