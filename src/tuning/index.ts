/**
 * mchord tuning layer (app-side) — 12-note microtuning ONLY.
 *
 * Bridges the vendored, framework-free tuning core (src/vendor/tuning-core,
 * copied verbatim from mdrone) to mchord's fixed 12-tone chromatic engine. A
 * tuning is expressed as a 12-entry cents-offset table: `centsOffset[pc]` is
 * added (in cents) to the 12-TET frequency of pitch class `pc` (pc = midi % 12).
 * All-zero is exactly 12-TET, so the default path is byte-identical to before.
 *
 * SCOPE: 12 pitch classes per octave only. Arbitrary-N scales are deliberately
 * out of scope here — non-12 / non-octave `.scl` files are rejected on import.
 */
import type { PitchClass, SceneTuning, TuningAnchor } from '../types'
import { midiToFreq } from '../audio/dsp'
import { centsToRatio } from '../vendor/tuning-core/model'
import {
  AUTHORED_PORTABLE_TUNINGS,
  BUILTIN_PORTABLE_TUNINGS,
} from '../vendor/tuning-core/builtins'
import type { PortableTuning } from '../vendor/tuning-core/model'
import { parseScl } from '../vendor/tuning-core/scala'

/** Number of chromatic pitch classes we retune. */
export const PITCH_CLASSES = 12

/** All-zero cents table = 12-TET. Fresh copy per call (never shared/mutated). */
export function zeroCents(): number[] {
  return new Array(PITCH_CLASSES).fill(0)
}

/** The default, always-available tuning: standard equal temperament. */
export const TWELVE_TET_NAME = 'Equal (12-TET)'
export function twelveTetTuning(): SceneTuning {
  // Follow-key anchor: sonically neutral for the all-zero table, and it is the
  // default new scenes should inherit (JI/maqam users mean "pure in MY key").
  return { name: TWELVE_TET_NAME, centsOffset: zeroCents(), anchor: { mode: 'key' } }
}

/**
 * Suggested anchor for a builtin preset. Historical well-temperaments encode
 * per-key colour around a C-rooted circle of fifths, so they are authentically
 * C-anchored; everything else (JI, maqam, EDO subsets, gamelan) describes
 * intervals from a tonic and should follow the key. Applied on preset
 * selection only — the user can override it afterwards.
 */
function suggestedAnchor(name: string): TuningAnchor {
  return name.includes('(well-temp)') ? { mode: 'fixed', pc: 0 } : { mode: 'key' }
}

/**
 * Cents offset from 12-TET for each of the 12 pitch classes of a 12-note
 * `PortableTuning`: `offset[i] = scaleCents[i] - 100·i`. A 12-TET portable
 * tuning therefore yields all zeros. Requires a 12-entry scale (our scope).
 */
export function portableToCentsOffset(t: PortableTuning): number[] {
  const out: number[] = []
  for (let i = 0; i < PITCH_CLASSES; i++) {
    const c = t.scaleCents[i] ?? i * 100
    out.push(c - 100 * i)
  }
  return out
}

/** Builtin + authored 12-note tunings as ready-to-apply cents tables, name-keyed. */
export const TUNING_PRESETS: readonly SceneTuning[] = [
  ...BUILTIN_PORTABLE_TUNINGS,
  ...AUTHORED_PORTABLE_TUNINGS,
]
  .filter((t) => t.scaleCents.length === PITCH_CLASSES)
  .map((t) => ({
    name: t.name,
    centsOffset: portableToCentsOffset(t),
    anchor: suggestedAnchor(t.name),
  }))

/**
 * Parse a `.scl` file into a 12-note cents-offset tuning, or null if it is not a
 * 12-note octave scale (our hard scope limit) or is malformed. `parseScl`
 * returns cents rooted at 0 with `cents.length === note count`, so a standard
 * 12-tone octave file yields exactly 12 entries with a 1200¢ period.
 */
export function sclTextToTuning(text: string): SceneTuning | null {
  let scl
  try {
    scl = parseScl(text)
  } catch {
    return null
  }
  if (scl.cents.length !== PITCH_CLASSES) return null
  if (Math.abs(scl.period - 1200) > 1e-6) return null
  const centsOffset = scl.cents.map((c, i) => c - 100 * i)
  // `.scl` scales are written from a tonic (degree 0 = 1/1), so an import is
  // tonic-relative by nature: follow the key.
  return { name: scl.name?.trim() || 'Imported .scl', centsOffset, anchor: { mode: 'key' } }
}

/**
 * Resolve a tuning to the engine-facing 12-entry table by rotating it to its
 * anchor: effective offset for pitch class p is `centsOffset[(p − anchorPc) mod
 * 12]`, so the anchor pitch class carries the table's degree-0 offset (normally
 * 0¢ — pure 12-TET). The engine and Voice stay anchor-unaware: they keep
 * indexing by `midi % 12`, and this rotation happens once per tuning/key change,
 * never in the audio hot path. Anchor C (the pre-anchor behaviour) and any
 * all-zero table are exact no-ops.
 */
export function resolveCentsOffset(tuning: SceneTuning, keyRoot: PitchClass): number[] {
  const anchorPc = tuning.anchor.mode === 'key' ? keyRoot : tuning.anchor.pc
  return tuning.centsOffset.map(
    (_, pc) => tuning.centsOffset[(((pc - anchorPc) % PITCH_CLASSES) + PITCH_CLASSES) % PITCH_CLASSES] ?? 0,
  )
}

/**
 * Pitch → Hz for a 12-note microtuning: the 12-TET frequency of `midi` scaled by
 * the pitch class's cents offset. `centsOffset` all-zero ⇒ exactly `midiToFreq`.
 */
export function tunedFreq(midi: number, centsOffset: readonly number[]): number {
  const pc = ((Math.round(midi) % PITCH_CLASSES) + PITCH_CLASSES) % PITCH_CLASSES
  const off = centsOffset[pc]
  const cents = typeof off === 'number' && Number.isFinite(off) ? off : 0
  return midiToFreq(midi) * centsToRatio(cents)
}
