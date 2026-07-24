/**
 * Normalized progression catalog — model, legacy normalization, and selectors.
 *
 * WHY THIS EXISTS
 * The app shipped with a flat genre→preset bank (`PROGRESSION_LIBRARY`) in which
 * the same musical content was copied into several genres under different names
 * (see the catalog audit: 32 exact-duplicate signature groups). This module
 * introduces a *normalized* catalog: one CANONICAL entry per unique musical
 * signature, carrying multiple genre tags and aliases instead of duplicated
 * chord data, plus typed provenance, review status, tags, and richer
 * per-event structure.
 *
 * HOW IT IS BUILT (deterministic, no fabrication)
 *   legacy PROGRESSION_LIBRARY  ──normalizeLegacyLibrary()──▶ base entries
 *                                                    │
 *   curated overrides + new coverage entries ────────┴──▶ CATALOG (frozen)
 *
 * The normalizer is a pure, deterministic function; there is no hidden generator
 * script and no network step. Every base entry gets an HONEST default provenance
 * (`traditional`, review `unverified`): it is a common genre/theory pattern with
 * no external source recorded. The curated overlay (catalogCurated.ts) upgrades a
 * reviewed subset and renames entries whose names implied specific compositions
 * we cannot verify. Nothing here claims an external source it does not have.
 *
 * IDS ARE PERMANENT. An id is derived once from the canonical name slug and then
 * pinned by a golden test (catalog.test.ts). Renaming an entry keeps the id via
 * an explicit `id` override in the curated overlay — ids never change or get
 * reused once shipped.
 */
import { CHORD_FAMILIES, MODES, SLOT_COUNT, SLOT_DURATIONS } from '../types'
import type { Chord, ChordFamily, Mode, PitchClass, SlotDuration } from '../types'
import { mod12, scaleSemitones } from './scales'
import { GENRES, PROGRESSION_LIBRARY, type Genre, type ProgChord } from './progressions'
import { CURATED_ENTRIES, CURATED_OVERRIDES } from './catalogCurated'

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

/**
 * What KIND of thing a catalog entry is. Kept separate so the UI/tests can treat
 * "a common theory cadence", "a genre idiom", and "a reduction of a named work"
 * differently — they carry different provenance expectations.
 */
export const CLASSIFICATIONS = [
  'generic-theory', // a common, teachable theory pattern (ii–V–I, Axis, 12-bar blues)
  'genre-pattern', // an idiom associated with one or more genres
  'composition-reduction', // a simplified harmonic outline of a named composition
  'original-editorial', // an original/editorial pattern authored for this catalog
] as const
export type Classification = (typeof CLASSIFICATIONS)[number]

/** Editorial review state. Drives UI labelling and audit reporting. */
export const REVIEW_STATES = ['reviewed', 'draft', 'unverified'] as const
export type ReviewStatus = (typeof REVIEW_STATES)[number]

/** How complete the stored harmony is *relative to the app's 8-slot model*. */
export const COMPLETENESS = [
  'complete', // fully expresses the pattern within the app model
  'excerpt', // a fragment of a longer piece
  'simplified', // real piece, harmony reduced
  'reharmonized', // deliberately altered harmony
  'reduction', // an eight-slot reduction of a larger form
] as const
export type Completeness = (typeof COMPLETENESS)[number]

/**
 * Provenance kind. The three "no external source" kinds are first-class and
 * honest: they say exactly why no citation is attached.
 */
export const PROVENANCE_KINDS = [
  'traditional', // traditional / common-practice pattern; no single author
  'internal-theory-review', // asserted from standard music theory, reviewed in-house
  'unverified', // name/attribution could not be established
  'textbook', // a music-theory text (title/author/section recorded)
  'reference-work', // encyclopaedic / reference source
  'artist-material', // official artist/publisher material
] as const
export type ProvenanceKind = (typeof PROVENANCE_KINDS)[number]

/** Harmonic-intent + function tags. Deliberate chromaticism is annotated, never
 *  rejected — tests use these to tell intent apart from unexplained data. */
export const HARMONY_TAGS = [
  'cadence',
  'vamp',
  'modal',
  'borrowed',
  'chromatic',
  'turnaround',
  'blues',
  'line-cliche',
  'planing',
  'modulation',
  'pedal',
  'diatonic',
] as const
export type HarmonyTag = (typeof HARMONY_TAGS)[number]

