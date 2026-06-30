import { describe, expect, it } from 'vitest'
import { NoteOwnership } from './ownership'

describe('NoteOwnership: single holder', () => {
  it('on then off transitions silent→sounding→silent', () => {
    const o = new NoteOwnership()
    expect(o.on(60)).toBe(true) // newly sounding
    expect(o.isSounding(60)).toBe(true)
    expect(o.off(60)).toBe(true) // now silent
    expect(o.isSounding(60)).toBe(false)
  })
})

describe('NoteOwnership: overlapping holders (the no-hung-notes guarantee)', () => {
  it('only the first on and the last off transition', () => {
    const o = new NoteOwnership()
    expect(o.on(60)).toBe(true) // 1st holder → emit Note On
    expect(o.on(60)).toBe(false) // 2nd holder → no Note On
    expect(o.size).toBe(1)
    expect(o.off(60)).toBe(false) // one holder left → NO Note Off
    expect(o.isSounding(60)).toBe(true)
    expect(o.off(60)).toBe(true) // last holder released → emit Note Off
    expect(o.isSounding(60)).toBe(false)
  })

  it('tracks independent notes separately', () => {
    const o = new NoteOwnership()
    o.on(60)
    o.on(64)
    expect(o.size).toBe(2)
    expect(o.off(60)).toBe(true)
    expect(o.size).toBe(1)
    expect(o.isSounding(64)).toBe(true)
  })
})

describe('NoteOwnership: underflow safety', () => {
  it('off on a note that was never on is a no-op', () => {
    const o = new NoteOwnership()
    expect(o.off(60)).toBe(false)
    expect(o.size).toBe(0)
  })

  it('extra off after release never drives count negative or re-emits', () => {
    const o = new NoteOwnership()
    o.on(60)
    expect(o.off(60)).toBe(true)
    expect(o.off(60)).toBe(false) // already silent
    expect(o.off(60)).toBe(false)
    // A fresh on still works correctly after underflow attempts.
    expect(o.on(60)).toBe(true)
  })
})

describe('NoteOwnership: clear / panic', () => {
  it('returns all sounding notes and resets', () => {
    const o = new NoteOwnership()
    o.on(60)
    o.on(60) // doubly held
    o.on(64)
    o.on(67)
    const cleared = o.clear().sort((a, b) => a - b)
    expect(cleared).toEqual([60, 64, 67]) // each distinct note once
    expect(o.size).toBe(0)
    expect(o.isSounding(60)).toBe(false)
  })

  it('clear on an empty tracker returns []', () => {
    expect(new NoteOwnership().clear()).toEqual([])
  })
})
