#!/usr/bin/env node
/**
 * Check or re-sync the tuning core vendored into mchord from mdrone.
 *
 * The canonical source is ../mdrone/src/tuning; mchord carries a copy under
 * src/vendor/tuning-core/. Each vendored file is a VERBATIM copy of its upstream
 * counterpart with a generated credit header prepended (source repo, path, the
 * mdrone short SHA, AGPL same-author note). The header is deterministic, so the
 * expected file is exactly `header + upstream-bytes` — this script both verifies
 * that (check) and regenerates it (sync).
 *
 *   npm run vendored:check   # exit 1 if any copy is stale/missing (default)
 *   npm run vendored:sync    # re-copy + re-stamp from ../mdrone
 *
 * Mirrors mbus/scripts/sync-vendored.mjs. Vendored files are AGPL-3.0-or-later,
 * same author as mchord — edit upstream in mdrone, never here, then re-sync.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const FILES = ['model.ts', 'scala.ts', 'builtins.ts']

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const upstreamRepo = join(root, '..', 'mdrone')
const upstreamDir = join(upstreamRepo, 'src', 'tuning')
const vendorDir = join(root, 'src', 'vendor', 'tuning-core')
const mode = process.argv.includes('--sync') ? 'sync' : 'check'

const note = (s) => console.log(s)

/** Short HEAD SHA of the upstream mdrone checkout (the vendored provenance). */
function upstreamSha() {
  try {
    return execFileSync('git', ['-C', upstreamRepo, 'rev-parse', '--short', 'HEAD'], {
      encoding: 'utf8',
    }).trim()
  } catch {
    return 'unknown'
  }
}

/** Deterministic credit header prepended to each vendored file. */
function header(file, sha) {
  return (
    `/* @vendored from mdrone/src/tuning/${file} @ ${sha}\n` +
    ` * AGPL-3.0-or-later, same author as mchord. Do NOT edit here — edit upstream\n` +
    ` * in mdrone and re-run \`npm run vendored:sync\`. See scripts/sync-vendored.mjs. */\n\n`
  )
}

if (!existsSync(upstreamDir)) {
  note(`✗ upstream ${upstreamDir} missing (is ../mdrone cloned?)`)
  process.exit(1)
}

const sha = upstreamSha()
let failures = 0

if (mode === 'sync' && !existsSync(vendorDir)) mkdirSync(vendorDir, { recursive: true })

for (const f of FILES) {
  const srcPath = join(upstreamDir, f)
  const dstPath = join(vendorDir, f)
  if (!existsSync(srcPath)) {
    note(`✗ upstream ${f} missing`)
    failures++
    continue
  }
  const expected = header(f, sha) + readFileSync(srcPath, 'utf8')
  const current = existsSync(dstPath) ? readFileSync(dstPath, 'utf8') : null
  if (current === expected) {
    note(`✓ tuning-core/${f} in sync (mdrone@${sha})`)
  } else if (mode === 'sync') {
    writeFileSync(dstPath, expected)
    note(`↻ tuning-core/${f} re-vendored (mdrone@${sha})`)
  } else {
    note(`✗ tuning-core/${f} ${current === null ? 'missing' : 'STALE / differs from upstream'}`)
    failures++
  }
}

if (mode === 'check' && failures > 0) {
  note(`\n${failures} problem(s). Run \`npm run vendored:sync\` to refresh.`)
  process.exit(1)
}
note(mode === 'sync' ? '\nVendored tuning core synced.' : '\nVendored tuning core in sync.')
