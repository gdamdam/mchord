/**
 * The eight built-in mchord sound presets.
 *
 * Each `PresetDef` carries display metadata plus a base `VoiceParams` block.
 * `applyMacros` later bends the base params with the four performance macros.
 * Preset ids are the stable contract from types.ts (PRESET_IDS) — never rename.
 *
 * Pure data — no Web Audio here, so the table is unit-testable.
 */

import { PRESET_IDS, type PresetId } from '../types'
import type { VoiceParams } from './voiceParams'

export interface PresetDef {
  id: PresetId
  /** Human-facing name for the UI. */
  name: string
  /** One-line character description. */
  description: string
  /** Base timbre, before macros. */
  voice: VoiceParams
}

/**
 * The built-in presets. Per-voice gains are kept conservative (<= 0.4) as a
 * headroom guideline — not a guarantee: a full chord summed across the pool
 * still peaks well above 0 dBFS, so the master glue compressor and limiter
 * (MasterBus) do the actual peak control. These trims just keep the signal
 * feeding them musical rather than slammed.
 */
export const PRESETS: Record<PresetId, PresetDef> = {
  'warm-poly': {
    id: 'warm-poly',
    name: 'Warm Poly',
    description: 'Classic detuned saw poly — round, full, slightly bright.',
    voice: {
      oscType: 'sawtooth',
      oscCount: 3,
      detuneCents: 12,
      subLevel: 0.25,
      subType: 'sine',
      filterCutoff: 1800,
      filterQ: 0.7,
      filterEnvAmount: 1600,
      amp: { attack: 0.012, decay: 0.35, sustain: 0.72, release: 0.55 },
      stereoSpread: 0.45,
      gain: 0.32,
      reverbSend: 0.18,
    },
  },
  glass: {
    id: 'glass',
    name: 'Glass',
    description: 'Bright bell-like triangle+sine, fast attack, long shimmer tail.',
    voice: {
      oscType: 'triangle',
      oscCount: 2,
      detuneCents: 6,
      subLevel: 0,
      subType: 'sine',
      filterCutoff: 4200,
      filterQ: 1.4,
      filterEnvAmount: 2600,
      amp: { attack: 0.004, decay: 0.9, sustain: 0.35, release: 1.6 },
      stereoSpread: 0.7,
      gain: 0.3,
      reverbSend: 0.4,
    },
  },
  'dub-chord': {
    id: 'dub-chord',
    name: 'Dub Chord',
    description: 'Dark stab — heavy sub, low cutoff, short body, deep reverb.',
    voice: {
      oscType: 'sawtooth',
      oscCount: 2,
      detuneCents: 9,
      subLevel: 0.55,
      subType: 'square',
      filterCutoff: 700,
      filterQ: 2.2,
      filterEnvAmount: 900,
      amp: { attack: 0.006, decay: 0.22, sustain: 0.18, release: 0.4 },
      stereoSpread: 0.3,
      gain: 0.4,
      reverbSend: 0.5,
    },
  },
  felt: {
    id: 'felt',
    name: 'Felt',
    description: 'Soft muted piano-ish triangle — gentle attack, dark and intimate.',
    voice: {
      oscType: 'triangle',
      oscCount: 2,
      detuneCents: 4,
      subLevel: 0.2,
      subType: 'sine',
      filterCutoff: 1200,
      filterQ: 0.6,
      filterEnvAmount: 700,
      amp: { attack: 0.02, decay: 0.6, sustain: 0.4, release: 0.9 },
      stereoSpread: 0.35,
      gain: 0.34,
      reverbSend: 0.28,
    },
  },
  'air-choir': {
    id: 'air-choir',
    name: 'Air Choir',
    description: 'Breathy pad — slow swell, wide detune, airy high cutoff, big space.',
    voice: {
      oscType: 'sawtooth',
      oscCount: 3,
      detuneCents: 22,
      subLevel: 0.1,
      subType: 'sine',
      filterCutoff: 2600,
      filterQ: 0.8,
      filterEnvAmount: 1200,
      amp: { attack: 0.55, decay: 1.2, sustain: 0.85, release: 2.2 },
      stereoSpread: 0.9,
      gain: 0.28,
      reverbSend: 0.45,
    },
  },
  hollow: {
    id: 'hollow',
    name: 'Hollow',
    description: 'Square/pulse with no sub — woody, nasal, mid-focused, dry.',
    voice: {
      oscType: 'square',
      oscCount: 2,
      detuneCents: 8,
      subLevel: 0,
      subType: 'square',
      filterCutoff: 1500,
      filterQ: 1.0,
      filterEnvAmount: 1300,
      amp: { attack: 0.01, decay: 0.4, sustain: 0.5, release: 0.5 },
      stereoSpread: 0.4,
      gain: 0.3,
      reverbSend: 0.12,
    },
  },
  'analog-brass': {
    id: 'analog-brass',
    name: 'Analog Brass',
    description: 'Punchy saw brass — strong filter env sweep, resonant, present.',
    voice: {
      oscType: 'sawtooth',
      oscCount: 3,
      detuneCents: 14,
      subLevel: 0.3,
      subType: 'sawtooth',
      filterCutoff: 1000,
      filterQ: 1.6,
      filterEnvAmount: 2800,
      amp: { attack: 0.05, decay: 0.5, sustain: 0.7, release: 0.45 },
      stereoSpread: 0.5,
      gain: 0.32,
      reverbSend: 0.2,
    },
  },
  'soft-organ': {
    id: 'soft-organ',
    name: 'Soft Organ',
    description: 'Sine-stack organ — flat sustain, minimal detune, even and steady.',
    voice: {
      oscType: 'sine',
      oscCount: 2,
      detuneCents: 3,
      subLevel: 0.4,
      subType: 'sine',
      filterCutoff: 3200,
      filterQ: 0.5,
      filterEnvAmount: 200,
      amp: { attack: 0.015, decay: 0.1, sustain: 0.95, release: 0.3 },
      stereoSpread: 0.25,
      gain: 0.36,
      reverbSend: 0.22,
    },
  },
  // Ported from mpump's bass presets. mchord uses a plain biquad lowpass (no
  // Moog ladder / filterDrive), so the resonance is scaled down from mpump's
  // ladder values to stay stable, and gain is trimmed into mchord's headroom.
  foghorn: {
    id: 'foghorn',
    name: 'Foghorn',
    description: 'Deep dub sub — dark triangle, heavy sine sub, slow low cutoff.',
    voice: {
      oscType: 'triangle',
      oscCount: 1,
      detuneCents: 0,
      subLevel: 0.8,
      subType: 'sine',
      filterCutoff: 350,
      filterQ: 2.5,
      filterEnvAmount: 0,
      amp: { attack: 0.005, decay: 0.3, sustain: 0.9, release: 0.15 },
      stereoSpread: 0,
      gain: 0.4,
      reverbSend: 0.05,
    },
  },
  'uk-sub': {
    id: 'uk-sub',
    name: 'UK Sub',
    description: 'UK garage bass — sawtooth with light filter sweep and sine sub.',
    voice: {
      oscType: 'sawtooth',
      oscCount: 1,
      detuneCents: 0,
      subLevel: 0.6,
      subType: 'sine',
      filterCutoff: 700,
      filterQ: 1.5,
      filterEnvAmount: 2000,
      amp: { attack: 0.008, decay: 0.2, sustain: 0.6, release: 0.1 },
      stereoSpread: 0,
      gain: 0.34,
      reverbSend: 0.05,
    },
  },
  // Five keys/strings voices chosen to fill gaps for chord-progression work:
  // an electric piano, bowed strings, a pluck, a mallet, and a percussive clav.
  'tine-ep': {
    id: 'tine-ep',
    name: 'Electric Piano',
    description: 'Rhodes-style tine EP — bell attack, warm sine body, medium decay.',
    voice: {
      oscType: 'sine',
      oscCount: 2,
      detuneCents: 5,
      subLevel: 0.15,
      subType: 'sine',
      filterCutoff: 2800,
      filterQ: 0.7,
      filterEnvAmount: 1500,
      amp: { attack: 0.003, decay: 0.8, sustain: 0.25, release: 0.9 },
      stereoSpread: 0.4,
      gain: 0.34,
      reverbSend: 0.22,
    },
  },
  'string-ens': {
    id: 'string-ens',
    name: 'String Ensemble',
    description: 'Warm bowed strings — layered saws, medium swell, wide and lush.',
    voice: {
      oscType: 'sawtooth',
      oscCount: 3,
      detuneCents: 18,
      subLevel: 0.12,
      subType: 'sine',
      filterCutoff: 2200,
      filterQ: 0.7,
      filterEnvAmount: 1000,
      amp: { attack: 0.12, decay: 0.9, sustain: 0.8, release: 1.4 },
      stereoSpread: 0.8,
      gain: 0.28,
      reverbSend: 0.35,
    },
  },
  'nylon-pluck': {
    id: 'nylon-pluck',
    name: 'Nylon Pluck',
    description: 'Plucked nylon/harp — fast attack, quick decay, dry and articulate.',
    voice: {
      oscType: 'triangle',
      oscCount: 2,
      detuneCents: 5,
      subLevel: 0.1,
      subType: 'sine',
      filterCutoff: 2400,
      filterQ: 1.0,
      filterEnvAmount: 1800,
      amp: { attack: 0.004, decay: 0.5, sustain: 0.05, release: 0.4 },
      stereoSpread: 0.4,
      gain: 0.32,
      reverbSend: 0.2,
    },
  },
  vibes: {
    id: 'vibes',
    name: 'Vibraphone',
    description: 'Mallet vibes — soft sine strike, long ringing tail, gentle shimmer.',
    voice: {
      oscType: 'sine',
      oscCount: 2,
      detuneCents: 3,
      subLevel: 0,
      subType: 'sine',
      filterCutoff: 3600,
      filterQ: 0.8,
      filterEnvAmount: 800,
      amp: { attack: 0.002, decay: 1.1, sustain: 0.15, release: 1.2 },
      stereoSpread: 0.5,
      gain: 0.32,
      reverbSend: 0.32,
    },
  },
  clav: {
    id: 'clav',
    name: 'Clavinet',
    description: 'Funky clav — snappy square pluck, resonant sweep, tight and dry.',
    voice: {
      oscType: 'square',
      oscCount: 1,
      detuneCents: 0,
      subLevel: 0.15,
      subType: 'square',
      filterCutoff: 1900,
      filterQ: 1.8,
      filterEnvAmount: 2200,
      amp: { attack: 0.003, decay: 0.18, sustain: 0.12, release: 0.25 },
      stereoSpread: 0.3,
      gain: 0.32,
      reverbSend: 0.1,
    },
  },
}

/** Look up a preset by id, falling back to the first preset for safety. */
export function getPreset(id: PresetId): PresetDef {
  return PRESETS[id] ?? PRESETS[PRESET_IDS[0]]
}
