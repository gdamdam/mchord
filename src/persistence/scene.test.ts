import { describe, it, expect } from 'vitest'
import {
  CHORD_FAMILIES,
  DIRECTIONS,
  MODES,
  PRESET_IDS,
  RHYTHM_STYLES,
  SCENE_VERSION,
  SLOT_COUNT,
  SLOT_DURATIONS,
  VOICING_MODES,
  type SceneState,
} from '../types'
import { createDefaultScene } from './defaults'
import { sanitizeScene, migrateScene } from './scene'

/** Assert an object is a fully-valid SceneState. */
function expectValidScene(s: SceneState): void {
  expect(s.version).toBe(SCENE_VERSION)
  expect(s.keyRoot).toBeGreaterThanOrEqual(0)
  expect(s.keyRoot).toBeLessThanOrEqual(11)
  expect(Number.isInteger(s.keyRoot)).toBe(true)
  expect(MODES).toContain(s.mode)
  expect(VOICING_MODES).toContain(s.voicingMode)
  expect(DIRECTIONS).toContain(s.direction)
  expect(RHYTHM_STYLES).toContain(s.rhythm)
  expect(PRESET_IDS).toContain(s.preset)
  expect(s.bpm).toBeGreaterThanOrEqual(40)
  expect(s.bpm).toBeLessThanOrEqual(240)
  expect(s.swing).toBeGreaterThanOrEqual(0)
  expect(s.swing).toBeLessThanOrEqual(1)
  for (const k of ['tension', 'spread', 'motion', 'color'] as const) {
    expect(s.macros[k]).toBeGreaterThanOrEqual(0)
    expect(s.macros[k]).toBeLessThanOrEqual(1)
  }
  expect(Number.isFinite(s.seed)).toBe(true)
  expect(s.slots).toHaveLength(SLOT_COUNT)
  for (const slot of s.slots) {
    expect(SLOT_DURATIONS).toContain(slot.durationBars)
    if (slot.chord !== null) {
      expect(slot.chord.root).toBeGreaterThanOrEqual(0)
      expect(slot.chord.root).toBeLessThanOrEqual(11)
      expect(Number.isInteger(slot.chord.root)).toBe(true)
      expect(CHORD_FAMILIES).toContain(slot.chord.family)
    }
  }
}

describe('createDefaultScene', () => {
  it('produces a valid scene', () => {
    expectValidScene(createDefaultScene())
  })

  it('returns a fresh object each call (no shared mutable state)', () => {
    const a = createDefaultScene()
    const b = createDefaultScene()
    expect(a).not.toBe(b)
    expect(a.slots).not.toBe(b.slots)
    a.slots[0].chord = null
    expect(b.slots[0].chord).not.toBeNull()
  })

  it('has a I–V–vi–IV-ish 4-chord progression then empties', () => {
    const s = createDefaultScene()
    expect(s.slots.slice(0, 4).every((sl) => sl.chord !== null)).toBe(true)
    expect(s.slots.slice(4).every((sl) => sl.chord === null)).toBe(true)
  })
})

