import { useState } from 'react'
import {
  GENRES,
  GENRE_LABELS,
  PROGRESSION_LIBRARY,
  chordName,
  instantiateProgression,
  type Genre,
  type ProgressionPreset,
} from '../harmony'
import type { Chord, Mode, PitchClass } from '../types'
import { Modal } from './Modal'

interface ProgressionBrowserProps {
  open: boolean
  onClose: () => void
  keyRoot: PitchClass
  mode: Mode
  onLoad: (chords: (Chord | null)[], mode?: Mode) => void
}

export function ProgressionBrowser({ open, onClose, keyRoot, mode, onLoad }: ProgressionBrowserProps) {
  const [genre, setGenre] = useState<Genre>('house')
  const presets = PROGRESSION_LIBRARY[genre]

  const preview = (p: ProgressionPreset): string =>
    instantiateProgression(p, keyRoot)
      .map((c) => (c ? chordName(c, keyRoot, p.mode ?? mode) : '·'))
      .join('  ·  ')

  return (
    <Modal open={open} onClose={onClose} size="sheet" title="Progressions">
      <p className="palette__lead">
        Curated chord progressions by genre. Loading one fills the slots in your current key and sets
        the loop length; your sound, macros, and tempo stay put.
      </p>
      <div className="proglib">
        <nav className="proglib__genres" aria-label="Genre">
          {GENRES.map((g) => (
            <button
              key={g}
              type="button"
              className={`proglib__genre${g === genre ? ' is-active' : ''}`}
              aria-pressed={g === genre}
              onClick={() => setGenre(g)}
            >
              {GENRE_LABELS[g]}
            </button>
          ))}
        </nav>
        <ul className="proglib__list">
          {presets.map((p, i) => (
            <li key={`${p.name}-${i}`}>
              <button
                type="button"
                className="proglib__item"
                onClick={() => {
                  onLoad(instantiateProgression(p, keyRoot), p.mode)
                  onClose()
                }}
              >
                <span className="proglib__name">{p.name}</span>
                <span className="proglib__chords">{preview(p)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  )
}
