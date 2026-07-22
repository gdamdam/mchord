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

  it('6+-accidental keys reach C♭/E♯ enharmonics (D4)', () => {
    // G♭ major (6 flats): pc11 is the 4th degree C♭, not the natural B.
    expect(noteNameInKey(11, 6, 'major')).toBe('C♭')
    // A sharp key still spells its 6/pc as F♯ (sharp side unaffected).
    expect(noteNameInKey(6, 11, 'major')).toBe('F♯')
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

  it('G♭ major IV chord spells C♭ E♭ G♭, not B D♯ F♯ (D4)', () => {
    expect(spellChord({ root: 11, family: 'maj' }, 6, 'major')).toEqual([
      'C♭',
      'E♭',
      'G♭',
    ])
  })

  it('F♯ major triad keeps sharp spelling in a sharp key (D4)', () => {
    // In B major, F♯ major (the V) reads F♯ A♯ C♯.
    expect(spellChord({ root: 6, family: 'maj' }, 11, 'major')).toEqual([
      'F♯',
      'A♯',
      'C♯',
    ])
  })

  it('extended families spell their tensions by generic degree (C key)', () => {
    // half-diminished: root ♭3 ♭5 ♭7
    expect(spellChord({ root: 0, family: 'm7b5' }, 0, 'major')).toEqual([
      'C', 'E♭', 'G♭', 'B♭',
    ])
    // ♭9 spells as a 2nd letter (D♭), not a 3rd (C♯)
    expect(spellChord({ root: 0, family: '7b9' }, 0, 'major')).toEqual([
      'C', 'E', 'G', 'B♭', 'D♭',
    ])
    // ♯9 spells as a 2nd letter (D♯), not a 3rd (E♭)
    expect(spellChord({ root: 0, family: '7#9' }, 0, 'major')).toEqual([
      'C', 'E', 'G', 'B♭', 'D♯',
    ])
    // ♯11 spells as a 4th letter (F♯)
    expect(spellChord({ root: 0, family: 'maj7#11' }, 0, 'major')).toEqual([
      'C', 'E', 'G', 'B', 'F♯',
    ])
    // 13 spells as a 6th letter (A)
    expect(spellChord({ root: 0, family: '13' }, 0, 'major')).toEqual([
      'C', 'E', 'G', 'B♭', 'D', 'A',
    ])
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
