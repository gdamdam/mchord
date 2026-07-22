import type { Chord, Midi, Voicing, VoicingOptions } from '../types'
import { chordIntervals } from './chords'
import { mod12 } from './scales'

/**
 * Voice-leading engine.
 *
 * Goal: turn an abstract Chord into concrete MIDI notes (a Voicing) according
 * to a VoicingMode, optionally relative to the previous voicing, in a fully
 * DETERMINISTIC way. Determinism is enforced by (a) never using randomness and
 * (b) stable tie-breaking (lowest pitch-sum, then lexicographic note order).
 *
 * Macro influences (all 0..1):
 *   TENSION → add upper extensions / colour tones (more notes, more bite).
 *   SPREAD  → widen the spacing between voices.
 * MOTION is intentionally NOT consulted here (it is a rhythm macro).
 * (VoicingOptions.color is accepted for API compatibility but is not wired into
 *  the engine and currently has no effect — see D6.)
 */

const DEFAULT_CENTER = 60
const DEFAULT_MIN = 36
const DEFAULT_MAX = 84

interface Resolved {
  mode: VoicingOptions['mode']
  center: Midi
  minMidi: Midi
  maxMidi: Midi
  tension: number
  spread: number
}

function resolveOpts(opts: VoicingOptions): Resolved {
  return {
    mode: opts.mode,
    center: opts.center ?? DEFAULT_CENTER,
    minMidi: opts.minMidi ?? DEFAULT_MIN,
    maxMidi: opts.maxMidi ?? DEFAULT_MAX,
    tension: clamp01(opts.tension ?? 0),
    spread: clamp01(opts.spread ?? 0),
  }
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

/**
 * The set of pitch classes to voice, after macro adjustment.
 * TENSION may append an upper extension (9th/13th colour) when the family does
 * not already carry it. Returned as pitch classes in stacked order (root first).
 */
function targetPitchClasses(chord: Chord, r: Resolved): number[] {
  const base = chordIntervals(chord.family).map((iv) => mod12(chord.root + iv))
  const pcs: number[] = []
  for (const pc of base) if (!pcs.includes(pc)) pcs.push(pc)

  // TENSION: add a 9th colour tone above a threshold if not present.
  // WHY: tension should make the chord richer/edgier without changing identity.
  if (r.tension > 0.5) {
    const ninth = mod12(chord.root + 2)
    if (!pcs.includes(ninth)) pcs.push(ninth)
  }
  if (r.tension > 0.8) {
    // Add a 6th/13th colour for extra bite when very high.
    const thirteenth = mod12(chord.root + 9)
    if (!pcs.includes(thirteenth)) pcs.push(thirteenth)
  }
  return pcs
}

/** Map a pitch class to the nearest MIDI note to `target`. */
function nearestMidiToPc(pc: number, target: number): Midi {
  const base = mod12(pc)
  // Candidate octave around target.
  const approx = target - mod12(target - base)
  const candidates = [approx - 12, approx, approx + 12]
  let best = candidates[0]
  let bestDist = Math.abs(best - target)
  for (const c of candidates) {
    const d = Math.abs(c - target)
    if (d < bestDist || (d === bestDist && c < best)) {
      best = c
      bestDist = d
    }
  }
  return best
}

/** Stack pitch classes upward from a starting MIDI, each note above the prev. */
function stackUp(pcs: number[], startMidi: Midi, gap = 0): Midi[] {
  const out: Midi[] = []
  let prev = startMidi - 1
  for (let i = 0; i < pcs.length; i++) {
    const pc = mod12(pcs[i])
    let m = pc
    // Lift to first octave strictly above prev (+ optional spread gap).
    const floor = prev + 1 + (i === 0 ? 0 : gap)
    while (m < floor) m += 12
    out.push(m)
    prev = m
  }
  return out
}

/** Clamp/transpose a whole voicing by octaves so it sits within range. */
function fitToRange(v: Midi[], r: Resolved): Midi[] {
  if (v.length === 0) return v
  let out = [...v]
  // Shift down while the top exceeds max.
  while (Math.max(...out) > r.maxMidi) out = out.map((n) => n - 12)
  // Shift up while the bottom is below min.
  while (Math.min(...out) < r.minMidi) out = out.map((n) => n + 12)
  // If still out of range (very wide chord), hard clamp individual notes.
  out = out.map((n) => Math.max(r.minMidi, Math.min(r.maxMidi, n)))
  // Per-note clamping can collapse a wide voicing onto duplicate MIDI notes,
  // which sound as a single doubled-loudness voice (a lost voice). Re-spread to
  // strictly-ascending, distinct pitches with a two-pass squeeze: first push up
  // from the floor to separate collisions, then pull down from the ceiling so
  // the top stays in range. A range narrower than the voice count can't be
  // fully separated (some overlap remains), but real ranges always can.
  out.sort((a, b) => a - b)
  out[0] = Math.max(out[0], r.minMidi)
  for (let i = 1; i < out.length; i++) out[i] = Math.max(out[i], out[i - 1] + 1)
  out[out.length - 1] = Math.min(out[out.length - 1], r.maxMidi)
  for (let i = out.length - 2; i >= 0; i--) out[i] = Math.min(out[i], out[i + 1] - 1)
  return out
}

// ---------------------------------------------------------------------------
// ROOT mode
// ---------------------------------------------------------------------------

/** Root-position chord with the root placed near the center. */
function voiceRoot(chord: Chord, r: Resolved): Voicing {
  const rootMidi = nearestMidiToPc(chord.root, r.center)
  const ivs = chordIntervals(chord.family)
  const gap = Math.round(r.spread * 4) // SPREAD opens the stack a little.
  const pcs = ivs.map((iv) => mod12(chord.root + iv))
  let v = stackUp(pcs, rootMidi, gap)
  // Ensure the actual root is the lowest note (root position by construction).
  v = fitToRange(v, r)
  return v
}

// ---------------------------------------------------------------------------
// CLOSE mode
// ---------------------------------------------------------------------------

/** Compact voicing: all tones within ~an octave, centred on `center`. */
function voiceClose(chord: Chord, r: Resolved): Voicing {
  const pcs = targetPitchClasses(chord, r)
  // Start near center minus half an octave so the cluster straddles center.
  const start = r.center - 5
  const lowest = nearestMidiToPc(pcs[0], start)
  let v = stackUp(pcs, lowest, 0)
  v = sortAsc(v)
  v = fitToRange(v, r)
  return v
}

// ---------------------------------------------------------------------------
// WIDE mode (drop-2 style)
// ---------------------------------------------------------------------------

/**
 * Open voicing. Build a close voicing then "drop" the 2nd-from-top voice down
 * an octave (classic drop-2), and apply extra SPREAD between voices.
 */
function voiceWide(chord: Chord, r: Resolved): Voicing {
  const pcs = targetPitchClasses(chord, r)
  const start = r.center - 4
  const lowest = nearestMidiToPc(pcs[0], start)
  let v = sortAsc(stackUp(pcs, lowest, 0))
  if (v.length >= 3) {
    // Drop-2: take the second-highest voice and lower it an octave.
    const idx = v.length - 2
    v = sortAsc([...v.slice(0, idx), v[idx] - 12, ...v.slice(idx + 1)])
  }
  // Extra spacing from SPREAD: push every voice apart progressively.
  const extra = Math.round(r.spread * 5)
  if (extra > 0) {
    v = v.map((n, i) => n + i * extra)
  }
  v = fitToRange(sortAsc(v), r)
  return v
}

// ---------------------------------------------------------------------------
// SMOOTH mode (minimise movement)
// ---------------------------------------------------------------------------

/**
 * Generate candidate voicings for the chord (different inversions / octave
 * placements / drop variants), then pick the one closest to `prev` by total
 * absolute semitone movement (greedy nearest-voice matching across differing
 * sizes), penalising out-of-range notes. Deterministic tie break: lowest
 * pitch-sum, then lexicographic.
 */
function voiceSmooth(chord: Chord, r: Resolved, prev: Voicing | null): Voicing {
  const candidates = enumerateCandidates(chord, r)
  if (!prev || prev.length === 0) {
    // No reference: prefer the candidate nearest the center, deterministic ties.
    return pickByScore(candidates, (v) => centerScore(v, r), r)
  }
  return pickByScore(candidates, (v) => movementScore(v, prev) + rangeScore(v, r), r)
}

/**
 * Enumerate a reasonable, bounded candidate set: each inversion (rotation of the
 * chord tones into the bass) across a few octave registers, plus drop-2 of each.
 * Bounded so SMOOTH is O(small) and deterministic.
 */
function enumerateCandidates(chord: Chord, r: Resolved): Voicing[] {
  const pcs = targetPitchClasses(chord, r)
  const out: Voicing[] = []
  const seen = new Set<string>()
  const push = (v: Midi[]) => {
    const fitted = fitToRange(sortAsc(v), r)
    const key = fitted.join(',')
    if (!seen.has(key)) {
      seen.add(key)
      out.push(fitted)
    }
  }

  // For each rotation (inversion) and each anchor octave, stack upward.
  const anchors = [r.center - 12, r.center - 5, r.center, r.center + 7]
  for (let rot = 0; rot < pcs.length; rot++) {
    const rotated = [...pcs.slice(rot), ...pcs.slice(0, rot)]
    for (const anchor of anchors) {
      const lowest = nearestMidiToPc(rotated[0], anchor)
      const v = stackUp(rotated, lowest, 0)
      push(v)
      // drop-2 variant
      if (v.length >= 3) {
        const idx = v.length - 2
        push([...v.slice(0, idx), v[idx] - 12, ...v.slice(idx + 1)])
      }
    }
  }
  return out
}

/** Total minimal movement from prev to v via greedy nearest-voice matching. */
function movementScore(v: Voicing, prev: Voicing): number {
  // Greedy: match each note of the smaller set to nearest unused note of the
  // larger, then add leftover notes' distance to their nearest counterpart.
  const a = sortAsc(prev)
  const b = sortAsc(v)
  const used = new Array(b.length).fill(false)
  let total = 0
  // Match every prev voice to its nearest *unused* b voice. (Skipping used slots
  // is essential: matching two prev voices onto one b slot both double-counts
  // that move and leaves a real b voice unmatched, inflating the score and
  // hiding the genuinely closest voicing.)
  for (const note of a) {
    let bestJ = -1
    let bestD = Infinity
    for (let j = 0; j < b.length; j++) {
      if (used[j]) continue
      const d = Math.abs(b[j] - note)
      if (d < bestD) {
        bestD = d
        bestJ = j
      }
    }
    if (bestJ >= 0) {
      total += bestD
      used[bestJ] = true
    }
  }
  // Any unmatched b voices (new chord larger): charge nearest prev distance.
  for (let j = 0; j < b.length; j++) {
    if (!used[j]) {
      let d = Infinity
      for (const note of a) d = Math.min(d, Math.abs(b[j] - note))
      total += d === Infinity ? 0 : d
    }
  }
  return total
}

/** Penalty for notes outside [minMidi, maxMidi]. */
function rangeScore(v: Voicing, r: Resolved): number {
  let pen = 0
  for (const n of v) {
    if (n < r.minMidi) pen += (r.minMidi - n) * 2
    if (n > r.maxMidi) pen += (n - r.maxMidi) * 2
  }
  return pen
}

/** Closeness of voicing centroid to the desired center. */
function centerScore(v: Voicing, r: Resolved): number {
  if (v.length === 0) return 0
  const centroid = v.reduce((s, n) => s + n, 0) / v.length
  return Math.abs(centroid - r.center)
}

/**
 * Pick the lowest-scoring candidate. Deterministic tie-break:
 * 1) lowest total pitch-sum, 2) lexicographically smallest note list.
 */
function pickByScore(
  candidates: Voicing[],
  score: (v: Voicing) => number,
  _r: Resolved,
): Voicing {
  let best = candidates[0]
  let bestScore = score(best)
  for (let i = 1; i < candidates.length; i++) {
    const c = candidates[i]
    const s = score(c)
    if (s < bestScore || (s === bestScore && tieBreakLess(c, best))) {
      best = c
      bestScore = s
    }
  }
  return best
}

/** True if `a` should beat `b` on ties: lower pitch-sum, then lexicographic. */
function tieBreakLess(a: Voicing, b: Voicing): boolean {
  const sa = a.reduce((s, n) => s + n, 0)
  const sb = b.reduce((s, n) => s + n, 0)
  if (sa !== sb) return sa < sb
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) {
    if (a[i] !== b[i]) return a[i] < b[i]
  }
  return a.length < b.length
}

