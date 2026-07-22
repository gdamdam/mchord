import { describe, it, expect } from 'vitest'
import { CHORD_FAMILIES, MODES, SLOT_COUNT } from '../types'
import {
  GENRES,
  GENRE_LABELS,
  PROGRESSION_LIBRARY,
  instantiateProgression,
  type ProgressionPreset,
} from './progressions'

const families = new Set<string>(CHORD_FAMILIES)
const modes = new Set<string>(MODES)

describe('progression library', () => {
  it('has a label for every genre', () => {
    for (const g of GENRES) expect(GENRE_LABELS[g]).toBeTruthy()
  })

  it('has 5–30 progressions per genre', () => {
    // Variable per genre: idiom-rich genres (jazz/gospel) carry more; vamp-based
    // genres fewer. Bounds keep every genre useful without unbounded bloat.
    for (const g of GENRES) {
      expect(PROGRESSION_LIBRARY[g].length, `${g}: count`).toBeGreaterThanOrEqual(5)
      expect(PROGRESSION_LIBRARY[g].length, `${g}: count`).toBeLessThanOrEqual(30)
    }
  })

  it('preset names are unique within each genre', () => {
    for (const g of GENRES) {
      const names = PROGRESSION_LIBRARY[g].map((p) => p.name)
      expect(new Set(names).size, `${g}: duplicate name`).toBe(names.length)
    }
  })

  it('includes the jazz/pop/cinematic/gospel banks', () => {
    for (const g of ['jazz', 'pop', 'cinematic', 'gospel'] as const) {
      expect(GENRES).toContain(g)
      expect(GENRE_LABELS[g], `${g}: label`).toBeTruthy()
      expect(PROGRESSION_LIBRARY[g].length, `${g}: count`).toBeGreaterThanOrEqual(5)
    }
  })

  it('every progression is well-formed (valid families, offsets, modes, length)', () => {
    for (const g of GENRES) {
      for (const p of PROGRESSION_LIBRARY[g]) {
        expect(p.name.trim().length, `${g}: name`).toBeGreaterThan(0)
        if (p.mode !== undefined) expect(modes.has(p.mode), `${g}: mode ${p.mode}`).toBe(true)
        expect(p.chords.length, `${g} "${p.name}": chord count`).toBeGreaterThanOrEqual(1)
        expect(p.chords.length, `${g} "${p.name}": chord count`).toBeLessThanOrEqual(SLOT_COUNT)
        for (const c of p.chords) {
          if (c === null) continue
          expect(families.has(c.family), `${g} "${p.name}": family ${c.family}`).toBe(true)
          expect(Number.isInteger(c.offset), `${g} "${p.name}": offset int`).toBe(true)
          expect(c.offset, `${g} "${p.name}": offset range`).toBeGreaterThanOrEqual(0)
          expect(c.offset, `${g} "${p.name}": offset range`).toBeLessThanOrEqual(11)
        }
      }
    }
  })
})

describe('instantiateProgression', () => {
  it('transposes offsets above the key root, wrapping mod 12, keeping rests', () => {
    const preset: ProgressionPreset = {
      name: 'test',
      chords: [{ offset: 0, family: 'min' }, { offset: 8, family: 'maj' }, null],
    }
    expect(instantiateProgression(preset, 2)).toEqual([
      { root: 2, family: 'min' },
      { root: 10, family: 'maj' },
      null,
    ])
    // wrap-around: root 7 + offset 8 = 15 → 3
    expect(instantiateProgression({ name: 'w', chords: [{ offset: 8, family: 'maj' }] }, 7)).toEqual([
      { root: 3, family: 'maj' },
    ])
  })
})
