import { describe, it, expect } from 'vitest'
import {
  romanNumeral,
  chordCategory,
  chordStability,
  chordLabel,
} from './labels'

describe('romanNumeral', () => {
  it('C major diatonic triads', () => {
    expect(romanNumeral({ root: 0, family: 'maj' }, 0, 'major')).toBe('I')
    expect(romanNumeral({ root: 2, family: 'min' }, 0, 'major')).toBe('ii')
    expect(romanNumeral({ root: 4, family: 'min' }, 0, 'major')).toBe('iii')
    expect(romanNumeral({ root: 5, family: 'maj' }, 0, 'major')).toBe('IV')
    expect(romanNumeral({ root: 7, family: 'maj' }, 0, 'major')).toBe('V')
    expect(romanNumeral({ root: 9, family: 'min' }, 0, 'major')).toBe('vi')
    expect(romanNumeral({ root: 11, family: 'dim' }, 0, 'major')).toBe('vii°')
  })

  it('quality suffixes', () => {
    expect(romanNumeral({ root: 7, family: 'dom7' }, 0, 'major')).toBe('V7')
    expect(romanNumeral({ root: 2, family: 'min7' }, 0, 'major')).toBe('ii7')
    expect(romanNumeral({ root: 0, family: 'maj7' }, 0, 'major')).toBe('Imaj7')
  })

  it('the tritone above the tonic is ♯iv°, not ♭v° (D7)', () => {
    // F♯dim in C major is the raised subdominant, conventionally ♯iv°.
    expect(romanNumeral({ root: 6, family: 'dim' }, 0, 'major')).toBe('♯iv°')
  })

  it('chromatic roots get accidentals', () => {
    // bVII in C major = Bb major
    expect(romanNumeral({ root: 10, family: 'maj' }, 0, 'major')).toBe('♭VII')
    // bII (Neapolitan) = Db major
    expect(romanNumeral({ root: 1, family: 'maj' }, 0, 'major')).toBe('♭II')
    // bIII = Eb major
    expect(romanNumeral({ root: 3, family: 'maj' }, 0, 'major')).toBe('♭III')
  })

  it('augmented uses + and uppercase', () => {
    expect(romanNumeral({ root: 0, family: 'aug' }, 0, 'major')).toBe('I+')
  })
})

describe('chordCategory', () => {
  it('diatonic triads are diatonic', () => {
    expect(chordCategory({ root: 0, family: 'maj' }, 0, 'major')).toBe('diatonic')
    expect(chordCategory({ root: 2, family: 'min' }, 0, 'major')).toBe('diatonic')
    expect(chordCategory({ root: 7, family: 'dom7' }, 0, 'major')).toBe(
      'diatonic',
    )
  })

  it('borrowed: diatonic root, non-diatonic quality', () => {
    // I as minor in major key (modal mixture) → root diatonic, quality not
    expect(chordCategory({ root: 0, family: 'min' }, 0, 'major')).toBe('borrowed')
    // iv major in major (Picardy-ish / borrowed) F major is diatonic; use iv minor? F min
    expect(chordCategory({ root: 5, family: 'min' }, 0, 'major')).toBe('borrowed')
  })

  it('chromatic: non-diatonic root', () => {
    expect(chordCategory({ root: 1, family: 'maj' }, 0, 'major')).toBe(
      'chromatic',
    )
    expect(chordCategory({ root: 10, family: 'maj' }, 0, 'major')).toBe(
      'chromatic',
    )
  })
})

describe('chordStability', () => {
  it('is within 0..1', () => {
    for (let root = 0; root < 12; root++) {
      const s = chordStability({ root, family: 'maj' }, 0, 'major')
      expect(s).toBeGreaterThanOrEqual(0)
      expect(s).toBeLessThanOrEqual(1)
    }
  })

  it('tonic triad most stable; chromatic least', () => {
    const tonic = chordStability({ root: 0, family: 'maj' }, 0, 'major')
    const dom = chordStability({ root: 7, family: 'maj' }, 0, 'major')
    const dim = chordStability({ root: 11, family: 'dim' }, 0, 'major')
    const chromatic = chordStability({ root: 1, family: 'maj' }, 0, 'major')
    expect(tonic).toBeGreaterThan(dom)
    expect(dom).toBeGreaterThan(dim)
    expect(tonic).toBeGreaterThan(chromatic)
    expect(dim).toBeGreaterThan(chromatic)
  })

  it('triad more stable than its 7th extension on same root', () => {
    const tri = chordStability({ root: 7, family: 'maj' }, 0, 'major')
    const sev = chordStability({ root: 7, family: 'dom7' }, 0, 'major')
    expect(tri).toBeGreaterThan(sev)
  })

  it('deterministic', () => {
    const a = chordStability({ root: 5, family: 'maj7' }, 0, 'major')
    const b = chordStability({ root: 5, family: 'maj7' }, 0, 'major')
    expect(a).toBe(b)
  })
})

describe('romanNumeral (extended families)', () => {
  it('half-diminished vii in a major key reads viiø7', () => {
    expect(romanNumeral({ root: 11, family: 'm7b5' }, 0, 'major')).toBe('viiø7')
  })
  it('altered dominants keep the V numeral with their suffix', () => {
    expect(romanNumeral({ root: 7, family: '7b9' }, 0, 'major')).toBe('V7♭9')
    expect(romanNumeral({ root: 7, family: '7#9' }, 0, 'major')).toBe('V7♯9')
    expect(romanNumeral({ root: 7, family: '13' }, 0, 'major')).toBe('V13')
  })
  it('maj7♯11 stays uppercase; 7sus4 is a suspended (uppercase) numeral', () => {
    expect(romanNumeral({ root: 0, family: 'maj7#11' }, 0, 'major')).toBe('Imaj7♯11')
    expect(romanNumeral({ root: 7, family: '7sus4' }, 0, 'major')).toBe('V7sus4')
  })
})

describe('chordLabel', () => {
  it('assembles all fields', () => {
    const l = chordLabel({ root: 2, family: 'min7' }, 0, 'major')
    expect(l.roman).toBe('ii7')
    expect(l.name).toBe('Dm7')
    expect(l.notes).toBe('D F A C')
    expect(l.category).toBe('diatonic')
    expect(l.stability).toBeGreaterThan(0)
    expect(l.stability).toBeLessThanOrEqual(1)
  })
})
