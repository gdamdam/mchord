import { useEffect, useRef, useState } from 'react'
import type { LinkControls, MidiControls } from '../app/useInstrument'
import { deleteScene, listScenes, loadScene, saveScene, type SavedScene } from '../persistence'
import { sceneToShareUrl } from '../sharing'
import type { SceneState } from '../types'
import { Meter } from './Meter'
import { Select } from './Select'
import { WORDMARK_ASCII } from './displayNames'

interface TopBarProps {
  getLevel: () => number
  link: LinkControls
  effectiveBpm: number
  scene: SceneState
  currentSessionName: string | null
  onLoadSession: (name: string, scene: SceneState) => void
  onSaveSession: (name: string) => void
  localMuted: boolean
  onToggleLocalMute: () => void
  mbusPublishing: boolean
  onToggleMbusPublish: () => void
  masterVolume: number
  onMasterVolume: (volume: number) => void
  midi: MidiControls
  onOpenAdvanced: () => void
  onOpenChords: () => void
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/** Brand, live output meter, and Link status. */
export function TopBar({
  getLevel,
  link,
  effectiveBpm,
  scene,
  currentSessionName,
  onLoadSession,
  onSaveSession,
  localMuted,
  onToggleLocalMute,
  mbusPublishing,
  onToggleMbusPublish,
  masterVolume,
  onMasterVolume,
  midi,
  onOpenAdvanced,
  onOpenChords,
}: TopBarProps) {
  const menuRef = useRef<HTMLDetailsElement>(null)
  const midiMenuRef = useRef<HTMLDetailsElement>(null)
  const [saved, setSaved] = useState<SavedScene[]>(() => listScenes())
  const [name, setName] = useState('')
  // One transient header note, reused for Share and Save feedback.
  const [note, setNote] = useState('')
  const noteTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const flashNote = (message: string) => {
    setNote(message)
    clearTimeout(noteTimer.current)
    noteTimer.current = setTimeout(() => setNote(''), 3000)
  }

  const refresh = () => setSaved(listScenes())
  const save = (requestedName: string) => {
    const clean = requestedName.trim()
    if (!clean) return
    // saveScene returns false when browser storage is unavailable/rejects (G9).
    const ok = saveScene(clean, scene)
    if (!ok) {
      flashNote('Save failed — storage unavailable')
      return
    }
    onSaveSession(clean)
    setName('')
    refresh()
    flashNote(`Saved “${clean}”`)
  }

  const onShare = async () => {
    const url = sceneToShareUrl(scene, `${location.origin}${location.pathname}`)
    const ok = await copyText(url)
    flashNote(ok ? 'Share link copied to clipboard' : url)
  }

  // Dismiss the details menus on an outside pointer down, matching Select (G5).
  useEffect(() => {
    const onDoc = (e: PointerEvent) => {
      const target = e.target as Node
      if (!menuRef.current?.contains(target)) menuRef.current?.removeAttribute('open')
      if (!midiMenuRef.current?.contains(target)) midiMenuRef.current?.removeAttribute('open')
    }
    document.addEventListener('pointerdown', onDoc)
    return () => document.removeEventListener('pointerdown', onDoc)
  }, [])

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand__logo">
          <pre className="brand__ascii" aria-hidden="true">{WORDMARK_ASCII}</pre>
          <span className="brand__ver">v{__APP_VERSION__}</span>
          <span className="sr-only">mchord version {__APP_VERSION__}</span>
        </div>
        <span className="brand__tagline">Move through chords. Stay in flow.</span>
      </div>

      <div className="topbar__status">
        <details
          ref={menuRef}
          className="session-menu"
          onToggle={(event) => {
            if (event.currentTarget.open) {
              refresh()
              midiMenuRef.current?.removeAttribute('open')
            }
          }}
        >
          <summary className="session-menu__button" aria-label="Open session menu">
            ◆ Session
          </summary>
          <div className="session-menu__sheet">
            <p className="session-menu__current">
              Current: <strong>{currentSessionName ?? 'Unsaved session'}</strong>
            </p>
            {currentSessionName && (
              <button type="button" className="btn" onClick={() => save(currentSessionName)}>
                Save current
              </button>
            )}
            <div className="session-menu__save">
              <input
                className="text-input"
                type="text"
                value={name}
                placeholder={currentSessionName ? 'Save as…' : 'Session name'}
                aria-label="Session name"
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') save(name)
                }}
              />
              <button type="button" className="btn" disabled={!name.trim()} onClick={() => save(name)}>
                {currentSessionName ? 'Save as' : 'Save'}
              </button>
            </div>

            {saved.length > 0 ? (
              <ul className="session-menu__list">
                {saved.map((item) => (
                  <li key={item.name} className="session-menu__item">
                    <button
                      type="button"
                      className="session-menu__load"
                      onClick={() => {
                        const loaded = loadScene(item.name)
                        if (!loaded) return
                        onLoadSession(item.name, loaded)
                        menuRef.current?.removeAttribute('open')
                      }}
                    >
                      <span>{item.name}</span>
                      <small>{new Date(item.savedAt).toLocaleDateString()}</small>
                    </button>
                    <button
                      type="button"
                      className="session-menu__delete"
                      aria-label={`Delete ${item.name}`}
                      onClick={() => {
                        deleteScene(item.name)
                        refresh()
                      }}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="session-menu__empty">No saved sessions yet.</p>
            )}
          </div>
        </details>
        <details
          ref={midiMenuRef}
          className="session-menu midi-menu"
          onToggle={(event) => {
            if (event.currentTarget.open) menuRef.current?.removeAttribute('open')
          }}
        >
          <summary className="session-menu__button midi-menu__button" aria-label="Open MIDI setup">
            MIDI
            {midi.outputId && <span className="midi-menu__dot" aria-label="MIDI output connected" />}
          </summary>
          <div className="session-menu__sheet midi-menu__sheet">
            <p className="session-menu__current">
              Route chord voices to another synth, or trigger slots from MIDI notes 36–43.
            </p>
            {!midi.ready ? (
              <button type="button" className="btn" onClick={() => void midi.enable()}>
                Enable MIDI
              </button>
            ) : (
              <div className="midi-menu__controls">
                <Select
                  label="Output"
                  value={midi.outputId ?? ''}
                  onChange={(value) => midi.setOutput(value || null)}
                  options={[
                    { value: '', label: 'None' },
                    ...[...midi.outputs]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((output) => ({ value: output.id, label: output.name })),
                  ]}
                />
                <Select
                  label="Input"
                  value={midi.inputId ?? ''}
                  onChange={(value) => midi.setInput(value || null)}
                  options={[
                    { value: '', label: 'None' },
                    ...[...midi.inputs]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((input) => ({ value: input.id, label: input.name })),
                  ]}
                />
                <div className="midi-menu__row">
                  <Select
                    label="Output channel"
                    value={String(midi.channel)}
                    onChange={(value) => midi.setChannel(Number(value))}
                    options={Array.from({ length: 16 }, (_, index) => ({
                      value: String(index),
                      label: String(index + 1),
                    }))}
                  />
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={midi.clock}
                      onChange={(event) => midi.setClock(event.target.checked)}
                    />
                    <span>Send clock</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </details>
        <button
          type="button"
          className="session-menu__button"
          title="Type a chord progression by name and drop it into the slots"
          onClick={onOpenChords}
        >
          ⌨ Chords
        </button>
        <button
          type="button"
          className="session-menu__button"
          title="Copy a link that restores this scene"
          onClick={onShare}
        >
          Share
        </button>
        <button
          type="button"
          className="session-menu__button"
          aria-label="Open advanced options"
          onClick={onOpenAdvanced}
        >
          ⚙ Advanced
        </button>
        {note && (
          <span className="topbar__note" role="status" aria-live="polite">
            {note}
          </span>
        )}
        <label className="volume" title="Master output volume">
          <span className="sr-only">Master volume</span>
          <span className="volume__icon" aria-hidden="true">
            ▮
          </span>
          <input
            type="range"
            className="volume__input"
            min={0}
            max={1.2}
            step={0.01}
            value={masterVolume}
            onChange={(event) => onMasterVolume(Number(event.target.value))}
            aria-label="Master volume"
            aria-valuetext={`${Math.round(masterVolume * 100)}%`}
          />
        </label>
        <button
          type="button"
          className={`local-audio-btn${localMuted ? ' is-muted' : ''}`}
          aria-pressed={localMuted}
          title={localMuted ? 'Restore mchord local audio' : 'Mute mchord local audio; MIDI keeps playing'}
          onClick={onToggleLocalMute}
        >
          <span aria-hidden="true">{localMuted ? '🔇' : '🔊'}</span>
          {localMuted ? 'Local muted' : 'Local audio'}
        </button>
        <button
          type="button"
          className={`mbus-btn${mbusPublishing ? ' is-on' : ''}`}
          aria-pressed={mbusPublishing}
          title={
            mbusPublishing
              ? 'Publishing to the mbus patchbay (via the local link-bridge); local mute does not affect the bus feed'
              : 'Publish mchord’s output to the mbus patchbay (needs the local link-bridge; harmless without it)'
          }
          onClick={onToggleMbusPublish}
        >
          <span className="mbus-btn__dot" aria-hidden="true" />
          {mbusPublishing ? 'bus on' : 'bus'}
        </button>
        <button
          type="button"
          className={`link-btn${link.enabled ? ' is-on' : ''}${link.state.connected ? ' is-connected' : ''}`}
          aria-pressed={link.enabled}
          title={
            link.enabled
              ? link.state.connected
                ? `Ableton Link: following ${effectiveBpm.toFixed(1)} BPM · ${link.state.peers} peer${link.state.peers === 1 ? '' : 's'}. Click to turn off.`
                : 'Ableton Link on — needs the mpump Link Bridge to connect. Click to turn off.'
              : 'Enable Ableton Link (needs the mpump Link Bridge; harmless without it)'
          }
          onClick={() => link.enable(!link.enabled)}
        >
          <span className="link-btn__dot" aria-hidden="true" />
          {link.enabled
            ? link.state.connected
              ? `Link ${effectiveBpm.toFixed(1)} · ${link.state.peers} peer${link.state.peers === 1 ? '' : 's'}`
              : 'Link on'
            : 'Enable Link'}
        </button>
        <Meter getLevel={getLevel} />
      </div>
    </header>
  )
}
