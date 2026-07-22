import { describe, it, expect } from 'vitest'
import type { Chord, Voicing, VoicingOptions } from '../types'
import { voiceChord, voiceProgression } from './voiceLeading'

const C: Chord = { root: 0, family: 'maj' }
const F: Chord = { root: 5, family: 'maj' }
const G: Chord = { root: 7, family: 'dom7' }
const Am: Chord = { root: 9, family: 'min' }
const Dm7: Chord = { root: 2, family: 'min7' }

function chordPcSet(v: Voicing): Set<number> {
  return new Set(v.map((n) => ((n % 12) + 12) % 12))
}

function totalMovement(a: Voicing, b: Voicing): number {
  // simple greedy nearest matching for test measurement
  const x = [...a].sort((m, n) => m - n)
  const y = [...b].sort((m, n) => m - n)
  let total = 0
  const used = new Array(y.length).fill(false)
  for (const note of x) {
    let bj = -1
    let bd = Infinity
    for (let j = 0; j < y.length; j++) {
      const d = Math.abs(y[j] - note)
      if (d < bd) {
        bd = d
        bj = j
      }
    }
    if (bj >= 0) {
      total += bd
      used[bj] = true
    }
  }
  return total
}

const RANGE: VoicingOptions = { mode: 'smooth', minMidi: 36, maxMidi: 84 }

describe('voiceChord — basic correctness', () => {
  it('produces the chord pitch classes (root mode)', () => {
    const v = voiceChord(C, { mode: 'root' }, null)
    expect(chordPcSet(v)).toEqual(new Set([0, 4, 7]))
    // sorted ascending
    expect([...v].sort((a, b) => a - b)).toEqual(v)
  })

  it('root mode places root as lowest note', () => {
    const v = voiceChord(C, { mode: 'root' }, null)
    expect(((v[0] % 12) + 12) % 12).toBe(0)
  })

  it('close mode keeps voices within ~an octave', () => {
    const v = voiceChord(G, { mode: 'close' }, null)
    expect(Math.max(...v) - Math.min(...v)).toBeLessThanOrEqual(14)
    expect(chordPcSet(v)).toEqual(new Set([7, 11, 2, 5]))
  })

  it('wide mode spans wider than close', () => {
    const close = voiceChord(G, { mode: 'close' }, null)
    const wide = voiceChord(G, { mode: 'wide', spread: 0.6 }, null)
    const span = (v: Voicing) => Math.max(...v) - Math.min(...v)
    expect(span(wide)).toBeGreaterThan(span(close))
  })

  it('bass mode anchors root in the bass', () => {
    const v = voiceChord(C, { mode: 'bass' }, null)
    expect(((v[0] % 12) + 12) % 12).toBe(0)
    // bass is clearly the lowest
    expect(v[0]).toBeLessThan(v[1])
  })
})

describe('range constraints', () => {
  it('all notes within [minMidi, maxMidi] across modes and roots', () => {
    const modes: VoicingOptions['mode'][] = [
      'root',
      'close',
      'wide',
      'smooth',
      'bass',
    ]
    for (const mode of modes) {
      for (let root = 0; root < 12; root++) {
        const v = voiceChord(
          { root, family: 'maj9' },
          { mode, minMidi: 40, maxMidi: 80, spread: 0.8, tension: 0.9 },
          null,
        )
        for (const n of v) {
          expect(n).toBeGreaterThanOrEqual(40)
          expect(n).toBeLessThanOrEqual(80)
        }
      }
    }
  })
})

describe('determinism', () => {
  it('same input → identical output (single chord, all modes)', () => {
    const modes: VoicingOptions['mode'][] = [
      'root',
      'close',
      'wide',
      'smooth',
      'bass',
    ]
    for (const mode of modes) {
      const opts: VoicingOptions = { mode, tension: 0.3, spread: 0.4, color: 0.5 }
      const a = voiceChord(G, opts, [60, 64, 67])
      const b = voiceChord(G, opts, [60, 64, 67])
      expect(a).toEqual(b)
    }
  })

  it('same input → identical output (full progression, deep-equal twice)', () => {
    const prog = [C, F, G, Am, Dm7, G, C, null]
    const opts: VoicingOptions = { mode: 'smooth', tension: 0.2, spread: 0.3 }
    const run1 = voiceProgression(prog, opts)
    const run2 = voiceProgression(prog, opts)
    expect(run1).toEqual(run2)
  })
})

