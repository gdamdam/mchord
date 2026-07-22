import { useState } from 'react'
import { createDefaultScene, exportSceneJSON, importSceneJSON } from '../persistence'
import type { SceneState } from '../types'

interface AdvancedPanelProps {
  scene: SceneState
  onLoadScene: (scene: SceneState, name?: string) => void
  onPanic: () => void
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * Body of the Advanced modal: JSON backup (copy/import) plus troubleshooting
 * (panic, reset). Share and the Enable Link toggle now live in the header, so
 * this is no longer a page-level <details> — it renders inside <Modal>.
 */
export function AdvancedPanel({ scene, onLoadScene, onPanic }: AdvancedPanelProps) {
  const [note, setNote] = useState('')
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')

  const onExport = async () => {
    const ok = await copyText(exportSceneJSON(scene))
    setNote(ok ? 'Scene JSON copied to clipboard' : 'Copy failed — your browser blocked it')
  }

  const onImport = () => {
    const result = importSceneJSON(importText)
    if (!result) {
      setImportError('That doesn’t look like a valid mchord scene.')
      return
    }
    setImportError('')
    setImportText('')
    onLoadScene(result)
  }

  const onReset = () => {
    // Destructive: wipes the whole scene back to defaults, so confirm first.
    if (!window.confirm('Reset everything to defaults? This clears the current scene.')) return
    onLoadScene(createDefaultScene())
  }

  return (
    <div className="advanced__grid">
      <section className="panel" aria-label="Backup">
        <h3 className="panel__title">Backup</h3>
        <div className="panel__row">
          <button type="button" className="btn" onClick={onExport}>
            Copy JSON
          </button>
        </div>
        {note && <p className="panel__note">{note}</p>}
        <label className="panel__field">
          <span className="field__label">Import JSON</span>
          <textarea
            className="text-input text-input--area"
            rows={3}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste a scene’s JSON here"
          />
        </label>
        <div className="panel__row">
          <button type="button" className="btn" onClick={onImport} disabled={!importText.trim()}>
            Load JSON
          </button>
        </div>
        {importError && <p className="panel__note panel__note--error">{importError}</p>}
      </section>

      <section className="panel" aria-label="Troubleshooting">
        <h3 className="panel__title">Troubleshooting</h3>
        <button type="button" className="btn btn--danger" onClick={onPanic}>
          Panic — all notes off
        </button>
        <button type="button" className="btn btn--danger" onClick={onReset}>
          Reset all to defaults
        </button>
      </section>
    </div>
  )
}
