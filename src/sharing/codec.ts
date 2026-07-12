/**
 * Backend-free share codec: SceneState ⇆ a self-contained URL fragment.
 *
 * The wire format is a COMPACT JSON object: short single/double-letter keys and
 * integer indices into the type-level const arrays (MODES, VOICING_MODES, …)
 * instead of the verbose string enums. Enum *indices* are stable as long as the
 * const arrays only ever append (the types.ts comments already require this), so
 * the compact form is itself versioned via `v` and decoded back through
 * `sanitizeScene`, which tolerates anything out of range.
 *
 * Pipeline: compact obj → JSON → encodeURIComponent → btoa → URL-safe base64.
 * `btoa` needs Latin-1, and encodeURIComponent guarantees an ASCII-safe string,
 * so the pair round-trips arbitrary Unicode safely and stays dependency-free.
 * The base64 is then made URL-safe (+/ → -_, no padding) so linkifiers can't
 * mangle the fragment; decode accepts both alphabets for backward compatibility.
 *
 * The payload is tiny (8 slots), so plain base64 is fine. If the scene ever
 * grew large, this is exactly where an lz-string / DEFLATE pass would slot in
 * (compress the JSON string before btoa, decompress after atob) — no other
 * change needed.
 */
import {
  CHORD_FAMILIES,
  DIRECTIONS,
  MODES,
  PRESET_IDS,
  RHYTHM_STYLES,
  SLOT_COUNT,
  SLOT_DURATIONS,
  VOICING_MODES,
  type SceneState,
  type Slot,
} from '../types'
import { sanitizeScene } from '../persistence/scene'

/** Stable URL-fragment param key: `…#s=<payload>`. */
const FRAGMENT_KEY = 's'

/** Compact-format version (independent of SCENE_VERSION; bump on format change).
 *  v2 added `ll` (loopLength); links without it decode as a full 8-slot loop.
 *  v3 added `t`/`tn` (tuning cents + name); links without them decode as 12-TET.
 *  v4 added `ta` (tuning anchor); links without it decode as Fixed C — the
 *  pre-anchor behaviour, so old links sound bit-identical. */
const COMPACT_VERSION = 4

/**
 * Compact slot: `[familyIndex, root, durationIndex]` for a filled slot, or
 * `[-1, 0, durationIndex]` for an empty one (family index -1 = no chord).
 */
type CompactSlot = [number, number, number]

interface CompactScene {
  v: number // compact format version
  k: number // keyRoot 0–11
  m: number // mode index
  s: CompactSlot[] // slots
  ll: number // loopLength 1–SLOT_COUNT
  vm: number // voicingMode index
  d: number // direction index
  r: number // rhythm index
  b: number // bpm
  sw: number // swing 0–1
  p: number // preset index
  // macros as a fixed-order tuple: [tension, spread, motion, color]
  mc: [number, number, number, number]
  sd: number // seed
  t: number[] // tuning cents offsets (length 12)
  tn: string // tuning display name
  ta: number // tuning anchor: -1 = follow key, 0–11 = fixed pitch class
}

function indexOf<T extends string>(arr: readonly T[], value: T): number {
  // Always present for a valid SceneState; -1 can't happen post-sanitise but is
  // harmless (decode clamps via sanitizeScene).
  return arr.indexOf(value)
}

function encodeSlot(slot: Slot): CompactSlot {
  const durIdx = SLOT_DURATIONS.indexOf(slot.durationBars)
  if (slot.chord === null) return [-1, 0, durIdx]
  return [CHORD_FAMILIES.indexOf(slot.chord.family), slot.chord.root, durIdx]
}

function decodeSlot(raw: unknown): unknown {
  // Produce a *loose* slot object for sanitizeScene to finalise. Anything
  // malformed becomes an empty slot once sanitised.
  if (!Array.isArray(raw)) return {}
  const [familyIdx, root, durIdx] = raw as unknown[]
  const fi = typeof familyIdx === 'number' ? familyIdx : -1
  const di = typeof durIdx === 'number' ? durIdx : -1
  const durationBars = SLOT_DURATIONS[di] ?? 1
  if (fi < 0 || fi >= CHORD_FAMILIES.length) {
    return { chord: null, durationBars }
  }
  return {
    chord: { family: CHORD_FAMILIES[fi], root: typeof root === 'number' ? root : 0 },
    durationBars,
  }
}

function toCompact(scene: SceneState): CompactScene {
  return {
    v: COMPACT_VERSION,
    k: scene.keyRoot,
    m: indexOf(MODES, scene.mode),
    s: scene.slots.map(encodeSlot),
    ll: scene.loopLength,
    vm: indexOf(VOICING_MODES, scene.voicingMode),
    d: indexOf(DIRECTIONS, scene.direction),
    r: indexOf(RHYTHM_STYLES, scene.rhythm),
    b: scene.bpm,
    sw: scene.swing,
    p: indexOf(PRESET_IDS, scene.preset),
    mc: [scene.macros.tension, scene.macros.spread, scene.macros.motion, scene.macros.color],
    sd: scene.seed,
    t: scene.tuning.centsOffset,
    tn: scene.tuning.name,
    ta: scene.tuning.anchor.mode === 'key' ? -1 : scene.tuning.anchor.pc,
  }
}

