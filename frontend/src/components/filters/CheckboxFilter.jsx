// List of real checkboxes. options: [{ value, label, count }], selected: [value].
// An option without matching products is greyed out and disabled (unless it is currently selected).
export default function CheckboxFilter({ legend, options, selected, onToggle }) {
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      {options.map(({ value, label, count }) => {
        const checked = selected.includes(value)
        return (
          <label key={value} className="filter-option">
            <input
              type="checkbox"
              className="filter-check"
              checked={checked}
              disabled={count === 0 && !checked}
              onChange={() => onToggle(value)}
            />
            <span className="flex-1">{label}</span>
            <span className="filter-count">({count})</span>
          </label>
        )
      })}
    </fieldset>
  )
}
