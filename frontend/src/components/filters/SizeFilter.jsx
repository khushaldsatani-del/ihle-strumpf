// Pill-shaped chips (multi-select), used for the sizes and for the units.
// Each chip is a real checkbox. options: [{ value, label, count }], selected: [value].
export default function SizeFilter({ legend, options, selected, onToggle }) {
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(({ value, label, count }) => {
          const checked = selected.includes(value)
          return (
            <label key={value} className="filter-chip">
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                disabled={count === 0 && !checked}
                onChange={() => onToggle(value)}
              />
              {label}
              <span className="filter-count">({count})</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
