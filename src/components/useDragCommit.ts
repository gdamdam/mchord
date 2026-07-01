import { useRef } from 'react'

/**
 * Commit-on-release for native range inputs. A pointer drag fires many `input`
 * events; if each pushed its own undo checkpoint, one drag would flood the
 * history. Here the FIRST change of a drag commits normally (transient=false →
 * checkpoint) and the rest are transient (no checkpoint), so a whole drag
 * collapses to a single undo step. Keyboard/click changes (no active drag)
 * always checkpoint.
 *
 * Spread `dragProps` on the <input>; call `commit(value)` from its onChange.
 */
export function useDragCommit(onCommit: (value: number, transient: boolean) => void) {
  const dragging = useRef(false)
  const started = useRef(false)
  const end = () => {
    dragging.current = false
    started.current = false
  }
  return {
    commit: (value: number) => {
      const transient = dragging.current && started.current
      started.current = true
      onCommit(value, transient)
    },
    dragProps: {
      onPointerDown: () => {
        dragging.current = true
        started.current = false
      },
      onPointerUp: end,
      onPointerCancel: end,
      onLostPointerCapture: end,
      // A keypress is a discrete keyboard adjustment, not a drag — checkpoint each.
      onKeyDown: end,
    },
  }
}
