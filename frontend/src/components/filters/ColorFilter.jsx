import { Check } from 'lucide-react'

// Light colours get a dark checkmark
const isLight = (hex) => {
  const [r, g, b] = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16))
  return r * 0.299 + g * 0.587 + b * 0.114 > 170
}

// Round colour swatches (multi-select). Each is a real checkbox with a tooltip name and the number of products.
// colors: [{ code, name, hex }] from the products (NAV colour codes and names).
export default function ColorFilter({ legend, colors, selected, onToggle, count }) {
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className="flex flex-wrap gap-x-3 gap-y-2">
        {colors.map(({ code, name, hex }) => {
          const checked = selected.includes(code)
          const matches = count(code)
          return (
            <label key={code} className="filter-swatch">
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                disabled={matches === 0 && !checked}
                aria-label={`${name} (${matches})`}
                onChange={() => onToggle(code)}
              />
              <span className="filter-swatch__dot" style={{ backgroundColor: hex, color: isLight(hex) ? '#3b1f12' : '#fff' }}>
                {checked && <Check size={16} strokeWidth={3} aria-hidden="true" />}
              </span>
              <span aria-hidden="true" className="filter-count">
                ({matches})
              </span>
              <span aria-hidden="true" className="filter-swatch__tip">
                {name}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
