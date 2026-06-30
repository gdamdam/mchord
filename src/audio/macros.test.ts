import { describe, it, expect } from 'vitest'
import type { MacroValues } from '../types'
import { applyMacros } from './macros'
import { PRESETS } from './presets'
import type { VoiceParams } from './voiceParams'

const BASE: VoiceParams = PRESETS['warm-poly'].voice
const NEUTRAL: MacroValues = { tension: 0.5, spread: 0.5, motion: 0.5, color: 0.5 }

function withColor(c: number): MacroValues {
  return { ...NEUTRAL, color: c }
}
function withSpread(s: number): MacroValues {
  return { ...NEUTRAL, spread: s }
}
function withTension(t: number): MacroValues {
  return { ...NEUTRAL, tension: t }
}

describe('applyMacros — purity & determinism', () => {
  it('does not mutate the base params', () => {
    const snapshot = JSON.stringify(BASE)
    applyMacros(BASE, { tension: 0.9, spread: 0.1, motion: 0.3, color: 0.8 })
    expect(JSON.stringify(BASE)).toBe(snapshot)
  })

  it('is deterministic for identical inputs', () => {
    const m: MacroValues = { tension: 0.3, spread: 0.7, motion: 0.2, color: 0.6 }
    expect(applyMacros(BASE, m)).toEqual(applyMacros(BASE, m))
  })

  it('returns the preset roughly unchanged at the neutral centre (0.5)', () => {
    const r = applyMacros(BASE, NEUTRAL)
    expect(r.filterCutoff).toBeCloseTo(BASE.filterCutoff, 3)
    expect(r.stereoSpread).toBeCloseTo(BASE.stereoSpread, 3)
    expect(r.detuneCents).toBeCloseTo(BASE.detuneCents, 3)
    expect(r.filterEnvAmount).toBeCloseTo(BASE.filterEnvAmount, 3)
    // Q only gets neutral COLOR/TENSION contributions at 0.5 → unchanged.
    expect(r.filterQ).toBeCloseTo(BASE.filterQ, 3)
  })
})

describe('COLOR → brightness group', () => {
  it('raising COLOR raises filter cutoff (monotonic)', () => {
    let prev = -1
    for (const c of [0, 0.25, 0.5, 0.75, 1]) {
      const cutoff = applyMacros(BASE, withColor(c)).filterCutoff
      expect(cutoff).toBeGreaterThan(prev)
      prev = cutoff
    }
  })
  it('COLOR=0 darkens below base, COLOR=1 brightens above base', () => {
    expect(applyMacros(BASE, withColor(0)).filterCutoff).toBeLessThan(BASE.filterCutoff)
    expect(applyMacros(BASE, withColor(1)).filterCutoff).toBeGreaterThan(BASE.filterCutoff)
  })
  it('cutoff stays within audible bounds at the extremes', () => {
    expect(applyMacros(BASE, withColor(0)).filterCutoff).toBeGreaterThanOrEqual(60)
    expect(applyMacros(BASE, withColor(1)).filterCutoff).toBeLessThanOrEqual(18000)
  })
})

describe('SPREAD → stereo image group', () => {
  it('raising SPREAD widens stereo spread (monotonic, clamped to 1)', () => {
    let prev = -1
    for (const s of [0, 0.5, 1]) {
      const sp = applyMacros(BASE, withSpread(s)).stereoSpread
      expect(sp).toBeGreaterThanOrEqual(prev)
      expect(sp).toBeLessThanOrEqual(1)
      prev = sp
    }
  })
  it('raising SPREAD widens unison detune', () => {
    expect(applyMacros(BASE, withSpread(1)).detuneCents).toBeGreaterThan(
      applyMacros(BASE, withSpread(0)).detuneCents,
    )
  })
  it('detune stays within range', () => {
    expect(applyMacros(BASE, withSpread(1)).detuneCents).toBeLessThanOrEqual(80)
    expect(applyMacros(BASE, withSpread(0)).detuneCents).toBeGreaterThanOrEqual(0)
  })
})

describe('TENSION → edge / drive group', () => {
  it('raising TENSION raises filter envelope amount (monotonic)', () => {
    let prev = -1
    for (const t of [0, 0.5, 1]) {
      const amt = applyMacros(BASE, withTension(t)).filterEnvAmount
      expect(amt).toBeGreaterThanOrEqual(prev)
      prev = amt
    }
  })
  it('raising TENSION raises resonance (Q)', () => {
    expect(applyMacros(BASE, withTension(1)).filterQ).toBeGreaterThan(
      applyMacros(BASE, withTension(0)).filterQ,
    )
  })
  it('Q is clamped below self-oscillation even with hot COLOR+TENSION', () => {
    const hot = applyMacros(BASE, { tension: 1, spread: 1, motion: 1, color: 1 })
    expect(hot.filterQ).toBeLessThanOrEqual(8)
    expect(hot.filterQ).toBeGreaterThan(0)
  })
})

describe('MOTION is ignored by applyMacros (consumed by transport)', () => {
  it('changing only MOTION does not change resolved params', () => {
    const a = applyMacros(BASE, { ...NEUTRAL, motion: 0 })
    const b = applyMacros(BASE, { ...NEUTRAL, motion: 1 })
    expect(a).toEqual(b)
  })
})

describe('output ranges hold across the full macro cube for every preset', () => {
  it('all resolved values stay within engine-safe bounds', () => {
    const grid = [0, 0.5, 1]
    for (const presetId of Object.keys(PRESETS) as Array<keyof typeof PRESETS>) {
      const base = PRESETS[presetId].voice
      for (const tension of grid)
        for (const spread of grid)
          for (const color of grid) {
            const r = applyMacros(base, { tension, spread, color, motion: 0.5 })
            expect(r.filterCutoff).toBeGreaterThanOrEqual(60)
            expect(r.filterCutoff).toBeLessThanOrEqual(18000)
            expect(r.filterQ).toBeGreaterThan(0)
            expect(r.filterQ).toBeLessThanOrEqual(8)
            expect(r.filterEnvAmount).toBeGreaterThanOrEqual(0)
            expect(r.filterEnvAmount).toBeLessThanOrEqual(8000)
            expect(r.stereoSpread).toBeGreaterThanOrEqual(0)
            expect(r.stereoSpread).toBeLessThanOrEqual(1)
            expect(r.detuneCents).toBeGreaterThanOrEqual(0)
            expect(r.detuneCents).toBeLessThanOrEqual(80)
          }
    }
  })
})
