import { describe, it, expect } from 'vitest'
import { parseChordName, parseChordLine } from './chordParse'

describe('parseChordName', () => {
  it('parses roots with accidentals (absolute pitch class)', () => {
    expect(parseChordName('C')).toEqual({ root: 0, family: 'maj' })
    expect(parseChordName('C#')).toEqual({ root: 1, family: 'maj' })
    expect(parseChordName('Db')).toEqual({ root: 1, family: 'maj' })
    expect(parseChordName('Bb')).toEqual({ root: 10, family: 'maj' })
    expect(parseChordName('B')).toEqual({ root: 11, family: 'maj' })
    // unicode accidentals
    expect(parseChordName('F♯')).toEqual({ root: 6, family: 'maj' })
    expect(parseChordName('E♭')).toEqual({ root: 3, family: 'maj' })
  })

  it('maps common suffixes to families', () => {
    expect(parseChordName('Cm')).toEqual({ root: 0, family: 'min' })
    expect(parseChordName('Cmin')).toEqual({ root: 0, family: 'min' })
    expect(parseChordName('Cmaj7')).toEqual({ root: 0, family: 'maj7' })
    expect(parseChordName('CM7')).toEqual({ root: 0, family: 'maj7' })
    expect(parseChordName('Cm7')).toEqual({ root: 0, family: 'min7' })
    expect(parseChordName('C7')).toEqual({ root: 0, family: 'dom7' })
    expect(parseChordName('Cdim')).toEqual({ root: 0, family: 'dim' })
    expect(parseChordName('Caug')).toEqual({ root: 0, family: 'aug' })
    expect(parseChordName('Csus4')).toEqual({ root: 0, family: 'sus4' })
    expect(parseChordName('Csus2')).toEqual({ root: 0, family: 'sus2' })
    expect(parseChordName('Cadd9')).toEqual({ root: 0, family: 'add9' })
  })

  it('distinguishes upper-case M (major) from lower-case m (minor)', () => {
    expect(parseChordName('CM7')).toEqual({ root: 0, family: 'maj7' })
    expect(parseChordName('Cm7')).toEqual({ root: 0, family: 'min7' })
    expect(parseChordName('CM9')).toEqual({ root: 0, family: 'maj9' })
    expect(parseChordName('Cm9')).toEqual({ root: 0, family: 'min9' })
  })

  it('parses the extended / altered families', () => {
    expect(parseChordName('Bm7b5')).toEqual({ root: 11, family: 'm7b5' })
    expect(parseChordName('Bø')).toEqual({ root: 11, family: 'm7b5' })
    expect(parseChordName('G7b9')).toEqual({ root: 7, family: '7b9' })
    expect(parseChordName('G7#9')).toEqual({ root: 7, family: '7#9' })
    expect(parseChordName('G13')).toEqual({ root: 7, family: '13' })
    expect(parseChordName('Fmaj7#11')).toEqual({ root: 5, family: 'maj7#11' })
    expect(parseChordName('G7sus4')).toEqual({ root: 7, family: '7sus4' })
    expect(parseChordName('C5')).toEqual({ root: 0, family: '5' })
    expect(parseChordName('Cm6')).toEqual({ root: 0, family: 'min6' })
    expect(parseChordName('C6')).toEqual({ root: 0, family: '6' })
    expect(parseChordName('CmMaj7')).toEqual({ root: 0, family: 'minMaj7' })
  })

  it('ignores surrounding whitespace and rejects garbage', () => {
    expect(parseChordName('  Am7  ')).toEqual({ root: 9, family: 'min7' })
    expect(parseChordName('')).toBeNull()
    expect(parseChordName('H')).toBeNull() // no such note letter
    expect(parseChordName('Cwtf')).toBeNull() // unknown suffix
    expect(parseChordName('7')).toBeNull() // no root
  })
})

describe('parseChordLine', () => {
  it('splits on whitespace and commas, preserving order', () => {
    const r = parseChordLine('Cmaj7 Am7, Dm7  G7')
    expect(r.map((t) => t.token)).toEqual(['Cmaj7', 'Am7', 'Dm7', 'G7'])
    expect(r.map((t) => t.chord)).toEqual([
      { root: 0, family: 'maj7' },
      { root: 9, family: 'min7' },
      { root: 2, family: 'min7' },
      { root: 7, family: 'dom7' },
    ])
  })

  it('flags unrecognised tokens with a null chord but keeps them', () => {
    const r = parseChordLine('C nope G')
    expect(r.map((t) => t.token)).toEqual(['C', 'nope', 'G'])
    expect(r[1].chord).toBeNull()
    expect(r[0].chord).toEqual({ root: 0, family: 'maj' })
  })

  it('returns [] for empty / whitespace input', () => {
    expect(parseChordLine('')).toEqual([])
    expect(parseChordLine('   ')).toEqual([])
  })
})