/**
 * Anchor wire form → loose anchor object for sanitizeTuning to finalise
 * (it clamps the pc and defaults anything unrecognised to Fixed C). Pre-v4
 * links carry no `ta`: returning undefined lets that same Fixed-C default
 * apply, keeping codec and session sanitiser bounds in exact parity.
 */
function decodeAnchor(ta: unknown): unknown {
  if (ta === -1) return { mode: 'key' }
  if (typeof ta === 'number') return { mode: 'fixed', pc: ta }
  return undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Build a loose SceneState-shaped object from a compact payload for sanitising. */
function fromCompact(raw: unknown): Record<string, unknown> {
  if (!isRecord(raw)) return {}
  const lookup = <T>(arr: readonly T[], idx: unknown): T | undefined =>
    typeof idx === 'number' ? arr[idx] : undefined

  const slots = Array.isArray(raw.s) ? raw.s.map(decodeSlot) : []
  const mc = Array.isArray(raw.mc) ? raw.mc : []

  return {
    keyRoot: raw.k,
    mode: lookup(MODES, raw.m),
    slots,
    // Pre-v2 links have no `ll`; treat them as the original full 8-slot loop.
    loopLength: typeof raw.ll === 'number' ? raw.ll : SLOT_COUNT,
    voicingMode: lookup(VOICING_MODES, raw.vm),
    direction: lookup(DIRECTIONS, raw.d),
    rhythm: lookup(RHYTHM_STYLES, raw.r),
    bpm: raw.b,
    swing: raw.sw,
    preset: lookup(PRESET_IDS, raw.p),
    macros: { tension: mc[0], spread: mc[1], motion: mc[2], color: mc[3] },
    seed: raw.sd,
    // Pre-v3 links carry no tuning; sanitizeScene defaults a missing/invalid
    // tuning to 12-TET, so old links decode byte-identically.
    tuning: { name: raw.tn, centsOffset: raw.t, anchor: decodeAnchor(raw.ta) },
  }
}

// ---------------------------------------------------------------------------
// Base64 over Unicode-safe JSON
// ---------------------------------------------------------------------------

function utf8ToBase64(str: string): string {
  // encodeURIComponent → %XX escapes → unescape gives a Latin-1 string btoa accepts.
  const b64 = btoa(unescape(encodeURIComponent(str)))
  // URL-safe alphabet: +/ → -_ and drop '=' padding. Standard base64 rides in a
  // URL fragment fine per spec, but real-world linkifiers (chat, email) turn '+'
  // into a space and can choke on '/', silently corrupting a shared link.
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64ToUtf8(b64: string): string {
  // Accept both the URL-safe (-_) and legacy (+/) alphabets so links shared
  // before the URL-safe switch still decode. Re-pad to a multiple of 4 for atob.
  let s = b64.replace(/-/g, '+').replace(/_/g, '/')
  const pad = s.length % 4
  if (pad > 0) s += '='.repeat(4 - pad)
  return decodeURIComponent(escape(atob(s)))
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Encode a scene into a compact, URL-fragment-safe base64 string. */
export function encodeScene(scene: SceneState): string {
  // Sanitise first so we never serialise garbage into a share link.
  const compact = toCompact(sanitizeScene(scene))
  return utf8ToBase64(JSON.stringify(compact))
}

/**
 * Decode a compact share string back into a valid SceneState, or null on any
 * malformed input. Never throws — every failure mode returns null, and a
 * structurally-odd-but-decodable payload is salvaged via sanitizeScene.
 */
export function decodeScene(str: string): SceneState | null {
  if (typeof str !== 'string' || str.length === 0) return null
  let json: string
  try {
    json = base64ToUtf8(str)
  } catch {
    return null
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return null
  }
  if (!isRecord(parsed)) return null
  return sanitizeScene(fromCompact(parsed))
}

/** Build a full share URL with the scene in a `#s=` fragment. */
export function sceneToShareUrl(scene: SceneState, baseUrl?: string): string {
  const base = baseUrl ?? defaultBaseUrl()
  return `${base}#${FRAGMENT_KEY}=${encodeScene(scene)}`
}

/**
 * Extract and decode a scene from a hash fragment or full URL. Accepts a bare
 * fragment (`#s=…` or `s=…`) or a complete URL. Returns null if the fragment
 * param is absent or invalid.
 */
export function sceneFromUrl(hashOrUrl: string): SceneState | null {
  if (typeof hashOrUrl !== 'string') return null
  // Take everything after the first '#', if present; otherwise treat the whole
  // string as the fragment body.
  const hashIndex = hashOrUrl.indexOf('#')
  const fragment = hashIndex >= 0 ? hashOrUrl.slice(hashIndex + 1) : hashOrUrl

  // The fragment may carry multiple `&`-separated params; find `s=`.
  for (const part of fragment.split('&')) {
    const eq = part.indexOf('=')
    if (eq < 0) continue
    if (part.slice(0, eq) === FRAGMENT_KEY) {
      return decodeScene(part.slice(eq + 1))
    }
  }
  return null
}

/** Best-effort base URL from the current document, falling back to '' in node. */
function defaultBaseUrl(): string {
  try {
    const loc = (globalThis as { location?: { origin?: string; pathname?: string } }).location
    if (loc?.origin) return `${loc.origin}${loc.pathname ?? ''}`
  } catch {
    // no DOM (tests/SSR)
  }
  return ''
}
