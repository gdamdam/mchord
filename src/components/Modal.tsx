import { useEffect, useId, useRef, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Optional wider layout for the chord palette. */
  size?: 'sheet' | 'dialog'
}

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Accessible modal: role=dialog + aria-modal, focus moves in on open and is
 * trapped via Tab, Escape closes, and focus returns to the opener on close.
 */
export function Modal({ open, onClose, title, children, size = 'dialog' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const opener = useRef<HTMLElement | null>(null)

  // Ref the latest onClose so the trap effect can depend on `open` alone. App
  // passes an inline arrow that changes every render; keying the effect on it
  // re-ran the trap and yanked focus back to the first control (G3).
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    opener.current = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !panel) return
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute('disabled'),
      )
      if (items.length === 0) return
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      opener.current?.focus()
    }
  }, [open])

  if (!open) return null

  return (
    // Close on `click` (pointerdown+pointerup both on the scrim), not
    // pointerdown: a touch drag that starts on the scrim no longer dismisses
    // mid-gesture and lets the follow-up tap land on a slot underneath (G6).
    <div className="modal__scrim" onClick={onClose}>
      <div
        ref={panelRef}
        className={`modal modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__head">
          <h2 id={titleId} className="modal__title">
            {title}
          </h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}
