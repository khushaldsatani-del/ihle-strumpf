import { useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { LoadError, ProductGridSkeleton, Skeleton } from '../components/common/Loading.jsx'
import FilterButton from '../components/filters/FilterButton.jsx'
import FilterPanel from '../components/filters/FilterPanel.jsx'
import Pagination from '../components/products/Pagination.jsx'
import ProductCard from '../components/products/ProductCard.jsx'
import SortDropdown from '../components/products/SortDropdown.jsx'
import ViewToggle from '../components/products/ViewToggle.jsx'
import { findCategory } from '../data/categories.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useCatalog } from '../context/CatalogContext.jsx'
import useFilters from '../hooks/useFilters.js'
import useMediaQuery from '../hooks/useMediaQuery.js'
import usePrices, { lowestPrice } from '../hooks/usePrices.js'
import { filterProducts } from '../utils/filterProducts.js'
import { productName } from '../utils/productText.js'
import { PAGE_SIZES, readStoredPageSize, readStoredView, storePageSize, storeView } from '../utils/preferences.js'

const SORTS = ['articleNo', 'name', 'price', 'size']
const STORAGE_KEY = 'ihle_filter_open' // remembers whether the filter panel is open (tablet and desktop)
const EASE = [0.22, 1, 0.36, 1]

// localStorage can be unavailable (private mode, blocked site data)
function readStoredOpen() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function storeOpen(open) {
  try {
    localStorage.setItem(STORAGE_KEY, open ? '1' : '0')
  } catch {
    // not remembered, nothing else to do
  }
}

/**
 * Product list: title, filter and sort bar, the filter panel and a grid of products.
 * The filter panel opens below the "Filter" button and makes room for itself:
 * - desktop (from 1024px): sidebar on the left, the grid goes from 4 columns to 3
 * - tablet (768–1023px): narrower sidebar, the grid goes from 3 columns to 2
 * - phone: the panel opens across the full width above the products (2 columns stay)
 * The products can be shown as a grid or as a list (the two icons after "Sort by").
 * Prices and the order fields are only shown to logged-in customers (see ProductCard / OrderForm).
 */
export default function Products() {
  const { t, i18n } = useTranslation()
  const panelId = useId()
  const api = useFilters()
  const { filters, activeCount } = api
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const isTablet = useMediaQuery('(min-width: 768px)')
  const sideBySide = isTablet // sidebar next to the grid; below that the panel sits above the grid
  const [sidebarOpen, setSidebarOpen] = useState(readStoredOpen)
  const [phoneOpen, setPhoneOpen] = useState(false)
  const { isLoggedIn } = useAuth()
  const catalog = useCatalog()
  const priceData = usePrices() // null for guests
  const [sort, setSort] = useState('articleNo')
  const [view, setView] = useState(readStoredView)
  const [pageSize, setPageSize] = useState(readStoredPageSize)
  const [searchParams, setSearchParams] = useSearchParams()
  const toolbarRef = useRef(null)
  const changeView = (next) => {
    setView(next)
    storeView(next)
  }

  const panelOpen = sideBySide ? sidebarOpen : phoneOpen
  const setPanelOpen = (open) => {
    if (sideBySide) {
      setSidebarOpen(open)
      storeOpen(open)
    } else {
      setPhoneOpen(open)
    }
  }

  // Sorting (ascending). Ties are ordered by article number.
  const text = (a, b) => a.localeCompare(b, i18n.resolvedLanguage, { numeric: true })
  const smallestSize = (product) => Math.min(...product.sizes.map((size) => parseFloat(size) || Infinity))
  const compare = {
    // by the name shown, i.e. the translated one when NAV has it
    name: (a, b) => text(productName(a, i18n.resolvedLanguage), productName(b, i18n.resolvedLanguage)),
    articleNo: (a, b) => text(a.articleNo, b.articleNo),
    size: (a, b) => smallestSize(a) - smallestSize(b),
    // only possible for logged-in customers; guests have no price data
    price: (a, b) => (priceData ? (lowestPrice(priceData, a) ?? 0) - (lowestPrice(priceData, b) ?? 0) : 0),
  }
  const products = filterProducts(catalog.products, filters).sort(
    (a, b) => compare[sort](a, b) || text(a.articleNo, b.articleNo),
  )

  // Pages: the page number is in the URL (?page=2); changing a filter starts again at page 1
  const pageCount = Math.max(1, Math.ceil(products.length / pageSize))
  const page = Math.min(Math.max(parseInt(searchParams.get('page'), 10) || 1, 1), pageCount)
  const pageItems = products.slice((page - 1) * pageSize, page * pageSize)

  const setPage = (next) =>
    setSearchParams(
      (previous) => {
        const params = new URLSearchParams(previous)
        if (next <= 1) params.delete('page')
        else params.set('page', String(next))
        return params
      },
      { preventScrollReset: true },
    )
  const goToPage = (next) => {
    setPage(next)
    toolbarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const changePageSize = (size) => {
    setPageSize(size)
    storePageSize(size)
    setPage(1)
  }
  const changeSort = (next) => {
    setSort(next)
    setPage(1)
  }

  // Title: the chosen product group (when it is the only one), else the category, else "All products"
  const category = findCategory(filters.category)
  const group = filters.group.length === 1 ? category?.groups.find(({ code }) => code === filters.group[0]) : null

  // Grid of product cards; the loading placeholders use the same grid, so nothing jumps when products arrive
  const gridClass = `grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:gap-x-8 lg:gap-y-14 ${
    sideBySide && sidebarOpen ? 'lg:grid-cols-3' : 'md:grid-cols-3 lg:grid-cols-4'
  }`

  const sidebarWidth = isDesktop ? 300 : 248
  const sidebarGap = isDesktop ? 32 : 20
  const panel = (
    <FilterPanel
      id={panelId}
      api={api}
      products={catalog.products}
      resultCount={products.length}
      onClose={() => setPanelOpen(false)}
      footer={!sideBySide}
    />
  )

  return (
    <div className="mx-auto max-w-[96rem] px-4 pb-20 pt-10 sm:px-8 lg:px-16 lg:pt-14">
      <h1 className="text-center text-3xl font-bold tracking-tight text-heading sm:text-4xl">
        {group ? t(group.nameKey) : category ? t(category.nameKey) : t('categories.all')}
      </h1>

      {/* Filter button on the left, number of products and sorting on the right */}
      <div ref={toolbarRef} className="mt-8 flex scroll-mt-28 flex-wrap items-center justify-between gap-x-6 gap-y-3 lg:mt-12">
        <FilterButton open={panelOpen} count={activeCount} controls={panelId} onClick={() => setPanelOpen(!panelOpen)} />

        <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-3 text-sm text-heading sm:gap-x-8">
          {catalog.status === 'loading' ? (
            <Skeleton className="h-4 w-20" />
          ) : (
            <p aria-live="polite">{t('products.count', { count: products.length })}</p>
          )}
          <SortDropdown
            label={t('products.sortBy')}
            value={sort}
            options={SORTS.map((key) => ({
              value: key,
              label: t(`products.sort.${key}`),
              // guests see no prices, so they cannot sort by price either
              disabled: key === 'price' && !isLoggedIn,
              hint: key === 'price' && !isLoggedIn ? t('products.sortLoginHint') : null,
            }))}
            onChange={changeSort}
          />
          <ViewToggle view={view} onChange={changeView} />
        </div>
      </div>

      <div className="mt-6 md:mt-8 md:flex md:items-start lg:mt-10">
        <AnimatePresence initial={false}>
          {/* Tablet and desktop: sidebar that grows from the left and pushes the grid */}
          {sideBySide && sidebarOpen && (
            <motion.aside
              key="filter-sidebar"
              className="filter-sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: sidebarWidth + sidebarGap, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <motion.div
                style={{ width: sidebarWidth }}
                initial={{ x: -40 }}
                animate={{ x: 0 }}
                exit={{ x: -40 }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                {panel}
              </motion.div>
            </motion.aside>
          )}

          {/* Phone: the panel opens downwards and pushes the products down */}
          {!sideBySide && phoneOpen && (
            <motion.div
              key="filter-stack"
              className="filter-stack overflow-hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <div className="pb-8">{panel}</div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="min-w-0 flex-1">
          {catalog.status === 'loading' ? (
            <ProductGridSkeleton count={pageSize > 8 ? 8 : pageSize} className={gridClass} />
          ) : catalog.status === 'error' ? (
            <div className="py-12">
              <LoadError text={t('products.loadError')} onRetry={catalog.reload} />
            </div>
          ) : products.length > 0 && view === 'list' ? (
            // List view: one product per row, picture on the left
            <ul className="product-list">
              {pageItems.map((product) => (
                <ProductCard key={product.id} product={product} layout="list" />
              ))}
            </ul>
          ) : products.length > 0 ? (
            <ul className={gridClass}>
              {pageItems.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </ul>
          ) : (
            <p className="py-24 text-center text-lg text-body" role="status">
              {t('products.empty')}
            </p>
          )}

          {products.length > 0 && (
            <Pagination
              page={page}
              pageSize={pageSize}
              pageSizes={PAGE_SIZES}
              total={products.length}
              onPage={goToPage}
              onPageSize={changePageSize}
            />
          )}
        </div>
      </div>
    </div>
  )
}
