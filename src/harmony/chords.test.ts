import { describe, it, expect } from 'vitest'
import { CHORD_FAMILIES } from '../types'
import {
  chordIntervals,
  chordPitchClasses,
  chordMidiFromRoot,
  transposeChord,
} from './chords'

describe('chordIntervals', () => {
  it('covers every family with root 0 and ascending order', () => {
    for (const f of CHORD_FAMILIES) {
      const iv = chordIntervals(f)
      // Most families are triads+, but the power chord ('5') is a 2-note dyad.
      expect(iv.length).toBeGreaterThanOrEqual(f === '5' ? 2 : 3)
      expect(iv[0]).toBe(0)
      for (let i = 1; i < iv.length; i++) {
        expect(iv[i]).toBeGreaterThan(iv[i - 1])
      }
    }
  })

  it('known recipes', () => {
    expect(chordIntervals('maj')).toEqual([0, 4, 7])
    expect(chordIntervals('min')).toEqual([0, 3, 7])
    expect(chordIntervals('dim')).toEqual([0, 3, 6])
    expect(chordIntervals('aug')).toEqual([0, 4, 8])
    expect(chordIntervals('sus2')).toEqual([0, 2, 7])
    expect(chordIntervals('sus4')).toEqual([0, 5, 7])
    expect(chordIntervals('maj7')).toEqual([0, 4, 7, 11])
    expect(chordIntervals('min7')).toEqual([0, 3, 7, 10])
    expect(chordIntervals('dom7')).toEqual([0, 4, 7, 10])
    expect(chordIntervals('minMaj7')).toEqual([0, 3, 7, 11])
    expect(chordIntervals('add9')).toEqual([0, 4, 7, 14])
    expect(chordIntervals('maj9')).toEqual([0, 4, 7, 11, 14])
    expect(chordIntervals('min9')).toEqual([0, 3, 7, 10, 14])
    expect(chordIntervals('dom9')).toEqual([0, 4, 7, 10, 14])
    expect(chordIntervals('6')).toEqual([0, 4, 7, 9])
    expect(chordIntervals('min6')).toEqual([0, 3, 7, 9])
    expect(chordIntervals('m7b5')).toEqual([0, 3, 6, 10])
    expect(chordIntervals('7b9')).toEqual([0, 4, 7, 10, 13])
    expect(chordIntervals('7#9')).toEqual([0, 4, 7, 10, 15])
    expect(chordIntervals('13')).toEqual([0, 4, 7, 10, 14, 21])
    expect(chordIntervals('maj7#11')).toEqual([0, 4, 7, 11, 18])
    expect(chordIntervals('7sus4')).toEqual([0, 5, 7, 10])
    expect(chordIntervals('5')).toEqual([0, 7])
  })
})

describe('chordPitchClasses', () => {
  it('C major triad', () => {
    expect(chordPitchClasses({ root: 0, family: 'maj' })).toEqual([0, 4, 7])
  })
  it('D min7', () => {
    expect(chordPitchClasses({ root: 2, family: 'min7' })).toEqual([2, 5, 9, 0])
  })
  it('add9 9th wraps to pc 2 for C', () => {
    expect(chordPitchClasses({ root: 0, family: 'add9' })).toEqual([0, 4, 7, 2])
  })
})

describe('chordMidiFromRoot', () => {
  it('C maj at C4', () => {
    expect(chordMidiFromRoot({ root: 0, family: 'maj' }, 60)).toEqual([60, 64, 67])
  })
  it('dom9 keeps extension above octave', () => {
    expect(chordMidiFromRoot({ root: 0, family: 'dom9' }, 60)).toEqual([
      60, 64, 67, 70, 74,
    ])
  })
})

describe('transposeChord', () => {
  it('transposes root mod 12', () => {
    expect(transposeChord({ root: 0, family: 'maj7' }, 5)).toEqual({
      root: 5,
      family: 'maj7',
    })
    expect(transposeChord({ root: 10, family: 'min' }, 5)).toEqual({
      root: 3,
      family: 'min',
    })
    expect(transposeChord({ root: 0, family: 'maj' }, -1)).toEqual({
      root: 11,
      family: 'maj',
    })
  })
})
