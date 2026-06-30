/**
 * Public surface of the mchord audio engine.
 *
 * Consumers (transport, UI, persistence) import from here, never from the
 * individual modules.
 */

export { AudioEngine, getAudioEngine } from './AudioEngine'
export { PRESETS, getPreset, type PresetDef } from './presets'
export { applyMacros } from './macros'
export type { VoiceParams, ResolvedVoiceParams, OscType } from './voiceParams'
export {
  clamp,
  clamp01,
  dbToGain,
  gainToDb,
  midiToFreq,
  velocityToGain,
  sanitizeADSR,
  type ADSR,
} from './dsp'
