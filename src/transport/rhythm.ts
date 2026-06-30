/**
 * rhythm — turns a held voicing into timed note events for one progression
 * slot, according to a RhythmStyle. Pure & deterministic: same inputs always
 * yield the same events. Output positions are expressed in *beats* (and beat
 * durations) so the scheduler can convert to seconds with the tempo + swing of
 * its choosing.
 *
 * Swing is *not* baked in here as seconds — instead, events that fall on an
 * eighth-note off-beat are returned with their straight beat position and the
 * scheduler applies the swing delay via clock.swungBeatTime. That keeps this
 * module tempo-agnostic. We do however know the eighth-grid here so we mark
 * positions on the grid; see `startBeat` (a beat-domain value, e.g. 1.5 = the
 * "&" of beat 2).
 *
 * MOTION (0..1) increases rhythmic density: it raises the subdivision of
 * pulse/stab/offbeat from quarters toward eighths/sixteenths and speeds up the
 * arpeggio/broken cycles by shortening each step.
 */
import type { Voicing, RhythmStyle } from '../types'

export interface RhythmEvent {
  midi: number
  /** Normalised velocity 0..1. */
  velocity: number
  /** Onset position in beats from the start of the slot (0-based). */
  startBeat: number
  /** Duration in beats. */
  durBeats: number
}

export interface RhythmOpts {
  durationBars: number
  beatsPerBar?: number
  /** 0..1 swing — used only to decide gate length on off-beats, not timing. */
  swing: number
  /** 0..1 motion macro — density / arp speed. */
  motion: number
}

/** Base velocity with a small downbeat accent. beatPos is in beats. */
function velocityFor(beatPos: number, beatsPerBar: number, base: number): number {
  const inBar = ((beatPos % beatsPerBar) + beatsPerBar) % beatsPerBar
  // Strong accent on bar downbeat, mild accent on integer beats, soft on &s.
  let v: number
  if (inBar === 0) v = base + 0.18
  else if (Number.isInteger(inBar)) v = base + 0.06
  else v = base - 0.06
  return Math.max(0.05, Math.min(1, v))
}

/**
 * Subdivisions per beat as a function of motion. motion 0 → 1 (quarters),
 * up through 2 (eighths) to 4 (sixteenths). Stepped so output is stable.
 */
function subdivPerBeat(motion: number): number {
  const m = Math.max(0, Math.min(1, motion))
  if (m < 0.34) return 1
  if (m < 0.67) return 2
  return 4
}

/**
 * Arp/broken step length in beats from motion: slower (1 beat) at motion 0,
 * down to a sixteenth (0.25) at full motion. Stepped for determinism.
 */
function arpStepBeats(motion: number): number {
  const m = Math.max(0, Math.min(1, motion))
  if (m < 0.25) return 1
  if (m < 0.5) return 0.5
  if (m < 0.75) return 1 / 3
  return 0.25
}

/** True if a beat position lands on an eighth-note off-beat (the "&"). */
function isOffbeatEighth(beatPos: number): boolean {
  // off-beat eighths are at .5 within a beat
  const frac = beatPos - Math.floor(beatPos)
  return Math.abs(frac - 0.5) < 1e-9
}

/** Build a sustained block of the whole voicing. */
function block(
  voicing: Voicing,
  startBeat: number,
  durBeats: number,
  beatsPerBar: number,
  base: number,
): RhythmEvent[] {
  const v = velocityFor(startBeat, beatsPerBar, base)
  return voicing.map((midi) => ({ midi, velocity: v, startBeat, durBeats }))
}

