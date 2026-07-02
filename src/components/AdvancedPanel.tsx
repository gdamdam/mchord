import { useState } from 'react'
import {
  createDefaultScene,
  exportSceneJSON,
  importSceneJSON,
} from '../persistence'
import { sceneToShareUrl } from '../sharing'
import type { SceneState } from '../types'
import type { LinkControls } from '../app/useInstrument'

interface AdvancedPanelProps {
  scene: SceneState
  onLoadScene: (scene: SceneState, name?: string) => void
  link: LinkControls
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

export function AdvancedPanel({ scene, onLoadScene, link, onPanic }: AdvancedPanelProps) {
  const [shareNote, setShareNote] = useState('')
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')

  const onShare = async () => {
    const url = sceneToShareUrl(scene, `${location.origin}${location.pathname}`)
    const ok = await copyText(url)
    setShareNote(ok ? 'Link copied to clipboard' : url)
  }

  const onExport = async () => {
    const ok = await copyText(exportSceneJSON(scene))
    setShareNote(ok ? 'Scene JSON copied to clipboard' : 'Copy failed — your browser blocked it')
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
    <details className="advanced">
      <summary className="advanced__summary">Advanced — backup, Link</summary>

      <div className="advanced__grid">
        <section className="panel" aria-label="Share">
          <h3 className="panel__title">Share & backup</h3>
          <div className="panel__row">
            <button type="button" className="btn" onClick={onShare}>
              Copy share link
            </button>
            <button type="button" className="btn btn--ghost" onClick={onExport}>
              Copy JSON
            </button>
          </div>
          {shareNote && <p className="panel__note">{shareNote}</p>}
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

        <section className="panel" aria-label="Ableton Link">
          <h3 className="panel__title">Ableton Link</h3>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={link.enabled}
              onChange={(e) => link.enable(e.target.checked)}
            />
            <span>Enable Link</span>
          </label>
          <p className="panel__note">
            {link.state.connected
              ? `Connected — ${link.state.tempo.toFixed(1)} BPM, ${link.state.peers} peer${link.state.peers === 1 ? '' : 's'}.`
              : 'Needs the mpump Link Bridge running locally. Works fine without it.'}
          </p>
          <button type="button" className="btn btn--danger" onClick={onPanic}>
            Panic — all notes off
          </button>
          <button type="button" className="btn btn--danger" onClick={onReset}>
            Reset all to defaults
          </button>
        </section>
      </div>
    </details>
  )
}
