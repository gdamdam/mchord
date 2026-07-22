import { describe, it, expect } from 'vitest'
import {
  clamp,
  clamp01,
  lerp,
  expLerp,
  dbToGain,
  midiToFreq,
  centsToRatio,
  velocityToGain,
  sanitizeADSR,
  MIN_ENV_TIME,
  type ADSR,
} from './dsp'

describe('clamp / clamp01', () => {
  it('clamps to range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
    expect(clamp(-1, 0, 10)).toBe(0)
    expect(clamp(11, 0, 10)).toBe(10)
  })
  it('clamp01 clamps to [0,1]', () => {
    expect(clamp01(-0.5)).toBe(0)
    expect(clamp01(0.5)).toBe(0.5)
    expect(clamp01(2)).toBe(1)
  })
})

describe('lerp / expLerp', () => {
  it('lerp is linear', () => {
    expect(lerp(0, 10, 0)).toBe(0)
    expect(lerp(0, 10, 0.5)).toBe(5)
    expect(lerp(0, 10, 1)).toBe(10)
  })
  it('expLerp hits endpoints and is monotonic', () => {
    expect(expLerp(100, 1000, 0)).toBeCloseTo(100)
    expect(expLerp(100, 1000, 1)).toBeCloseTo(1000)
    const mid = expLerp(100, 1000, 0.5)
    expect(mid).toBeGreaterThan(100)
    expect(mid).toBeLessThan(1000)
    // Geometric mean at the midpoint.
    expect(mid).toBeCloseTo(Math.sqrt(100 * 1000), 3)
  })
})

describe('dbToGain', () => {
  it('0 dB is unity', () => {
    expect(dbToGain(0)).toBeCloseTo(1, 6)
  })
  it('-6 dB ≈ 0.501', () => {
    expect(dbToGain(-6)).toBeCloseTo(0.50119, 4)
  })
  it('handles silence', () => {
    expect(dbToGain(-Infinity)).toBe(0)
  })
})

describe('midiToFreq', () => {
  it('A4 = 440', () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 6)
  })
  it('middle C ≈ 261.63', () => {
    expect(midiToFreq(60)).toBeCloseTo(261.626, 2)
  })
  it('octave up doubles', () => {
    expect(midiToFreq(72) / midiToFreq(60)).toBeCloseTo(2, 6)
  })
})

describe('centsToRatio', () => {
  it('0 cents is unity', () => {
    expect(centsToRatio(0)).toBeCloseTo(1, 6)
  })
  it('1200 cents is an octave', () => {
    expect(centsToRatio(1200)).toBeCloseTo(2, 6)
    expect(centsToRatio(-1200)).toBeCloseTo(0.5, 6)
  })
})

describe('velocityToGain', () => {
  it('is monotonic non-decreasing over 0..1', () => {
    let prev = -1
    for (let v = 0; v <= 1.0001; v += 0.05) {
      const g = velocityToGain(v)
      expect(g).toBeGreaterThanOrEqual(prev)
      expect(g).toBeGreaterThanOrEqual(0)
      expect(g).toBeLessThanOrEqual(1)
      prev = g
    }
  })
  it('endpoints', () => {
    expect(velocityToGain(0)).toBe(0)
    expect(velocityToGain(1)).toBeCloseTo(1, 6)
  })
  it('keeps soft notes audible (curve above linear at low end)', () => {
    expect(velocityToGain(0.25)).toBeGreaterThan(0.25)
  })
})

describe('sanitizeADSR', () => {
  it('floors times and clamps sustain', () => {
    const dirty: ADSR = { attack: 0, decay: -1, sustain: 2, release: 100 }
    const s = sanitizeADSR(dirty)
    expect(s.attack).toBeGreaterThanOrEqual(MIN_ENV_TIME)
    expect(s.decay).toBeGreaterThanOrEqual(MIN_ENV_TIME)
    expect(s.sustain).toBe(1)
    expect(s.release).toBeLessThanOrEqual(12)
  })
  it('passes through valid values', () => {
    const ok: ADSR = { attack: 0.01, decay: 0.3, sustain: 0.7, release: 0.5 }
    expect(sanitizeADSR(ok)).toEqual(ok)
  })
})