// ---------------------------------------------------------------------------
// BASS mode
// ---------------------------------------------------------------------------

/**
 * Stable bass anchored near a target (center - one octave), with upper voices
 * moving smoothly relative to prev. The bass note is always the chord root so
 * the harmonic foundation stays solid; upper voices use the SMOOTH search but
 * constrained to sit above the bass.
 */
function voiceBass(chord: Chord, r: Resolved, prev: Voicing | null): Voicing {
  const bassTarget = r.center - 12
  let bass = nearestMidiToPc(chord.root, bassTarget)
  // The bass must respect the range floor: nearestMidiToPc can land below
  // minMidi, so raise it by whole octaves (preserving the root pitch class)
  // until it sits at/above minMidi. Without this the foundation — and the
  // upper range derived from it — can fall out of the caller's range.
  while (bass < r.minMidi) bass += 12

  // Upper voices = remaining chord tones, voiced smoothly above the bass.
  const upperR: Resolved = { ...r, center: r.center, minMidi: bass + 1 }
  const upperPrev = prev && prev.length > 1 ? sortAsc(prev).slice(1) : null
  const upperChordPcs = targetPitchClasses(chord, r).slice(1)
  if (upperChordPcs.length === 0) return fitToRange([bass], r)

  const upperCandidates = enumerateUpper(upperChordPcs, upperR, bass)
  const upper =
    upperPrev && upperPrev.length
      ? pickByScore(
          upperCandidates,
          (v) => movementScore(v, upperPrev) + rangeScore(v, upperR),
          upperR,
        )
      : pickByScore(upperCandidates, (v) => centerScore(v, r), upperR)

  return sortAsc([bass, ...upper])
}

