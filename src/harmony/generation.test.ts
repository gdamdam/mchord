import { describe, it, expect } from 'vitest'
import { SLOT_COUNT, SLOT_DURATIONS } from '../types'
import type { Slot } from '../types'
import { makeRng, generateProgression, varyProgression } from './generation'
import { scalePitchClasses } from './scales'

describe('makeRng (mulberry32)', () => {
  it('is deterministic for a seed', () => {
    const a = makeRng(123)
    const b = makeRng(123)
    for (let i = 0; i < 100; i++) expect(a()).toBe(b())
  })

  it('produces values in [0,1)', () => {
    const r = makeRng(42)
    for (let i = 0; i < 1000; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('different seeds diverge', () => {
    const a = makeRng(1)
    const b = makeRng(2)
    expect(a()).not.toBe(b())
  })
})

describe('generateProgression', () => {
  it('returns exactly SLOT_COUNT slots', () => {
    const slots = generateProgression({ keyRoot: 0, mode: 'major', seed: 7 })
    expect(slots).toHaveLength(SLOT_COUNT)
  })

  it('every chord is diatonic to the key', () => {
    const slots = generateProgression({ keyRoot: 5, mode: 'major', seed: 99 })
    const pcs = new Set(scalePitchClasses(5, 'major'))
    for (const s of slots) {
      if (s.chord) expect(pcs.has(s.chord.root)).toBe(true)
    }
  })

  it('starts on the tonic', () => {
    const slots = generateProgression({ keyRoot: 7, mode: 'major', seed: 3 })
    expect(slots[0].chord?.root).toBe(7)
  })

  it('all durations are valid SlotDurations', () => {
    const slots = generateProgression({ keyRoot: 0, mode: 'dorian', seed: 555 })
    for (const s of slots) {
      expect((SLOT_DURATIONS as readonly number[]).includes(s.durationBars)).toBe(
        true,
      )
    }
  })

  it('is reproducible (same seed → identical)', () => {
    const a = generateProgression({ keyRoot: 2, mode: 'natural-minor', seed: 2024 })
    const b = generateProgression({ keyRoot: 2, mode: 'natural-minor', seed: 2024 })
    expect(a).toEqual(b)
  })

  it('different seeds usually differ', () => {
    const a = generateProgression({ keyRoot: 0, mode: 'major', seed: 1 })
    const b = generateProgression({ keyRoot: 0, mode: 'major', seed: 12345 })
    const sameDegrees =
      JSON.stringify(a.map((s) => s.chord?.root)) ===
      JSON.stringify(b.map((s) => s.chord?.root))
    expect(sameDegrees).toBe(false)
  })

  it('respects length but still fills SLOT_COUNT', () => {
    const slots = generateProgression({
      keyRoot: 0,
      mode: 'major',
      seed: 9,
      length: 4,
    })
    expect(slots).toHaveLength(SLOT_COUNT)
    for (const s of slots) expect(s.chord).not.toBeNull()
  })
})

describe('varyProgression', () => {
  it('is reproducible for same inputs', () => {
    const base = generateProgression({ keyRoot: 0, mode: 'major', seed: 50 })
    const a = varyProgression(base, { keyRoot: 0, mode: 'major', seed: 50 })
    const b = varyProgression(base, { keyRoot: 0, mode: 'major', seed: 50 })
    expect(a).toEqual(b)
  })

  it('preserves the tonic anchor (first slot)', () => {
    const base = generateProgression({ keyRoot: 0, mode: 'major', seed: 77 })
    const v = varyProgression(base, { keyRoot: 0, mode: 'major', seed: 77 })
    expect(v[0].chord).toEqual(base[0].chord)
  })

  it('preserves the final cadence chord', () => {
    const base = generateProgression({ keyRoot: 0, mode: 'major', seed: 77 })
    const v = varyProgression(base, { keyRoot: 0, mode: 'major', seed: 77 })
    // find last non-null in both
    const last = (s: typeof base) => {
      for (let i = s.length - 1; i >= 0; i--) if (s[i].chord) return s[i].chord
      return null
    }
    expect(last(v)).toEqual(last(base))
  })

  it('keeps all chords diatonic after variation', () => {
    const base = generateProgression({ keyRoot: 7, mode: 'major', seed: 31 })
    const v = varyProgression(base, { keyRoot: 7, mode: 'major', seed: 31 })
    const pcs = new Set(scalePitchClasses(7, 'major'))
    for (const s of v) if (s.chord) expect(pcs.has(s.chord.root)).toBe(true)
  })

  it('returns same number of slots', () => {
    const base = generateProgression({ keyRoot: 0, mode: 'major', seed: 5 })
    const v = varyProgression(base, { keyRoot: 0, mode: 'major', seed: 5 })
    expect(v).toHaveLength(base.length)
  })

  it('leaves a borrowed chord sharing a diatonic root alone (D3)', () => {
    // D7 (V7/V in C) shares the ii root (D) but is NOT diatonic ii, so it must
    // never be substituted for F major as if it were degree 1.
    const slots: Slot[] = [
      { chord: { root: 0, family: 'maj' }, durationBars: 1 },
      { chord: { root: 2, family: 'dom7' }, durationBars: 1 }, // V7/V
      { chord: { root: 9, family: 'min' }, durationBars: 1 },
      { chord: { root: 5, family: 'maj' }, durationBars: 1 },
      { chord: { root: 7, family: 'maj' }, durationBars: 1 },
      { chord: { root: 0, family: 'maj' }, durationBars: 1 },
    ]
    const out = varyProgression(slots, { keyRoot: 0, mode: 'major', seed: 0 })
    expect(out[1].chord).toEqual({ root: 2, family: 'dom7' })
  })
})

describe('generateProgression always starts on the tonic (D5)', () => {
  it('length 2 keeps degrees[0] on the tonic (cadence fixup must not clobber it)', () => {
    // Previously the penultimate-chord fixup overwrote index 0, so a length-2
    // progression started on V (root 7 in C) instead of the tonic.
    const slots = generateProgression({ keyRoot: 0, mode: 'major', seed: 0, length: 2 })
    expect(slots[0].chord?.root).toBe(0)
  })
})
