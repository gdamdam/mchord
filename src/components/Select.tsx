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
  /** Flat options, OR pass `groups` for an <optgroup>-grouped list. */
  options?: SelectOption[]
  groups?: SelectGroup[]
  onChange: (value: string) => void
}

/** Labelled native <select> — compact and fully accessible for long lists. */
export function Select({ label, value, options, groups, onChange }: SelectProps) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <select className="field__select" value={value} onChange={(e) => onChange(e.target.value)}>
        {groups
          ? groups.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            ))
          : (options ?? []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
      </select>
    </label>
  )
}
