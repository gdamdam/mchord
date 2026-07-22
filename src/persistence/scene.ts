/**
 * Defensive scene (de)sanitisation + version migration.
 *
 * `sanitizeScene` is the single trust boundary: anything coming from
 * localStorage, an imported file, or a share URL passes through it before the
 * app ever sees it. It NEVER throws — every field is coerced to a valid value,
 * falling back to `createDefaultScene()` for anything missing or unrecoverable.
 *
 * Pattern mirrors mgrains' `deserializePreset`/`sanitizePatch` envelope.
 */
import {
  CHORD_FAMILIES,
  DIRECTIONS,
  MODES,
  OCTAVE_SHIFT_MIN,
  OCTAVE_SHIFT_MAX,
  PRESET_IDS,
  RHYTHM_STYLES,
  SCENE_VERSION,
  SLOT_COUNT,
  SLOT_DURATIONS,
  VOICING_MODES,
  type Chord,
  type ChordFamily,
  type Direction,
  type MacroValues,
  type Mode,
  type PresetId,
  type RhythmStyle,
  type SceneState,
  type SceneTuning,
  type Slot,
  type SlotDuration,
  type TuningAnchor,
  type VoicingMode,
} from '../types'
import { createDefaultScene } from './defaults'
import { TWELVE_TET_NAME, twelveTetTuning } from '../tuning'

// ---------------------------------------------------------------------------
// Small coercion helpers (each total — never throws)
// ---------------------------------------------------------------------------

/**
 * Shared plain-object type guard. Exported so the other trust boundaries
 * (storage.ts, sharing/codec.ts) reuse the one definition rather than each
 * carrying a drifting copy.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Max accepted length for a tuning display name. A share URL is untrusted, so
 *  an unbounded name (multi-MB) could exhaust localStorage quota once saved. */
const MAX_TUNING_NAME_LENGTH = 100

/** Clamp a finite number into [min, max]; fall back to `fallback` otherwise. */
function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  if (value < min) return min
  if (value > max) return max
  return value
}

/** Coerce to an integer in [min, max] (rounding), else `fallback`. */
function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, Math.round(value)))
}

/** Accept `value` only if it is a member of `allowed`, else `fallback`. */
function coerceEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback
}

// ---------------------------------------------------------------------------
// Field sanitisers
// ---------------------------------------------------------------------------

function sanitizeChord(raw: unknown): Chord | null {
  if (!isRecord(raw)) return null
  const family = raw.family
  if (typeof family !== 'string' || !(CHORD_FAMILIES as readonly string[]).includes(family)) {
    return null
  }
  // A chord with an out-of-range/invalid root is recoverable: clamp the root
  // rather than dropping the whole chord.
  const root = clampInt(raw.root, 0, 11, 0)
  return { root, family: family as ChordFamily }
}

/**
 * Coerce one slot. A slot is always present and always valid; an unrecoverable
 * chord becomes `null` (empty slot) rather than failing the whole scene.
 */
function sanitizeSlot(raw: unknown): Slot {
  const record = isRecord(raw) ? raw : {}
  const chord = sanitizeChord(record.chord)

  // SlotDuration is a numeric union; match by value against SLOT_DURATIONS.
  let durationBars: SlotDuration = 1
  const d = record.durationBars
  if (typeof d === 'number' && (SLOT_DURATIONS as readonly number[]).includes(d)) {
    durationBars = d as SlotDuration
  }

  return { chord, durationBars }
}

/** Ensure exactly SLOT_COUNT slots: truncate extras, pad shortfall with empties. */
function sanitizeSlots(raw: unknown): Slot[] {
  const input = Array.isArray(raw) ? raw : []
  const slots: Slot[] = []
  for (let i = 0; i < SLOT_COUNT; i++) {
    slots.push(sanitizeSlot(input[i]))
  }
  return slots
}

