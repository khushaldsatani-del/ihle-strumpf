import { SlidersHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// "Filter" button of the toolbar, with a badge for the number of active filters. It opens and closes the panel.
export default function FilterButton({ open, count, controls, onClick }) {
  const { t } = useTranslation()

  return (
    <button type="button" className="shop-chip" aria-expanded={open} aria-controls={controls} onClick={onClick}>
      <SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />
      {t('filters.title')}
      {count > 0 && (
        <span className="filter-badge">
          {count}
          <span className="sr-only"> {t('filters.activeCount', { count })}</span>
        </span>
      )}
    </button>
  )
}
