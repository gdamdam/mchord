import { useState } from 'react'
import {
  deleteScene,
  exportSceneJSON,
  importSceneJSON,
  listScenes,
  loadScene,
  saveScene,
  type SavedScene,
} from '../persistence'
import { sceneToShareUrl } from '../sharing'
import type { SceneState } from '../types'
import type { LinkControls, MidiControls } from '../app/useInstrument'

interface AdvancedPanelProps {
  scene: SceneState
  onLoadScene: (scene: SceneState) => void
  midi: MidiControls
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

export function AdvancedPanel({ scene, onLoadScene, midi, link, onPanic }: AdvancedPanelProps) {
  const [saved, setSaved] = useState<SavedScene[]>(() => listScenes())
  const [name, setName] = useState('')
  const [shareNote, setShareNote] = useState('')
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')

  const refresh = () => setSaved(listScenes())

  const onSave = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    saveScene(trimmed, scene)
    setName('')
    refresh()
  }

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

  return (
    <details className="advanced">
      <summary className="advanced__summary">Advanced — scenes, MIDI, Link</summary>

      <div className="advanced__grid">
        <section className="panel" aria-label="Scenes">
          <h3 className="panel__title">Scenes</h3>
          <div className="panel__row">
            <input
              className="text-input"
              type="text"
              placeholder="Scene name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Scene name"
            />
            <button type="button" className="btn" onClick={onSave} disabled={!name.trim()}>
              Save
            </button>
          </div>
          {saved.length > 0 && (
            <ul className="scene-list">
              {saved.map((s) => (
                <li key={s.name} className="scene-list__item">
                  <button
                    type="button"
                    className="scene-list__load"
                    onClick={() => {
                      const loaded = loadScene(s.name)
                      if (loaded) onLoadScene(loaded)
                    }}
                  >
                    {s.name}
                  </button>
                  <button
                    type="button"
                    className="scene-list__del"
                    aria-label={`Delete ${s.name}`}
                    onClick={() => {
                      deleteScene(s.name)
                      refresh()
                    }}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

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

        <section className="panel" aria-label="MIDI">
          <h3 className="panel__title">MIDI</h3>
          {!midi.ready ? (
            <button type="button" className="btn" onClick={() => void midi.enable()}>
              Enable MIDI
            </button>
          ) : (
            <>
              <label className="panel__field">
                <span className="field__label">Output</span>
                <select
                  className="field__select"
                  value={midi.outputId ?? ''}
                  onChange={(e) => midi.setOutput(e.target.value || null)}
                >
                  <option value="">None</option>
                  {midi.outputs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="panel__field">
                <span className="field__label">Input (notes 36–43 trigger slots)</span>
                <select
                  className="field__select"
                  value={midi.inputId ?? ''}
                  onChange={(e) => midi.setInput(e.target.value || null)}
                >
                  <option value="">None</option>
                  {midi.inputs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="panel__row">
                <label className="panel__field panel__field--inline">
                  <span className="field__label">Channel</span>
                  <select
                    className="field__select"
                    value={midi.channel}
                    onChange={(e) => midi.setChannel(Number(e.target.value))}
                  >
                    {Array.from({ length: 16 }, (_, i) => (
                      <option key={i} value={i}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={midi.clock}
                    onChange={(e) => midi.setClock(e.target.checked)}
                  />
                  <span>Send MIDI clock</span>
                </label>
              </div>
            </>
          )}
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
        </section>
      </div>
    </details>
  )
}
