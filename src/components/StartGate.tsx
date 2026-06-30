import { useState } from 'react'
import { WORDMARK_ASCII } from './displayNames'

interface StartGateProps {
  onStart: () => Promise<void>
}

/**
 * First-gesture gate. Browsers only allow an AudioContext to start from a user
 * gesture, so nothing sounds until this is pressed.
 */
export function StartGate({ onStart }: StartGateProps) {
  const [busy, setBusy] = useState(false)
  return (
    <div className="startgate" role="dialog" aria-modal="true" aria-label="Start audio">
      <div className="startgate__card">
        <pre className="startgate__ascii" aria-hidden="true">{WORDMARK_ASCII}</pre>
        <h1 className="sr-only">mchord</h1>
        <p className="startgate__tagline">Move through chords. Stay in flow.</p>
        <button
          type="button"
          className="startgate__btn"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try {
              await onStart()
            } finally {
              setBusy(false)
            }
          }}
        >
          {busy ? 'Starting…' : 'Start audio'}
        </button>
        <p className="startgate__hint">Headphones or speakers recommended.</p>
      </div>
    </div>
  )
}
