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

  it('coalesces a slider drag into one undo step via the transient flag', () => {
    const s0 = createInitialState()
    // First change of a drag checkpoints normally.
    const s1 = sceneReducer(s0, { type: 'setMacro', macro: 'tension', value: 0.5 })
    expect(s1.past).toHaveLength(1)
    // Subsequent mid-drag increments are transient: scene updates, no new checkpoint.
    const s2 = sceneReducer(s1, { type: 'setMacro', macro: 'tension', value: 0.6, transient: true })
    const s3 = sceneReducer(s2, { type: 'setMacro', macro: 'tension', value: 0.7, transient: true })
    expect(s3.scene.macros.tension).toBeCloseTo(0.7)
    expect(s3.past).toHaveLength(1)
    // A single undo restores the pre-drag value.
    expect(sceneReducer(s3, { type: 'undo' }).scene.macros.tension).toBe(s0.scene.macros.tension)
  })

  it('transient changes still clear the redo stack', () => {
    const s = run(createInitialState(), { type: 'setBpm', bpm: 120 }, { type: 'setBpm', bpm: 140 })
    const u = sceneReducer(s, { type: 'undo' })
    expect(u.future).toHaveLength(1)
    const t = sceneReducer(u, { type: 'setBpm', bpm: 150, transient: true })
    expect(t.scene.bpm).toBe(150)
    expect(t.future).toHaveLength(0)
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

  it('shiftOctave accumulates, clamps to [-2, 2], and is undoable', () => {
    const s = createInitialState()
    const up = run(s, { type: 'shiftOctave', delta: 1 }, { type: 'shiftOctave', delta: 1 })
    expect(up.scene.octaveShift).toBe(2)
    // Clamp at the ceiling — a further +1 stays at 2.
    expect(sceneReducer(up, { type: 'shiftOctave', delta: 1 }).scene.octaveShift).toBe(2)
    const down = run(s, { type: 'shiftOctave', delta: -1 }, { type: 'shiftOctave', delta: -1 }, { type: 'shiftOctave', delta: -1 })
    expect(down.scene.octaveShift).toBe(-2)
    // Undoable: one step back from +2 returns to +1.
    expect(sceneReducer(up, { type: 'undo' }).scene.octaveShift).toBe(1)
  })

  it('loadProgression fills slots, sizes the loop, sets mode, and is undoable', () => {
    const s = createInitialState()
    const chords = [
      { root: 0, family: 'min' as const },
      null,
      { root: 5, family: 'maj7' as const },
    ]
    const a = sceneReducer(s, { type: 'loadProgression', chords, mode: 'dorian' })
    expect(a.scene.slots).toHaveLength(SLOT_COUNT)
    expect(a.scene.slots[0].chord).toEqual({ root: 0, family: 'min' })
    expect(a.scene.slots[1].chord).toBeNull()
    expect(a.scene.slots[2].chord).toEqual({ root: 5, family: 'maj7' })
    expect(a.scene.slots[3].chord).toBeNull() // padded to SLOT_COUNT
    expect(a.scene.loopLength).toBe(3)
    expect(a.scene.mode).toBe('dorian')
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

  it('ignores out-of-range slot indices without pushing a spurious checkpoint (F5)', () => {
    const s0 = createInitialState()
    const badActions: Action[] = [
      { type: 'setSlotChord', index: 99, chord: null },
      { type: 'setSlotChord', index: -1, chord: null },
      { type: 'setSlotDuration', index: SLOT_COUNT, duration: 2 },
      { type: 'clearSlot', index: 999 },
    ]
    for (const a of badActions) {
      const s1 = sceneReducer(s0, a)
      // Same reference: the `nextScene === state.scene` guard suppresses history.
      expect(s1).toBe(s0)
      expect(s1.past).toHaveLength(0)
    }
  })
})