const GENRE_SET = new Set<string>(GENRES)
const MODE_SET = new Set<string>(MODES)
const FAMILY_SET = new Set<string>(CHORD_FAMILIES)

// ---------------------------------------------------------------------------
// Provenance
// ---------------------------------------------------------------------------

/**
 * A typed provenance record. All descriptive fields are optional so the three
 * no-external-source kinds can omit citation fields honestly. `supports` states
 * exactly what the source is claimed to back — never more.
 */
export interface Provenance {
  kind: ProvenanceKind
  title?: string
  author?: string
  publisher?: string
  url?: string
  isbn?: string
  published?: string // ISO date or year
  accessed?: string // ISO date the source was consulted
  locator?: string // page / section / chapter / timestamp
  supports?: string // the specific claim the source backs
  notes?: string // editorial notes
  reviewer?: string
  reviewDate?: string
  license?: string
}

// ---------------------------------------------------------------------------
// Progression events (Phase-3 model)
// ---------------------------------------------------------------------------

/**
 * One event in a progression. Extends the legacy flat chord with per-event
 * duration and — as CATALOG-ONLY METADATA (see README/architecture) — inversion,
 * slash bass, and a local key centre. `durationBars` is wired end-to-end into
 * playback/persistence/sharing; the metadata fields are intentionally NOT sent to
 * the audio/MIDI path yet (guarded by a boundary test) and exist so the catalog
 * can record them losslessly.
 */
export interface ProgEvent {
  /** null = a rest slot. */
  chord: ProgChord | null
  /** Bars this event sounds. Defaults to 1 when omitted. WIRED to playback. */
  durationBars?: SlotDuration
  /** 0=root..3, inversion hint. CATALOG-ONLY metadata. */
  inversion?: number
  /** Slash bass as a semitone offset above the tonic. CATALOG-ONLY metadata. */
  bass?: number
  /** Local tonicization centre (semitone offset above tonic). CATALOG-ONLY. */
  keyCenter?: number
}

/** A named span of events. CATALOG-ONLY metadata. */
export interface Section {
  name: string
  /** Inclusive start / exclusive end event indices. */
  start: number
  end: number
}

/**
 * A normalized, canonical progression. Data only — selectors live below, the UI
 * lives elsewhere. Frozen at module load.
 */
export interface CatalogEntry {
  /** Permanent stable id. Never change or reuse once shipped. */
  id: string
  name: string
  aliases: string[]
  classification: Classification
  /** One or more genre tags (canonical entries can belong to several genres). */
  genres: Genre[]
  /** Suggested mode / tonal centre. */
  mode?: Mode
  events: ProgEvent[]
  tags: HarmonyTag[]
  description: string
  provenance: Provenance
  review: ReviewStatus
  completeness: Completeness
  /** 0–1 verification confidence (optional). */
  confidence?: number
  /**
   * Human note on harmonic intent, present whenever the entry contains
   * non-diatonic harmony so tests can tell deliberate colour from stray data.
   */
  harmonicIntent?: string
  // ---- catalog-only recommendations (not wired to playback) ----
  tempoRange?: [number, number]
  playStyle?: string
  voicing?: string
  performanceNotes?: string
  sections?: Section[]
  pickup?: ProgEvent
  altEndings?: ProgEvent[][]
}

// ---------------------------------------------------------------------------
// Signature + id helpers
// ---------------------------------------------------------------------------

