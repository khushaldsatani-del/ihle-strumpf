import { FileUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import ProductState from '../components/ProductState.jsx'
import ProductThumb from '../components/ProductThumb.jsx'
import { ColorDot } from '../components/StatusBadges.jsx'
import { EmptyState, PageHeader, Pagination, SearchField, TableWrap } from '../components/ui.jsx'
import { useData } from '../context/contexts.js'
import { CATEGORIES } from '../data/categories.js'
import usePaged from '../hooks/usePaged.js'
import { formatMoney } from '../utils/format.js'
import { categoryName, colorName, groupName } from '../utils/names.js'
import { priceRange, productState } from '../utils/products.js'
import { matchesSearch } from '../utils/search.js'
import { articleId } from '../utils/sku.js'

export default function Products() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { products, orders } = useData()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [state, setState] = useState('all')

  // Pieces ordered per article, over all orders
  const ordered = useMemo(() => {
    const pieces = new Map()
    orders.forEach((order) =>
      order.items.forEach((item) => {
        const article = item.sku.split(' ').slice(0, 2).join(' ')
        pieces.set(article, (pieces.get(article) || 0) + item.amount)
      }),
    )
    return pieces
  }, [orders])

  const filtered = useMemo(() => {
    return products
      .filter((product) => category === 'all' || product.category === category)
      .filter((product) => state === 'all' || productState(product) === state)
      .filter((product) => matchesSearch([product.articleNo, product.name, product.description, ...product.variants.map((variant) => variant.sku)], query))
      .sort((a, b) => a.articleNo.localeCompare(b.articleNo))
  }, [products, query, category, state])

  const paged = usePaged(filtered, `${query}|${category}|${state}`)

  return (
    <>
      <PageHeader
        title={t('products.title')}
        description={t('products.subtitle', {
          count: products.length,
          visible: products.filter((product) => productState(product) === 'visible').length,
          waiting: products.filter((product) => productState(product) === 'waiting').length,
        })}
        actions={
          <Link to="/import" className="btn btn-primary">
            <FileUp size={16} aria-hidden="true" />
            {t('products.importButton')}
          </Link>
        }
      />

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
          <SearchField value={query} onChange={setQuery} placeholder={t('products.search')} />
          <div className="flex gap-3 sm:ml-auto">
            <select className="field sm:w-52" value={category} onChange={(event) => setCategory(event.target.value)} aria-label={t('products.category')}>
              <option value="all">{t('products.allCategories')}</option>
              {CATEGORIES.map((entry) => (
                <option key={entry.navCode} value={entry.navCode}>
                  {categoryName(entry.navCode)}
                </option>
              ))}
            </select>
            <select className="field sm:w-44" value={state} onChange={(event) => setState(event.target.value)} aria-label={t('products.stateLabel')}>
              <option value="all">{t('products.allStates')}</option>
              {['visible', 'waiting', 'blocked'].map((key) => (
                <option key={key} value={key}>
                  {t(`products.state.${key}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length ? (
          <>
            <TableWrap>
              <table className="table table-clickable">
                <thead>
                  <tr>
                    <th>{t('products.product')}</th>
                    <th>{t('products.category')}</th>
                    <th>{t('products.colors')}</th>
                    <th className="num">{t('products.variants')}</th>
                    <th className="num">{t('products.priceFrom')}</th>
                    <th className="num">{t('products.ordered')}</th>
                    <th>{t('products.stateLabel')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.items.map((product) => {
                    const id = articleId(product.articleNo)
                    // One variant per colour, for the dot and its name
                    const productColors = [...new Map(product.variants.map((variant) => [variant.color, variant])).values()]
                    return (
                      <tr key={product.articleNo} onClick={() => navigate(`/products/${id}`)}>
                        <td className="min-w-64">
                          <div className="flex items-center gap-3">
                            <ProductThumb photo={product.photos?.[0]} />
                            <div className="min-w-0">
                              <Link to={`/products/${id}`} onClick={(event) => event.stopPropagation()} className="block truncate font-medium text-heading">
                                {product.name}
                              </Link>
                              <span className="font-mono text-xs text-muted">{product.articleNo}</span>
                            </div>
                          </div>
                        </td>
                        <td className="max-w-56">
                          <span className="block truncate">{categoryName(product.category)}</span>
                          <span className="block truncate text-xs text-muted">{groupName(product.productGroup)}</span>
                        </td>
                        <td>
                          <span className="flex max-w-44 flex-wrap gap-1">
                            {productColors.map((variant) => (
                              <span key={variant.color} title={`${variant.color} · ${colorName(variant)}`}>
                                <ColorDot code={variant.color} />
                              </span>
                            ))}
                          </span>
                        </td>
                        <td className="num">{product.variants.length}</td>
                        <td className="num">{formatMoney(priceRange(product).min)}</td>
                        <td className="num">{ordered.get(product.articleNo) || 0}</td>
                        <td>
                          <ProductState product={product} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </TableWrap>
            <Pagination page={paged.page} pageCount={paged.pageCount} total={paged.total} onChange={paged.setPage} />
          </>
        ) : (
          <EmptyState title={t(products.length ? 'common.noResults' : 'products.empty')} text={t(products.length ? 'common.noResultsText' : 'products.emptyText')} />
        )}
      </div>
    </>
  )
}
