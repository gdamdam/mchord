import { describe, it, expect } from 'vitest'
import {
  sceneReducer,
  createInitialState,
  nextSeed,
  MAX_HISTORY,
  type AppState,
  type Action,
} from './sceneReducer'
import { SLOT_COUNT } from '../types'

const run = (state: AppState, ...actions: Action[]): AppState =>
  actions.reduce((s, a) => sceneReducer(s, a), state)

describe('sceneReducer', () => {
  it('starts with a valid default scene, no history', () => {
    const s = createInitialState()
    expect(s.scene.slots).toHaveLength(SLOT_COUNT)
    expect(s.past).toHaveLength(0)
    expect(s.future).toHaveLength(0)
    expect(s.selectedSlot).toBe(0)
  })

  it('pushes an undo checkpoint on a scene mutation and clears redo', () => {
    const s0 = createInitialState()
    const s1 = sceneReducer(s0, { type: 'setBpm', bpm: 123 })
    expect(s1.scene.bpm).toBe(123)
    expect(s1.past).toHaveLength(1)
    expect(s1.future).toHaveLength(0)
  })

  it('undo and redo move through history', () => {
    const s = run(createInitialState(), { type: 'setBpm', bpm: 120 }, { type: 'setBpm', bpm: 140 })
    expect(s.scene.bpm).toBe(140)
    const u1 = sceneReducer(s, { type: 'undo' })
    expect(u1.scene.bpm).toBe(120)
    const u2 = sceneReducer(u1, { type: 'undo' })
    expect(u2.scene.bpm).not.toBe(120)
    const r1 = sceneReducer(u2, { type: 'redo' })
    expect(r1.scene.bpm).toBe(120)
  })

  it('undo/redo are no-ops at the ends of history', () => {
    const s0 = createInitialState()
    expect(sceneReducer(s0, { type: 'undo' })).toBe(s0)
    expect(sceneReducer(s0, { type: 'redo' })).toBe(s0)
  })

  it('bounds history to MAX_HISTORY', () => {
    let s = createInitialState()
    for (let i = 0; i < MAX_HISTORY + 20; i++) {
      s = sceneReducer(s, { type: 'setBpm', bpm: 60 + (i % 100) })
    }
    expect(s.past.length).toBeLessThanOrEqual(MAX_HISTORY)
  })

  it('clamps bpm, swing, and macros', () => {
    const s = createInitialState()
    expect(sceneReducer(s, { type: 'setBpm', bpm: 9999 }).scene.bpm).toBe(240)
    expect(sceneReducer(s, { type: 'setBpm', bpm: 1 }).scene.bpm).toBe(40)
    expect(sceneReducer(s, { type: 'setSwing', swing: 5 }).scene.swing).toBe(1)
    expect(sceneReducer(s, { type: 'setMacro', macro: 'tension', value: -1 }).scene.macros.tension).toBe(0)
  })

  it('setLoopLength clamps to [1, SLOT_COUNT] and is undoable', () => {
    const s = createInitialState()
    expect(sceneReducer(s, { type: 'setLoopLength', length: 99 }).scene.loopLength).toBe(SLOT_COUNT)
    expect(sceneReducer(s, { type: 'setLoopLength', length: 0 }).scene.loopLength).toBe(1)
    const a = sceneReducer(s, { type: 'setLoopLength', length: 3 })
    expect(a.scene.loopLength).toBe(3)
    expect(a.past).toHaveLength(1)
    expect(sceneReducer(a, { type: 'undo' }).scene.loopLength).toBe(s.scene.loopLength)
  })

  it('transposes the harmonic intent when the key root changes', () => {
    const s0 = createInitialState()
    const origRoots = s0.scene.slots.map((slot) => slot.chord?.root ?? null)
    const newRoot = (s0.scene.keyRoot + 5) % 12
    const s1 = sceneReducer(s0, { type: 'setKey', root: newRoot })
    const delta = ((newRoot - s0.scene.keyRoot) % 12 + 12) % 12
    s1.scene.slots.forEach((slot, i) => {
      const orig = origRoots[i]
      if (orig === null) {
        expect(slot.chord).toBeNull()
      } else {
        expect(slot.chord?.root).toBe((orig + delta) % 12)
      }
    })
    expect(s1.scene.keyRoot).toBe(newRoot)
  })

  it('generates reproducibly for a fixed seed', () => {
    const s = createInitialState()
    const a = sceneReducer(s, { type: 'generate', seed: 4242 })
    const b = sceneReducer(s, { type: 'generate', seed: 4242 })
    expect(a.scene.slots).toEqual(b.scene.slots)
    expect(a.scene.seed).toBe(4242)
    expect(a.scene.slots).toHaveLength(SLOT_COUNT)
  })

  it('varies reproducibly for a fixed seed', () => {
    const s = createInitialState()
    const a = sceneReducer(s, { type: 'vary', seed: 77 })
    const b = sceneReducer(s, { type: 'vary', seed: 77 })
    expect(a.scene.slots).toEqual(b.scene.slots)
  })

  it('loadScene replaces the scene and resets history', () => {
    const s = run(createInitialState(), { type: 'setBpm', bpm: 111 }, { type: 'setBpm', bpm: 112 })
    const replacement = { ...createInitialState().scene, bpm: 95 }
    const loaded = sceneReducer(s, { type: 'loadScene', scene: replacement })
    expect(loaded.scene.bpm).toBe(95)
    expect(loaded.past).toHaveLength(0)
    expect(loaded.future).toHaveLength(0)
  })

  it('moveSelection wraps around the slot grid', () => {
    const s = createInitialState()
    expect(sceneReducer(s, { type: 'moveSelection', delta: -1 }).selectedSlot).toBe(SLOT_COUNT - 1)
    expect(sceneReducer({ ...s, selectedSlot: SLOT_COUNT - 1 }, { type: 'moveSelection', delta: 1 }).selectedSlot).toBe(0)
  })

  it('nextSeed is deterministic and stays in uint32 range', () => {
    expect(nextSeed(1)).toBe(nextSeed(1))
    expect(nextSeed(1)).toBeGreaterThanOrEqual(0)
    expect(nextSeed(1)).toBeLessThan(2 ** 32)
  })
})
