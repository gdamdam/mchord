/**
 * mchord Web Audio sound engine.
 *
 * Implements the shared `NoteSink` contract (types.ts): the transport/scheduler
 * broadcasts voiced notes to this engine (and to MIDI out) at sample-accurate
 * AudioContext times. Voices are allocated from a pool of native Web Audio node
 * graphs; the summed output runs through the MasterBus (glue comp → native
 * limiter → output trim → analyser → destination).
 *
 * The module-scope singleton + HMR-dispose lifecycle is adapted from
 * mdrone/src/App.tsx (AGPL-3.0-or-later). The resume/interruption handling is
 * adapted from mgrains/src/audio/AudioEngine.ts (AGPL-3.0-or-later). See NOTICE.
 */

import type { Midi, NoteSink, PresetId, MacroValues, VoicedNote } from '../types'
import { MasterBus } from './MasterBus'
import { Voice } from './Voice'
import { getPreset } from './presets'
import { applyMacros } from './macros'
import type { ResolvedVoiceParams } from './voiceParams'

/**
 * Pool size. An 8-note chord with long release tails (pads up to ~2.4 s) keeps
 * its voices ringing while the next chord starts, so 16 would force constant
 * voice-stealing (the dominant click source). 32 lets ~4 overlapping 8-note
 * chords coexist, so normal playback always lands on a fresh, click-free voice.
 */
const VOICE_POOL_SIZE = 32

export class AudioEngine implements NoteSink {
  private ctx: AudioContext | null = null
  private bus: MasterBus | null = null
  private voices: Voice[] = []
  /** Monotonic note counter — voice age for stealing (oldest first). */
  private noteCounter = 0
  /** In-flight start(), so concurrent callers coalesce onto one context. */
  private startPromise: Promise<void> | null = null
  private localMuted = false

  private presetId: PresetId = 'warm-poly'
  private macros: MacroValues = { tension: 0.5, spread: 0.5, motion: 0.5, color: 0.5 }
  /** Current resolved params applied to every voice. */
  private resolved: ResolvedVoiceParams = applyMacros(getPreset('warm-poly').voice, {
    tension: 0.5,
    spread: 0.5,
    motion: 0.5,
    color: 0.5,
  })

