import { describe, it, expect } from 'vitest'
import { SCENE_VERSION, type SceneState } from '../types'
import { createDefaultScene } from '../persistence/defaults'
import { encodeScene, decodeScene, sceneToShareUrl, sceneFromUrl } from './codec'

/** A non-default, fully-populated scene to exercise every field. */
function richScene(): SceneState {
  return {
    version: SCENE_VERSION,
    keyRoot: 7,
    mode: 'dorian',
    slots: [
      { chord: { root: 7, family: 'min7' }, durationBars: 2 },
      { chord: { root: 0, family: 'maj9' }, durationBars: 0.5 },
      { chord: null, durationBars: 4 },
      { chord: { root: 11, family: 'dim' }, durationBars: 1 },
      { chord: { root: 5, family: 'sus4' }, durationBars: 1 },
      { chord: null, durationBars: 1 },
      { chord: { root: 2, family: 'dom9' }, durationBars: 2 },
      { chord: { root: 9, family: 'min6' }, durationBars: 0.5 },
    ],
    loopLength: 6,
    voicingMode: 'wide',
    direction: 'pendulum',
    rhythm: 'arp-updown',
    bpm: 137,
    swing: 0.3,
    preset: 'glass',
    macros: { tension: 0.1, spread: 0.9, motion: 0.55, color: 0.25 },
    seed: 123456,
    octaveShift: 0,
    tuning: {
      name: 'Just 5-limit',
      centsOffset: [0, 11.73, 3.91, 15.64, -13.69, -1.96, -17.49, 1.96, 13.69, -15.64, -3.91, -11.73],
    },
  }
}

describe('encodeScene / decodeScene', () => {
  it('round-trips the default scene exactly', () => {
    const scene = createDefaultScene()
    const back = decodeScene(encodeScene(scene))
    expect(back).toEqual(scene)
  })

  it('round-trips a rich scene exactly (deep equal)', () => {
    const scene = richScene()
    const back = decodeScene(encodeScene(scene))
    expect(back).toEqual(scene)
  })

  it('produces a compact, URL-safe-ish string (no spaces/quotes)', () => {
    const enc = encodeScene(createDefaultScene())
    expect(enc).not.toMatch(/[ "<>]/)
    expect(enc.length).toBeGreaterThan(0)
  })

  it('returns null on malformed share strings', () => {
    expect(decodeScene('')).toBeNull()
    expect(decodeScene('!!!not base64!!!')).toBeNull()
    expect(decodeScene('Zm9vYmFy')).toBeNull() // valid base64 of "foobar" -> not JSON
    expect(decodeScene(btoa('[1,2,3]'))).toBeNull() // valid JSON but not an object
    expect(decodeScene(btoa('null'))).toBeNull()
    expect(decodeScene(123 as unknown as string)).toBeNull()
  })

  it('salvages a decodable-but-partial compact payload', () => {
    // Only a couple of fields present; sanitizeScene fills the rest.
    const partial = btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, b: 200 }))))
    const back = decodeScene(partial)
    expect(back).not.toBeNull()
    expect(back?.bpm).toBe(200)
    expect(back?.version).toBe(SCENE_VERSION)
  })

  it('round-trips a non-12-TET tuning in the fragment', () => {
    const scene = richScene()
    const back = decodeScene(encodeScene(scene))
    expect(back?.tuning.name).toBe('Just 5-limit')
    expect(back?.tuning.centsOffset).toEqual(scene.tuning.centsOffset)
  })

  it('decodes a pre-v3 link (no tuning) as 12-TET', () => {
    // A compact payload without `t`/`tn` — older share links.
    const legacy = btoa(unescape(encodeURIComponent(JSON.stringify({ v: 2, b: 120 }))))
    const back = decodeScene(legacy)
    expect(back?.tuning.centsOffset).toEqual(new Array(12).fill(0))
  })

  it('rejects a tampered wrong-length tuning down to 12-TET', () => {
    const tampered = btoa(
      unescape(encodeURIComponent(JSON.stringify({ v: 3, t: [1, 2, 3], tn: 'bad' }))),
    )
    const back = decodeScene(tampered)
    expect(back?.tuning.centsOffset).toEqual(new Array(12).fill(0))
  })

  it('clamps out-of-range values arriving in a tampered payload', () => {
    const tampered = btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, b: 99999, k: 99 }))))
    const back = decodeScene(tampered)
    expect(back?.bpm).toBe(240)
    expect(back?.keyRoot).toBe(11)
  })
})

describe('sceneToShareUrl / sceneFromUrl', () => {
  it('builds a URL with the #s= fragment and round-trips', () => {
    const scene = richScene()
    const url = sceneToShareUrl(scene, 'https://mchord.example/app')
    expect(url.startsWith('https://mchord.example/app#s=')).toBe(true)
    const back = sceneFromUrl(url)
    expect(back).toEqual(scene)
  })

  it('parses a bare fragment (with and without leading #)', () => {
    const scene = createDefaultScene()
    const enc = encodeScene(scene)
    expect(sceneFromUrl(`#s=${enc}`)).toEqual(scene)
    expect(sceneFromUrl(`s=${enc}`)).toEqual(scene)
  })

  it('finds s= among multiple & fragment params', () => {
    const scene = createDefaultScene()
    const enc = encodeScene(scene)
    expect(sceneFromUrl(`#foo=1&s=${enc}&bar=2`)).toEqual(scene)
  })

  it('returns null when the fragment param is absent or invalid', () => {
    expect(sceneFromUrl('https://x/app')).toBeNull()
    expect(sceneFromUrl('https://x/app#other=1')).toBeNull()
    expect(sceneFromUrl('#s=garbage!!!')).toBeNull()
    expect(sceneFromUrl('')).toBeNull()
    expect(sceneFromUrl(null as unknown as string)).toBeNull()
  })

  it('uses an empty base when none is given and no DOM is present', () => {
    const url = sceneToShareUrl(createDefaultScene())
    expect(url.startsWith('#s=')).toBe(true)
  })
})

describe('encoding size (informational)', () => {
  it('default scene encodes to a modest length', () => {
    const len = encodeScene(createDefaultScene()).length
    // Sanity ceiling; the real value is reported in the task summary.
    expect(len).toBeLessThan(400)
  })
})
