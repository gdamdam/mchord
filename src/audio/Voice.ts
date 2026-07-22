/**
 * A single pooled synth voice: a native Web Audio node graph.
 *
 * Graph (per voice):
 *   [ osc × oscCount (detuned) ] ┐
 *   [ sub osc (optional)       ] ┼→ oscMix → lowpass filter → VCA (amp) → panner → out
 *
 * The lowpass filter cutoff and the VCA amplitude are both driven by AudioParam
 * ramps (linearRampToValueAtTime for the attack/decay/release shape,
 * setTargetAtTime for click-free retrigger/steal) — we NEVER assign to a live
 * `.value` of a sounding param. Voices are allocated from a pool and reused.
 *
 * The voice-pool + ADSR-VCA + click-free-ramp approach is adapted from the
 * mdrone master-bus / voice design (AGPL-3.0-or-later). See NOTICE.
 */

import { centsToRatio, clamp, sanitizeADSR, velocityToGain } from './dsp'
import { tunedFreq, zeroCents } from '../tuning'
import type { ResolvedVoiceParams } from './voiceParams'

/** A very small fade used when stealing / hard-stopping a voice, in seconds. */
const STEAL_FADE = 0.006

/**
 * Click-free param transition: pin the param at its TRUE value at time `t`
 * (cancelling any in-flight ramp) so a new ramp scheduled from here is
 * continuous. `cancelAndHoldAtTime` does exactly this where available
 * (Chrome/Safari/Firefox 128+); the fallback pins the instantaneous value.
 *
 * This replaces the `cancelScheduledValues(t) + setValueAtTime(param.value, t)`
 * pattern, which reads the value at *schedule* time (≈100 ms before `t`) and so
 * steps — and clicks — when a voice is reused while a previous note still rings.
 */
function holdAt(param: AudioParam, t: number): void {
  const p = param as AudioParam & { cancelAndHoldAtTime?: (when: number) => void }
  if (typeof p.cancelAndHoldAtTime === 'function') {
    p.cancelAndHoldAtTime(t)
  } else {
    param.cancelScheduledValues(t)
    param.setValueAtTime(param.value, t)
  }
}

export class Voice {
  private readonly ctx: AudioContext
  private readonly oscs: OscillatorNode[] = []
  private subOsc: OscillatorNode | null = null
  private readonly oscMix: GainNode
  private readonly subGain: GainNode
  private readonly filter: BiquadFilterNode
  private readonly amp: GainNode
  private readonly panner: StereoPannerNode
  /** Parallel reverb send gain, post-panner. */
  private readonly reverbSend: GainNode

  /** MIDI note this voice is currently sounding, or null when free. */
  private currentMidi: number | null = null
  /** Monotonic counter set when the voice starts — used by the pool to pick the
   *  oldest voice to steal. */
  private startedAt = 0
  /** True between noteOn and the moment the release envelope fully completes. */
  private active = false
  /** Incremented on every deactivation schedule so a stale timer from a prior
   *  note can't retire a voice that has since been reused. */
  private inactiveGen = 0
  /** ctx time at which the currently-scheduled deactivation completes, or
   *  Infinity while a note is sounding with none scheduled. Lets the isActive
   *  getter reconcile against the audio clock when background-tab throttling
   *  delays the scheduleInactive timer (E5). */
  private inactiveAt = Infinity
  private params: ResolvedVoiceParams
  /** Active 12-note microtuning as per-pitch-class cents offsets (all-zero =
   *  12-TET). Retunes the base frequency at noteOn; unset ⇒ standard tuning. */
  private tuningCents: number[] = zeroCents()

  constructor(
    ctx: AudioContext,
    params: ResolvedVoiceParams,
    destination: AudioNode,
    reverbDestination: AudioNode,
  ) {
    this.ctx = ctx
    this.params = params

    this.oscMix = ctx.createGain()
    this.oscMix.gain.value = 1
    this.subGain = ctx.createGain()
    this.subGain.gain.value = 0

    this.filter = ctx.createBiquadFilter()
    this.filter.type = 'lowpass'
    this.filter.frequency.value = params.filterCutoff
    this.filter.Q.value = params.filterQ

    this.amp = ctx.createGain()
    this.amp.gain.value = 0 // silent until noteOn

    this.panner = ctx.createStereoPanner()
    this.panner.pan.value = 0

    this.reverbSend = ctx.createGain()
    this.reverbSend.gain.value = params.reverbSend

    // Static wiring done once; oscillators are (re)created per note because an
    // OscillatorNode is single-use (cannot be restarted after stop()).
    this.oscMix.connect(this.filter)
    this.subGain.connect(this.filter)
    this.filter.connect(this.amp)
    this.amp.connect(this.panner)
    this.panner.connect(destination)
    // Parallel reverb send, post-panner so the wet keeps the voice's placement.
    this.panner.connect(this.reverbSend)
    this.reverbSend.connect(reverbDestination)
  }

