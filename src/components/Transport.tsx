import { useRef, useState } from 'react'

interface TransportProps {
  playing: boolean
  onToggle: () => void
  bpm: number
  onBpm: (bpm: number) => void
  bpmLocked: boolean
  effectiveBpm: number
  onGenerate: () => void
  onVary: () => void
  onUndo: () => void
  onRedo: () => void
  onOpenLibrary: () => void
  canUndo: boolean
  canRedo: boolean
}

export function Transport({
  playing,
  onToggle,
  bpm,
  onBpm,
  bpmLocked,
  effectiveBpm,
  onGenerate,
  onVary,
  onUndo,
  onRedo,
  onOpenLibrary,
  canUndo,
  canRedo,
}: TransportProps) {
  // Click the BPM number to type an exact tempo.
  const [editingBpm, setEditingBpm] = useState(false)
  const [draft, setDraft] = useState('')
  const skipCommit = useRef(false)

  const commitBpm = () => {
    setEditingBpm(false)
    if (skipCommit.current) {
      skipCommit.current = false
      return
    }
    const v = Math.round(Number(draft))
    if (draft.trim() !== '' && Number.isFinite(v)) {
      const clamped = Math.max(40, Math.min(240, v))
      if (clamped !== bpm) onBpm(clamped)
    }
  }

  return (
    <section className="transport" aria-label="Transport">
      <button
        type="button"
        className={`play${playing ? ' is-playing' : ''}`}
        onClick={onToggle}
        aria-pressed={playing}
      >
        <span className="play__glyph" aria-hidden="true">
          {playing ? '■' : '▶'}
        </span>
        <span className="play__label">{playing ? 'Stop' : 'Play'}</span>
      </button>

      <div className="tempo">
        <div className="tempo__readout">
          {editingBpm ? (
            <input
              type="number"
              className="tempo__bpm-input"
              min={40}
              max={240}
              value={draft}
              autoFocus
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitBpm()
                else if (e.key === 'Escape') {
                  skipCommit.current = true
                  setEditingBpm(false)
                }
              }}
              onBlur={commitBpm}
              aria-label="Tempo in BPM"
            />
          ) : (
            <button
              type="button"
              className="tempo__bpm"
              disabled={bpmLocked}
              title={bpmLocked ? 'Tempo follows Ableton Link' : 'Click to type a BPM'}
              onClick={() => {
                setDraft(String(Math.round(effectiveBpm)))
                setEditingBpm(true)
              }}
            >
              {Math.round(effectiveBpm)}
            </button>
          )}
          <span className="tempo__unit">{bpmLocked ? 'BPM · Link' : 'BPM'}</span>
        </div>
        <input
          type="range"
          className="tempo__slider"
          min={40}
          max={240}
          step={1}
          value={bpm}
          onChange={(e) => onBpm(Number(e.target.value))}
          disabled={bpmLocked}
          aria-label="Tempo"
          aria-valuetext={`${Math.round(effectiveBpm)} BPM`}
        />
      </div>

      <div className="transport__actions">
        <button type="button" className="btn" onClick={onOpenLibrary} title="Browse genre chord progressions">
          Progressions
        </button>
        <button type="button" className="btn" onClick={onVary} title="Vary (R)">
          Vary
        </button>
        <button type="button" className="btn" onClick={onGenerate} title="Generate (Shift+R)">
          Generate
        </button>
        <button type="button" className="btn btn--ghost" onClick={onUndo} disabled={!canUndo} title="Undo (⌘Z)">
          Undo
        </button>
        <button type="button" className="btn btn--ghost" onClick={onRedo} disabled={!canRedo} title="Redo (⇧⌘Z)">
          Redo
        </button>
      </div>
    </section>
  )
}
