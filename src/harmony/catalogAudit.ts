/**
 * Catalog audit — a pure, deterministic report over the progression catalog.
 *
 * This is the single source of truth for catalog-quality facts: counts, unique
 * musical signatures, exact duplicates (within and across genres), rotations /
 * near-duplicates, and coverage of modes, chord families, root offsets, length,
 * and rests. It powers both the `catalog:audit` command (a printed report) and
 * the catalog regression tests, so the numbers reported to humans and the
 * numbers asserted by CI can never drift apart.
 *
 * It operates on a *flattened* view of the catalog (one row per genre membership)
 * so it works unchanged against both the legacy `PROGRESSION_LIBRARY` shape and
 * the normalized catalog. Nothing here imports the catalog directly; callers pass
 * the rows in, which keeps the audit reusable and trivially testable.
 */
import { CHORD_FAMILIES, MODES } from '../types'
import type { ChordFamily, Mode } from '../types'
import type { ProgChord } from './progressions'

/**
 * One catalog row as the audit sees it. For the normalized catalog this is one
 * CANONICAL entry (with all its genre tags in `genres`); for the legacy bank it
 * is one preset under one `genre`. Either form is accepted so the audit reports
 * identically on both.
 */
export interface AuditRow {
  /** Stable id when available (normalized catalog); undefined for legacy data. */
  id?: string
  /** Legacy single-genre membership. */
  genre?: string
  /** Normalized multi-genre tags. Takes precedence over `genre` when present. */
  genres?: string[]
  name: string
  mode?: Mode
  chords: (ProgChord | null)[]
  /** Provenance/review status when available (normalized catalog only). */
  reviewStatus?: string
  provenanceKind?: string
  /** Whether the entry declares itself an excerpt/reduction/simplification. */
  completeness?: string
}

/** The genre list a row belongs to, from either the legacy or normalized shape. */
function genresOf(row: AuditRow): string[] {
  if (row.genres && row.genres.length) return row.genres
  return row.genre ? [row.genre] : []
}

/**
 * Normalized musical signature of a progression, independent of display name and
 * genre. `_` marks a rest; each chord is `offset:family`. This is the key used to
 * detect exact musical duplicates.
 */
export function signatureOf(chords: (ProgChord | null)[]): string {
  return chords.map((c) => (c ? `${c.offset}:${c.family}` : '_')).join('|')
}

/**
 * Canonical rotation key: the lexicographically smallest rotation of the chord
 * sequence. Two vamps that are rotations of each other (same cycle, different
 * starting chord) share a rotation key but differ in signature — useful for
 * surfacing "is this just a rotation of that?" without treating them as exact
 * duplicates (a different starting chord can change harmonic function/genre use).
 */
export function rotationKeyOf(chords: (ProgChord | null)[]): string {
  const tokens = chords.map((c) => (c ? `${c.offset}:${c.family}` : '_'))
  if (tokens.length === 0) return ''
  let best: string | null = null
  for (let i = 0; i < tokens.length; i++) {
    const rot = tokens.slice(i).concat(tokens.slice(0, i)).join('|')
    if (best === null || rot < best) best = rot
  }
  return best ?? ''
}

export interface DuplicateGroup {
  signature: string
  rows: AuditRow[]
}

export interface RotationGroup {
  rotationKey: string
  /** Distinct signatures that share this rotation key (>1 ⇒ genuine rotations). */
  signatures: string[]
  rows: AuditRow[]
}

export interface CoverageReport {
  modes: Record<string, number>
  families: Record<string, number>
  offsets: Record<number, number>
  lengths: Record<number, number>
  withRests: number
  /** Modes/families that appear in zero entries. */
  unusedModes: string[]
  unusedFamilies: string[]
}

