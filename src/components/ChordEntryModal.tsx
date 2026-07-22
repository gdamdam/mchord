import { useMemo, useState } from 'react'
import { chordName, parseChordLine } from '../harmony'
import { SLOT_COUNT, type Chord, type Mode, type PitchClass } from '../types'
import { Modal } from './Modal'

interface ChordEntryModalProps {
  open: boolean
  onClose: () => void
  keyRoot: PitchClass
  mode: Mode
  /** Apply the typed chords to the slots (reuses the progression-load path). */
  onApply: (chords: (Chord | null)[]) => void
}

/**
 * Type a chord progression by name (e.g. "Cmaj7 Am7 Dm7 G7") and drop it into
 * the slots. Names are read absolutely (independent of the Key selector); the
 * preview shows what each token resolved to so mistakes are caught before Apply.
 */
export function ChordEntryModal({ open, onClose, keyRoot, mode, onApply }: ChordEntryModalProps) {
  const [text, setText] = useState('')

  const parsed = useMemo(() => parseChordLine(text), [text])
  const recognised = parsed.filter((t) => t.chord !== null)
  const unknown = parsed.filter((t) => t.chord === null)
  const overflow = recognised.length > SLOT_COUNT

  const canApply = recognised.length > 0 && unknown.length === 0 && !overflow

  const apply = () => {
    if (!canApply) return
    onApply(parsed.map((t) => t.chord))
    setText('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} size="sheet" title="Type chords">
      <div className="chordentry">
        <p className="chordentry__hint">
          Enter chord names separated by spaces or commas — e.g.{' '}
          <code>Cmaj7 Am7 Dm7 G7</code>. They fill the slots from the first, up to {SLOT_COUNT}.
          Names are read as written (independent of the Key setting).
        </p>
        <textarea
          className="chordentry__input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Cmaj7 Am7 Dm7 G7"
          rows={3}
          aria-label="Chord names"
          autoFocus
          onKeyDown={(e) => {
            // Cmd/Ctrl+Enter applies without reaching for the mouse.
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') apply()
          }}
        />

        {parsed.length > 0 && (
          <div className="chordentry__preview" aria-live="polite">
            {parsed.map((t, i) => (
              <span
                key={`${t.token}-${i}`}
                className={`chordentry__chip${t.chord ? '' : ' is-bad'}`}
                title={t.chord ? undefined : 'Unrecognised chord name'}
              >
                {t.chord ? chordName(t.chord, keyRoot, mode) : t.token}
              </span>
            ))}
          </div>
        )}

        <div className="chordentry__status" role="status">
          {unknown.length > 0 && (
            <span className="chordentry__error">
              Unrecognised: {unknown.map((t) => t.token).join(', ')}
            </span>
          )}
          {overflow && (
            <span className="chordentry__error">
              Too many — {recognised.length} chords, max {SLOT_COUNT}.
            </span>
          )}
          {canApply && (
            <span className="chordentry__ok">
              {recognised.length} chord{recognised.length === 1 ? '' : 's'} ready.
            </span>
          )}
        </div>

        <div className="chordentry__actions">
          <button type="button" className="btn" onClick={apply} disabled={!canApply}>
            Apply to slots
          </button>
        </div>
      </div>
    </Modal>
  )
}
