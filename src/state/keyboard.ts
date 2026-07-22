/**
 * Pure keyboard-shortcut mapping. Kept free of React/DOM so it is unit-testable:
 * given a key event shape + a small context, it returns a semantic command (or
 * null). The App wires these commands to the reducer, transport, and overlays.
 *
 * Shortcuts (spec):
 *   1–8                     trigger chord slot (live)
 *   Space                   start/stop progression playback
 *   Arrows                  move the selected slot (←/→ ±1, ↑/↓ ±4)
 *   Enter                   open / commit chord selection
 *   R / Shift+R             vary / generate progression
 *   Cmd|Ctrl+Z              undo
 *   Shift+Cmd|Ctrl+Z        redo
 *   Escape                  close overlays
 * Shortcuts are ignored while typing in inputs.
 */

export interface KeyEventLike {
  key: string
  code: string
  shiftKey: boolean
  metaKey: boolean
  ctrlKey: boolean
}

export interface KeyContext {
  /** True when focus is in a text input/select/textarea/contenteditable. */
  typing: boolean
  /** True when a modal/overlay is open (changes Enter/Escape semantics). */
  overlayOpen: boolean
}

export type KeyCommand =
  | { kind: 'triggerSlot'; slot: number }
  | { kind: 'toggleTransport' }
  | { kind: 'moveSelection'; delta: number }
  | { kind: 'openOrCommitChord' }
  | { kind: 'generateOrVary'; fresh: boolean }
  | { kind: 'undo' }
  | { kind: 'redo' }
  | { kind: 'closeOverlay' }

/**
 * Duck-typed editable-target test (mirrors the suite convention) so shortcuts
 * never fire while the user is typing.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  const tag = el?.tagName
  if (typeof tag !== 'string') return false
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable === true
}

/**
 * True when the event target is an interactive control that should handle
 * Space/Enter/Arrows itself, so a global shortcut must NOT also fire. Covers
 * native buttons/links/fields, ARIA `role="button"`, the custom Select's
 * `role="listbox"`/`"option"` (G1), and `<details>`/`<summary>` menus (G2).
 * Kept DOM-free (duck-typed on tagName + role) so the gate is unit-testable.
 */
export function isInteractiveTarget(target: EventTarget | null): boolean {
  const el = target as (HTMLElement & { role?: string | null }) | null
  const tag = el?.tagName
  if (typeof tag !== 'string') return false
  const role = typeof el?.getAttribute === 'function' ? el.getAttribute('role') : (el?.role ?? null)
  return (
    tag === 'BUTTON' ||
    tag === 'A' ||
    tag === 'SELECT' ||
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SUMMARY' ||
    tag === 'DETAILS' ||
    role === 'button' ||
    role === 'listbox' ||
    role === 'option'
  )
}

export function keyToCommand(e: KeyEventLike, ctx: KeyContext): KeyCommand | null {
  // Escape always closes an open overlay, even mid-typing.
  if (e.key === 'Escape') {
    return ctx.overlayOpen ? { kind: 'closeOverlay' } : null
  }

  // Never steal keys while typing into a field.
  if (ctx.typing) return null

  const mod = e.metaKey || e.ctrlKey

  // Undo / redo.
  if (mod && (e.key === 'z' || e.key === 'Z')) {
    return e.shiftKey ? { kind: 'redo' } : { kind: 'undo' }
  }
  // Common Windows redo alias.
  if (mod && (e.key === 'y' || e.key === 'Y')) {
    return { kind: 'redo' }
  }
  // Any other modified chord is not ours.
  if (mod) return null

  // Number keys 1–8 trigger slots.
  if (e.code.startsWith('Digit')) {
    const n = Number(e.code.slice(5))
    if (n >= 1 && n <= 8) return { kind: 'triggerSlot', slot: n - 1 }
  }
  if (e.code.startsWith('Numpad')) {
    const n = Number(e.code.slice(6))
    if (n >= 1 && n <= 8) return { kind: 'triggerSlot', slot: n - 1 }
  }

  switch (e.code) {
    case 'Space':
      return { kind: 'toggleTransport' }
    case 'ArrowLeft':
      return { kind: 'moveSelection', delta: -1 }
    case 'ArrowRight':
      return { kind: 'moveSelection', delta: 1 }
    case 'ArrowUp':
      return { kind: 'moveSelection', delta: -4 }
    case 'ArrowDown':
      return { kind: 'moveSelection', delta: 4 }
    case 'Enter':
      return { kind: 'openOrCommitChord' }
    case 'KeyR':
      return { kind: 'generateOrVary', fresh: e.shiftKey }
    default:
      return null
  }
}