/** Candidate upper-voice stacks (inversions/octaves) above a fixed bass. */
function enumerateUpper(pcs: number[], r: Resolved, bass: Midi): Voicing[] {
  const out: Voicing[] = []
  const seen = new Set<string>()
  const anchors = [bass + 3, r.center - 3, r.center, r.center + 5]
  for (let rot = 0; rot < pcs.length; rot++) {
    const rotated = [...pcs.slice(rot), ...pcs.slice(0, rot)]
    for (const anchor of anchors) {
      const lowest = Math.max(bass + 1, nearestMidiToPc(rotated[0], anchor))
      const v = sortAsc(stackUp(rotated, lowest, 0))
      // Use fitToRange (not a bare per-note Math.min against maxMidi): capping
      // each note at the ceiling collapses high stacks onto duplicate MIDI
      // notes (lost voices). fitToRange re-spreads to distinct pitches.
      const fitted = fitToRange(v, r)
      const key = fitted.join(',')
      if (!seen.has(key)) {
        seen.add(key)
        out.push(fitted)
      }
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

function sortAsc(v: Midi[]): Midi[] {
  return [...v].sort((a, b) => a - b)
}

/** Voice a single chord per the options, optionally relative to `prev`. */
export function voiceChord(
  chord: Chord,
  opts: VoicingOptions,
  prev: Voicing | null,
): Voicing {
  const r = resolveOpts(opts)
  switch (r.mode) {
    case 'root':
      return voiceRoot(chord, r)
    case 'close':
      return voiceClose(chord, r)
    case 'wide':
      return voiceWide(chord, r)
    case 'smooth':
      return voiceSmooth(chord, r, prev)
    case 'bass':
      return voiceBass(chord, r, prev)
    default:
      return voiceClose(chord, r)
  }
}

/**
 * Voice a whole progression. Each non-null chord is voiced relative to the
 * previous *non-null* voicing, so empty slots don't reset the voice-leading.
 */
export function voiceProgression(
  chords: (Chord | null)[],
  opts: VoicingOptions,
): (Voicing | null)[] {
  const out: (Voicing | null)[] = []
  let prev: Voicing | null = null
  for (const chord of chords) {
    if (chord === null) {
      out.push(null)
      continue
    }
    const v = voiceChord(chord, opts, prev)
    out.push(v)
    prev = v
  }
  return out
}
