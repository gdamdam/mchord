import type { CSSProperties } from 'react'
import type { MacroValues } from '../types'
import { MACRO_LABELS } from './displayNames'

interface MacrosProps {
  macros: MacroValues
  onChange: (macro: keyof MacroValues, value: number) => void
}

const ORDER: (keyof MacroValues)[] = ['tension', 'spread', 'motion', 'color']

/**
 * The four performance macros. Each maps to a curated group of engine/voicing
 * parameters (handled downstream) — here they are large, tactile faders that
 * stay legible while a progression plays.
 */
export function Macros({ macros, onChange }: MacrosProps) {
  return (
    <div className="macros" role="group" aria-label="Performance macros">
      {ORDER.map((key) => {
        const meta = MACRO_LABELS[key]
        const pct = Math.round(macros[key] * 100)
        return (
          <div className="macro" key={key}>
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
              value={macros[key]}
              onChange={(e) => onChange(key, Number(e.target.value))}
              aria-label={`${meta.name} — ${meta.hint}`}
              aria-valuetext={`${pct} percent`}
              style={{ '--fill': `${pct}%` } as CSSProperties}
            />
            <span className="macro__hint">{meta.hint}</span>
          </div>
        )
      })}
    </div>
  )
}
