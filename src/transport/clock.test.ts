import { describe, it, expect } from 'vitest'
import { secondsPerBeat, secondsPerBar, swungBeatTime } from './clock'

describe('secondsPerBeat', () => {
  it('120 bpm = 0.5s/beat', () => {
    expect(secondsPerBeat(120)).toBeCloseTo(0.5, 10)
  })
  it('60 bpm = 1s/beat', () => {
    expect(secondsPerBeat(60)).toBeCloseTo(1, 10)
  })
})

describe('secondsPerBar', () => {
  it('120 bpm 4/4 = 2s/bar', () => {
    expect(secondsPerBar(120)).toBeCloseTo(2, 10)
  })
  it('honours beatsPerBar', () => {
    expect(secondsPerBar(120, 3)).toBeCloseTo(1.5, 10)
  })
})

describe('swungBeatTime', () => {
  const spb = 0.5 // 120 bpm

  it('straight (swing 0) lays eighths on the grid', () => {
    expect(swungBeatTime(0, 0, spb)).toBeCloseTo(0, 10)
    expect(swungBeatTime(1, 0, spb)).toBeCloseTo(0.25, 10) // & of 1
    expect(swungBeatTime(2, 0, spb)).toBeCloseTo(0.5, 10) // beat 2
    expect(swungBeatTime(3, 0, spb)).toBeCloseTo(0.75, 10)
  })

  it('on-beats never move regardless of swing', () => {
    expect(swungBeatTime(0, 1, spb)).toBeCloseTo(0, 10)
    expect(swungBeatTime(2, 1, spb)).toBeCloseTo(0.5, 10)
    expect(swungBeatTime(4, 0.5, spb)).toBeCloseTo(1.0, 10)
  })

  it('off-beats are delayed by swing * spb/3', () => {
    // full swing pushes the & by spb/3 = 0.1667
    expect(swungBeatTime(1, 1, spb)).toBeCloseTo(0.25 + spb / 3, 10)
    // half swing = half that delay
    expect(swungBeatTime(1, 0.5, spb)).toBeCloseTo(0.25 + 0.5 * (spb / 3), 10)
  })

  it('clamps swing to [0,1]', () => {
    expect(swungBeatTime(1, 5, spb)).toBeCloseTo(0.25 + spb / 3, 10)
    expect(swungBeatTime(1, -1, spb)).toBeCloseTo(0.25, 10)
  })
})
