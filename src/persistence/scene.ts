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
  type Slot,
  type SlotDuration,
  type VoicingMode,
} from '../types'
import { createDefaultScene } from './defaults'

// ---------------------------------------------------------------------------
// Small coercion helpers (each total — never throws)
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

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
}

/**
 * Read `version`, run forward migrations up to SCENE_VERSION, then sanitise.
 * Never throws. A missing/invalid version is treated as 0 (oldest), so even
 * un-versioned legacy blobs migrate forward cleanly.
 */
export function migrateScene(raw: unknown): SceneState {
  let working: Record<string, unknown> = isRecord(raw) ? { ...raw } : {}

  let version =
    typeof working.version === 'number' && Number.isFinite(working.version)
      ? Math.floor(working.version)
      : 0
  if (version < 0) version = 0

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
