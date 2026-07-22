import { describe, expect, it } from 'vitest'
import type { LinkState } from '../transport'
import { dueClockTicks, linkStateChanged, resolveEffectiveBpm } from './useInstrument'

describe('resolveEffectiveBpm', () => {
  it('uses the scene tempo without Link', () => {
    expect(resolveEffectiveBpm(128, { connected: false, tempo: 90 })).toBe(128)
  })

  it('uses Link tempo when the scheduler starts after Link connected', () => {
    expect(resolveEffectiveBpm(128, { connected: true, tempo: 90 })).toBe(90)
  })
})

// C7 — only fields the UI/transport logic reads should force a React re-render.
describe('linkStateChanged', () => {
  const base: LinkState = {
    tempo: 120,
    beat: 0,
    phase: 0,
    playing: false,
    peers: 0,
    clients: 0,
    connected: false,
  }

  it('ignores the ~20Hz beat/phase stream (no re-render churn)', () => {
    expect(linkStateChanged(base, { ...base, beat: 3.2, phase: 1.1 })).toBe(false)
  })

  it('ignores clients-only changes (not consumed by UI or logic)', () => {
    expect(linkStateChanged(base, { ...base, clients: 5 })).toBe(false)
  })

  it('detects tempo / peers / connected / playing changes', () => {
    expect(linkStateChanged(base, { ...base, tempo: 121 })).toBe(true)
    expect(linkStateChanged(base, { ...base, peers: 1 })).toBe(true)
    expect(linkStateChanged(base, { ...base, connected: true })).toBe(true)
    expect(linkStateChanged(base, { ...base, playing: true })).toBe(true)
  })
})

// C6 — MIDI-clock ticks are scheduled against the audio clock so setInterval
// jitter never accumulates into tempo drift.
describe('dueClockTicks', () => {
  it('emits no ticks before the first is due', () => {
    expect(dueClockTicks(0.5, 1, 1)).toEqual({ ticks: 0, nextDue: 1 })
  })

  it('emits one tick when exactly due and advances by one period', () => {
    expect(dueClockTicks(1, 1, 0.5)).toEqual({ ticks: 1, nextDue: 1.5 })
  })

  it('catches up multiple ticks after a late interval (no accumulated drift)', () => {
    // Ticks due at 1.0, 1.5, 2.0 have all elapsed by now=2.2.
    expect(dueClockTicks(2.2, 1, 0.5)).toEqual({ ticks: 3, nextDue: 2.5 })
  })

  it('caps catch-up and resyncs to now after a long stall', () => {
    const r = dueClockTicks(1000, 1, 0.5)
    expect(r.ticks).toBe(32)
    expect(r.nextDue).toBeCloseTo(1000.5)
  })

  it('guards against a non-positive or NaN period', () => {
    expect(dueClockTicks(5, 1, 0)).toEqual({ ticks: 0, nextDue: 1 })
    expect(dueClockTicks(5, 1, Number.NaN)).toEqual({ ticks: 0, nextDue: 1 })
  })
})
