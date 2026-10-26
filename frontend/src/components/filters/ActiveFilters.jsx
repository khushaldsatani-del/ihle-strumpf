import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// The active filters as small chips; a click removes that filter. items: [{ key, label, onRemove }]
export default function ActiveFilters({ items }) {
  const { t } = useTranslation()
  if (items.length === 0) return null

  return (
    <ul aria-label={t('filters.active')} className="flex flex-wrap gap-2 px-1 pb-4">
      {items.map(({ key, label, onRemove }) => (
        <li key={key}>
          <button type="button" className="filter-active" aria-label={t('filters.remove', { name: label })} onClick={onRemove}>
            {label}
            <X size={14} strokeWidth={2.25} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  )
}