  /** Bound auto-resume handler so we can add/remove the same reference. */
  private readonly onResumeHint = (): void => {
    void this.tryResume()
  }
  private readonly onStateChange = (): void => {
    if (this.ctx && this.ctx.state !== 'running') void this.tryResume()
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  get ready(): boolean {
    return this.ctx !== null && this.ctx.state === 'running'
  }

  /** Create/resume the context, load the limiter worklet, build the master
   *  chain and voice pool. Idempotent; concurrent calls share one promise. */
  start(): Promise<void> {
    this.startPromise ??= this.runStart().finally(() => {
      this.startPromise = null
    })
    return this.startPromise
  }

  private async runStart(): Promise<void> {
    if (this.ctx) {
      if (this.ctx.state !== 'running') await this.ctx.resume()
      return
    }

    // Device-native sample rate (no explicit sampleRate), balanced latency.
    const ctx = new AudioContext({ latencyHint: 'balanced' })
    this.ctx = ctx

    if (ctx.state !== 'running') {
      try {
        await ctx.resume()
      } catch {
        /* will retry on user-gesture / visibility listeners */
      }
    }

    const bus = new MasterBus(ctx)
    this.bus = bus
    bus.setLocalMuted(this.localMuted)

    // Build the voice pool against the master + reverb inputs.
    this.voices = []
    for (let i = 0; i < VOICE_POOL_SIZE; i++) {
      this.voices.push(new Voice(ctx, this.resolved, bus.getInput(), bus.getReverbInput()))
    }

    // Auto-resume listeners for iOS interruptions / tab switches.
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.onResumeHint)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('pageshow', this.onResumeHint)
    }
    ctx.addEventListener('statechange', this.onStateChange)
  }

  private async tryResume(): Promise<void> {
    if (!this.ctx) return
    const state = this.ctx.state
    if (state === 'suspended' || (state as string) === 'interrupted') {
      try {
        await this.ctx.resume()
      } catch {
        /* ignore; another gesture will retry */
      }
    }
  }

  getContext(): AudioContext | null {
    return this.ctx
  }

  now(): number {
    return this.ctx?.currentTime ?? 0
  }

  getOutputLevel(): number {
    return this.bus?.getOutputLevel() ?? 0
  }

  /** Mute mchord's local Web Audio output without touching MIDI dispatch. */
  setLocalMuted(muted: boolean): void {
    this.localMuted = muted
    this.bus?.setLocalMuted(muted)
  }

  // ---------------------------------------------------------------------------
  // NoteSink
  // ---------------------------------------------------------------------------

  noteOn(note: VoicedNote, time: number): void {
    if (!this.ctx) return
    const voice = this.allocateVoice(note.midi)
    voice.noteOn(note.midi, note.velocity, time, ++this.noteCounter)
  }

  noteOff(midi: Midi, time: number): void {
    if (!this.ctx) return
    // Release the most-recently-started active voice for this midi (handles
    // overlapping same-midi retriggers: each off peels the newest).
    let target: Voice | null = null
    for (const v of this.voices) {
      if (v.isActive && v.midi === midi) {
        if (!target || v.age > target.age) target = v
      }
    }
    target?.noteOff(time)
  }

  allNotesOff(): void {
    this.panic()
  }

  /** Fast (~6 ms) fade + release of every voice; cancels scheduled params. */
  panic(): void {
    if (!this.ctx) return
    const t = this.ctx.currentTime
    for (const v of this.voices) v.fastStop(t)
  }

  // ---------------------------------------------------------------------------
  // Voice allocation
  // ---------------------------------------------------------------------------

  /** Pick a free voice; if none, steal the quietest sounding one. */
  private allocateVoice(_midi: Midi): Voice {
    // Always prefer an idle voice. Note: we deliberately do NOT hard-reuse a
    // voice already sounding the same midi — cutting its oscillators mid-cycle
    // resets their phase under audible gain and clicks. Letting the old voice
    // release naturally while a fresh voice attacks is how polysynths retrigger
    // without artefacts (the 32-voice pool gives ample room for the overlap).
    for (const v of this.voices) {
      if (!v.isActive) return v
    }
    // No free voice: steal the QUIETEST sounding one (least audible to cut), and
    // fast-fade it before reuse so the steal itself stays click-free.
    let quietest = this.voices[0]
    for (const v of this.voices) {
      if (v.level < quietest.level) quietest = v
    }
    quietest.fastStop(this.now())
    return quietest
  }

  // ---------------------------------------------------------------------------
  // Preset / macros
  // ---------------------------------------------------------------------------

  /** Switch preset, click-free: briefly duck the master while reconfiguring the
   *  per-voice defaults applied to subsequently-triggered notes. */
  setPreset(id: PresetId): void {
    this.presetId = id
    this.bus?.duckForPresetChange()
    this.reresolve()
  }

  setMacros(m: MacroValues): void {
    this.macros = m
    this.reresolve()
  }

  /** Recompute resolved params from preset + macros and push to every voice. */
  private reresolve(): void {
    this.resolved = applyMacros(getPreset(this.presetId).voice, this.macros)
    for (const v of this.voices) v.setParams(this.resolved)
  }

  // ---------------------------------------------------------------------------
  // Teardown
  // ---------------------------------------------------------------------------

  dispose(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.onResumeHint)
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('pageshow', this.onResumeHint)
    }
    if (this.ctx) this.ctx.removeEventListener('statechange', this.onStateChange)
    for (const v of this.voices) v.dispose()
    this.voices = []
    this.bus?.dispose()
    this.bus = null
    const ctx = this.ctx
    this.ctx = null
    void ctx?.close().catch(() => {
      /* already closed */
    })
  }
}

// ---------------------------------------------------------------------------
// Module-scope singleton (survives React StrictMode double-mount) + HMR dispose.
// Adapted from mdrone/src/App.tsx.
// ---------------------------------------------------------------------------

let globalEngine: AudioEngine | null = null

export function getAudioEngine(): AudioEngine {
  if (!globalEngine) globalEngine = new AudioEngine()
  return globalEngine
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    globalEngine?.dispose()
    globalEngine = null
  })
}