  get midi(): number | null {
    return this.currentMidi
  }

  get isActive(): boolean {
    // Lazily reconcile against the audio clock. Background-tab throttling can
    // fire the scheduleInactive setTimeout long after the voice actually fell
    // silent, leaving it flagged active and starving the pool (E5). If the
    // scheduled deactivation time has passed and the oscillators are already
    // gone, the voice is silent now regardless of whether the timer ran. The
    // generation token still guards the timer path for the reuse case.
    if (
      this.active &&
      this.ctx.currentTime >= this.inactiveAt &&
      this.oscs.length === 0 &&
      this.subOsc === null
    ) {
      this.active = false
    }
    return this.active
  }

  get age(): number {
    return this.startedAt
  }

  /** Current amplitude (for the pool to steal the quietest, least-audible voice). */
  get level(): number {
    return this.amp.gain.value
  }

  /** Replace the timbre params used by subsequent notes (preset / macro change).
   *  Does not retune a currently-sounding voice's oscillators; the filter/Q are
   *  ramped so a held note follows the change click-free. */
  setParams(params: ResolvedVoiceParams): void {
    this.params = params
    const now = this.ctx.currentTime
    this.reverbSend.gain.setTargetAtTime(params.reverbSend, now, 0.05)
    if (this.active) {
      this.filter.Q.setTargetAtTime(params.filterQ, now, 0.03)
      // Cancel the note's still-pending filter attack/decay ramps (scheduled in
      // noteOn) before nudging: otherwise those linear ramps keep firing and drag
      // the cutoff to the OLD preset's targets after this nudge (E3). Hold the
      // true value at `now`, then glide to the new floor. We deliberately do NOT
      // re-trigger the envelope (matches the documented no-retrigger intent) — a
      // sustained voice is past its attack/decay, so there is no remaining
      // segment to reschedule.
      holdAt(this.filter.frequency, now)
      this.filter.frequency.setTargetAtTime(params.filterCutoff, now, 0.05)
    }
  }

  /** Set the active 12-note microtuning (per-pitch-class cents offsets). Applies
   *  to subsequently-triggered notes, like a preset change — a sounding voice
   *  keeps its pitch until it is re-triggered. */
  setTuning(centsOffset: readonly number[]): void {
    this.tuningCents = centsOffset.slice(0, 12)
  }

  /**
   * Start (or retrigger) this voice on `midi` at `velocity`, scheduled at `time`
   * (ctx.currentTime seconds). Builds fresh oscillators, schedules the amp and
   * filter ADSR envelopes, and pans by stereo spread.
   */
  noteOn(midi: number, velocity: number, time: number, counter: number): void {
    const ctx = this.ctx
    const p = this.params
    const t = Math.max(time, ctx.currentTime)

    // If reused while still sounding, tear down old oscillators cleanly first.
    this.stopOscillators(t)

    this.currentMidi = midi
    this.startedAt = counter
    this.active = true
    // No deactivation is scheduled while the note sounds; the isActive getter
    // must not auto-retire it against a stale prior deactivation time (E5).
    this.inactiveAt = Infinity
    this.reverbSend.gain.setValueAtTime(p.reverbSend, t)

    // Apply the active microtuning here — the only pitch→Hz mapping in the voice.
    // All-zero cents ⇒ midiToFreq(midi) exactly (12-TET regression guard).
    const baseFreq = tunedFreq(midi, this.tuningCents)
    const count = clamp(Math.round(p.oscCount), 1, 3)

    // Detune unison copies symmetrically around the centre frequency.
    for (let i = 0; i < count; i++) {
      const osc = ctx.createOscillator()
      osc.type = p.oscType
      osc.frequency.value = baseFreq
      // Spread: -d, 0, +d for 3; -d/2, +d/2 for 2; 0 for 1.
      let cents = 0
      if (count === 2) cents = i === 0 ? -p.detuneCents / 2 : p.detuneCents / 2
      else if (count === 3) cents = (i - 1) * p.detuneCents
      if (cents !== 0) osc.detune.value = cents
      osc.connect(this.oscMix)
      osc.start(t)
      this.oscs.push(osc)
    }

    // Sub oscillator one octave down.
    if (p.subLevel > 0) {
      const sub = ctx.createOscillator()
      sub.type = p.subType
      sub.frequency.value = baseFreq * centsToRatio(-1200)
      sub.connect(this.subGain)
      sub.start(t)
      this.subOsc = sub
      this.subGain.gain.setValueAtTime(p.subLevel, t)
    } else {
      this.subGain.gain.setValueAtTime(0, t)
    }

    // Stereo placement: deterministic per-note offset so a chord fans across the
    // field rather than collapsing to one pan position.
    const panSpread = clamp(p.stereoSpread, 0, 1)
    const pan = panSpread === 0 ? 0 : clamp(((midi % 7) / 6 - 0.5) * 2 * panSpread, -1, 1)
    this.panner.pan.cancelScheduledValues(t)
    this.panner.pan.setValueAtTime(pan, t)

    // --- Amplitude ADSR (linear ramps for click-free attack/decay) ---
    const env = sanitizeADSR(p.amp)
    const peak = clamp(velocityToGain(velocity) * p.gain, 0, 1)
    const sustain = peak * env.sustain
    const g = this.amp.gain
    // Hold continuous at t (a reused voice may still be ringing), then attack→decay.
    holdAt(g, t)
    g.linearRampToValueAtTime(peak, t + env.attack)
    g.linearRampToValueAtTime(sustain, t + env.attack + env.decay)

    // --- Filter ADSR (same shape, scaled by filterEnvAmount) ---
    const f = this.filter.frequency
    const base = p.filterCutoff
    const top = clamp(base + p.filterEnvAmount, 20, 20000)
    holdAt(f, t)
    f.linearRampToValueAtTime(top, t + env.attack)
    f.linearRampToValueAtTime(clamp(base + p.filterEnvAmount * env.sustain, 20, 20000), t + env.attack + env.decay)
    this.filter.Q.setValueAtTime(p.filterQ, t)
  }

