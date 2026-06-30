/**
 * clock — pure tempo/timing math for the mchord transport.
 *
 * Everything here is a pure function (numbers in, numbers out) so it is
 * trivially unit-testable without any audio nodes or wall-clock. Times are in
 * seconds and meant to be added to an AudioContext currentTime base.
 */

/** Seconds per beat (quarter note) at a given tempo. */
export function secondsPerBeat(bpm: number): number {
  return 60 / bpm
}

/** Seconds per bar. Defaults to 4 beats/bar (4/4). */
export function secondsPerBar(bpm: number, beatsPerBar = 4): number {
  return secondsPerBeat(bpm) * beatsPerBar
}

/**
 * Swing model.
 *
 * Swing is expressed against an *eighth-note* grid. We index eighths by
 * `beatIndex` (0,1,2,3,… = 1, &, 2, &, …). Even indices (0,2,4,…) are the
 * on-beats and stay on the straight grid; odd indices (1,3,5,…) are the
 * "&" off-beats and are pushed later in time.
 *
 * `swing` ∈ [0,1] is the fraction of the *eighth-note duration* by which an
 * off-beat is delayed, scaled so that swing = 1 reaches a triplet feel
 * (delay = 1/3 of a beat ≈ classic hard swing) rather than a degenerate
 * "off-beat lands on the next on-beat". Concretely the off-beat delay is
 * `swing * (spb / 3)` seconds, where `spb` is seconds-per-beat. swing = 0 is
 * perfectly straight.
 *
 * @param beatIndex eighth-note index from the start of the slot (0-based)
 * @param swing     0..1 swing amount
 * @param spb       seconds per beat (quarter note) — see secondsPerBeat
 * @returns absolute time offset (seconds) of that eighth within the slot
 */
export function swungBeatTime(beatIndex: number, swing: number, spb: number): number {
  const eighth = spb / 2
  const base = beatIndex * eighth
  const isOffbeat = beatIndex % 2 === 1
  if (!isOffbeat) return base
  const s = Math.max(0, Math.min(1, swing))
  return base + s * (spb / 3)
}
