import { chordLabel } from '../harmony'
import { SLOT_DURATIONS, type Mode, type PitchClass, type Slot, type SlotDuration } from '../types'

interface ChordSlotsProps {
  slots: Slot[]
  keyRoot: PitchClass
  mode: Mode
  /** Slots at index >= loopLength are "parked": shown dimmed, not played. */
  loopLength: number
  selectedSlot: number
  activeSlot: number | null
  queuedSlot: number | null
  onSelect: (index: number) => void
  onTrigger: (index: number) => void
  onOpen: (index: number) => void
  onCycleDuration: (index: number, duration: SlotDuration) => void
}

const DURATION_LABEL: Record<number, string> = { 0.5: '½', 1: '1', 2: '2', 4: '4' }

function nextDuration(current: SlotDuration): SlotDuration {
  const i = SLOT_DURATIONS.indexOf(current)
  return SLOT_DURATIONS[(i + 1) % SLOT_DURATIONS.length]
}

const CATEGORY_VAR: Record<string, string> = {
  diatonic: 'var(--stable)',
  borrowed: 'var(--neutral)',
  chromatic: 'var(--tense)',
}

export function ChordSlots({
  slots,
  keyRoot,
  mode,
  loopLength,
  selectedSlot,
  activeSlot,
  queuedSlot,
  onSelect,
  onTrigger,
  onOpen,
  onCycleDuration,
}: ChordSlotsProps) {
  return (
    <section className="slots" aria-label="Chord progression">
      {slots.map((slot, i) => {
        const label = slot.chord ? chordLabel(slot.chord, keyRoot, mode) : null
        const parked = i >= loopLength
        const state = [
          i === selectedSlot ? 'is-selected' : '',
          i === activeSlot ? 'is-active' : '',
          i === queuedSlot ? 'is-queued' : '',
          slot.chord ? '' : 'is-empty',
          parked ? 'is-parked' : '',
        ]
          .filter(Boolean)
          .join(' ')

        const activate = () => {
          onSelect(i)
          if (slot.chord) onTrigger(i)
          else onOpen(i)
        }

        return (
          <div
            key={i}
            className={`slot ${state}`}
            role="button"
            tabIndex={0}
            aria-label={
              (label
                ? `Slot ${i + 1}: ${label.name}, ${label.roman}${i === activeSlot ? ', playing' : ''}`
                : `Slot ${i + 1}: empty, add a chord`) + (parked ? ', parked — outside the loop' : '')
            }
            onClick={activate}
            onKeyDown={(e) => {
              // Only the slot container itself handles Enter/Space. A keydown
              // that bubbled from a child control (edit / duration button) must
              // not also trigger the slot — that would hijack the focused button
              // and suppress its own activation (stopPropagation only covers clicks).
              if (e.target !== e.currentTarget) return
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                activate()
              }
            }}
          >
            <span className="slot__index">{i + 1}</span>

            {slot.chord && (
              <button
                type="button"
                className="slot__edit"
                aria-label={`Edit slot ${i + 1}`}
                onClick={(e) => {
                  e.stopPropagation()
                  onOpen(i)
                }}
              >
                ✎
              </button>
            )}

            {label ? (
              <span className="slot__body">
                <span className="slot__roman">{label.roman}</span>
                <span className="slot__name">{label.name}</span>
                <span className="slot__notes">{label.notes}</span>
                <span className="slot__stability" aria-hidden="true">
                  <span
                    className="slot__stability-fill"
                    style={{
                      width: `${Math.round(label.stability * 100)}%`,
                      background: CATEGORY_VAR[label.category] ?? 'var(--neutral)',
                    }}
                  />
                </span>
              </span>
            ) : (
              <span className="slot__add">+ Add chord</span>
            )}

            <button
              type="button"
              className="slot__dur"
              aria-label={`Slot ${i + 1} length ${DURATION_LABEL[slot.durationBars]} bar. Change.`}
              onClick={(e) => {
                e.stopPropagation()
                onCycleDuration(i, nextDuration(slot.durationBars))
              }}
            >
              {DURATION_LABEL[slot.durationBars]}
            </button>
          </div>
        )
      })}
    </section>
  )
}
