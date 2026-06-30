import { describe, it, expect, beforeEach } from 'vitest'
import { SCENE_VERSION, type SceneState } from '../types'
import { createDefaultScene } from './defaults'
import {
  listScenes,
  saveScene,
  loadScene,
  deleteScene,
  exportSceneJSON,
  importSceneJSON,
} from './storage'

// ---------------------------------------------------------------------------
// In-memory localStorage stub. The vitest environment is 'node', so there is
// no localStorage; install a minimal Storage-compatible shim on globalThis.
// ---------------------------------------------------------------------------
class MemoryStorage {
  private map = new Map<string, string>()
  get length(): number {
    return this.map.size
  }
  clear(): void {
    this.map.clear()
  }
  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value))
  }
  removeItem(key: string): void {
    this.map.delete(key)
  }
  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null
  }
  /** Direct write for corruption tests. */
  __setRaw(key: string, value: string): void {
    this.map.set(key, value)
  }
}

const STORAGE_KEY = 'mchord:scenes:v1'

beforeEach(() => {
  const mem = new MemoryStorage()
  ;(globalThis as { localStorage: Storage }).localStorage = mem as unknown as Storage
})

describe('storage round trip', () => {
  it('save → list → load → delete', () => {
    expect(listScenes()).toEqual([])

    const scene = createDefaultScene()
    saveScene('My Scene', scene)

    const list = listScenes()
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('My Scene')
    expect(list[0].scene).toEqual(scene)
    expect(typeof list[0].savedAt).toBe('number')

    const loaded = loadScene('My Scene')
    expect(loaded).toEqual(scene)

    deleteScene('My Scene')
    expect(listScenes()).toEqual([])
    expect(loadScene('My Scene')).toBeNull()
  })

  it('overwrites a scene saved under the same name', () => {
    saveScene('S', createDefaultScene())
    const edited: SceneState = { ...createDefaultScene(), bpm: 140 }
    saveScene('S', edited)
    const list = listScenes()
    expect(list).toHaveLength(1)
    expect(list[0].scene.bpm).toBe(140)
  })

  it('trims names and ignores blank names', () => {
    saveScene('  Padded  ', createDefaultScene())
    saveScene('   ', createDefaultScene())
    const list = listScenes()
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('Padded')
  })

  it('sorts newest first', () => {
    saveScene('a', { ...createDefaultScene(), bpm: 100 })
    // force distinct timestamps
    const list1 = listScenes()
    saveScene('b', { ...createDefaultScene(), bpm: 110 })
    const list = listScenes()
    expect(list.map((e) => e.name)).toContain('a')
    expect(list.map((e) => e.name)).toContain('b')
    expect(list[0].savedAt).toBeGreaterThanOrEqual(list[list.length - 1].savedAt)
    expect(list1).toHaveLength(1)
  })

  it('sanitises a scene on save', () => {
    // Cast a deliberately-invalid object through to exercise the sanitise path.
    saveScene('bad', { bpm: 9999 } as unknown as SceneState)
    const loaded = loadScene('bad')
    expect(loaded).not.toBeNull()
    expect(loaded?.bpm).toBe(240)
    expect(loaded?.version).toBe(SCENE_VERSION)
  })

  it('skips corrupt entries without throwing', () => {
    saveScene('good', createDefaultScene())
    // Inject a corrupt array of entries directly.
    const mem = globalThis.localStorage as unknown as MemoryStorage
    const valid = JSON.parse(mem.getItem(STORAGE_KEY) as string)
    const corrupted = [
      'not-an-object',
      { name: '', scene: {} }, // empty name -> skipped
      { noName: true },
      ...valid,
    ]
    mem.__setRaw(STORAGE_KEY, JSON.stringify(corrupted))
    const list = listScenes()
    expect(list).toHaveLength(1)
    expect(list[0].name).toBe('good')
  })

  it('returns [] when the stored blob is not valid JSON', () => {
    const mem = globalThis.localStorage as unknown as MemoryStorage
    mem.__setRaw(STORAGE_KEY, '{not json')
    expect(listScenes()).toEqual([])
  })

  it('salvages an entry whose scene is corrupt rather than dropping it', () => {
    const mem = globalThis.localStorage as unknown as MemoryStorage
    mem.__setRaw(
      STORAGE_KEY,
      JSON.stringify([{ name: 'salvage', scene: { bpm: 'garbage' }, savedAt: 5 }]),
    )
    const loaded = loadScene('salvage')
    expect(loaded).not.toBeNull()
    expect(loaded?.version).toBe(SCENE_VERSION)
  })
})

describe('storage without localStorage (degrades gracefully)', () => {
  it('no-ops and returns empty/null when localStorage is absent', () => {
    // Remove the stub entirely to simulate a node env without any shim.
    delete (globalThis as { localStorage?: Storage }).localStorage
    expect(() => saveScene('x', createDefaultScene())).not.toThrow()
    expect(listScenes()).toEqual([])
    expect(loadScene('x')).toBeNull()
    expect(() => deleteScene('x')).not.toThrow()
  })
})

describe('JSON export / import', () => {
  it('is pretty (multi-line) and round-trips', () => {
    const scene = createDefaultScene()
    const json = exportSceneJSON(scene)
    expect(json).toContain('\n')
    expect(json).toContain('  ') // indented
    const back = importSceneJSON(json)
    expect(back).toEqual(scene)
  })

  it('returns null on malformed JSON', () => {
    expect(importSceneJSON('{ not valid')).toBeNull()
    expect(importSceneJSON('')).toBeNull()
  })

  it('salvages structurally-valid-but-invalid JSON into a valid scene', () => {
    const back = importSceneJSON(JSON.stringify({ bpm: 99999, mode: 'bogus' }))
    expect(back).not.toBeNull()
    expect(back?.bpm).toBe(240)
    expect(back?.version).toBe(SCENE_VERSION)
  })

  it('migrates an exported legacy (unversioned) JSON', () => {
    const back = importSceneJSON(JSON.stringify({ keyRoot: 5, bpm: 120 }))
    expect(back?.version).toBe(SCENE_VERSION)
    expect(back?.keyRoot).toBe(5)
  })
})
