import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CATEGORIES, findCategory } from '../../data/categories.js'
import { colorHex, colorLabel, FIBRES, sizeLabel } from '../../data/filters.js'
import { countOption } from '../../utils/filterProducts.js'
import ActiveFilters from './ActiveFilters.jsx'
import CategoryFilter from './CategoryFilter.jsx'
import CheckboxFilter from './CheckboxFilter.jsx'
import ColorFilter from './ColorFilter.jsx'
import FilterSection from './FilterSection.jsx'
import ProductGroupFilter from './ProductGroupFilter.jsx'
import SizeFilter from './SizeFilter.jsx'

// Sizes come in several kinds ("35-38", "11-12cm", "6cm", "universal"): sorted by their first number
const sizeOrder = (size) => {
  const number = parseFloat(size)
  return Number.isNaN(number) ? Infinity : number
}

// The options every filter offers, taken from the products themselves (NAV data)
function optionsOf(products) {
  const colors = new Map()
  const sizes = new Set()
  const units = new Set()
  const fibres = new Set()
  for (const product of products) {
    product.colors.forEach(({ code, navName }) => colors.has(code) || colors.set(code, colorLabel(navName, code)))
    product.sizes.forEach((size) => sizes.add(size))
    units.add(product.unit)
    product.materials.forEach((fibre) => fibres.add(fibre))
  }
  return {
    colors: [...colors].sort(([a], [b]) => a.localeCompare(b)).map(([code, name]) => ({ code, name, hex: colorHex(code) })),
    sizes: [...sizes].sort((a, b) => sizeOrder(a) - sizeOrder(b) || a.localeCompare(b)),
    units: [...units].filter(Boolean).sort(),
    fibres: FIBRES.filter(({ code }) => fibres.has(code)).map(({ code }) => code),
  }
}

/**
 * Content of the filter panel: header, active filters and the collapsible filter sections.
 * api = result of useFilters(), products = all products (for the options and the counts next to them),
 * resultCount = number of products currently shown. footer = true adds the bar with "reset" and "show results".
 */
export default function FilterPanel({ id, api, products, resultCount, onClose, footer = false, closeRef }) {
  const { t } = useTranslation()
  const { filters, activeCount, setCategory, toggle, reset } = api
  const category = findCategory(filters.category)
  const options = optionsOf(products)
  const count = (key) => (value) => countOption(products, filters, key, value)
  const unitName = (code) => t(`filters.units.${code}`, { defaultValue: code })

  // Chips for every active filter
  const labels = {
    group: (code) => t(category?.groups.find((group) => group.code === code)?.nameKey ?? code),
    color: (code) => options.colors.find((color) => color.code === code)?.name ?? code,
    size: (code) => sizeLabel(code),
    material: (code) => t(`filters.materials.${code}`),
    unit: unitName,
  }
  const active = [
    ...(category ? [{ key: 'category', label: t(category.nameKey), onRemove: () => setCategory(null) }] : []),
    ...Object.keys(labels).flatMap((key) =>
      filters[key].map((value) => ({ key: `${key}-${value}`, label: labels[key](value), onRemove: () => toggle(key, value) })),
    ),
  ]

  return (
    <div id={id} className="filter-panel">
      <div className="flex min-h-12 items-center gap-3 pl-1">
        <h2 className="flex-1 text-lg font-bold text-heading">{t('filters.title')}</h2>
        {activeCount > 0 && (
          <button type="button" className="filter-link" onClick={reset}>
            {t('filters.resetAll')}
          </button>
        )}
        <button ref={closeRef} type="button" className="filter-close" aria-label={t('filters.close')} onClick={onClose}>
          <X size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>

      <div className="filter-panel__body">
        <ActiveFilters items={active} />

        <FilterSection title={t('filters.category')}>
          <CategoryFilter
            legend={t('filters.category')}
            selected={filters.category}
            onSelect={setCategory}
            count={count('category')}
            total={CATEGORIES.reduce((sum, { code }) => sum + count('category')(code), 0)}
          />
        </FilterSection>

        {/* Only for a category that has product groups */}
        {category?.groups.length > 0 && (
          <FilterSection title={t('filters.group')}>
            <ProductGroupFilter
              legend={t('filters.group')}
              category={category}
              selected={filters.group}
              onToggle={(value) => toggle('group', value)}
              count={count('group')}
            />
          </FilterSection>
        )}

        <FilterSection title={t('filters.color')}>
          <ColorFilter
            legend={t('filters.color')}
            colors={options.colors}
            selected={filters.color}
            onToggle={(value) => toggle('color', value)}
            count={count('color')}
          />
        </FilterSection>

        <FilterSection title={t('filters.size')}>
          <SizeFilter
            legend={t('filters.size')}
            options={options.sizes.map((size) => ({ value: size, label: sizeLabel(size), count: count('size')(size) }))}
            selected={filters.size}
            onToggle={(value) => toggle('size', value)}
          />
        </FilterSection>

        <FilterSection title={t('filters.material')}>
          <CheckboxFilter
            legend={t('filters.material')}
            options={options.fibres.map((code) => ({ value: code, label: t(`filters.materials.${code}`), count: count('material')(code) }))}
            selected={filters.material}
            onToggle={(value) => toggle('material', value)}
          />
        </FilterSection>

        <FilterSection title={t('filters.unit')}>
          <SizeFilter
            legend={t('filters.unit')}
            options={options.units.map((code) => ({ value: code, label: unitName(code), count: count('unit')(code) }))}
            selected={filters.unit}
            onToggle={(value) => toggle('unit', value)}
          />
        </FilterSection>
      </div>

      {footer && (
        <div className="filter-panel__footer">
          <button type="button" className="filter-footer-btn" disabled={activeCount === 0} onClick={reset}>
            {t('filters.reset')}
          </button>
          <button type="button" className="filter-footer-btn filter-footer-btn--primary" onClick={onClose}>
            {t('filters.showResults', { count: resultCount })}
          </button>
        </div>
      )}
    </div>
  )
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), a[href]'

/**
 * Tablet / phone version: the panel slides in from the left over a dimmed page.
 * Render it inside <AnimatePresence>. Closes with the X, a tap on the dimmed page, Escape or "show results".
 */
export function FilterDrawer({ onClose, ...panelProps }) {
  const { t } = useTranslation()
  const drawerRef = useRef(null)
  const closeRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  // While open: lock the page scroll, keep Tab inside the panel, Escape closes, focus goes back afterwards
  useEffect(() => {
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = [...drawerRef.current.querySelectorAll(FOCUSABLE)]
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const current = document.activeElement

      if (!drawerRef.current.contains(current) || (!event.shiftKey && current === last)) {
        event.preventDefault()
        first.focus()
      } else if (event.shiftKey && current === first) {
        event.preventDefault()
        last.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus?.()
    }
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <motion.div
        className="absolute inset-0 bg-black/45"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
      />
      <motion.div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('filters.title')}
        className="filter-drawer absolute inset-y-0 left-0 w-[22rem] max-w-[85%]"
        initial={{ x: '-100%', opacity: 0.6 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '-100%', opacity: 0.6 }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      >
        <FilterPanel {...panelProps} onClose={onClose} closeRef={closeRef} footer />
      </motion.div>
    </div>,
    document.body,
  )
}
