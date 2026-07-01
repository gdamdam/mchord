import { useState } from 'react'
import type { AutosavedScene } from '../persistence'
import { WORDMARK_ASCII } from './displayNames'

interface StartGateProps {
  lastScene: AutosavedScene | null
  onStart: (mode: 'continue' | 'new') => void
}

/** Launch choice shown before the working scene is allowed to autosave. */
export function StartGate({ lastScene, onStart }: StartGateProps) {
  const [starting, setStarting] = useState<'continue' | 'new' | null>(null)

  const start = (mode: 'continue' | 'new') => {
    setStarting(mode)
    onStart(mode)
  }

  const savedLabel = lastScene
    ? new Date(lastScene.savedAt).toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null

  return (
    <main className="startgate">
      <div className="startgate__card">
        <pre className="startgate__ascii" aria-hidden="true">{WORDMARK_ASCII}</pre>
        <h1 className="startgate__title">mchord</h1>
        <p className="startgate__tagline">Move through chords. Stay in flow.</p>

        <div className="startgate__actions">
          {lastScene && (
            <button
              type="button"
              className="startgate__btn"
              disabled={starting !== null}
              onClick={() => start('continue')}
            >
              {starting === 'continue' ? 'Restoring…' : 'Continue Last Session'}
            </button>
          )}
          <button
            type="button"
            className={`startgate__btn${lastScene ? ' startgate__btn--secondary' : ''}`}
            disabled={starting !== null}
            onClick={() => start('new')}
          >
            {starting === 'new' ? 'Starting…' : lastScene ? 'Start New' : 'Start mchord'}
          </button>
        </div>

        {savedLabel && <p className="startgate__hint">Last session saved {savedLabel}</p>}
        <p className="startgate__hint">Audio starts on your first play or chord tap.</p>
      </div>
    </main>
  )
}