export interface CatalogAudit {
  totalRows: number
  /** Unique musical signatures across the whole catalog. */
  uniqueSignatures: number
  perGenreCounts: Record<string, number>
  /** Signatures used by >1 row (exact musical duplicates), name-independent. */
  exactDuplicates: DuplicateGroup[]
  /** Duplicates whose rows are all in the *same* genre (the worst kind). */
  sameGenreDuplicates: DuplicateGroup[]
  /** Rotation families spanning >1 distinct signature (rotations/near-dupes). */
  rotations: RotationGroup[]
  coverage: CoverageReport
  /** Rows whose name hints at an abbreviated named work (heuristic). */
  possiblyAbbreviated: AuditRow[]
  /** Provenance kind → count (normalized catalog only). */
  provenanceByKind: Record<string, number>
  /** Review status → count (normalized catalog only). */
  reviewByStatus: Record<string, number>
  /** Rows explicitly marked `unverified` — the only truly-unsourced bucket. */
  unverified: AuditRow[]
}

/** Heuristic: names suggesting a truncated transcription of a named composition. */
const ABBREV_HINT = /\b(excerpt|reduction|intro|verse|chorus|section|part|theme|bridge|coda)\b/i

export function computeCatalogAudit(rows: AuditRow[]): CatalogAudit {
  const bySignature = new Map<string, AuditRow[]>()
  const byRotation = new Map<string, AuditRow[]>()
  const perGenreCounts: Record<string, number> = {}
  const modes: Record<string, number> = {}
  const families: Record<string, number> = {}
  const offsets: Record<number, number> = {}
  const lengths: Record<number, number> = {}
  let withRests = 0
  const possiblyAbbreviated: AuditRow[] = []
  const unverified: AuditRow[] = []
  const provenanceByKind: Record<string, number> = {}
  const reviewByStatus: Record<string, number> = {}

  for (const m of MODES) modes[m] = 0
  for (const f of CHORD_FAMILIES) families[f] = 0

  for (const row of rows) {
    for (const g of genresOf(row)) perGenreCounts[g] = (perGenreCounts[g] ?? 0) + 1

    const sig = signatureOf(row.chords)
    ;(bySignature.get(sig) ?? bySignature.set(sig, []).get(sig)!).push(row)
    const rot = rotationKeyOf(row.chords)
    ;(byRotation.get(rot) ?? byRotation.set(rot, []).get(rot)!).push(row)

    if (row.mode) modes[row.mode] = (modes[row.mode] ?? 0) + 1
    const len = row.chords.length
    lengths[len] = (lengths[len] ?? 0) + 1
    if (row.chords.some((c) => c === null)) withRests++
    for (const c of row.chords) {
      if (!c) continue
      families[c.family] = (families[c.family] ?? 0) + 1
      offsets[c.offset] = (offsets[c.offset] ?? 0) + 1
    }

    if (ABBREV_HINT.test(row.name)) possiblyAbbreviated.push(row)
    if (row.provenanceKind !== undefined) {
      provenanceByKind[row.provenanceKind] = (provenanceByKind[row.provenanceKind] ?? 0) + 1
    }
    if (row.reviewStatus !== undefined) {
      reviewByStatus[row.reviewStatus] = (reviewByStatus[row.reviewStatus] ?? 0) + 1
    }
    if (row.provenanceKind === 'unverified') unverified.push(row)
  }

  const exactDuplicates: DuplicateGroup[] = []
  for (const [signature, groupRows] of bySignature) {
    if (groupRows.length > 1) exactDuplicates.push({ signature, rows: groupRows })
  }
  const sameGenreDuplicates = exactDuplicates.filter((group) => {
    // A duplicate is "same-genre" when two DISTINCT rows sharing a signature also
    // share a genre — i.e. the same musical content is listed twice in one bank.
    // (A single normalized entry tagged with several genres is NOT a duplicate.)
    const seen = new Set<string>()
    for (const r of group.rows) {
      for (const g of genresOf(r)) {
        if (seen.has(g)) return true
        seen.add(g)
      }
    }
    return false
  })

  const rotations: RotationGroup[] = []
  for (const [rotationKey, groupRows] of byRotation) {
    const sigs = new Set(groupRows.map((r) => signatureOf(r.chords)))
    if (sigs.size > 1) {
      rotations.push({ rotationKey, signatures: [...sigs], rows: groupRows })
    }
  }

  const unusedModes = MODES.filter((m) => modes[m] === 0)
  const unusedFamilies = CHORD_FAMILIES.filter((f) => families[f] === 0)

  // Sort for deterministic output.
  const sortGroups = (a: DuplicateGroup, b: DuplicateGroup) =>
    a.signature < b.signature ? -1 : a.signature > b.signature ? 1 : 0
  exactDuplicates.sort(sortGroups)
  sameGenreDuplicates.sort(sortGroups)
  rotations.sort((a, b) => (a.rotationKey < b.rotationKey ? -1 : 1))

  return {
    totalRows: rows.length,
    uniqueSignatures: bySignature.size,
    perGenreCounts,
    exactDuplicates,
    sameGenreDuplicates,
    rotations,
    coverage: {
      modes,
      families: families as Record<ChordFamily, number>,
      offsets,
      lengths,
      withRests,
      unusedModes,
      unusedFamilies,
    },
    possiblyAbbreviated,
    provenanceByKind,
    reviewByStatus,
    unverified,
  }
}