describe('SMOOTH minimises movement', () => {
  it('SMOOTH total movement <= ROOT total movement on a progression', () => {
    const prog: Chord[] = [C, Am, F, G, C]
    const smooth = voiceProgression(prog, { mode: 'smooth' }) as Voicing[]
    const root = voiceProgression(prog, { mode: 'root' }) as Voicing[]
    let smoothMove = 0
    let rootMove = 0
    for (let i = 1; i < prog.length; i++) {
      smoothMove += totalMovement(smooth[i - 1], smooth[i])
      rootMove += totalMovement(root[i - 1], root[i])
    }
    expect(smoothMove).toBeLessThanOrEqual(rootMove)
    // and meaningfully smaller on this classic loop
    expect(smoothMove).toBeLessThan(rootMove)
  })

  it('SMOOTH picks an inversion close to prev (C→F small move)', () => {
    const prevC = voiceChord(C, { mode: 'close' }, null)
    const fSmooth = voiceChord(F, { mode: 'smooth' }, prevC)
    // moving C(close) → F should be smaller than F in root position from same prev
    const fRoot = voiceChord(F, { mode: 'root' }, null)
    expect(totalMovement(prevC, fSmooth)).toBeLessThanOrEqual(
      totalMovement(prevC, fRoot),
    )
    // F voicing must still contain F major pcs
    expect(chordPcSet(fSmooth)).toEqual(new Set([5, 9, 0]))
  })
})

describe('differing chord sizes', () => {
  it('triad → seventh → triad voices without error and keeps pcs', () => {
    const prog: Chord[] = [C, G, C] // 3 → 4 → 3
    const v = voiceProgression(prog, { mode: 'smooth' }) as Voicing[]
    expect(chordPcSet(v[0])).toEqual(new Set([0, 4, 7]))
    expect(chordPcSet(v[1])).toEqual(new Set([7, 11, 2, 5]))
    expect(chordPcSet(v[2])).toEqual(new Set([0, 4, 7]))
    // determinism on mixed sizes
    expect(voiceProgression(prog, { mode: 'smooth' })).toEqual(v)
  })

  it('seventh → triad → ninth', () => {
    const prog: Chord[] = [
      { root: 2, family: 'min7' },
      { root: 7, family: 'maj' },
      { root: 0, family: 'maj9' },
    ]
    const v = voiceProgression(prog, RANGE) as Voicing[]
    expect(v).toHaveLength(3)
    for (const voicing of v) {
      for (const n of voicing) {
        expect(n).toBeGreaterThanOrEqual(36)
        expect(n).toBeLessThanOrEqual(84)
      }
    }
  })
})

describe('macro influence', () => {
  it('TENSION adds at least one extra tone vs no tension (close)', () => {
    const plain = voiceChord(C, { mode: 'close', tension: 0 }, null)
    const tense = voiceChord(C, { mode: 'close', tension: 0.9 }, null)
    expect(chordPcSet(tense).size).toBeGreaterThan(chordPcSet(plain).size)
  })

  it('SPREAD widens span (wide mode)', () => {
    const narrow = voiceChord(G, { mode: 'wide', spread: 0 }, null)
    const wide = voiceChord(G, { mode: 'wide', spread: 1 }, null)
    const span = (v: Voicing) => Math.max(...v) - Math.min(...v)
    expect(span(wide)).toBeGreaterThanOrEqual(span(narrow))
  })
})

describe('voiceProgression handles nulls', () => {
  it('null slots produce null and do not reset prev voicing', () => {
    const prog = [C, null, C]
    const v = voiceProgression(prog, { mode: 'smooth' })
    expect(v[1]).toBeNull()
    expect(v[0]).not.toBeNull()
    expect(v[2]).not.toBeNull()
    // 3rd C should match 1st C closely since prev carried across the null
    expect(v[2]).toEqual(v[0])
  })
})

describe('fitToRange keeps voices distinct (regression)', () => {
  it('a wide voicing squeezed into a narrow range does not collapse to duplicates', () => {
    // High spread in WIDE mode builds a voicing wider than the allowed range,
    // forcing per-note clamping that used to map several voices onto one MIDI.
    const v = voiceChord(
      { root: 0, family: 'maj9' },
      { mode: 'wide', spread: 1, minMidi: 58, maxMidi: 66 },
      null,
    )
    expect(new Set(v).size).toBe(v.length)
    for (const n of v) {
      expect(n).toBeGreaterThanOrEqual(58)
    }
  })
})

