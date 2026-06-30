interface Option<T extends string> {
  value: T
  label: string
  /** Optional one-word hint shown under the label. */
  hint?: string
}

interface SegmentedProps<T extends string> {
  label: string
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
  /** Visually hide the group label (still read by screen readers). */
  hideLabel?: boolean
}

/**
 * A single-select control built from native radio inputs, so arrow-key
 * navigation, focus, and screen-reader semantics come from the platform. The
 * inputs are visually hidden; the labels are the buttons.
 */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  hideLabel,
}: SegmentedProps<T>) {
  return (
    <fieldset className="segmented">
      <legend className={hideLabel ? 'sr-only' : 'segmented__legend'}>{label}</legend>
      <div className="segmented__row">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`segmented__opt${opt.value === value ? ' is-active' : ''}`}
          >
            <input
              type="radio"
              name={label}
              value={opt.value}
              checked={opt.value === value}
              onChange={() => onChange(opt.value)}
            />
            <span className="segmented__opt-label">{opt.label}</span>
            {opt.hint && <span className="segmented__opt-hint">{opt.hint}</span>}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
