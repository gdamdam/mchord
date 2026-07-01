import { describe, it, expect } from 'vitest'
import { playStyleEvents } from './playStyles'
import { rhythmEvents } from './rhythm'

const V = [60, 64, 67] // C major triad, C4 E4 G4
const opts = { durationBars: 1, beatsPerBar: 4, swing: 0, motion: 0 }

describe('playStyleEvents — delegation', () => {
  it('delegates the original single-lane styles to rhythmEvents unchanged', () => {
    for (const style of ['hold', 'pulse', 'stab', 'offbeat', 'arp-up', 'broken'] as const) {
      expect(playStyleEvents(0, V, style, opts)).toEqual(rhythmEvents(V, style, opts))
    }
  })
})

describe('playStyleEvents — split styles', () => {
  it('bass lane uses the chord ROOT in a low register, not the voicing lowest', () => {
    // Inverted voicing: lowest sounding note is E, but the root is C (pc 0).
    const voicing = [64, 67, 72] // E4 G4 C5
    const evs = playStyleEvents(0, voicing, 'bass-melody', opts)
    const low = Math.min(...evs.map((e) => e.midi))
    expect(low % 12).toBe(0) // C, the root
    expect(low).toBeLessThan(48) // placed in the bass register, below the voicing
  })

  it('emits simultaneous bass + melody lanes on the downbeat', () => {
    const evs = playStyleEvents(0, V, 'bass-melody', opts)
    const atZero = evs.filter((e) => Math.abs(e.startBeat) < 1e-9)
    expect(atZero.length).toBeGreaterThanOrEqual(2)
    expect(Math.min(...atZero.map((e) => e.midi))).toBeLessThan(50) // bass
    expect(Math.max(...atZero.map((e) => e.midi))).toBeGreaterThan(55) // melody, an octave up
  })

  it('returns [] for an empty voicing', () => {
    expect(playStyleEvents(0, [], 'trance-arp', opts)).toEqual([])
  })

  it('chord-tone lanes still play when root is null (bass drops out)', () => {
    const evs = playStyleEvents(null, V, 'trance-arp', opts)
    expect(evs.length).toBeGreaterThan(0)
    expect(evs.every((e) => e.midi >= 48)).toBe(true) // nothing in the deep bass register
  })

  it('MOTION increases arp density (monotonic non-decreasing)', () => {
    const low = playStyleEvents(0, V, 'synth-drive', { ...opts, motion: 0 }).length
    const high = playStyleEvents(0, V, 'synth-drive', { ...opts, motion: 1 }).length
    expect(high).toBeGreaterThan(low)
  })

  it('repeats the bar pattern across a longer slot', () => {
    const one = playStyleEvents(0, V, 'house-bass-stab', { ...opts, durationBars: 1 }).length
    const two = playStyleEvents(0, V, 'house-bass-stab', { ...opts, durationBars: 2 }).length
    expect(two).toBeGreaterThan(one)
  })

  it('is deterministic for the same inputs', () => {
    const a = playStyleEvents(0, V, 'garage-2step', { ...opts, seed: 7 })
    const b = playStyleEvents(0, V, 'garage-2step', { ...opts, seed: 7 })
    expect(a).toEqual(b)
  })

  it('every split style yields events for a normal triad', () => {
    const splits = [
      'bass-melody', 'house-bass-stab', 'techno-roll', 'trance-arp',
      'dub-skank', 'synth-drive', 'lofi-broken', 'garage-2step',
    ] as const
    for (const s of splits) {
      expect(playStyleEvents(0, V, s, opts).length, s).toBeGreaterThan(0)
    }
  })
})