/** Musical signature of an event list, independent of name/genre/metadata. */
export function signatureOfEvents(events: ProgEvent[]): string {
  return events.map((e) => (e.chord ? `${e.chord.offset}:${e.chord.family}` : '_')).join('|')
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip accents (é → e)
    .replace(/[♭b]/g, 'b')
    .replace(/[♯#]/g, 's')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// ---------------------------------------------------------------------------
// Legacy normalization
// ---------------------------------------------------------------------------

interface LegacyRow {
  genre: Genre
  name: string
  mode?: Mode
  chords: (ProgChord | null)[]
  order: number // global iteration order for deterministic tie-breaks
}

function flattenLegacy(): LegacyRow[] {
  const rows: LegacyRow[] = []
  let order = 0
  for (const genre of GENRES) {
    for (const p of PROGRESSION_LIBRARY[genre]) {
      rows.push({ genre, name: p.name, mode: p.mode, chords: p.chords, order: order++ })
    }
  }
  return rows
}

/** Whether every chord root sits inside the mode's diatonic scale. */
function isDiatonic(events: ProgEvent[], mode: Mode): boolean {
  const scale = new Set(scaleSemitones(mode))
  return events.every((e) => e.chord === null || scale.has(mod12(e.chord.offset)))
}

/**
 * Build canonical base entries from the legacy library by grouping rows on their
 * musical signature. Deterministic: rows are visited in GENRES order; within a
 * signature group the first-seen name is canonical, the rest become aliases, and
 * genres are collected in GENRES order.
 */
export function normalizeLegacyLibrary(): CatalogEntry[] {
  const groups = new Map<string, LegacyRow[]>()
  for (const row of flattenLegacy()) {
    const sig = row.chords.map((c) => (c ? `${c.offset}:${c.family}` : '_')).join('|')
    ;(groups.get(sig) ?? groups.set(sig, []).get(sig)!).push(row)
  }

  const usedSlugs = new Map<string, number>()
  const entries: CatalogEntry[] = []

  // Preserve first-appearance order of each signature for stable id assignment.
  const orderedSigs = [...groups.entries()].sort(
    (a, b) => Math.min(...a[1].map((r) => r.order)) - Math.min(...b[1].map((r) => r.order)),
  )

  for (const [, rows] of orderedSigs) {
    rows.sort((a, b) => a.order - b.order)
    const canonical = rows[0]
    const names = [...new Set(rows.map((r) => r.name))]
    const aliases = names.slice(1)
    const genresSet = new Set(rows.map((r) => r.genre))
    const genresList = GENRES.filter((g) => genresSet.has(g))
    const mode = rows.find((r) => r.mode)?.mode

    // Assign a permanent id from the canonical name slug, disambiguating
    // collisions deterministically (`-2`, `-3`, … in first-appearance order).
    let slug = slugify(canonical.name) || 'progression'
    const n = usedSlugs.get(slug) ?? 0
    usedSlugs.set(slug, n + 1)
    if (n > 0) slug = `${slug}-${n + 1}`

    const events: ProgEvent[] = canonical.chords.map((c) => ({ chord: c }))
    const nonDiatonic = mode ? !isDiatonic(events, mode) : false

    entries.push({
      id: slug,
      name: canonical.name,
      aliases,
      classification: 'genre-pattern',
      genres: genresList,
      mode,
      events,
      tags: nonDiatonic ? ['chromatic'] : [],
      description: '',
      provenance: {
        kind: 'traditional',
        supports: 'common genre / theory pattern',
        notes:
          'Normalized from the legacy genre bank; no external source recorded. ' +
          'Marked traditional/unverified pending editorial review.',
      },
      review: 'unverified',
      completeness: 'complete',
      harmonicIntent: nonDiatonic
        ? 'Contains non-diatonic chords (auto-detected from mode; not individually reviewed).'
        : undefined,
    })
  }
  return entries
}

// ---------------------------------------------------------------------------
// Curated overlay merge → the shipped catalog
// ---------------------------------------------------------------------------

/** A partial override applied to a base entry by id (curated review). */
export type CatalogOverride = Partial<Omit<CatalogEntry, 'id'>> & { id: string }

function applyOverride(base: CatalogEntry, ov: CatalogOverride): CatalogEntry {
  const merged: CatalogEntry = { ...base }
  for (const [k, v] of Object.entries(ov)) {
    if (k === 'id' || v === undefined) continue
    // Merge aliases additively (keeps legacy names discoverable) and dedupe.
    if (k === 'aliases') {
      merged.aliases = [...new Set([...base.aliases, ...(v as string[])])]
    } else {
      ;(merged as unknown as Record<string, unknown>)[k] = v
    }
  }
  // On a rename, keep the previous canonical name discoverable as an alias and
  // ensure the (new) canonical name never appears in its own alias list.
  if (ov.name && ov.name !== base.name) {
    merged.aliases = [...new Set([base.name, ...merged.aliases])]
  }
  merged.aliases = merged.aliases.filter((a) => a !== merged.name)
  // Recompute the diatonic intent note if a curated mode/events changed things,
  // but never clobber an explicit curated harmonicIntent.
  if (ov.harmonicIntent === undefined && merged.mode) {
    const nonDiatonic = !isDiatonic(merged.events, merged.mode)
    if (nonDiatonic && !merged.tags.some((t) => INTENT_TAGS.has(t))) {
      merged.tags = [...merged.tags, 'chromatic']
    }
  }
  return merged
}

/** Tags that count as an explicit harmonic-intent annotation. */
export const INTENT_TAGS = new Set<HarmonyTag>([
  'borrowed',
  'chromatic',
  'modal',
  'planing',
  'turnaround',
  'blues',
  'line-cliche',
  'modulation',
])

function buildCatalog(): CatalogEntry[] {
  const base = normalizeLegacyLibrary()
  const overrideMap = new Map(CURATED_OVERRIDES.map((o) => [o.id, o]))
  const merged = base.map((e) => {
    const ov = overrideMap.get(e.id)
    return ov ? applyOverride(e, ov) : e
  })
  const all = [...merged, ...CURATED_ENTRIES]
  // Freeze deeply enough to keep the catalog immutable/deterministic at runtime.
  return all.map((e) => Object.freeze({ ...e, events: e.events.map((ev) => Object.freeze(ev)) }))
}

/** The shipped, normalized catalog. Built once, frozen. */
export const CATALOG: readonly CatalogEntry[] = Object.freeze(buildCatalog())

// ---------------------------------------------------------------------------
// Selectors (pure; data stays separate from UI)
// ---------------------------------------------------------------------------

export function allEntries(): readonly CatalogEntry[] {
  return CATALOG
}

export function resolveById(id: string): CatalogEntry | undefined {
  return CATALOG.find((e) => e.id === id)
}

export function progressionsForGenre(genre: Genre): CatalogEntry[] {
  return CATALOG.filter((e) => e.genres.includes(genre))
}

/** Case-insensitive search over name + aliases (and id as a fallback). */
export function searchProgressions(query: string): CatalogEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return [...CATALOG]
  return CATALOG.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.aliases.some((a) => a.toLowerCase().includes(q)) ||
      e.id.includes(q),
  )
}

export function filterByMode(mode: Mode): CatalogEntry[] {
  return CATALOG.filter((e) => e.mode === mode)
}

export function filterByFamily(family: ChordFamily): CatalogEntry[] {
  return CATALOG.filter((e) => e.events.some((ev) => ev.chord?.family === family))
}

export function filterByTag(tag: HarmonyTag): CatalogEntry[] {
  return CATALOG.filter((e) => e.tags.includes(tag))
}

export function filterByLength(min: number, max: number): CatalogEntry[] {
  return CATALOG.filter((e) => e.events.length >= min && e.events.length <= max)
}

export function filterByReview(status: ReviewStatus): CatalogEntry[] {
  return CATALOG.filter((e) => e.review === status)
}

// ---------------------------------------------------------------------------
// Instantiation (catalog entry → concrete, key-rooted slots for loading)
// ---------------------------------------------------------------------------

export interface LoadPayload {
  chords: (Chord | null)[]
  durations: SlotDuration[]
  mode?: Mode
}

/**
 * Instantiate an entry into concrete chords + per-event durations for a key.
 * Only the WIRED fields (chord, durationBars) cross into the app; inversion /
 * bass / sections stay in the catalog. Truncates to SLOT_COUNT (padding is the
 * reducer's job).
 */
export function entryToLoad(entry: CatalogEntry, keyRoot: PitchClass): LoadPayload {
  const events = entry.events.slice(0, SLOT_COUNT)
  return {
    chords: events.map((e) =>
      e.chord ? { root: mod12(keyRoot + e.chord.offset), family: e.chord.family } : null,
    ),
    durations: events.map((e) => normalizeDuration(e.durationBars)),
    mode: entry.mode,
  }
}

function normalizeDuration(d: SlotDuration | undefined): SlotDuration {
  return d !== undefined && (SLOT_DURATIONS as readonly number[]).includes(d) ? d : 1
}

// ---------------------------------------------------------------------------
// Validation helpers (shared by tests + the curated overlay author)
// ---------------------------------------------------------------------------

export function isValidGenre(g: string): g is Genre {
  return GENRE_SET.has(g)
}
export function isValidMode(m: string): m is Mode {
  return MODE_SET.has(m)
}
export function isValidFamily(f: string): f is ChordFamily {
  return FAMILY_SET.has(f)
}
