import { describe, it, expect } from 'vitest'
import { MODES } from '../types'
import { scaleSemitones, scalePitchClasses, scaleDegreeOf, mod12 } from './scales'

describe('scaleSemitones', () => {
  it('returns 7 intervals for every mode', () => {
    for (const m of MODES) {
      const s = scaleSemitones(m)
      expect(s).toHaveLength(7)
      expect(s[0]).toBe(0)
    }
  })

  it('major scale is correct', () => {
    expect(scaleSemitones('major')).toEqual([0, 2, 4, 5, 7, 9, 11])
  })

  it('natural-minor scale is correct', () => {
    expect(scaleSemitones('natural-minor')).toEqual([0, 2, 3, 5, 7, 8, 10])
  })

  it('dorian / mixolydian / phrygian / lydian / harmonic-minor', () => {
    expect(scaleSemitones('dorian')).toEqual([0, 2, 3, 5, 7, 9, 10])
    expect(scaleSemitones('mixolydian')).toEqual([0, 2, 4, 5, 7, 9, 10])
    expect(scaleSemitones('phrygian')).toEqual([0, 1, 3, 5, 7, 8, 10])
    expect(scaleSemitones('lydian')).toEqual([0, 2, 4, 6, 7, 9, 11])
    expect(scaleSemitones('harmonic-minor')).toEqual([0, 2, 3, 5, 7, 8, 11])
  })

  it('locrian / melodic-minor / harmonic-major', () => {
    expect(scaleSemitones('locrian')).toEqual([0, 1, 3, 5, 6, 8, 10])
    expect(scaleSemitones('melodic-minor')).toEqual([0, 2, 3, 5, 7, 9, 11])
    expect(scaleSemitones('harmonic-major')).toEqual([0, 2, 4, 5, 7, 8, 11])
  })

  it('returns a copy (no mutation of internal table)', () => {
    const a = scaleSemitones('major')
    a[0] = 99
    expect(scaleSemitones('major')[0]).toBe(0)
  })
})

describe('scalePitchClasses', () => {
  it('C major', () => {
    expect(scalePitchClasses(0, 'major')).toEqual([0, 2, 4, 5, 7, 9, 11])
  })
  it('A natural-minor', () => {
    expect(scalePitchClasses(9, 'natural-minor')).toEqual([9, 11, 0, 2, 4, 5, 7])
  })
  it('F major wraps correctly', () => {
    expect(scalePitchClasses(5, 'major')).toEqual([5, 7, 9, 10, 0, 2, 4])
  })
})

describe('scaleDegreeOf', () => {
  it('finds diatonic degrees', () => {
    expect(scaleDegreeOf(0, 0, 'major')).toBe(0)
    expect(scaleDegreeOf(7, 0, 'major')).toBe(4)
    expect(scaleDegreeOf(11, 0, 'major')).toBe(6)
  })
  it('returns null for non-diatonic', () => {
    expect(scaleDegreeOf(1, 0, 'major')).toBeNull()
    expect(scaleDegreeOf(6, 0, 'major')).toBeNull()
  })
})

describe('mod12', () => {
  it('handles negatives and overflow', () => {
    expect(mod12(-1)).toBe(11)
    expect(mod12(12)).toBe(0)
    expect(mod12(25)).toBe(1)
  })
})
