import { describe, it, expect } from 'vitest'
import { PRESET_IDS } from '../types'
import { PRESETS, getPreset } from './presets'
import type { OscType } from './voiceParams'

const OSC_TYPES: OscType[] = ['sine', 'triangle', 'sawtooth', 'square']

describe('PRESETS table', () => {
  it('has an entry for every PresetId and no extras', () => {
    expect(Object.keys(PRESETS).sort()).toEqual([...PRESET_IDS].sort())
  })

  it('each entry carries the matching id, a name and a description', () => {
    for (const id of PRESET_IDS) {
      const p = PRESETS[id]
      expect(p.id).toBe(id)
      expect(p.name.length).toBeGreaterThan(0)
      expect(p.description.length).toBeGreaterThan(0)
    }
  })

  it('every voice param is in a sane range', () => {
    for (const id of PRESET_IDS) {
      const v = PRESETS[id].voice
      expect(OSC_TYPES).toContain(v.oscType)
      expect(OSC_TYPES).toContain(v.subType)
      expect(v.oscCount).toBeGreaterThanOrEqual(1)
      expect(v.oscCount).toBeLessThanOrEqual(3)
      expect(v.detuneCents).toBeGreaterThanOrEqual(0)
      expect(v.detuneCents).toBeLessThanOrEqual(80)
      expect(v.subLevel).toBeGreaterThanOrEqual(0)
      expect(v.subLevel).toBeLessThanOrEqual(1)
      expect(v.filterCutoff).toBeGreaterThanOrEqual(60)
      expect(v.filterCutoff).toBeLessThanOrEqual(18000)
      expect(v.filterQ).toBeGreaterThan(0)
      expect(v.filterQ).toBeLessThanOrEqual(8)
      expect(v.filterEnvAmount).toBeGreaterThanOrEqual(0)
      expect(v.filterEnvAmount).toBeLessThanOrEqual(8000)
      expect(v.stereoSpread).toBeGreaterThanOrEqual(0)
      expect(v.stereoSpread).toBeLessThanOrEqual(1)
      expect(v.reverbSend).toBeGreaterThanOrEqual(0)
      expect(v.reverbSend).toBeLessThanOrEqual(1)
      // Gain kept conservative for safe gain staging into the limiter.
      expect(v.gain).toBeGreaterThan(0)
      expect(v.gain).toBeLessThanOrEqual(0.42)
      // ADSR sane.
      expect(v.amp.attack).toBeGreaterThan(0)
      expect(v.amp.decay).toBeGreaterThan(0)
      expect(v.amp.sustain).toBeGreaterThanOrEqual(0)
      expect(v.amp.sustain).toBeLessThanOrEqual(1)
      expect(v.amp.release).toBeGreaterThan(0)
    }
  })

  it('presets are genuinely distinct (no two share a voice param set)', () => {
    const seen = new Set<string>()
    for (const id of PRESET_IDS) {
      const sig = JSON.stringify(PRESETS[id].voice)
      expect(seen.has(sig)).toBe(false)
      seen.add(sig)
    }
    expect(seen.size).toBe(PRESET_IDS.length)
  })

  it('presets differ meaningfully in timbre (cutoff + osc variety)', () => {
    const cutoffs = PRESET_IDS.map((id) => PRESETS[id].voice.filterCutoff)
    // At least 6 distinct cutoff values across 8 presets.
    expect(new Set(cutoffs).size).toBeGreaterThanOrEqual(6)
    const oscTypes = new Set(PRESET_IDS.map((id) => PRESETS[id].voice.oscType))
    // Uses at least 3 of the 4 waveforms across the set.
    expect(oscTypes.size).toBeGreaterThanOrEqual(3)
  })
})

describe('getPreset', () => {
  it('returns the requested preset', () => {
    expect(getPreset('glass').id).toBe('glass')
  })
})