export function rhythmEvents(
  voicing: Voicing,
  style: RhythmStyle,
  opts: RhythmOpts,
): RhythmEvent[] {
  const beatsPerBar = opts.beatsPerBar ?? 4
  const totalBeats = opts.durationBars * beatsPerBar
  if (!voicing.length || totalBeats <= 0) return []

  const events: RhythmEvent[] = []
  const motion = opts.motion

  switch (style) {
    case 'hold': {
      // One sustained block for the whole slot.
      events.push(...block(voicing, 0, totalBeats, beatsPerBar, 0.7))
      break
    }

    case 'pulse': {
      // A block on every subdivision (quarters → sixteenths with motion).
      const div = subdivPerBeat(motion)
      const step = 1 / div
      const dur = step * 0.95
      for (let b = 0; b < totalBeats - 1e-9; b += step) {
        events.push(...block(voicing, b, dur, beatsPerBar, 0.72))
      }
      break
    }

    case 'stab': {
      // Short staccato block on every subdivision.
      const div = subdivPerBeat(motion)
      const step = 1 / div
      const dur = Math.min(step, 0.25) * 0.6
      for (let b = 0; b < totalBeats - 1e-9; b += step) {
        events.push(...block(voicing, b, dur, beatsPerBar, 0.7))
      }
      break
    }

    case 'offbeat': {
      // Blocks on the &s. Motion adds the in-between sixteenth off-beats.
      // Base grid: eighth off-beats at b + 0.5. High motion: also the
      // sixteenth off-beats (b + 0.25, b + 0.75).
      const dur = 0.45
      for (let b = 0; b < totalBeats - 1e-9; b += 1) {
        const offs = motion >= 0.67 ? [0.25, 0.5, 0.75] : [0.5]
        for (const o of offs) {
          const pos = b + o
          if (pos >= totalBeats - 1e-9) continue
          events.push(...block(voicing, pos, dur, beatsPerBar, 0.66))
        }
      }
      break
    }

    case 'arp-up':
    case 'arp-down':
    case 'arp-updown': {
      const order = arpOrder(voicing, style)
      const step = arpStepBeats(motion)
      const dur = step * 0.9
      let i = 0
      for (let b = 0; b < totalBeats - 1e-9; b += step) {
        const midi = order[i % order.length]
        const v = velocityFor(b, beatsPerBar, 0.7)
        events.push({ midi, velocity: v, startBeat: b, durBeats: dur })
        i++
      }
      break
    }

    case 'broken': {
      // A repeating broken-chord figure: low, high, mid, high (relative to
      // the sorted voicing). Cycles across the slot at the arp step rate.
      const sorted = [...voicing].sort((a, b) => a - b)
      const pattern = brokenPattern(sorted)
      const step = arpStepBeats(motion)
      const dur = step * 0.95
      let i = 0
      for (let b = 0; b < totalBeats - 1e-9; b += step) {
        const midi = pattern[i % pattern.length]
        const v = velocityFor(b, beatsPerBar, 0.7)
        events.push({ midi, velocity: v, startBeat: b, durBeats: dur })
        i++
      }
      break
    }
  }

  // Slightly shorten gate of swung off-beats so swing feel reads cleanly.
  if (opts.swing > 0) {
    for (const e of events) {
      if (isOffbeatEighth(e.startBeat)) {
        e.durBeats = Math.max(0.05, e.durBeats * (1 - 0.2 * opts.swing))
      }
    }
  }

  return events
}

/** Note order for arpeggio styles. */
function arpOrder(voicing: Voicing, style: RhythmStyle): number[] {
  const up = [...voicing].sort((a, b) => a - b)
  if (style === 'arp-down') return [...up].reverse()
  if (style === 'arp-updown') {
    if (up.length <= 2) return up
    // up then back down, without repeating the top or bottom endpoints:
    // [1,2,3] -> 1 2 3 2 ; [1,2,3,4] -> 1 2 3 4 3 2
    const down = up.slice(1, -1).reverse()
    return [...up, ...down]
  }
  return up // arp-up
}

/** Broken-chord figure over a sorted voicing: low, top, mid, top. */
function brokenPattern(sorted: number[]): number[] {
  if (sorted.length === 1) return [sorted[0]]
  const low = sorted[0]
  const high = sorted[sorted.length - 1]
  const mid = sorted[Math.floor(sorted.length / 2)]
  return [low, high, mid, high]
}
