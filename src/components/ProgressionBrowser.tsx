import { useMemo, useState } from 'react'
import {
  GENRES,
  GENRE_LABELS,
  chordName,
  entryToLoad,
  progressionsForGenre,
  searchProgressions,
  type CatalogEntry,
  type Genre,
  type LoadPayload,
} from '../harmony'
import { MODES } from '../types'
import type { Mode, PitchClass } from '../types'
import { Modal } from './Modal'

interface ProgressionBrowserProps {
  open: boolean
  onClose: () => void
  keyRoot: PitchClass
  mode: Mode
  onLoad: (payload: LoadPayload) => void
}

const MODE_LABELS: Record<Mode, string> = {
  major: 'Major',
  'natural-minor': 'Minor',
  dorian: 'Dorian',
  mixolydian: 'Mixolydian',
  phrygian: 'Phrygian',
  lydian: 'Lydian',
  'harmonic-minor': 'Harmonic min',
  locrian: 'Locrian',
  'melodic-minor': 'Melodic min',
  'harmonic-major': 'Harmonic maj',
}

/** A short badge for entries that are not a plain, complete pattern. */
function completenessBadge(e: CatalogEntry): string | null {
  switch (e.completeness) {
    case 'excerpt':
      return 'excerpt'
    case 'simplified':
      return 'simplified'
    case 'reharmonized':
      return 'reharm.'
    case 'reduction':
      return 'reduction'
    default:
      return null
  }
}

export function ProgressionBrowser({ open, onClose, keyRoot, mode, onLoad }: ProgressionBrowserProps) {
  const [genre, setGenre] = useState<Genre>('house')
  const [query, setQuery] = useState('')
  const [modeFilter, setModeFilter] = useState<Mode | 'all'>('all')
  const [reviewedOnly, setReviewedOnly] = useState(false)

  const searching = query.trim().length > 0

  const entries = useMemo(() => {
    let list = searching ? searchProgressions(query) : progressionsForGenre(genre)
    if (modeFilter !== 'all') list = list.filter((e) => e.mode === modeFilter)
    if (reviewedOnly) list = list.filter((e) => e.review === 'reviewed')
    return list
  }, [searching, query, genre, modeFilter, reviewedOnly])

  const preview = (e: CatalogEntry): string =>
    entryToLoad(e, keyRoot)
      .chords.map((c) => (c ? chordName(c, keyRoot, e.mode ?? mode) : '·'))
      .join('  ·  ')

  return (
    <Modal open={open} onClose={onClose} size="sheet" title="Progressions">
      <p className="palette__lead">
        Curated chord progressions. Loading one fills the slots in your current key (keeping any
        longer-held chords) and sets the loop length; your sound, macros, and tempo stay put.
      </p>

      <div className="proglib__controls">
        <label className="proglib__search">
          <span className="visually-hidden">Search progressions by name</span>
          <input
            type="search"
            placeholder="Search all progressions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search progressions by name"
          />
        </label>
        <label className="proglib__filter">
          <span className="visually-hidden">Filter by mode</span>
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value as Mode | 'all')}
            aria-label="Filter by mode"
          >
            <option value="all">All modes</option>
            {MODES.map((m) => (
              <option key={m} value={m}>
                {MODE_LABELS[m]}
              </option>
            ))}
          </select>
        </label>
        <label className="proglib__toggle">
          <input
            type="checkbox"
            checked={reviewedOnly}
            onChange={(e) => setReviewedOnly(e.target.checked)}
          />
          Reviewed only
        </label>
      </div>

      <div className="proglib">
        <nav className="proglib__genres" aria-label="Genre">
          {[...GENRES]
            .sort((a, b) => GENRE_LABELS[a].localeCompare(GENRE_LABELS[b]))
            .map((g) => (
              <button
                key={g}
                type="button"
                className={`proglib__genre${!searching && g === genre ? ' is-active' : ''}`}
                aria-pressed={!searching && g === genre}
                onClick={() => {
                  setQuery('')
                  setGenre(g)
                }}
              >
                {GENRE_LABELS[g]}
              </button>
            ))}
        </nav>

        <div className="proglib__results">
          <p className="proglib__count" aria-live="polite">
            {entries.length} {entries.length === 1 ? 'progression' : 'progressions'}
            {searching ? ' across all genres' : ` in ${GENRE_LABELS[genre]}`}
          </p>
          <ul className="proglib__list">
            {entries.map((e) => {
              const badge = completenessBadge(e)
              return (
                <li key={e.id}>
                  <div className="proglib__row">
                    <button
                      type="button"
                      className="proglib__item"
                      onClick={() => {
                        onLoad(entryToLoad(e, keyRoot))
                        onClose()
                      }}
                    >
                      <span className="proglib__name">
                        {e.name}
                        {e.mode && <span className="proglib__mode">{MODE_LABELS[e.mode]}</span>}
                        <span className="proglib__len">{e.events.length}</span>
                        {badge && <span className="proglib__badge">{badge}</span>}
                        {e.review === 'unverified' && (
                          <span className="proglib__badge proglib__badge--warn" title="Attribution not verified">
                            unverified
                          </span>
                        )}
                      </span>
                      <span className="proglib__chords">{preview(e)}</span>
                      {e.tags.length > 0 && (
                        <span className="proglib__tags">{e.tags.join(' · ')}</span>
                      )}
                    </button>
                  </div>
                  <details className="proglib__details">
                    <summary>Details</summary>
                    <div className="proglib__detailbody">
                      {e.description && <p>{e.description}</p>}
                      {e.aliases.length > 0 && (
                        <p className="proglib__aliases">Also known as: {e.aliases.join(', ')}</p>
                      )}
                      <p className="proglib__meta">
                        <span>{e.classification.replace(/-/g, ' ')}</span>
                        {' · '}
                        <span>genres: {e.genres.join(', ')}</span>
                        {' · '}
                        <span>review: {e.review}</span>
                      </p>
                      <p className="proglib__prov">
                        <strong>Provenance ({e.provenance.kind.replace(/-/g, ' ')}):</strong>{' '}
                        {e.provenance.supports ?? '—'}
                        {e.provenance.notes ? ` ${e.provenance.notes}` : ''}
                        {e.provenance.url && (
                          <>
                            {' '}
                            <a href={e.provenance.url} target="_blank" rel="noreferrer">
                              source
                            </a>
                          </>
                        )}
                      </p>
                    </div>
                  </details>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </Modal>
  )
}