/** Compact "genre[,genre]" label for a row in the printed report. */
function rowGenres(r: AuditRow): string {
  return genresOf(r).join(',')
}

/** Render a concise, human-readable report from a computed audit. */
export function formatCatalogAudit(a: CatalogAudit): string {
  const L: string[] = []
  L.push('# mchord catalog audit')
  L.push('')
  L.push(`Total rows (genre memberships): ${a.totalRows}`)
  L.push(`Unique musical signatures:      ${a.uniqueSignatures}`)
  L.push('')
  L.push('## Per-genre counts')
  for (const g of Object.keys(a.perGenreCounts).sort()) {
    L.push(`  ${g.padEnd(16)} ${a.perGenreCounts[g]}`)
  }
  L.push('')
  L.push(`## Exact musical duplicates (name-independent): ${a.exactDuplicates.length}`)
  for (const g of a.exactDuplicates) {
    L.push(`  [${g.signature}]`)
    for (const r of g.rows) L.push(`      ${rowGenres(r)} / "${r.name}"`)
  }
  L.push('')
  L.push(`## Same-genre duplicates: ${a.sameGenreDuplicates.length}`)
  for (const g of a.sameGenreDuplicates) {
    L.push(`  [${g.signature}]`)
    for (const r of g.rows) L.push(`      ${rowGenres(r)} / "${r.name}"`)
  }
  L.push('')
  L.push(`## Rotation families (different start, same cycle): ${a.rotations.length}`)
  for (const g of a.rotations.slice(0, 40)) {
    L.push(`  ${g.rows.map((r) => `${rowGenres(r)}/"${r.name}"`).join('  ·  ')}`)
  }
  L.push('')
  L.push('## Coverage — modes')
  for (const m of MODES) {
    const n = a.coverage.modes[m] ?? 0
    L.push(`  ${m.padEnd(16)} ${n}${n === 0 ? '   <-- UNUSED' : ''}`)
  }
  L.push('')
  L.push('## Coverage — chord families')
  for (const f of CHORD_FAMILIES) {
    const n = a.coverage.families[f] ?? 0
    L.push(`  ${f.padEnd(10)} ${n}${n === 0 ? '   <-- UNUSED' : ''}`)
  }
  L.push('')
  L.push('## Coverage — lengths')
  for (const len of Object.keys(a.coverage.lengths).map(Number).sort((x, y) => x - y)) {
    L.push(`  ${len} chords: ${a.coverage.lengths[len]}`)
  }
  L.push(`  with rests: ${a.coverage.withRests}`)
  L.push('')
  L.push(`## Possibly-abbreviated named works: ${a.possiblyAbbreviated.length}`)
  for (const r of a.possiblyAbbreviated) L.push(`  ${rowGenres(r)} / "${r.name}"`)
  L.push('')
  L.push('## Provenance by kind')
  for (const k of Object.keys(a.provenanceByKind).sort()) {
    L.push(`  ${k.padEnd(24)} ${a.provenanceByKind[k]}`)
  }
  L.push('')
  L.push('## Review status')
  for (const s of Object.keys(a.reviewByStatus).sort()) {
    L.push(`  ${s.padEnd(12)} ${a.reviewByStatus[s]}`)
  }
  L.push('')
  L.push(`## Explicitly unverified (attribution not established): ${a.unverified.length}`)
  for (const r of a.unverified) L.push(`  ${rowGenres(r)} / "${r.name}"`)
  return L.join('\n')
}
