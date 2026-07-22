import { describe, it, expect } from 'vitest'
import { midiToFreq } from '../audio/dsp'
import {
  TUNING_PRESETS,
  portableToCentsOffset,
  resolveCentsOffset,
  sclTextToTuning,
  tunedFreq,
  twelveTetTuning,
  zeroCents,
} from './index'
import { BUILTIN_PORTABLE_TUNINGS } from '../vendor/tuning-core/builtins'
import { parseScl } from '../vendor/tuning-core/scala'
import type { SceneTuning, TuningAnchor } from '../types'

function presetByName(name: string) {
  const t = TUNING_PRESETS.find((p) => p.name === name)
  if (!t) throw new Error(`missing preset ${name}`)
  return t
}

describe('tunedFreq — 12-TET regression guard', () => {
  it('all-zero cents table is byte-identical to midiToFreq for every MIDI note', () => {
    const zero = zeroCents()
    for (let midi = 0; midi <= 127; midi++) {
      expect(tunedFreq(midi, zero)).toBe(midiToFreq(midi))
    }
  })

  it('the default tuning and the 12-TET builtin preset are all-zero', () => {
    expect(twelveTetTuning().centsOffset).toEqual(new Array(12).fill(0))
    expect(presetByName('Equal (12-TET)').centsOffset).toEqual(new Array(12).fill(0))
    expect(portableToCentsOffset(BUILTIN_PORTABLE_TUNINGS[0])).toEqual(new Array(12).fill(0))
  })
})

describe('tunedFreq — Werckmeister III shifts the right pitch classes', () => {
  // Werckmeister III scaleCents (from the builtin): pc1=90.2, pc3=294.1, pc7=696.1.
  const werck = presetByName('Werckmeister III (well-temp)')

  it('offsets each pitch class by (scaleCents - 100·pc)', () => {
    expect(werck.centsOffset[0]).toBeCloseTo(0, 6)
    expect(werck.centsOffset[1]).toBeCloseTo(90.2 - 100, 6) // -9.8
    expect(werck.centsOffset[3]).toBeCloseTo(294.1 - 300, 6) // -5.9
    expect(werck.centsOffset[7]).toBeCloseTo(696.1 - 700, 6) // -3.9
  })

  it('retunes frequencies by exactly those cents relative to 12-TET', () => {
    for (const midi of [60, 61, 63, 67]) {
      const pc = midi % 12
      const expected = midiToFreq(midi) * Math.pow(2, werck.centsOffset[pc] / 1200)
      expect(tunedFreq(midi, werck.centsOffset)).toBeCloseTo(expected, 9)
    }
  })

  it('leaves the tonic pitch class (C) exactly on 12-TET', () => {
    expect(tunedFreq(60, werck.centsOffset)).toBe(midiToFreq(60))
  })
})

describe('tunedFreq — a just-intonation major triad is beat-free', () => {
  const just = presetByName('Just 5-limit')

  it('C–E–G sound the pure 4:5:6 ratios (no beating)', () => {
    const c = tunedFreq(60, just.centsOffset)
    const e = tunedFreq(64, just.centsOffset)
    const g = tunedFreq(67, just.centsOffset)
    // Pure major third 5/4 and perfect fifth 3/2 — beat-free chord.
    expect(e / c).toBeCloseTo(5 / 4, 4)
    expect(g / c).toBeCloseTo(3 / 2, 4)
  })
})

describe('sclTextToTuning — 12-note octave scope only', () => {
  it('parses a 12-note octave .scl into a 12-entry offset table', () => {
    const scl = [
      '! test.scl',
      'Test 12-tone',
      ' 12',
      ...[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200].map((c) => ` ${c}.0`),
    ].join('\n')
    const t = sclTextToTuning(scl)
    expect(t).not.toBeNull()
    expect(t!.centsOffset).toEqual(new Array(12).fill(0))
    expect(t!.name).toBe('Test 12-tone')
  })

  it('rejects a non-12-note scale (out of scope)', () => {
    const scl = ['! bp.scl', 'Bohlen-Pierce-ish', ' 3', ' 400.0', ' 800.0', ' 1200.0'].join('\n')
    expect(sclTextToTuning(scl)).toBeNull()
  })

  it('returns null on malformed input', () => {
    expect(sclTextToTuning('not a scl file')).toBeNull()
  })
})

