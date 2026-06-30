import { useState } from 'react'

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
        <svg className="startgate__mark" viewBox="0 0 512 512" aria-hidden="true">
          <rect x="60" y="120" width="392" height="64" rx="32" fill="var(--accent)" />
          <rect x="60" y="224" width="392" height="64" rx="32" fill="var(--accent-2)" />
          <rect x="60" y="328" width="392" height="64" rx="32" fill="var(--accent-3)" />
        </svg>
        <h1 className="startgate__title">mchord</h1>
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
