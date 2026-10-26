import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { CATEGORIES } from '../../data/categories.js'

// Category as a radio list with the coloured dots of the navigation. selected = category code or null.
export default function CategoryFilter({ legend, selected, onSelect, count, total }) {
  const { t } = useTranslation()
  const name = useId()

  const options = [
    { code: null, label: t('filters.allCategories'), count: total },
    ...CATEGORIES.map(({ code, nameKey, color }) => ({ code, label: t(nameKey), color, count: count(code) })),
  ]

  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      {options.map(({ code, label, color, count: matches }) => {
        const checked = code === selected
        return (
          <label key={code ?? 'all'} className="filter-option">
            <input
              type="radio"
              name={name}
              className="filter-check"
              checked={checked}
              disabled={matches === 0 && !checked}
              onChange={() => onSelect(code)}
            />
            {color && <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />}
            <span className="flex-1">{label}</span>
            <span className="filter-count">({matches})</span>
          </label>
        )
      })}
    </fieldset>
  )
}
