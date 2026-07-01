import { useDragCommit } from './useDragCommit'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  /** `transient` is true for mid-drag increments (no undo checkpoint). */
  onChange: (value: number, transient?: boolean) => void
  /** Render the current value for display + screen-reader text. */
  format?: (value: number) => string
}

/**
 * Labelled native range input. Native <input type=range> gives keyboard control
 * and screen-reader support for free; we add a visible value readout.
 */
export function Slider({ label, value, min, max, step = 1, onChange, format }: SliderProps) {
  const shown = format ? format(value) : String(value)
  const { commit, dragProps } = useDragCommit(onChange)
  return (
    <label className="slider">
      <span className="slider__label">
        <span>{label}</span>
        <span className="slider__value">{shown}</span>
      </span>
      <input
        type="range"
        className="slider__input"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => commit(Number(e.target.value))}
        {...dragProps}
        aria-label={label}
        aria-valuetext={shown}
      />
    </label>
  )
}
