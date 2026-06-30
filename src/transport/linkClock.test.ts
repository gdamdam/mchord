import { describe, it, expect } from 'vitest'
import {
  makeLinkClockSnapshot,
  barSec,
  nextDownbeatTime,
  nextBoundaryTime,
  quantizeDelaySec,
  type LinkClockSnapshot,
} from './linkClock'
import type { LinkState } from './linkBridge'

function snap(over: Partial<LinkClockSnapshot> = {}): LinkClockSnapshot {
  return { bpm: 120, beat: 0, phase: 0, quantum: 4, tAtMsg: 0, ...over }
}

const linkState = (over: Partial<LinkState> = {}): LinkState => ({
  tempo: 120,
  beat: 0,
  phase: 0,
  playing: false,
  peers: 0,
  clients: 0,
  connected: true,
  ...over,
})

describe('makeLinkClockSnapshot', () => {
  it('copies fields and defaults quantum to 4', () => {
    const s = makeLinkClockSnapshot(linkState({ tempo: 140, beat: 9, phase: 1 }), 3)
    expect(s).toEqual({ bpm: 140, beat: 9, phase: 1, quantum: 4, tAtMsg: 3 })
  })
  it('falls back to quantum 4 for non-finite/non-positive', () => {
    expect(makeLinkClockSnapshot(linkState(), 0, 0).quantum).toBe(4)
    expect(makeLinkClockSnapshot(linkState(), 0, NaN).quantum).toBe(4)
    expect(makeLinkClockSnapshot(linkState(), 0, 3).quantum).toBe(3)
  })
})

describe('barSec', () => {
  it('120bpm 4/4 = 2s', () => {
    expect(barSec(snap())).toBeCloseTo(2, 10)
  })
})

describe('nextDownbeatTime', () => {
  it('phase 0 at msg → next downbeat one bar later', () => {
    // phase 0 means we're exactly on a downbeat; (quantum-phase)=4 beats = 2s
    expect(nextDownbeatTime(snap({ phase: 0 }), 0)).toBeCloseTo(2, 10)
  })
  it('mid-bar phase → remaining beats to the next downbeat', () => {
    // phase 1 → 3 beats left = 1.5s
    expect(nextDownbeatTime(snap({ phase: 1 }), 0)).toBeCloseTo(1.5, 10)
  })
  it('advances past now by whole bars', () => {
    expect(nextDownbeatTime(snap({ phase: 1 }), 1.6)).toBeCloseTo(3.5, 10)
  })
})

describe('nextBoundaryTime', () => {
  it('beat grid → next integer beat', () => {
    // phase 0.5 → 0.5 beat left = 0.25s
    expect(nextBoundaryTime(snap({ phase: 0.5 }), 'beat', 0)).toBeCloseTo(0.25, 10)
  })
  it('bar grid equals nextDownbeatTime', () => {
    const s = snap({ phase: 2 })
    expect(nextBoundaryTime(s, 'bar', 0)).toBeCloseTo(nextDownbeatTime(s, 0), 10)
  })
  it('2bar grid uses absolute beat to find even-bar boundary', () => {
    // beat 0 → next 2-bar boundary is 8 beats away = 4s
    expect(nextBoundaryTime(snap({ beat: 0 }), '2bar', 0)).toBeCloseTo(4, 10)
    // beat 5 → 2*quantum=8, mod=5, remaining 3 beats = 1.5s
    expect(nextBoundaryTime(snap({ beat: 5 }), '2bar', 0)).toBeCloseTo(1.5, 10)
  })
})

describe('quantizeDelaySec', () => {
  it('0 when grid off / disconnected / no snapshot', () => {
    expect(quantizeDelaySec(snap(), 'off', true, 0)).toBe(0)
    expect(quantizeDelaySec(snap(), 'bar', false, 0)).toBe(0)
    expect(quantizeDelaySec(null, 'bar', true, 0)).toBe(0)
  })
  it('returns the delay to the boundary when connected', () => {
    expect(quantizeDelaySec(snap({ phase: 1 }), 'bar', true, 0)).toBeCloseTo(1.5, 10)
  })
  it('never negative', () => {
    expect(quantizeDelaySec(snap(), 'beat', true, 100)).toBeGreaterThanOrEqual(0)
  })
})
