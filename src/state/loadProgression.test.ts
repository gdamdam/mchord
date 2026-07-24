/**
 * Phase-3 wiring + backward-compatibility: loadProgression must honour per-event
 * durations (the catalog can hold a chord longer) while callers that omit them
 * keep the historical 1-bar behaviour, and the new durations must survive a
 * share-link round trip exactly like any other scene data.
 */
import { describe, it, expect } from 'vitest'
import { createInitialState, sceneReducer } from './sceneReducer'
import { entryToLoad, resolveById } from '../harmony'
import { encodeScene, decodeScene } from '../sharing/codec'

describe('loadProgression: per-event durations', () => {
  it('honours supplied durations and pads the rest to 1 bar', () => {
    const start = createInitialState()
    const next = sceneReducer(start, {
      type: 'loadProgression',
      chords: [{ root: 0, family: 'min9' }, { root: 5, family: 'dom9' }],
      durations: [2, 1],
      mode: 'dorian',
    })
    expect(next.scene.slots[0]).toEqual({ chord: { root: 0, family: 'min9' }, durationBars: 2 })
    expect(next.scene.slots[1]).toEqual({ chord: { root: 5, family: 'dom9' }, durationBars: 1 })
    expect(next.scene.slots[2].durationBars).toBe(1) // padded slot
    expect(next.scene.mode).toBe('dorian')
    expect(next.scene.loopLength).toBe(2)
  })

  it('is backward-compatible: omitting durations yields all 1-bar slots', () => {
    const start = createInitialState()
    const next = sceneReducer(start, {
      type: 'loadProgression',
      chords: [{ root: 0, family: 'maj7' }, { root: 7, family: 'dom7' }],
    })
    expect(next.scene.slots.map((s) => s.durationBars)).toEqual([1, 1, 1, 1, 1, 1, 1, 1])
  })

  it('loads a catalog entry with its durations intact', () => {
    const entry = resolveById('long-short-vamp')!
    const load = entryToLoad(entry, 0)
    const next = sceneReducer(createInitialState(), {
      type: 'loadProgression',
      chords: load.chords,
      durations: load.durations,
      mode: load.mode,
    })
    expect(next.scene.slots.slice(0, 3).map((s) => s.durationBars)).toEqual([2, 1, 1])
  })
})

describe('loadProgression: share-link round trip preserves durations', () => {
  it('encodes and decodes varied durations byte-stably', () => {
    const start = createInitialState()
    const loaded = sceneReducer(start, {
      type: 'loadProgression',
      chords: [{ root: 2, family: 'min9' }, { root: 7, family: 'dom9' }, { root: 0, family: 'maj9' }],
      durations: [4, 0.5, 2],
      mode: 'major',
    }).scene

    const round = decodeScene(encodeScene(loaded))
    expect(round).not.toBeNull()
    expect(round!.slots.map((s) => s.durationBars)).toEqual(loaded.slots.map((s) => s.durationBars))
    expect(round!.slots.map((s) => s.chord)).toEqual(loaded.slots.map((s) => s.chord))
  })
})
