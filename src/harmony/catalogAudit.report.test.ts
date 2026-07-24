/**
 * Printed catalog-audit report. Not an assertion test — it exists so the audit
 * can be produced with a plain `vitest run` (no extra tooling/deps). Invariants
 * are asserted separately in catalog.test.ts. Run via `npm run catalog:audit`.
 *
 * The report runs over the NORMALIZED catalog (one row per canonical entry, with
 * its full genre-tag list), so cross-genre membership is reported as coverage,
 * not as duplication.
 */
import { it, expect } from 'vitest'
import { CATALOG } from './catalog'
import { computeCatalogAudit, formatCatalogAudit, type AuditRow } from './catalogAudit'

function catalogRows(): AuditRow[] {
  return CATALOG.map((e) => ({
    id: e.id,
    genres: e.genres,
    name: e.name,
    mode: e.mode,
    chords: e.events.map((ev) => ev.chord),
    reviewStatus: e.review,
    provenanceKind: e.provenance.kind,
    completeness: e.completeness,
  }))
}

it('prints the catalog audit', () => {
  const audit = computeCatalogAudit(catalogRows())
  // Only print under the `catalog:audit` command (MCHORD_AUDIT=1) so the normal
  // test run stays quiet; the invariant below keeps this file meaningful in CI.
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
  if (env?.MCHORD_AUDIT) {
    console.log('\n' + formatCatalogAudit(audit))
  }
  expect(audit.uniqueSignatures).toBe(CATALOG.length)
})
