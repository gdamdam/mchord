import { describe, it, expect, vi } from 'vitest'
import { AudioEngine } from './AudioEngine'
import type { Voice } from './Voice'

/**
 * These tests exercise pure pool-accounting logic (allocateVoice + the noteOn
 * guards) with mocked voices and a mocked context. The vitest env is `node`,
 * so there is no real AudioContext — we inject the private fields directly
 * rather than calling start().
 */

type FakeVoice = {
  isActive: boolean
  midi: number | null
  level: number
  age: number
  fastStop: ReturnType<typeof vi.fn>
  noteOn: ReturnType<typeof vi.fn>
}

function fakeVoice(o: { isActive: boolean; midi: number | null; level: number; age: number }): FakeVoice {
  return { ...o, fastStop: vi.fn(), noteOn: vi.fn() }
}

type PrivateEngine = {
  ctx: unknown
  voices: unknown[]
  allocateVoice(midi: number): { voice: Voice; stole: boolean }
}

function engineWith(ctx: unknown, voices: FakeVoice[]): PrivateEngine {
  // Intersecting with AudioEngine collapses to `never` (ctx is private on the
  // real class), so expose only the private surface the tests poke.
  const e = new AudioEngine() as unknown as PrivateEngine
  e.ctx = ctx
  e.voices = voices
  return e
}

describe('AudioEngine voice stealing (allocateVoice)', () => {
  const runningCtx = { currentTime: 0, state: 'running' as const }

  it('prefers an idle voice without stealing', () => {
    const busy = fakeVoice({ isActive: true, midi: 60, level: 0.5, age: 2 })
    const idle = fakeVoice({ isActive: false, midi: null, level: 0, age: 1 })
    const e = engineWith(runningCtx, [busy, idle])
    const { voice, stole } = e.allocateVoice(64)
    expect(voice).toBe(idle as unknown as Voice)
    expect(stole).toBe(false)
    expect(idle.fastStop).not.toHaveBeenCalled()
  })

  it('steals the quietest releasing voice (midi === null) when none are idle', () => {
    const held = fakeVoice({ isActive: true, midi: 60, level: 0.1, age: 5 })
    const loudTail = fakeVoice({ isActive: true, midi: null, level: 0.4, age: 1 })
    const quietTail = fakeVoice({ isActive: true, midi: null, level: 0.05, age: 3 })
    const e = engineWith(runningCtx, [held, loudTail, quietTail])
    const { voice, stole } = e.allocateVoice(64)
    expect(voice).toBe(quietTail as unknown as Voice)
    expect(stole).toBe(true)
    expect(quietTail.fastStop).toHaveBeenCalledOnce()
    expect(loudTail.fastStop).not.toHaveBeenCalled()
  })

  it('steals the oldest sounding voice, not the quietest, when none are releasing', () => {
    // `newer` is quieter (mid-attack) but freshest — must NOT be stolen by gain.
    const oldest = fakeVoice({ isActive: true, midi: 60, level: 0.5, age: 1 })
    const newer = fakeVoice({ isActive: true, midi: 62, level: 0.01, age: 9 })
    const e = engineWith(runningCtx, [newer, oldest])
    const { voice, stole } = e.allocateVoice(64)
    expect(voice).toBe(oldest as unknown as Voice)
    expect(stole).toBe(true)
    expect(oldest.fastStop).toHaveBeenCalledOnce()
  })
})

describe('AudioEngine.noteOn guards', () => {
  const note = { midi: 60, velocity: 1 }

  it('does not throw / allocate when the pool is empty (E1 empty-pool guard)', () => {
    // ctx running but voices not yet built (e.g. a still-pending resume()): the
    // old code hit this.voices[0] === undefined and crashed in fastStop.
    const e = engineWith({ currentTime: 0, state: 'running' }, [])
    expect(() => (e as unknown as AudioEngine).noteOn(note, 0)).not.toThrow()
  })

  it('drops the note while the context is not running (E2 frozen clock)', () => {
    const voice = fakeVoice({ isActive: false, midi: null, level: 0, age: 1 })
    const e = engineWith({ currentTime: 0, state: 'suspended' }, [voice])
    ;(e as unknown as AudioEngine).noteOn(note, 0)
    expect(voice.noteOn).not.toHaveBeenCalled()
  })

  it('plays on a free voice when running with a built pool', () => {
    const voice = fakeVoice({ isActive: false, midi: null, level: 0, age: 1 })
    const e = engineWith({ currentTime: 0, state: 'running' }, [voice])
    ;(e as unknown as AudioEngine).noteOn(note, 0)
    expect(voice.noteOn).toHaveBeenCalledOnce()
  })
})