  /**
   * Release this voice (note-off). Ramps the amp and filter down over the
   * release time and schedules oscillator teardown after the tail completes.
   */
  noteOff(time: number): void {
    if (!this.active) return
    const ctx = this.ctx
    const env = sanitizeADSR(this.params.amp)
    const t = Math.max(time, ctx.currentTime)
    const release = env.release

    const g = this.amp.gain
    // Hold the true value at t (continuous even if note-off lands mid-attack),
    // then ramp down over the release.
    holdAt(g, t)
    g.linearRampToValueAtTime(0, t + release)

    const f = this.filter.frequency
    holdAt(f, t)
    f.linearRampToValueAtTime(this.params.filterCutoff, t + release)

    const stopAt = t + release + 0.02
    this.stopOscillators(stopAt)
    this.currentMidi = null
    // Mark inactive only after the tail; the pool can still steal it sooner if
    // needed (stopOscillators on reuse handles the overlap).
    this.scheduleInactive(stopAt)
  }

  /** Fast, click-free hard stop (panic / all-notes-off / voice steal). */
  fastStop(time: number): void {
    const ctx = this.ctx
    const t = Math.max(time, ctx.currentTime)
    const g = this.amp.gain
    holdAt(g, t)
    g.linearRampToValueAtTime(0, t + STEAL_FADE)
    const stopAt = t + STEAL_FADE + 0.005
    this.stopOscillators(stopAt)
    this.currentMidi = null
    this.scheduleInactive(stopAt)
  }

  /** Stop and disconnect all oscillators at `when`, scheduling them for GC.
   *  Safe to call when none exist. */
  private stopOscillators(when: number): void {
    for (const osc of this.oscs) this.stopOsc(osc, when)
    this.oscs.length = 0
    if (this.subOsc) {
      this.stopOsc(this.subOsc, when)
      this.subOsc = null
    }
  }

  /** Stop one oscillator at `when`, disconnecting it once it ends. Safe on an
   *  already-stopped node (both stop() and the graph teardown are wrapped). */
  private stopOsc(osc: OscillatorNode, when: number): void {
    try {
      osc.stop(when)
      osc.onended = () => {
        try {
          osc.disconnect()
        } catch {
          /* already gone */
        }
      }
    } catch {
      /* already stopped */
    }
  }

  private scheduleInactive(when: number): void {
    const gen = ++this.inactiveGen
    this.inactiveAt = when
    const ms = Math.max(0, (when - this.ctx.currentTime) * 1000) + 10
    setTimeout(() => {
      // Only the latest deactivation may retire the voice. A reused voice clears
      // `oscs` synchronously when its own stop is scheduled, so the osc guard
      // alone can't tell an older note's tail from the current one — the
      // generation token does. Also require the oscillators to be gone.
      if (gen === this.inactiveGen && this.oscs.length === 0 && this.subOsc === null) {
        this.active = false
      }
    }, ms)
  }

  /** Immediate teardown for engine disposal. */
  dispose(): void {
    this.stopOscillators(this.ctx.currentTime)
    try {
      this.panner.disconnect()
    } catch {
      /* ok */
    }
    try {
      this.reverbSend.disconnect()
    } catch {
      /* ok */
    }
    this.active = false
    this.currentMidi = null
  }
}
