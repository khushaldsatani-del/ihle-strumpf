import { useTranslation } from 'react-i18next'
import { nameOf } from '../../data/categories.js'
import CheckboxFilter from './CheckboxFilter.jsx'

// Product groups of the chosen category, as checkboxes. Only rendered for a category that has groups.
export default function ProductGroupFilter({ legend, category, selected, onToggle, count }) {
  const { t } = useTranslation()

  const options = category.groups.map((group) => ({ value: group.code, label: nameOf(t, group), count: count(group.code) }))

  return <CheckboxFilter legend={legend} options={options} selected={selected} onToggle={onToggle} />
}