function sanitizeMacros(raw: unknown): MacroValues {
  const record = isRecord(raw) ? raw : {}
  return {
    tension: clampNumber(record.tension, 0, 1, 0.4),
    spread: clampNumber(record.spread, 0, 1, 0.4),
    motion: clampNumber(record.motion, 0, 1, 0.4),
    color: clampNumber(record.color, 0, 1, 0.4),
  }
}

/**
 * Coerce a tuning anchor. A missing/invalid anchor is Fixed C — pre-anchor
 * scenes/links were implicitly C-anchored (pc = midi % 12), so this is the only
 * default that never silently changes what an existing scene sounds like. New
 * scenes get Follow key from `createDefaultScene()`/`twelveTetTuning()` instead.
 */
function sanitizeAnchor(raw: unknown): TuningAnchor {
  if (isRecord(raw)) {
    if (raw.mode === 'key') return { mode: 'key' }
    if (raw.mode === 'fixed') return { mode: 'fixed', pc: clampInt(raw.pc, 0, 11, 0) }
  }
  return { mode: 'fixed', pc: 0 }
}

/**
 * Coerce a tuning to a valid 12-note microtuning. Requires exactly 12 cents
 * entries (our hard scope); anything else — wrong length, non-record, missing —
 * falls back to 12-TET. Individual non-finite cents become 0 rather than
 * discarding the whole table. Each cents value is clamped to ±1200¢ (an octave).
 */
function sanitizeTuning(raw: unknown): SceneTuning {
  const record = isRecord(raw) ? raw : {}
  const anchor = sanitizeAnchor(record.anchor)
  const co = record.centsOffset
  // The 12-TET fallback keeps the sanitised anchor: with an all-zero table the
  // anchor is sonically neutral either way, and preserving a valid one avoids
  // dropping user intent when only the cents table is malformed.
  if (!Array.isArray(co) || co.length !== 12) return { ...twelveTetTuning(), anchor }
  const centsOffset = co.map((c) => clampNumber(c, -1200, 1200, 0))
  const name =
    typeof record.name === 'string' && record.name.trim().length > 0
      ? record.name.slice(0, MAX_TUNING_NAME_LENGTH)
      : TWELVE_TET_NAME
  return { name, centsOffset, anchor }
}

// ---------------------------------------------------------------------------
// Public: sanitizeScene
// ---------------------------------------------------------------------------

/**
 * Coerce an arbitrary unknown value into a fully-valid SceneState. Never throws.
 * Unknown/missing/invalid fields fall back to the corresponding default-scene
 * value; numbers are clamped to safe ranges; enums validated against the
 * type-level const arrays; slots forced to exactly SLOT_COUNT.
 */
export function sanitizeScene(raw: unknown): SceneState {
  const fallback = createDefaultScene()
  const record = isRecord(raw) ? raw : {}

  const mode = coerceEnum<Mode>(record.mode, MODES, fallback.mode)
  const voicingMode = coerceEnum<VoicingMode>(record.voicingMode, VOICING_MODES, fallback.voicingMode)
  const direction = coerceEnum<Direction>(record.direction, DIRECTIONS, fallback.direction)
  const rhythm = coerceEnum<RhythmStyle>(record.rhythm, RHYTHM_STYLES, fallback.rhythm)
  const preset = coerceEnum<PresetId>(record.preset, PRESET_IDS, fallback.preset)

  // seed: any finite number is acceptable; coerce to a non-negative 32-bit int
  // so it stays JSON-stable and reproducible.
  const seed =
    typeof record.seed === 'number' && Number.isFinite(record.seed)
      ? Math.floor(Math.abs(record.seed)) >>> 0
      : fallback.seed

  return {
    version: SCENE_VERSION,
    keyRoot: clampInt(record.keyRoot, 0, 11, fallback.keyRoot),
    mode,
    slots: sanitizeSlots(record.slots),
    loopLength: clampInt(record.loopLength, 1, SLOT_COUNT, fallback.loopLength),
    voicingMode,
    direction,
    rhythm,
    bpm: clampNumber(record.bpm, 40, 240, fallback.bpm),
    swing: clampNumber(record.swing, 0, 1, fallback.swing),
    preset,
    macros: sanitizeMacros(record.macros),
    seed,
    octaveShift: clampInt(record.octaveShift, OCTAVE_SHIFT_MIN, OCTAVE_SHIFT_MAX, fallback.octaveShift),
    tuning: sanitizeTuning(record.tuning),
  }
}

