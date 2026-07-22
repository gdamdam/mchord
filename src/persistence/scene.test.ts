import { describe, it, expect } from 'vitest'
import {
  CHORD_FAMILIES,
  DIRECTIONS,
  MODES,
  OCTAVE_SHIFT_MIN,
  OCTAVE_SHIFT_MAX,
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
  expect(s.octaveShift).toBeGreaterThanOrEqual(OCTAVE_SHIFT_MIN)
  expect(s.octaveShift).toBeLessThanOrEqual(OCTAVE_SHIFT_MAX)
  expect(Number.isInteger(s.octaveShift)).toBe(true)
  expect(typeof s.tuning.name).toBe('string')
  expect(s.tuning.centsOffset).toHaveLength(12)
  expect(s.tuning.centsOffset.every((c) => Number.isFinite(c))).toBe(true)
  expect(s.slots).toHaveLength(SLOT_COUNT)
  expect(s.loopLength).toBeGreaterThanOrEqual(1)
  expect(s.loopLength).toBeLessThanOrEqual(SLOT_COUNT)
  expect(Number.isInteger(s.loopLength)).toBe(true)
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

  it('clamps loopLength to [1, SLOT_COUNT] and defaults when missing', () => {
    expect(sanitizeScene({ loopLength: 99 }).loopLength).toBe(SLOT_COUNT)
    expect(sanitizeScene({ loopLength: 0 }).loopLength).toBe(1)
    expect(sanitizeScene({ loopLength: -5 }).loopLength).toBe(1)
    expect(sanitizeScene({ loopLength: 3 }).loopLength).toBe(3)
    expect(sanitizeScene({}).loopLength).toBe(createDefaultScene().loopLength)
  })

  it('defaults a missing/invalid tuning to 12-TET (all-zero)', () => {
    expect(sanitizeScene({}).tuning.centsOffset).toEqual(new Array(12).fill(0))
    expect(sanitizeScene({ tuning: 'nope' }).tuning.centsOffset).toEqual(new Array(12).fill(0))
    // Wrong length is out of scope (12 pitch classes only) -> 12-TET fallback.
    expect(sanitizeScene({ tuning: { centsOffset: [1, 2, 3] } }).tuning.centsOffset).toEqual(
      new Array(12).fill(0),
    )
  })

  it('accepts a valid 12-entry tuning, clamping wild cents and defaulting the name', () => {
    const co = [0, 10, -5, 3, 2000, -3000, 6, 7, 8, 9, 10, 11]
    const out = sanitizeScene({ tuning: { name: 'Custom', centsOffset: co } })
    expect(out.tuning.name).toBe('Custom')
    expect(out.tuning.centsOffset[4]).toBe(1200) // clamped to +1 octave
    expect(out.tuning.centsOffset[5]).toBe(-1200) // clamped to -1 octave
    expect(out.tuning.centsOffset[1]).toBe(10)
    // Blank name falls back to the 12-TET label.
    const noName = sanitizeScene({ tuning: { name: '  ', centsOffset: new Array(12).fill(0) } })
    expect(noName.tuning.name).toBe('Equal (12-TET)')
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
    const out = migrateScene(v0)!
    expect(out.version).toBe(SCENE_VERSION)
    expect(out.keyRoot).toBe(7)
    expect(out.mode).toBe('dorian')
    expect(out.bpm).toBe(128)
    expectValidScene(out)
  })

  it('migrates a v1 scene (no loopLength) to the full 8-slot loop', () => {
    const out = migrateScene({ version: 1, bpm: 110 })!
    expect(out.version).toBe(SCENE_VERSION)
    expect(out.loopLength).toBe(SLOT_COUNT)
  })

  it('migrates a v2 scene (no octaveShift) to a zero shift', () => {
    const out = migrateScene({ version: 2, bpm: 110 })!
    expect(out.version).toBe(SCENE_VERSION)
    expect(out.octaveShift).toBe(0)
  })

  it('migrates a v3 scene (no tuning) to 12-TET, byte-identical pitch', () => {
    const out = migrateScene({ version: 3, bpm: 110 })!
    expect(out.version).toBe(SCENE_VERSION)
    expect(out.tuning.centsOffset).toEqual(new Array(12).fill(0))
  })

  it('migrates an explicit version 0', () => {
    const out = migrateScene({ version: 0, bpm: 90 })!
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
      const out = migrateScene(bad)
      expect(out).not.toBeNull()
      expectValidScene(out as SceneState)
    }
  })

  it('refuses to migrate a future-version scene (returns null, not a lossy downgrade)', () => {
    expect(migrateScene({ version: SCENE_VERSION + 1, bpm: 120 })).toBeNull()
    expect(migrateScene({ version: 999 })).toBeNull()
    // The current version must still migrate normally.
    expect(migrateScene({ version: SCENE_VERSION })).not.toBeNull()
  })
})

