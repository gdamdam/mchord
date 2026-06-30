import { useMemo } from 'react'
import { paletteFor } from '../harmony'
import type { Chord, ChordCategory, Mode, PitchClass } from '../types'
import { Modal } from './Modal'

interface ChordPaletteProps {
  open: boolean
  onClose: () => void
  keyRoot: PitchClass
  mode: Mode
  slotIndex: number | null
  onPick: (chord: Chord) => void
  onClear: () => void
}

const GROUPS: { category: ChordCategory; title: string }[] = [
  { category: 'diatonic', title: 'In key' },
  { category: 'borrowed', title: 'Borrowed' },
  { category: 'chromatic', title: 'Chromatic' },
]

export function ChordPalette({
  open,
  onClose,
  keyRoot,
  mode,
  slotIndex,
  onPick,
  onClear,
}: ChordPaletteProps) {
  const palette = useMemo(() => paletteFor(keyRoot, mode), [keyRoot, mode])

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sheet"
      title={slotIndex === null ? 'Choose a chord' : `Slot ${slotIndex + 1} — choose a chord`}
    >
      <p className="palette__lead">
        Diatonic chords sit at the top. Borrowed and chromatic chords add colour — they read warmer
        as they get more unstable.
      </p>

      {GROUPS.map(({ category, title }) => {
        const items = palette.filter((p) => p.label.category === category)
        if (items.length === 0) return null
        return (
          <div className="palette__group" key={category}>
            <h3 className={`palette__group-title cat--${category}`}>{title}</h3>
            <div className="palette__grid">
              {items.map((p) => (
                <button
                  type="button"
                  key={`${p.chord.root}-${p.chord.family}`}
                  className={`chip cat--${category}`}
                  onClick={() => {
                    onPick(p.chord)
                    onClose()
                  }}
                  title={p.label.notes}
                >
                  <span className="chip__roman">{p.label.roman}</span>
                  <span className="chip__name">{p.label.name}</span>
                </button>
              ))}
            </div>
          </div>
        )
      })}

      <div className="palette__footer">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            onClear()
            onClose()
          }}
        >
          Clear slot
        </button>
      </div>
    </Modal>
  )
}
