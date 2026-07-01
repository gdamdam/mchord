import type { CSSProperties } from 'react'
import type { MacroValues } from '../types'
import { MACRO_LABELS } from './displayNames'
import { useDragCommit } from './useDragCommit'

interface MacrosProps {
  macros: MacroValues
  onChange: (macro: keyof MacroValues, value: number, transient?: boolean) => void
}

const ORDER: (keyof MacroValues)[] = ['tension', 'spread', 'motion', 'color']

/** One tactile fader. Its own hook instance tracks the drag so a whole sweep
 *  collapses to a single undo step (see useDragCommit). */
function MacroFader({
  macroKey,
  value,
  onChange,
}: {
  macroKey: keyof MacroValues
  value: number
  onChange: MacrosProps['onChange']
}) {
  const meta = MACRO_LABELS[macroKey]
  const pct = Math.round(value * 100)
  const { commit, dragProps } = useDragCommit((v, transient) => onChange(macroKey, v, transient))
  return (
    <div className="macro">
      <div className="macro__head">
        <span className="macro__name">{meta.name}</span>
        <span className="macro__value">{pct}</span>
      </div>
      <input
        className="macro__fader"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => commit(Number(e.target.value))}
        {...dragProps}
        aria-label={`${meta.name} — ${meta.hint}`}
        aria-valuetext={`${pct} percent`}
        style={{ '--fill': `${pct}%` } as CSSProperties}
      />
      <span className="macro__hint">{meta.hint}</span>
    </div>
  )
}

/**
 * The four performance macros. Each maps to a curated group of engine/voicing
 * parameters (handled downstream) — here they are large, tactile faders that
 * stay legible while a progression plays.
 */
export function Macros({ macros, onChange }: MacrosProps) {
  return (
    <div className="macros" role="group" aria-label="Performance macros">
      {ORDER.map((key) => (
        <MacroFader key={key} macroKey={key} value={macros[key]} onChange={onChange} />
      ))}
    </div>
  )
}
