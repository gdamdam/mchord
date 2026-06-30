/**
 * mchord master look-ahead limiter / soft-clip AudioWorkletProcessor.
 *
 * Portions of the worklet loading convention and the master-bus gain-staging
 * philosophy are adapted from the sibling projects mgrains
 * (src/audio/granular.worklet.ts — the `?worker&url` + addModule + AudioWorklet
 * declaration pattern) and mdrone (src/engine/MasterBus.ts — the master-chain
 * blueprint and limiter ceiling/release approach). Both are AGPL-3.0-or-later;
 * this file is likewise AGPL-3.0-or-later. See NOTICE.
 *
 * Design: a true look-ahead peak limiter. A short delay line lets the gain
 * computer "see" upcoming peaks so gain reduction is in place before the peak
 * arrives — no overshoot, no clicks. A final tanh soft-clip guarantees the
 * output never exceeds the ceiling even on inter-sample transients.
 *
 * REAL-TIME CONTRACT: `process()` performs ZERO allocation. The look-ahead delay
 * buffer and all scratch state are preallocated in the constructor. The render
 * loop only does arithmetic and array indexing — no `new`, no array literals,
 * no closures created per block.
 */

declare const sampleRate: number

declare abstract class AudioWorkletProcessor {
  readonly port: MessagePort
  abstract process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>,
  ): boolean
}

interface AudioParamDescriptor {
  name: string
  defaultValue?: number
  minValue?: number
  maxValue?: number
  automationRate?: 'a-rate' | 'k-rate'
}

declare function registerProcessor(
  name: string,
  processorCtor: (new () => AudioWorkletProcessor) & {
    parameterDescriptors?: readonly AudioParamDescriptor[]
  },
): void

/** Maximum supported channels — stereo. Buffers are sized for this up front. */
const MAX_CHANNELS = 2
/** Look-ahead window in milliseconds. 2 ms is enough to catch transients at a
 *  musical attack without smearing; at 48 kHz that is 96 samples. */
const LOOKAHEAD_MS = 2

class MchordLimiterProcessor extends AudioWorkletProcessor {
  // MUST be named `parameterDescriptors` — the Web Audio API reads this exact
  // static to create the node's AudioParams. If misnamed, `process()` receives
  // an empty `parameters` object and reading `parameters.ceiling[0]` throws,
  // which puts the processor in an error state and outputs SILENCE.
  static get parameterDescriptors(): readonly AudioParamDescriptor[] {
    return [
      // Output ceiling, linear (0..1). -1 dBFS ≈ 0.891 by default.
      { name: 'ceiling', defaultValue: 0.891, minValue: 0.1, maxValue: 1, automationRate: 'k-rate' },
      // Gain-reduction release time constant, seconds.
      { name: 'release', defaultValue: 0.1, minValue: 0.005, maxValue: 1, automationRate: 'k-rate' },
      // 1 = limiting active, 0 = bypass (still soft-clips at ceiling for safety).
      { name: 'enabled', defaultValue: 1, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
    ]
  }

  /** Look-ahead delay line, one preallocated Float32Array per channel. */
  private readonly delayBuffers: Float32Array[]
  /** Length of each delay line in samples (look-ahead window). */
  private readonly delaySamples: number
  /** Circular write head into the delay lines. */
  private writeIndex = 0
  /** Current smoothed gain-reduction multiplier (1 = no reduction). */
  private envGain = 1
  /** Attack time constant in samples — how fast we clamp down on a new peak. */
  private readonly attackSamples: number

  constructor() {
    super()
    this.delaySamples = Math.max(1, Math.round((LOOKAHEAD_MS / 1000) * sampleRate))
    // PREALLOCATE every buffer here so process() never allocates.
    this.delayBuffers = new Array<Float32Array>(MAX_CHANNELS)
    for (let c = 0; c < MAX_CHANNELS; c++) {
      this.delayBuffers[c] = new Float32Array(this.delaySamples)
    }
    // Fast attack (~0.5 ms) so gain reduction lands within the look-ahead window.
    this.attackSamples = Math.max(1, Math.round(0.0005 * sampleRate))
  }

  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>,
  ): boolean {
    const input = inputs[0]
    const output = outputs[0]
    if (!output || output.length === 0) return true

    // Read params defensively: if a descriptor is ever missing, fall back to
    // safe defaults rather than throwing — a master limiter must never silence
    // the whole instrument, only ever fail open to (worst case) passthrough.
    const ceiling = parameters.ceiling ? parameters.ceiling[0] : 0.891
    const releaseSec = parameters.release ? parameters.release[0] : 0.1
    const enabled = parameters.enabled ? parameters.enabled[0] >= 0.5 : true

    const blockSize = output[0].length
    const channels = output.length
    const delayLen = this.delaySamples

    // Per-sample release/attack coefficients (k-rate params → compute once/block,
    // no allocation). releaseCoef closer to 1 = slower recovery.
    const releaseCoef = Math.exp(-1 / Math.max(1, releaseSec * sampleRate))
    const attackCoef = Math.exp(-1 / this.attackSamples)

    // If input is missing (silent upstream), still flush the delay lines so a
    // tail isn't held. Treat missing channel data as zero.
    for (let i = 0; i < blockSize; i++) {
      // Peak of the INCOMING sample across channels — what we must tame.
      let peak = 0
      for (let c = 0; c < channels && c < MAX_CHANNELS; c++) {
        const inCh = input && input[c]
        const x = inCh ? inCh[i] : 0
        const a = x < 0 ? -x : x
        if (a > peak) peak = a
      }

      // Target gain that would bring this peak to the ceiling (1 if under).
      let targetGain = 1
      if (enabled && peak > ceiling) targetGain = ceiling / peak

      // Smooth the gain: fast attack toward a lower target, slow release back up.
      if (targetGain < this.envGain) {
        this.envGain = targetGain + (this.envGain - targetGain) * attackCoef
      } else {
        this.envGain = targetGain + (this.envGain - targetGain) * releaseCoef
      }

      // Read the delayed sample (look-ahead: the gain we computed from the
      // incoming peak is applied to the older, delayed sample so reduction is
      // already in place when the peak emerges from the delay line).
      const readIndex = this.writeIndex // oldest sample sits at the write head
      for (let c = 0; c < channels && c < MAX_CHANNELS; c++) {
        const outCh = output[c]
        const inCh = input && input[c]
        const buf = this.delayBuffers[c]
        const delayed = buf[readIndex]
        // Write the current input into the delay line at the same slot.
        buf[readIndex] = inCh ? inCh[i] : 0
        // Apply gain reduction, then a tanh soft-clip at the ceiling as a final
        // brick wall against inter-sample / residual overshoot.
        let y = delayed * this.envGain
        if (y > ceiling) y = ceiling * Math.tanh(y / ceiling)
        else if (y < -ceiling) y = -ceiling * Math.tanh(-y / ceiling)
        outCh[i] = y
      }
      this.writeIndex++
      if (this.writeIndex >= delayLen) this.writeIndex = 0
    }

    return true
  }
}

registerProcessor('mchord-limiter', MchordLimiterProcessor)
