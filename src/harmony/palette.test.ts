import { describe, it, expect } from 'vitest'
import { diatonicChords, diatonicSevenths, paletteFor } from './palette'
import { romanNumeral } from './labels'

describe('diatonicChords (major)', () => {
  it('C major degrees have correct qualities', () => {
    const c = diatonicChords(0, 'major')
    expect(c).toEqual([
      { root: 0, family: 'maj' }, // I
      { root: 2, family: 'min' }, // ii
      { root: 4, family: 'min' }, // iii
      { root: 5, family: 'maj' }, // IV
      { root: 7, family: 'maj' }, // V
      { root: 9, family: 'min' }, // vi
      { root: 11, family: 'dim' }, // vii°
    ])
  })

  it('roman numerals of diatonic chords are I ii iii IV V vi vii°', () => {
    const c = diatonicChords(0, 'major')
    const romans = c.map((ch) => romanNumeral(ch, 0, 'major'))
    expect(romans).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'])
  })
})

describe('diatonicChords (other modes)', () => {
  it('A natural-minor: i ii° III iv v VI VII', () => {
    const c = diatonicChords(9, 'natural-minor')
    expect(c.map((x) => x.family)).toEqual([
      'min', // i
      'dim', // ii°
      'maj', // III
      'min', // iv
      'min', // v
      'maj', // VI
      'maj', // VII
    ])
  })

  it('D dorian: i ii III IV v vi° VII', () => {
    const c = diatonicChords(2, 'dorian')
    expect(c.map((x) => x.family)).toEqual([
      'min', // i
      'min', // ii
      'maj', // III
      'maj', // IV (characteristic major)
      'min', // v
      'dim', // vi°
      'maj', // VII
    ])
  })

  it('G mixolydian: I ii iii° IV v vi VII', () => {
    const c = diatonicChords(7, 'mixolydian')
    expect(c.map((x) => x.family)).toEqual([
      'maj', // I
      'min', // ii
      'dim', // iii°
      'maj', // IV
      'min', // v
      'min', // vi
      'maj', // VII (characteristic ♭VII)
    ])
  })
})

describe('diatonicSevenths (major)', () => {
  it('C major: Imaj7 ii7 iii7 IVmaj7 V7 vi7 viiø7', () => {
    const c = diatonicSevenths(0, 'major')
    expect(c[0]).toEqual({ root: 0, family: 'maj7' })
    expect(c[1]).toEqual({ root: 2, family: 'min7' })
    expect(c[3]).toEqual({ root: 5, family: 'maj7' })
    expect(c[4]).toEqual({ root: 7, family: 'dom7' })
    expect(c[6]).toEqual({ root: 11, family: 'm7b5' }) // half-diminished, now a first-class family
  })
})

describe('paletteFor', () => {
  it('starts with the 7 diatonic chords', () => {
    const p = paletteFor(0, 'major')
    const firstSeven = p.slice(0, 7).map((e) => e.chord)
    expect(firstSeven).toEqual(diatonicChords(0, 'major'))
  })

  it('every entry has a complete label', () => {
    const p = paletteFor(0, 'major')
    for (const e of p) {
      expect(typeof e.label.roman).toBe('string')
      expect(e.label.roman.length).toBeGreaterThan(0)
      expect(typeof e.label.name).toBe('string')
      expect(e.label.notes.length).toBeGreaterThan(0)
      expect(e.label.stability).toBeGreaterThanOrEqual(0)
      expect(e.label.stability).toBeLessThanOrEqual(1)
    }
  })

  it('contains diatonic, borrowed, and chromatic categories', () => {
    const cats = new Set(paletteFor(0, 'major').map((e) => e.label.category))
    expect(cats.has('diatonic')).toBe(true)
    expect(cats.has('borrowed')).toBe(true)
    expect(cats.has('chromatic')).toBe(true)
  })

  it('diatonic entries are on average more stable than chromatic', () => {
    const p = paletteFor(0, 'major')
    const avg = (cat: string) => {
      const xs = p.filter((e) => e.label.category === cat)
      return xs.reduce((s, e) => s + e.label.stability, 0) / xs.length
    }
    expect(avg('diatonic')).toBeGreaterThan(avg('chromatic'))
  })

  it('no duplicate root+family entries', () => {
    const p = paletteFor(0, 'major')
    const keys = p.map((e) => `${e.chord.root}:${e.chord.family}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('is deterministic', () => {
    expect(paletteFor(5, 'natural-minor')).toEqual(paletteFor(5, 'natural-minor'))
  })
})