describe('sanitizeScene — tuning anchor', () => {
  const zeros = () => new Array(12).fill(0)

  it('defaults a missing anchor to Fixed C (pre-anchor scenes stay C-anchored)', () => {
    const out = sanitizeScene({ tuning: { name: 'JI', centsOffset: new Array(12).fill(5) } })
    expect(out.tuning.anchor).toEqual({ mode: 'fixed', pc: 0 })
    expect(out.tuning.centsOffset).toEqual(new Array(12).fill(5))
  })

  it('preserves follow-key and fixed anchors', () => {
    const key = sanitizeScene({ tuning: { name: 'x', centsOffset: zeros(), anchor: { mode: 'key' } } })
    expect(key.tuning.anchor).toEqual({ mode: 'key' })
    const fixed = sanitizeScene({
      tuning: { name: 'x', centsOffset: zeros(), anchor: { mode: 'fixed', pc: 9 } },
    })
    expect(fixed.tuning.anchor).toEqual({ mode: 'fixed', pc: 9 })
  })

  it('clamps a malformed fixed pc and rejects garbage anchors to Fixed C', () => {
    const anchorOf = (anchor: unknown) =>
      sanitizeScene({ tuning: { name: 'x', centsOffset: zeros(), anchor } }).tuning.anchor
    expect(anchorOf({ mode: 'fixed', pc: 99 })).toEqual({ mode: 'fixed', pc: 11 })
    expect(anchorOf({ mode: 'fixed', pc: -5 })).toEqual({ mode: 'fixed', pc: 0 })
    expect(anchorOf({ mode: 'fixed', pc: 'D' })).toEqual({ mode: 'fixed', pc: 0 })
    expect(anchorOf({ mode: 'sideways' })).toEqual({ mode: 'fixed', pc: 0 })
    expect(anchorOf('nope')).toEqual({ mode: 'fixed', pc: 0 })
    expect(anchorOf(null)).toEqual({ mode: 'fixed', pc: 0 })
  })

  it('newly created scenes follow the key', () => {
    expect(createDefaultScene().tuning.anchor).toEqual({ mode: 'key' })
  })

  it('clamps an over-long tuning name from an untrusted share URL', () => {
    // A multi-MB name could exhaust localStorage quota once autosaved.
    const huge = 'x'.repeat(100_000)
    const out = sanitizeScene({ tuning: { name: huge, centsOffset: zeros() } })
    expect(out.tuning.name.length).toBeLessThanOrEqual(100)
  })

  it('migrates a v4 scene (tuning without anchor) to Fixed C — unchanged sound', () => {
    const co = new Array(12).fill(7)
    const out = migrateScene({ version: 4, tuning: { name: 'JI', centsOffset: co } })!
    expect(out.version).toBe(SCENE_VERSION)
    expect(out.tuning.anchor).toEqual({ mode: 'fixed', pc: 0 })
    expect(out.tuning.centsOffset).toEqual(co)
  })
})
