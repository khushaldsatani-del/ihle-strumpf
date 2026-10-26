import { LayoutGrid, List } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const VIEWS = [
  { value: 'grid', icon: LayoutGrid, labelKey: 'products.view.grid' },
  { value: 'list', icon: List, labelKey: 'products.view.list' },
]

// Two icon buttons that switch the product list between the grid and the list view.
export default function ViewToggle({ view, onChange }) {
  const { t } = useTranslation()

  return (
    <div role="group" aria-label={t('products.view.label')} className="view-toggle">
      {VIEWS.map(({ value, icon: Icon, labelKey }) => (
        <button
          key={value}
          type="button"
          aria-label={t(labelKey)}
          aria-pressed={view === value}
          title={t(labelKey)}
          onClick={() => onChange(value)}
        >
          <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}