describe('sanitizeScene', () => {
  it('is identity-ish on a valid scene', () => {
    const input = createDefaultScene()
    const out = sanitizeScene(input)
    expectValidScene(out)
    expect(out).toEqual(input)
  })

  it('handles non-object input (null, number, string, array)', () => {
    for (const bad of [null, undefined, 42, 'nope', [], NaN]) {
      expectValidScene(sanitizeScene(bad))
    }
  })

  it('coerces wrong-typed fields', () => {
    const out = sanitizeScene({
      keyRoot: 'x',
      mode: 123,
      bpm: 'fast',
      swing: {},
      macros: 'no',
      slots: 'no',
      seed: 'no',
    })
    expectValidScene(out)
  })

  it('clamps out-of-range numbers', () => {
    const out = sanitizeScene({
      keyRoot: 99,
      bpm: 9999,
      swing: 5,
      macros: { tension: -2, spread: 9, motion: 1.5, color: -0.1 },
    })
    expect(out.keyRoot).toBe(11)
    expect(out.bpm).toBe(240)
    expect(out.swing).toBe(1)
    expect(out.macros.tension).toBe(0)
    expect(out.macros.spread).toBe(1)
    expect(out.macros.motion).toBe(1)
    expect(out.macros.color).toBe(0)
  })

  it('clamps low out-of-range bpm', () => {
    expect(sanitizeScene({ bpm: 1 }).bpm).toBe(40)
  })

  it('falls back on bad enums', () => {
    const out = sanitizeScene({
      mode: 'klingon',
      voicingMode: 'nope',
      direction: 'sideways',
      rhythm: 'jazz',
      preset: 'unknown',
    })
    expect(MODES).toContain(out.mode)
    expect(VOICING_MODES).toContain(out.voicingMode)
    expect(DIRECTIONS).toContain(out.direction)
    expect(RHYTHM_STYLES).toContain(out.rhythm)
    expect(PRESET_IDS).toContain(out.preset)
  })

  it('forces exactly SLOT_COUNT slots when too few', () => {
    const out = sanitizeScene({ slots: [{ chord: { root: 2, family: 'min7' }, durationBars: 2 }] })
    expect(out.slots).toHaveLength(SLOT_COUNT)
    expect(out.slots[0].chord).toEqual({ root: 2, family: 'min7' })
    expect(out.slots[0].durationBars).toBe(2)
    expect(out.slots[7].chord).toBeNull()
  })

  it('truncates when too many slots', () => {
    const many = Array.from({ length: 20 }, () => ({ chord: null, durationBars: 1 }))
    expect(sanitizeScene({ slots: many }).slots).toHaveLength(SLOT_COUNT)
  })

  it('drops invalid chord family to an empty slot but clamps a bad root', () => {
    const out = sanitizeScene({
      slots: [
        { chord: { root: 99, family: 'maj' }, durationBars: 1 }, // bad root -> clamp
        { chord: { root: 3, family: 'bogus' }, durationBars: 1 }, // bad family -> null
        { chord: { root: 3, family: 'maj' }, durationBars: 99 }, // bad duration -> 1
      ],
    })
    expect(out.slots[0].chord).toEqual({ root: 11, family: 'maj' })
    expect(out.slots[1].chord).toBeNull()
    expect(out.slots[2].durationBars).toBe(1)
  })

  it('tolerates extra/unknown fields', () => {
    const out = sanitizeScene({ ...createDefaultScene(), surprise: 'extra', nested: { a: 1 } })
    expectValidScene(out)
    expect('surprise' in out).toBe(false)
  })

  it('always stamps the current version', () => {
    expect(sanitizeScene({ version: 999 }).version).toBe(SCENE_VERSION)
  })
})

describe('migrateScene', () => {
  it('migrates a v0-shaped (unversioned) object forward and sanitises', () => {
    const v0 = {
      // no `version` field at all — the pre-versioned shape
      keyRoot: 7,
      mode: 'dorian',
      slots: [{ chord: { root: 7, family: 'min7' }, durationBars: 2 }],
      bpm: 128,
    }
    const out = migrateScene(v0)
    expect(out.version).toBe(SCENE_VERSION)
    expect(out.keyRoot).toBe(7)
    expect(out.mode).toBe('dorian')
    expect(out.bpm).toBe(128)
    expectValidScene(out)
  })

  it('migrates an explicit version 0', () => {
    const out = migrateScene({ version: 0, bpm: 90 })
    expect(out.version).toBe(SCENE_VERSION)
    expect(out.bpm).toBe(90)
  })

  it('passes a current-version scene through unchanged (sanitised)', () => {
    const cur = createDefaultScene()
    expect(migrateScene(cur)).toEqual(cur)
  })

  it('never throws on garbage', () => {
    for (const bad of [null, 5, 'x', [], { version: -3 }, { version: 'NaN' }]) {
      expect(() => migrateScene(bad)).not.toThrow()
      expectValidScene(migrateScene(bad))
    }
  })
})
