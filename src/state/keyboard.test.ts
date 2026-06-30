import { describe, it, expect } from 'vitest'
import { keyToCommand, isEditableTarget, type KeyEventLike } from './keyboard'

const ev = (over: Partial<KeyEventLike>): KeyEventLike => ({
  key: '',
  code: '',
  shiftKey: false,
  metaKey: false,
  ctrlKey: false,
  ...over,
})

const ctx = (over?: Partial<{ typing: boolean; overlayOpen: boolean }>) => ({
  typing: false,
  overlayOpen: false,
  ...over,
})

describe('keyToCommand', () => {
  it('maps Digit1..Digit8 to slot triggers 0..7', () => {
    for (let n = 1; n <= 8; n++) {
      expect(keyToCommand(ev({ code: `Digit${n}`, key: String(n) }), ctx())).toEqual({
        kind: 'triggerSlot',
        slot: n - 1,
      })
    }
  })

  it('ignores Digit9 and Digit0', () => {
    expect(keyToCommand(ev({ code: 'Digit9', key: '9' }), ctx())).toBeNull()
    expect(keyToCommand(ev({ code: 'Digit0', key: '0' }), ctx())).toBeNull()
  })

  it('maps Space to transport toggle', () => {
    expect(keyToCommand(ev({ code: 'Space', key: ' ' }), ctx())).toEqual({ kind: 'toggleTransport' })
  })

  it('maps arrows to selection moves (±1 horizontal, ±4 vertical)', () => {
    expect(keyToCommand(ev({ code: 'ArrowLeft' }), ctx())).toEqual({ kind: 'moveSelection', delta: -1 })
    expect(keyToCommand(ev({ code: 'ArrowRight' }), ctx())).toEqual({ kind: 'moveSelection', delta: 1 })
    expect(keyToCommand(ev({ code: 'ArrowUp' }), ctx())).toEqual({ kind: 'moveSelection', delta: -4 })
    expect(keyToCommand(ev({ code: 'ArrowDown' }), ctx())).toEqual({ kind: 'moveSelection', delta: 4 })
  })

  it('maps Enter to open/commit chord', () => {
    expect(keyToCommand(ev({ code: 'Enter', key: 'Enter' }), ctx())).toEqual({ kind: 'openOrCommitChord' })
  })

  it('maps R to vary and Shift+R to fresh generate', () => {
    expect(keyToCommand(ev({ code: 'KeyR', key: 'r' }), ctx())).toEqual({ kind: 'generateOrVary', fresh: false })
    expect(keyToCommand(ev({ code: 'KeyR', key: 'R', shiftKey: true }), ctx())).toEqual({
      kind: 'generateOrVary',
      fresh: true,
    })
  })

  it('maps Cmd/Ctrl+Z to undo and Shift+Cmd/Ctrl+Z to redo', () => {
    expect(keyToCommand(ev({ key: 'z', metaKey: true }), ctx())).toEqual({ kind: 'undo' })
    expect(keyToCommand(ev({ key: 'z', ctrlKey: true }), ctx())).toEqual({ kind: 'undo' })
    expect(keyToCommand(ev({ key: 'z', metaKey: true, shiftKey: true }), ctx())).toEqual({ kind: 'redo' })
    expect(keyToCommand(ev({ key: 'y', ctrlKey: true }), ctx())).toEqual({ kind: 'redo' })
  })

  it('returns closeOverlay for Escape only when an overlay is open', () => {
    expect(keyToCommand(ev({ key: 'Escape' }), ctx({ overlayOpen: true }))).toEqual({ kind: 'closeOverlay' })
    expect(keyToCommand(ev({ key: 'Escape' }), ctx({ overlayOpen: false }))).toBeNull()
  })

  it('ignores shortcuts while typing, except Escape closes overlays', () => {
    expect(keyToCommand(ev({ code: 'Space', key: ' ' }), ctx({ typing: true }))).toBeNull()
    expect(keyToCommand(ev({ code: 'KeyR', key: 'r' }), ctx({ typing: true }))).toBeNull()
    expect(keyToCommand(ev({ key: 'Escape' }), ctx({ typing: true, overlayOpen: true }))).toEqual({
      kind: 'closeOverlay',
    })
  })

  it('does not treat plain letters as commands', () => {
    expect(keyToCommand(ev({ code: 'KeyA', key: 'a' }), ctx())).toBeNull()
  })
})

describe('isEditableTarget', () => {
  it('detects inputs/textarea/select and contenteditable', () => {
    expect(isEditableTarget({ tagName: 'INPUT' } as unknown as EventTarget)).toBe(true)
    expect(isEditableTarget({ tagName: 'TEXTAREA' } as unknown as EventTarget)).toBe(true)
    expect(isEditableTarget({ tagName: 'SELECT' } as unknown as EventTarget)).toBe(true)
    expect(isEditableTarget({ tagName: 'DIV', isContentEditable: true } as unknown as EventTarget)).toBe(true)
    expect(isEditableTarget({ tagName: 'DIV' } as unknown as EventTarget)).toBe(false)
    expect(isEditableTarget(null)).toBe(false)
  })
})
