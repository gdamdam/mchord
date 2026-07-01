import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectGroup {
  label: string
  options: SelectOption[]
}

interface SelectProps {
  label: string
  value: string
  /** Flat options, OR pass `groups` for a grouped list. */
  options?: SelectOption[]
  groups?: SelectGroup[]
  onChange: (value: string) => void
}

/** Alphabetical by label, numeric-aware so "2" sorts before "10". Every
 *  dropdown is sorted this way — grouped lists are sorted within each group. */
const byLabel = (a: SelectOption, b: SelectOption) =>
  a.label.localeCompare(b.label, undefined, { numeric: true })

/**
 * A custom, fully-styled dropdown (NOT a native <select>) so it looks identical
 * across browsers and OSes. Implements the ARIA listbox pattern: a button opens
 * a listbox; arrow keys move the active option (aria-activedescendant), Enter/Space
 * selects, Escape closes, click-outside dismisses, and focus returns to the button.
 */
export function Select({ label, value, options, groups, onChange }: SelectProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const id = useId()

  const sortedGroups = useMemo(
    () => groups?.map((g) => ({ label: g.label, options: [...g.options].sort(byLabel) })),
    [groups],
  )
  const sortedOptions = useMemo(() => (options ? [...options].sort(byLabel) : undefined), [options])
  const flat = useMemo<SelectOption[]>(
    () => (sortedGroups ? sortedGroups.flatMap((g) => g.options) : (sortedOptions ?? [])),
    [sortedGroups, sortedOptions],
  )
  const currentLabel = flat.find((o) => o.value === value)?.label ?? ''
  const optId = (i: number) => `${id}-opt-${i}`

  const openList = () => {
    setActive(Math.max(0, flat.findIndex((o) => o.value === value)))
    setOpen(true)
  }
  const close = (focusButton = true) => {
    setOpen(false)
    if (focusButton) btnRef.current?.focus()
  }
  const choose = (v: string) => {
    onChange(v)
    close()
  }

  // Dismiss on outside pointer down.
  useEffect(() => {
    if (!open) return
    const onDoc = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDoc)
    return () => document.removeEventListener('pointerdown', onDoc)
  }, [open])

  // Move focus into the list when it opens.
  useEffect(() => {
    if (open) listRef.current?.focus()
  }, [open])

  const onListKey = (e: KeyboardEvent<HTMLUListElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActive((i) => Math.min(flat.length - 1, i + 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActive((i) => Math.max(0, i - 1))
        break
      case 'Home':
        e.preventDefault()
        setActive(0)
        break
      case 'End':
        e.preventDefault()
        setActive(flat.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (flat[active]) choose(flat[active].value)
        break
      case 'Escape':
        e.preventDefault()
        close()
        break
      case 'Tab':
        setOpen(false)
        break
    }
  }

  const onButtonKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openList()
    }
  }

  const renderOption = (o: SelectOption, i: number) => (
    <li
      key={o.value}
      id={optId(i)}
      role="option"
      aria-selected={o.value === value}
      className={`dropdown__opt${i === active ? ' is-active' : ''}${o.value === value ? ' is-selected' : ''}`}
      onPointerEnter={() => setActive(i)}
      onClick={() => choose(o.value)}
    >
      {o.label}
    </li>
  )

  // Grouped render needs a running flat index so aria-activedescendant lines up.
  let flatIndex = -1

  return (
    <div className="field" ref={rootRef}>
      <span className="field__label" id={`${id}-label`}>
        {label}
      </span>
      <div className="dropdown">
        <button
          ref={btnRef}
          type="button"
          className="dropdown__button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={`${id}-label ${id}-value`}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={onButtonKey}
        >
          <span id={`${id}-value`} className="dropdown__value">
            {currentLabel}
          </span>
          <span className="dropdown__caret" aria-hidden="true">
            ▾
          </span>
        </button>
        {open && (
          <ul
            ref={listRef}
            className="dropdown__list"
            role="listbox"
            tabIndex={-1}
            aria-labelledby={`${id}-label`}
            aria-activedescendant={optId(active)}
            onKeyDown={onListKey}
          >
            {sortedGroups
              ? sortedGroups.map((g) => (
                  <li key={g.label} role="group" aria-label={g.label} className="dropdown__group">
                    <span className="dropdown__group-label" aria-hidden="true">
                      {g.label}
                    </span>
                    <ul role="presentation" className="dropdown__group-list">
                      {g.options.map((o) => {
                        flatIndex += 1
                        return renderOption(o, flatIndex)
                      })}
                    </ul>
                  </li>
                ))
              : flat.map((o, i) => renderOption(o, i))}
          </ul>
        )}
      </div>
    </div>
  )
}