describe('bass mode respects the range floor (D1)', () => {
  it('clamps the bass to minMidi (preserving the root pitch class)', () => {
    // Previously the bass landed at 36 (below minMidi 48) and the whole
    // voicing derived from it fell out of range: [36,43,52].
    const v = voiceChord(
      { root: 0, family: 'maj' },
      { mode: 'bass', center: 50, minMidi: 48, maxMidi: 80 },
      null,
    )
    expect(v).toEqual([48, 52, 55])
    for (const n of v) {
      expect(n).toBeGreaterThanOrEqual(48)
      expect(n).toBeLessThanOrEqual(80)
    }
    expect(chordPcSet(v)).toEqual(new Set([0, 4, 7]))
  })
})

const Cmaj7: Chord = { root: 0, family: 'maj7' }

describe('quartal mode', () => {
  it('builds a stack of perfect fourths rooted on a chord tone', () => {
    const v = voiceChord(Cmaj7, { mode: 'quartal' }, null)
    const sorted = [...v].sort((a, b) => a - b)
    // Rooted on the chord root (C).
    expect(((sorted[0] % 12) + 12) % 12).toBe(0)
    // Consecutive intervals are perfect fourths (5 semitones).
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i] - sorted[i - 1]).toBe(5)
    }
    // Fourth-stack colour pcs for C: C, F, Bb, Eb.
    expect(chordPcSet(v)).toEqual(new Set([0, 5, 10, 3]))
  })

  it('yields at least 3 voices for a triad and stays in range', () => {
    const v = voiceChord(C, { mode: 'quartal', minMidi: 40, maxMidi: 80 }, null)
    expect(v.length).toBeGreaterThanOrEqual(3)
    for (const n of v) {
      expect(n).toBeGreaterThanOrEqual(40)
      expect(n).toBeLessThanOrEqual(80)
    }
  })
})

describe('drop2 mode', () => {
  it('preserves the chord pitch classes and opens wider than close', () => {
    const drop = voiceChord(Cmaj7, { mode: 'drop2' }, null)
    const close = voiceChord(Cmaj7, { mode: 'close' }, null)
    expect(chordPcSet(drop)).toEqual(new Set([0, 4, 7, 11]))
    const span = (v: Voicing) => Math.max(...v) - Math.min(...v)
    expect(span(drop)).toBeGreaterThan(span(close))
  })

  it('stays within range across roots', () => {
    for (let root = 0; root < 12; root++) {
      const v = voiceChord(
        { root, family: 'dom7' },
        { mode: 'drop2', minMidi: 40, maxMidi: 80 },
        null,
      )
      for (const n of v) {
        expect(n).toBeGreaterThanOrEqual(40)
        expect(n).toBeLessThanOrEqual(80)
      }
    }
  })
})

describe('shell mode', () => {
  it('keeps root + 3rd + 7th and omits the 5th (Cmaj7)', () => {
    const v = voiceChord(Cmaj7, { mode: 'shell' }, null)
    // root(0) + 3rd(4) + 7th(11); no 5th (7).
    expect(chordPcSet(v)).toEqual(new Set([0, 4, 11]))
    expect(chordPcSet(v).has(7)).toBe(false)
  })

  it('falls back to root+3rd+5th for a triad with no 7th', () => {
    const v = voiceChord(C, { mode: 'shell' }, null)
    expect(chordPcSet(v)).toEqual(new Set([0, 4, 7]))
  })

  it('stays within range', () => {
    const v = voiceChord(
      { root: 2, family: 'min7' },
      { mode: 'shell', minMidi: 40, maxMidi: 80 },
      null,
    )
    // Dm7 shell: D(2) + F(5) + C(0); no 5th (9).
    expect(chordPcSet(v)).toEqual(new Set([2, 5, 0]))
    for (const n of v) {
      expect(n).toBeGreaterThanOrEqual(40)
      expect(n).toBeLessThanOrEqual(80)
    }
  })
})

describe('bass mode does not collapse to duplicate ceiling notes (D2)', () => {
  it('re-spreads upper voices near maxMidi instead of stacking duplicates', () => {
    // Previously produced [65,67,74,80,80,80] — three lost voices at the top.
    const v = voiceChord(
      { root: 5, family: 'maj9' },
      { mode: 'bass', center: 76, maxMidi: 80 },
      null,
    )
    expect(v).toEqual([65, 72, 76, 79, 80])
    expect(new Set(v).size).toBe(v.length) // all voices distinct
    for (const n of v) expect(n).toBeLessThanOrEqual(80)
  })
})
