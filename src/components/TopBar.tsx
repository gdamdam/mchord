import { useRef, useState } from 'react'
import { deleteScene, listScenes, loadScene, saveScene, type SavedScene } from '../persistence'
import type { LinkState } from '../transport'
import type { SceneState } from '../types'
import { Meter } from './Meter'
import { WORDMARK_ASCII } from './displayNames'

interface TopBarProps {
  getLevel: () => number
  link: LinkState
  effectiveBpm: number
  scene: SceneState
  currentSessionName: string | null
  onLoadSession: (name: string, scene: SceneState) => void
  onSaveSession: (name: string) => void
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
}: TopBarProps) {
  const menuRef = useRef<HTMLDetailsElement>(null)
  const [saved, setSaved] = useState<SavedScene[]>(() => listScenes())
  const [name, setName] = useState('')

  const refresh = () => setSaved(listScenes())
  const save = (requestedName: string) => {
    const clean = requestedName.trim()
    if (!clean) return
    saveScene(clean, scene)
    onSaveSession(clean)
    setName('')
    refresh()
  }

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
            if (event.currentTarget.open) refresh()
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
        <span
          className={`link-pill${link.connected ? ' is-on' : ''}`}
          title={
            link.connected
              ? `Ableton Link: following ${effectiveBpm.toFixed(1)} BPM`
              : 'Ableton Link offline'
          }
        >
          <span className="link-pill__dot" aria-hidden="true" />
          {link.connected
            ? `Link ${effectiveBpm.toFixed(1)} · ${link.peers} peer${link.peers === 1 ? '' : 's'}`
            : 'Link off'}
        </span>
        <Meter getLevel={getLevel} />
      </div>
    </header>
  )
}
