/**
 * mchord master bus — voices → master gain → glue compressor → limiter worklet
 *                      → output trim → (analyser tap) → destination.
 *
 * Plus a parallel reverb send (procedural IR convolver) that voices feed via
 * their per-voice reverbSend level, summed pre-limiter so the tail is peak-safe.
 *
 * Adapted from the mdrone master-bus blueprint (src/engine/MasterBus.ts,
 * AGPL-3.0-or-later): the master-chain ordering, gentle glue-compressor
 * settings, safe gain staging, the AnalyserNode meter tap, the preset-change
 * "duck" to mask reconfiguration artefacts, and the procedural cathedral-IR
 * generator. Simplified for mchord's needs (no EQ/width/tilt/bass-mono stack).
 * The look-ahead limiter is an AudioWorklet here rather than mdrone's native
 * DynamicsCompressor. See NOTICE.
 */

import { dbToGain } from './dsp'

export class MasterBus {
  private readonly ctx: AudioContext

  /** Voices connect here. Also the dry feed into the chain. */
  private readonly masterGain: GainNode
  /** Gentle bus-glue compressor. */
  private readonly glueComp: DynamicsCompressorNode
  private readonly glueMakeup: GainNode
  /** Sums dry + reverb return, then feeds the limiter. */
  private readonly preLimMixer: GainNode
  /** Look-ahead limiter worklet (the real-time-critical DSP). */
  private limiterNode: AudioWorkletNode | null = null
  /** Fallback gain so the chain is wired even before the worklet loads. */
  private readonly limiterFallback: GainNode
  /** User output trim. */
  private readonly outputTrim: GainNode
  /** Brief duck pulled down on preset change to mask reconfiguration. */
  private readonly presetDuck: GainNode
  /** Meter tap for the UI output level. Explicitly ArrayBuffer-backed so it
   *  satisfies AnalyserNode.getFloatTimeDomainData's typed-array signature. */
  private readonly analyser: AnalyserNode
  private readonly meterBuf: Float32Array<ArrayBuffer>

  /** Parallel reverb send. */
  private readonly reverbConvolver: ConvolverNode
  private readonly reverbReturn: GainNode

  private readonly limiterCeilingLin = dbToGain(-1) // -1 dBFS ceiling

  constructor(ctx: AudioContext) {
    this.ctx = ctx

    this.masterGain = ctx.createGain()
    // -3 dB headroom so a full chord never slams the glue/limiter.
    this.masterGain.gain.value = dbToGain(-3)

    this.glueComp = ctx.createDynamicsCompressor()
    this.glueComp.threshold.value = -12
    this.glueComp.ratio.value = 2
    this.glueComp.attack.value = 0.02
    this.glueComp.release.value = 0.25
    this.glueComp.knee.value = 8

    this.glueMakeup = ctx.createGain()
    this.glueMakeup.gain.value = dbToGain(2)

    this.preLimMixer = ctx.createGain()
    this.preLimMixer.gain.value = 1

    this.limiterFallback = ctx.createGain()
    this.limiterFallback.gain.value = 1

    this.outputTrim = ctx.createGain()
    this.outputTrim.gain.value = 0.9

    this.presetDuck = ctx.createGain()
    this.presetDuck.gain.value = 1

    this.analyser = ctx.createAnalyser()
    this.analyser.fftSize = 1024
    this.meterBuf = new Float32Array(new ArrayBuffer(this.analyser.fftSize * 4))

    // Parallel reverb — procedural IR; silent until a voice sends to it.
    this.reverbConvolver = ctx.createConvolver()
    this.reverbConvolver.buffer = MasterBus.makeReverbIR(ctx, 2.4)
    this.reverbReturn = ctx.createGain()
    this.reverbReturn.gain.value = dbToGain(-3)

    // Wire the static chain. The limiter worklet is spliced in front of
    // outputTrim once loaded (see attachLimiter); until then preLimMixer →
    // limiterFallback → outputTrim keeps audio flowing.
    this.masterGain.connect(this.glueComp)
    this.glueComp.connect(this.glueMakeup)
    this.glueMakeup.connect(this.preLimMixer)

    // Reverb send tap off the (post-glue) signal, return summed pre-limiter.
    this.glueMakeup.connect(this.reverbConvolver)
    this.reverbConvolver.connect(this.reverbReturn)
    this.reverbReturn.connect(this.preLimMixer)

    this.preLimMixer.connect(this.limiterFallback)
    this.limiterFallback.connect(this.outputTrim)
    this.outputTrim.connect(this.analyser)
    this.analyser.connect(this.presetDuck)
    this.presetDuck.connect(ctx.destination)
  }

