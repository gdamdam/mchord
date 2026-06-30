interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
}

/** Labelled native <select> — compact and fully accessible for long lists. */
export function Select({ label, value, options, onChange }: SelectProps) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <select className="field__select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
