import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Voice } from './Voice'
import type { ResolvedVoiceParams } from './voiceParams'

/**
 * Mocked Web Audio nodes. The vitest env is `node`, so there is no real
 * AudioContext; these stubs implement only the surface Voice touches. Node
 * factories return a fresh node each call so oscillators are distinct.
 */
class MockParam {
  value = 0
  setValueAtTime = vi.fn((v: number) => ((this.value = v), this))
  setTargetAtTime = vi.fn(() => this)
  linearRampToValueAtTime = vi.fn((v: number) => ((this.value = v), this))
  cancelScheduledValues = vi.fn(() => this)
  cancelAndHoldAtTime = vi.fn(() => this)
}
class MockNode {
  gain = new MockParam()
  frequency = new MockParam()
  Q = new MockParam()
  pan = new MockParam()
  detune = new MockParam()
  type = ''
  onended: (() => void) | null = null
  connect = vi.fn()
  disconnect = vi.fn()
  start = vi.fn()
  stop = vi.fn()
}
class MockAudioContext {
  currentTime = 0
  createGain = () => new MockNode()
  createBiquadFilter = () => new MockNode()
  createStereoPanner = () => new MockNode()
  createOscillator = () => new MockNode()
}

const params: ResolvedVoiceParams = {
  oscType: 'sine',
  oscCount: 1,
  detuneCents: 0,
  subLevel: 0, // no sub osc → simpler teardown accounting
  subType: 'sine',
  filterCutoff: 1000,
  filterQ: 0.7,
  filterEnvAmount: 500,
  amp: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.5 },
  stereoSpread: 0,
  gain: 0.3,
  reverbSend: 0.1,
}

function makeVoice(ctx: MockAudioContext): Voice {
  return new Voice(
    ctx as unknown as AudioContext,
    params,
    new MockNode() as unknown as AudioNode,
    new MockNode() as unknown as AudioNode,
  )
}

describe('Voice inactiveGen generation guard', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('an old deactivation timer cannot retire a voice reused by a newer note', () => {
    const ctx = new MockAudioContext() // currentTime stays 0 so the lazy
    // isActive reconcile (E5) never fires — this isolates the timer/gen path.
    const voice = makeVoice(ctx)

    // Note 1, then a fast-stop steal → schedules deactivation gen1 at ~t+0.011.
    voice.noteOn(60, 1, 0, 1)
    voice.fastStop(0)
    expect(voice.isActive).toBe(true) // tail not yet elapsed (timer pending)

    // Reuse the voice with a fresh note (gen unchanged), then release it →
    // schedules gen2 at t+release (~0.52s), far past gen1's timer.
    voice.noteOn(62, 1, 0, 2)
    voice.noteOff(0)

    // Fire only gen1's timer (~21ms). The oscillators are already gone, so the
    // ONLY thing stopping gen1 from retiring the voice is the generation token.
    vi.advanceTimersByTime(50)
    expect(voice.isActive).toBe(true)

    // Fire gen2's timer (the authoritative deactivation) → voice retires.
    vi.advanceTimersByTime(600)
    expect(voice.isActive).toBe(false)
  })
})