// ---------------------------------------------------------------------------
// Migrations
// ---------------------------------------------------------------------------

/**
 * A migration steps a raw scene object up exactly one schema version. Migrations
 * operate on `unknown` (loosely-typed) data and need only move/rename/default
 * fields — final coercion is always done by `sanitizeScene` afterwards, so a
 * migration may be conservative and leave clean-up to the sanitiser.
 */
type Migration = (raw: Record<string, unknown>) => Record<string, unknown>

/**
 * Forward migrations keyed by the version they migrate *from*. To add v1→v2:
 * bump SCENE_VERSION in types.ts and add `1: (raw) => ({ ...raw, version: 2, ... })`.
 *
 * v0→v1 is the seed example: legacy pre-versioned scenes (no/0 `version`) just
 * get stamped with version 1; sanitizeScene fills any genuinely new fields.
 */
const MIGRATIONS: Record<number, Migration> = {
  0: (raw) => ({ ...raw, version: 1 }),
  // v1→v2: `loopLength` was added. Old scenes looped all 8 slots, so default to
  // SLOT_COUNT to preserve their behaviour (sanitizeScene clamps it).
  1: (raw) => ({ ...raw, version: 2, loopLength: SLOT_COUNT }),
  // v2→v3: `octaveShift` was added. Old scenes had no transposition; default 0
  // preserves their register (sanitizeScene clamps it).
  2: (raw) => ({ ...raw, version: 3, octaveShift: 0 }),
  // v3→v4: `tuning` was added. Old scenes were 12-TET; sanitizeTuning defaults a
  // missing tuning to all-zero (12-TET), so their pitch is byte-identical.
  3: (raw) => ({ ...raw, version: 4 }),
  // v4→v5: `tuning.anchor` was added. Old scenes were C-anchored (pc = midi % 12);
  // sanitizeAnchor defaults a missing anchor to Fixed C, so their pitch is
  // byte-identical.
  4: (raw) => ({ ...raw, version: 5 }),
}

/**
 * Read `version`, run forward migrations up to SCENE_VERSION, then sanitise.
 * Never throws. A missing/invalid version is treated as 0 (oldest), so even
 * un-versioned legacy blobs migrate forward cleanly. Returns null when the blob
 * comes from a FUTURE app version (see below) — callers treat that as a load
 * failure and leave the stored blob untouched.
 */
export function migrateScene(raw: unknown): SceneState | null {
  let working: Record<string, unknown> = isRecord(raw) ? { ...raw } : {}

  let version =
    typeof working.version === 'number' && Number.isFinite(working.version)
      ? Math.floor(working.version)
      : 0
  if (version < 0) version = 0

  // Refuse to migrate a scene written by a newer app: we don't know which fields
  // its schema added, so coercing it down to SCENE_VERSION would silently drop
  // them — and autosave would then re-persist the lossy result, destroying the
  // original. Surface as a load failure instead so the stored blob is preserved.
  if (version > SCENE_VERSION) return null

  // Apply each step migration in turn. If a step is missing we still advance the
  // counter (treat as a no-op) so an unexpected gap can't loop forever.
  while (version < SCENE_VERSION) {
    const step = MIGRATIONS[version]
    if (step) working = step(working)
    version += 1
    working.version = version
  }

  return sanitizeScene(working)
}