  /** Node that voices connect their dry output to. */
  getInput(): GainNode {
    return this.masterGain
  }

  /** Node that voices connect their reverb send to (feeds the convolver in
   *  parallel). Voices use their per-voice reverbSend level on a send gain. */
  getReverbInput(): ConvolverNode {
    return this.reverbConvolver
  }

  /**
   * Splice the loaded limiter worklet in front of outputTrim, replacing the
   * passthrough fallback. Idempotent. Ceiling/release configured to match the
   * gain-staging target (-1 dBFS, 100 ms release).
   */
  attachLimiter(node: AudioWorkletNode): void {
    if (this.limiterNode) return
    this.limiterNode = node
    const c = node.parameters.get('ceiling')
    const r = node.parameters.get('release')
    const e = node.parameters.get('enabled')
    if (c) c.value = this.limiterCeilingLin
    if (r) r.value = 0.1
    if (e) e.value = 1
    try {
      this.preLimMixer.disconnect(this.limiterFallback)
    } catch {
      /* ok */
    }
    this.preLimMixer.connect(node)
    node.connect(this.outputTrim)
  }

  /** Master output trim (user volume), 0..~1.2, click-free. */
  setOutputTrim(linear: number): void {
    const v = Math.max(0, Math.min(1.2, linear))
    this.outputTrim.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05)
  }

  /**
   * Soft duck to mask a preset change / voice rebuild. Dip to -6 dB over 20 ms,
   * hold 30 ms, recover over 80 ms. cancelScheduledValues so rapid preset spam
   * resets cleanly. Adapted from mdrone's duckForPresetChange.
   */
  duckForPresetChange(): void {
    const now = this.ctx.currentTime
    const g = this.presetDuck.gain
    g.cancelScheduledValues(now)
    g.setValueAtTime(g.value, now)
    g.linearRampToValueAtTime(0.5, now + 0.02)
    g.linearRampToValueAtTime(0.5, now + 0.05)
    g.linearRampToValueAtTime(1, now + 0.13)
  }

  /** 0..1 peak output level from the analyser, for the UI meter. */
  getOutputLevel(): number {
    this.analyser.getFloatTimeDomainData(this.meterBuf)
    let peak = 0
    for (let i = 0; i < this.meterBuf.length; i++) {
      const a = Math.abs(this.meterBuf[i])
      if (a > peak) peak = a
    }
    return peak > 1 ? 1 : peak
  }

  dispose(): void {
    try {
      this.presetDuck.disconnect()
    } catch {
      /* ok */
    }
    try {
      this.limiterNode?.disconnect()
    } catch {
      /* ok */
    }
  }

  /**
   * Procedural reverb IR — decaying stereo noise with an early-reflection
   * cluster and a gently warmed tail. Adapted from mdrone's makeCathedralIR so
   * mchord ships zero audio assets. Channels are independently seeded for
   * natural stereo decorrelation.
   */
  private static makeReverbIR(ctx: BaseAudioContext, seconds: number): AudioBuffer {
    const sr = ctx.sampleRate
    const len = Math.max(1, Math.floor(sr * seconds))
    const buf = ctx.createBuffer(2, len, sr)
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch)
      // Mulberry32 — deterministic per channel for a stable room across reloads.
      let s = (ch === 0 ? 0x9e3779b9 : 0x6a09e667) | 0
      const rand = (): number => {
        s = (s + 1831565813) | 0
        let t = Math.imul(s ^ (s >>> 15), 1 | s)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1
      }
      const earlyN = Math.floor((sr * 80) / 1000)
      const decayK = Math.log(1000) / len
      let lp = 0
      const lpA = 0.06
      for (let i = 0; i < len; i++) {
        const env = Math.exp(-decayK * i)
        const spike = i < earlyN && rand() > 0.985 ? rand() * 1.5 : 0
        const x = rand() * env + spike * env
        lp += (x - lp) * lpA
        data[i] = lp * 0.6
      }
      const fadeN = Math.min(64, len)
      for (let i = 0; i < fadeN; i++) data[i] *= i / fadeN
    }
    return buf
  }
}
