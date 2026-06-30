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
  canUndo,
  canRedo,
}: TransportProps) {
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
          <span className="tempo__bpm">{Math.round(effectiveBpm)}</span>
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