describe('resolveCentsOffset — tuning anchor', () => {
  const just = presetByName('Just 5-limit')
  const jiWith = (anchor: TuningAnchor): SceneTuning => ({
    name: just.name,
    centsOffset: [...just.centsOffset],
    anchor,
  })

  it('fixed C returns the table exactly as authored (pre-anchor behaviour)', () => {
    const t = jiWith({ mode: 'fixed', pc: 0 })
    expect(resolveCentsOffset(t, 2)).toEqual(just.centsOffset)
    expect(resolveCentsOffset(t, 9)).toEqual(just.centsOffset)
  })

  it('follow key in D puts the tonic on 12-TET and D-relative degrees on their offsets', () => {
    const resolved = resolveCentsOffset(jiWith({ mode: 'key' }), 2) // key of D
    expect(resolved[2]).toBe(just.centsOffset[0]) // D = degree 0 → unshifted tonic
    expect(resolved[9]).toBe(just.centsOffset[7]) // A = degree 7 → the pure fifth's offset
    expect(resolved[6]).toBe(just.centsOffset[4]) // F♯ = degree 4 → the pure third's offset
  })

  it('a fixed non-C anchor rotates the same way regardless of key', () => {
    const t = jiWith({ mode: 'fixed', pc: 3 })
    const inC = resolveCentsOffset(t, 0)
    const inG = resolveCentsOffset(t, 7)
    expect(inC).toEqual(inG)
    expect(inC[3]).toBe(just.centsOffset[0]) // E♭ carries the tonic degree
  })

  it('12-TET (all-zero) is byte-identical to midiToFreq in every anchor mode', () => {
    const anchors: TuningAnchor[] = [{ mode: 'key' }, { mode: 'fixed', pc: 0 }, { mode: 'fixed', pc: 7 }]
    for (const anchor of anchors) {
      for (const keyRoot of [0, 2, 11]) {
        const resolved = resolveCentsOffset(
          { name: 'Equal (12-TET)', centsOffset: zeroCents(), anchor },
          keyRoot,
        )
        for (let midi = 0; midi <= 127; midi++) {
          expect(tunedFreq(midi, resolved)).toBe(midiToFreq(midi))
        }
      }
    }
  })

  it('well-temperament presets suggest Fixed C; JI/maqam presets follow the key', () => {
    expect(presetByName('Werckmeister III (well-temp)').anchor).toEqual({ mode: 'fixed', pc: 0 })
    expect(presetByName('Kirnberger III (well-temp)').anchor).toEqual({ mode: 'fixed', pc: 0 })
    expect(presetByName('Just 5-limit').anchor).toEqual({ mode: 'key' })
    expect(presetByName('Maqam Rast').anchor).toEqual({ mode: 'key' })
  })

  it('the default tuning and imported .scl files follow the key', () => {
    expect(twelveTetTuning().anchor).toEqual({ mode: 'key' })
    const scl = [
      '! test.scl',
      'Test 12-tone',
      ' 12',
      ...[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200].map((c) => ` ${c}.0`),
    ].join('\n')
    expect(sclTextToTuning(scl)?.anchor).toEqual({ mode: 'key' })
  })
})

describe('parseScl rejects malformed pitch tokens (D9)', () => {
  // parseFloat/parseInt were lenient: "12x.y" → 12¢, "3/2junk" → 3/2. The
  // header contract says malformed files throw rather than resolve to garbage.
  it('throws on a trailing-junk cents value', () => {
    expect(() => parseScl('t\n 1\n 12x.y\n')).toThrow()
  })
  it('throws on a trailing-junk ratio', () => {
    expect(() => parseScl('t\n 1\n 3/2junk\n')).toThrow()
  })
  it('still accepts well-formed cents and ratios', () => {
    expect(() => parseScl('t\n 2\n 100.0\n 2/1\n')).not.toThrow()
  })
})
