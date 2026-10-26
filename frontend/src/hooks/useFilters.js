import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { findCategory } from '../data/categories.js'
import { MULTI_FILTERS } from '../data/filters.js'

const EMPTY = { category: null, group: [], color: [], size: [], material: [], unit: [] }

/**
 * Product filters, kept in the URL query (?category=DIABETES&group=201-KLAS&color=001&size=39-42),
 * so a filtered list can be shared and the browser's back button steps through the changes.
 * filters = { category: code | null, group: [], color: [], size: [], material: [], unit: [] }
 */
export default function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(() => {
    const category = findCategory(searchParams.get('category'))
    const result = { category: category?.code ?? null }
    for (const key of MULTI_FILTERS) result[key] = searchParams.getAll(key)
    // product groups only count when they belong to the chosen category
    result.group = result.group.filter((code) => category?.groups.some((group) => group.code === code))
    return result
  }, [searchParams])

  const write = (next) => {
    const params = new URLSearchParams()
    if (next.category) params.set('category', next.category)
    for (const key of MULTI_FILTERS) next[key].forEach((value) => params.append(key, value))
    setSearchParams(params, { preventScrollReset: true })
  }

  const activeCount = (filters.category ? 1 : 0) + MULTI_FILTERS.reduce((sum, key) => sum + filters[key].length, 0)

  return {
    filters,
    activeCount,
    // Choosing another category clears the product groups
    setCategory: (code) => write({ ...filters, category: code, group: [] }),
    toggle: (key, value) =>
      write({
        ...filters,
        [key]: filters[key].includes(value) ? filters[key].filter((item) => item !== value) : [...filters[key], value],
      }),
    reset: () => write(EMPTY),
  }
}
