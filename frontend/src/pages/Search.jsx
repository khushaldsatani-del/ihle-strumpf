import { SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { LoadError, ProductGridSkeleton } from '../components/common/Loading.jsx'
import ProductCard from '../components/products/ProductCard.jsx'
import { useCatalog } from '../context/CatalogContext.jsx'
import { findByNumber } from '../utils/articleNumber.js'
import { searchProducts } from '../utils/searchProducts.js'

const GRID = 'grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-14'

// Product page link for a number hit: with the SKU (colour and size chosen) or at least the colour
const productPath = ({ product, variant, color }) => {
  const params = variant ? `?sku=${encodeURIComponent(variant.sku)}` : color ? `?color=${color}` : ''
  return `/products/${product.id}${params}`
}

/**
 * Search (/search?q=…), from the navbar's search field. A full article number as customers know it
 * ("40 000 001 12", also without spaces) opens that article with colour and size already chosen;
 * anything else lists the matching articles (number start, name, description, material, in any language).
 */
export default function Search() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const query = (searchParams.get('q') || '').trim()
  const { status, products, reload } = useCatalog()

  if (status === 'ready') {
    const exact = findByNumber(query, products)
    if (exact) return <Navigate to={productPath(exact)} replace />
  }

  const results = status === 'ready' ? searchProducts(products, query) : []

  return (
    <div className="mx-auto max-w-[96rem] px-4 pb-20 pt-10 sm:px-8 lg:px-16 lg:pt-14">
      <h1 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl">{t('pages.search')}</h1>
      {query && (
        <p className="mt-2 text-body" aria-live="polite">
          {t('pages.searchFor', { query })}
          {status === 'ready' && <> · {t('products.count', { count: results.length })}</>}
        </p>
      )}

      <div className="mt-10">
        {status === 'loading' ? (
          <ProductGridSkeleton count={4} className={GRID} />
        ) : status === 'error' ? (
          <LoadError text={t('products.loadError')} onRetry={reload} />
        ) : results.length ? (
          <ul className={GRID}>
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-[#faf8f4] px-6 py-14 text-center">
            <SearchX size={28} strokeWidth={1.5} className="text-body" aria-hidden="true" />
            <p className="text-lg font-semibold text-heading">{t('search.noResults')}</p>
            <p className="max-w-md text-sm text-body">{t('search.hint')}</p>
            <Link to="/products" className="mt-2 text-sm font-semibold text-heading underline underline-offset-4">
              {t('nav.viewAllProducts')}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
