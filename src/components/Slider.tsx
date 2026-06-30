interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  /** Render the current value for display + screen-reader text. */
  format?: (value: number) => string
}

/**
 * Labelled native range input. Native <input type=range> gives keyboard control
 * and screen-reader support for free; we add a visible value readout.
 */
export function Slider({ label, value, min, max, step = 1, onChange, format }: SliderProps) {
  const shown = format ? format(value) : String(value)
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
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        aria-valuetext={shown}
      />
    </label>
  )
}
