import { describe, it, expect } from 'vitest'
import { noteNameInKey, spellChord, chordName } from './spelling'

describe('noteNameInKey', () => {
  it('naturals are letter names', () => {
    expect(noteNameInKey(0, 0, 'major')).toBe('C')
    expect(noteNameInKey(5, 0, 'major')).toBe('F')
    expect(noteNameInKey(11, 0, 'major')).toBe('B')
  })

  it('flat keys spell black keys as flats', () => {
    // F major uses B♭, not A♯.
    expect(noteNameInKey(10, 5, 'major')).toBe('B♭')
    // B♭ major: E♭ (pc3)
    expect(noteNameInKey(3, 10, 'major')).toBe('E♭')
    // E♭ major: A♭ (pc8)
    expect(noteNameInKey(8, 3, 'major')).toBe('A♭')
  })

  it('sharp keys spell black keys as sharps', () => {
    // G major: F♯ (pc6)
    expect(noteNameInKey(6, 7, 'major')).toBe('F♯')
    // D major: C♯ (pc1), F♯ (pc6)
    expect(noteNameInKey(1, 2, 'major')).toBe('C♯')
    expect(noteNameInKey(6, 2, 'major')).toBe('F♯')
  })

  it('minor keys follow relative-major signature', () => {
    // D minor (relative F major) → B♭
    expect(noteNameInKey(10, 2, 'natural-minor')).toBe('B♭')
    // E minor (relative G major) → F♯
    expect(noteNameInKey(6, 4, 'natural-minor')).toBe('F♯')
  })
})

describe('spellChord (stacked thirds)', () => {
  it('C major triad', () => {
    expect(spellChord({ root: 0, family: 'maj' }, 0, 'major')).toEqual([
      'C',
      'E',
      'G',
    ])
  })

  it('C minor triad uses E♭', () => {
    expect(spellChord({ root: 0, family: 'min' }, 0, 'natural-minor')).toEqual([
      'C',
      'E♭',
      'G',
    ])
  })

  it('B diminished triad: B D F', () => {
    expect(spellChord({ root: 11, family: 'dim' }, 0, 'major')).toEqual([
      'B',
      'D',
      'F',
    ])
  })

  it('D minor 7: D F A C', () => {
    expect(spellChord({ root: 2, family: 'min7' }, 5, 'major')).toEqual([
      'D',
      'F',
      'A',
      'C',
    ])
  })

  it('G dominant 7: G B D F', () => {
    expect(spellChord({ root: 7, family: 'dom7' }, 0, 'major')).toEqual([
      'G',
      'B',
      'D',
      'F',
    ])
  })

  it('B♭ major 7: B♭ D F A', () => {
    expect(spellChord({ root: 10, family: 'maj7' }, 10, 'major')).toEqual([
      'B♭',
      'D',
      'F',
      'A',
    ])
  })

  it('F augmented: F A C♯ (sharp in F? aug raises 5th)', () => {
    const s = spellChord({ root: 5, family: 'aug' }, 0, 'major')
    expect(s[0]).toBe('F')
    expect(s[1]).toBe('A')
    // augmented fifth above F is C♯ enharmonically; letter must be C
    expect(s[2][0]).toBe('C')
  })
})

describe('chordName', () => {
  it('absolute names with key spelling', () => {
    expect(chordName({ root: 2, family: 'min7' }, 0, 'major')).toBe('Dm7')
    expect(chordName({ root: 6, family: 'dim' }, 2, 'major')).toBe('F♯dim')
    expect(chordName({ root: 10, family: 'maj7' }, 10, 'major')).toBe('B♭maj7')
    expect(chordName({ root: 7, family: 'dom7' }, 0, 'major')).toBe('G7')
    expect(chordName({ root: 0, family: 'maj' }, 0, 'major')).toBe('C')
    expect(chordName({ root: 9, family: 'min' }, 0, 'major')).toBe('Am')
    expect(chordName({ root: 0, family: 'minMaj7' }, 0, 'major')).toBe('Cm(maj7)')
    expect(chordName({ root: 0, family: 'sus4' }, 0, 'major')).toBe('Csus4')
    expect(chordName({ root: 0, family: '6' }, 0, 'major')).toBe('C6')
    expect(chordName({ root: 0, family: 'dom9' }, 0, 'major')).toBe('C9')
  })
})
