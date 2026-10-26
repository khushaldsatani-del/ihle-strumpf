import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import ProductState from '../components/ProductState.jsx'
import ProductThumb from '../components/ProductThumb.jsx'
import { ColorDot } from '../components/StatusBadges.jsx'
import { Badge, EmptyState, PageHeader, TableWrap } from '../components/ui.jsx'
import { useData } from '../context/contexts.js'
import { PRICE_GROUPS } from '../data/pricing.js'
import { formatDate, formatMoney, formatSize } from '../utils/format.js'
import { categoryName, colorName, customerName, groupName } from '../utils/names.js'
import { photoFor, priceRange, productState } from '../utils/products.js'
import { articleId } from '../utils/sku.js'

function Info({ label, children }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium text-heading">{children || '–'}</dd>
    </div>
  )
}

export default function ProductDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const { products, orders, customersByNumber } = useData()
  const product = products.find((entry) => articleId(entry.articleNo) === id)
  const [picture, setPicture] = useState(0)
  const back = { to: '/products', label: t('products.title') }

  // Which customers ordered this article, and how many pieces
  const buyers = useMemo(() => {
    if (!product) return []
    const totals = new Map()
    orders.forEach((order) =>
      order.items.forEach((item) => {
        if (!item.sku.startsWith(`${product.articleNo} `)) return
        const entry = totals.get(order.customerNumber) || { number: order.customerNumber, amount: 0, orders: new Set() }
        entry.amount += item.amount
        entry.orders.add(order.orderNo)
        totals.set(order.customerNumber, entry)
      }),
    )
    return [...totals.values()].sort((a, b) => b.amount - a.amount)
  }, [orders, product])

  if (!product) {
    return (
      <>
        <PageHeader title={t('products.notFound')} back={back} />
        <div className="card">
          <EmptyState title={t('products.notFound')} text={t('products.notFoundText')} />
        </div>
      </>
    )
  }

  const gallery = product.photos || []
  const current = gallery[Math.min(picture, gallery.length - 1)]
  const missing = product.pictures.filter((file) => !photoFor(product, file))
  const state = productState(product)

  return (
    <>
      <PageHeader
        back={back}
        title={product.name}
        description={`${t('products.articleNo')} ${product.articleNo}${product.description ? ` · ${product.description}` : ''}`}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="card p-5 xl:col-span-2">
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="md:w-64">
              <div className="rounded-xl border border-line p-2">
                <ProductThumb key={current?.name} photo={current} large size="aspect-square w-full" alt={product.name} />
              </div>
              {gallery.length > 1 && (
                <div className="mt-2 flex max-h-56 flex-wrap gap-1.5 overflow-y-auto">
                  {gallery.map((photo, index) => (
                    <button
                      key={photo.name}
                      type="button"
                      onClick={() => setPicture(index)}
                      className={`rounded-lg border p-0.5 transition-colors ${
                        current?.name === photo.name ? 'border-brand' : 'border-line hover:border-line-strong'
                      }`}
                      aria-label={photo.name}
                      aria-pressed={current?.name === photo.name}
                    >
                      <ProductThumb photo={photo} size="size-10" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <dl className="grid flex-1 content-start gap-4 text-sm sm:grid-cols-2">
              <Info label={t('products.stateLabel')}>
                <ProductState product={product} />
              </Info>
              <Info label={t('products.category')}>{categoryName(product.category)}</Info>
              <Info label={t('products.group')}>
                {product.productGroup ? groupName(product.productGroup) : <span className="text-warn">{t('products.noGroup')}</span>}
              </Info>
              <Info label={t('products.unit')}>{t(`units.${product.unit}`, { defaultValue: product.unit })}</Info>
              <Info label={t('products.material')}>{product.material}</Info>
              <Info label={t('products.updated')}>
                {formatDate(product.updatedAt)} · {t(`common.source.${product.source || 'demo'}`)}
              </Info>
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted">{t('products.pictures')}</dt>
                <dd className="mt-0.5 font-medium text-heading">
                  {t('products.picturesCount', { uploaded: gallery.length, total: product.pictures.length })}
                  {/* NAV picture names without an uploaded photo, to pass on to whoever sends the photos */}
                  {missing.length > 0 && (
                    <details className="mt-1.5 text-xs font-normal">
                      <summary className="cursor-pointer text-warn">{t('products.picturesMissing', { count: missing.length })}</summary>
                      <p className="mt-1.5 max-h-32 overflow-y-auto font-mono leading-relaxed break-all text-muted">{missing.join(', ')}</p>
                    </details>
                  )}
                </dd>
              </div>
            </dl>
          </div>
          {state === 'blocked' && <p className="mt-5 rounded-xl bg-red-50 px-3 py-2.5 text-xs text-danger">{t('products.blockedNote')}</p>}
          {state === 'waiting' && <p className="mt-5 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-warn">{t('products.waitingNote')}</p>}
        </section>

        <section className="card p-5">
          <h2 className="text-base">{t('products.pricesByGroup')}</h2>
          <p className="mt-1 text-xs text-muted">{t('products.pricesByGroupHint')}</p>
          <ul className="mt-4 space-y-3">
            {PRICE_GROUPS.map((group) => {
              const range = priceRange(product, group.priceField)
              return (
                <li key={group.code} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3 py-2.5 text-sm">
                  <span className="flex items-center gap-2">
                    <Badge tone="brand">{group.code}</Badge>
                    <span className="text-xs text-muted">{t(`priceFields.${group.priceField}`)}</span>
                  </span>
                  <span className="font-semibold text-heading tabular-nums">
                    {range.min === range.max ? formatMoney(range.min) : `${formatMoney(range.min)} – ${formatMoney(range.max)}`}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <section className="card mt-4 overflow-hidden">
        <h2 className="px-5 py-4 text-base">{t('products.variantsTitle', { count: product.variants.length })}</h2>
        <TableWrap>
          <table className="table">
            <thead>
              <tr>
                <th>{t('products.sku')}</th>
                <th>{t('products.color')}</th>
                <th>{t('products.size')}</th>
                <th className="num">VK01 · {t('priceFields.price')}</th>
                <th className="num">VK02 · {t('priceFields.price2')}</th>
                <th>{t('products.vat')}</th>
                <th>{t('products.stateLabel')}</th>
              </tr>
            </thead>
            <tbody>
              {product.variants.map((variant) => (
                <tr key={variant.sku}>
                  <td className="font-mono text-xs whitespace-nowrap text-heading">{variant.sku}</td>
                  <td className="whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      <ColorDot code={variant.color} />
                      {variant.color} · {colorName(variant)}
                    </span>
                  </td>
                  <td>{formatSize(variant.size)}</td>
                  <td className="num">{formatMoney(variant.price)}</td>
                  <td className="num">{formatMoney(variant.price2)}</td>
                  <td className="text-muted">{variant.vat}</td>
                  <td>
                    {variant.blocked ? <Badge tone="danger">{t('products.state.blocked')}</Badge> : <Badge tone="ok">{t('products.active')}</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </section>

      <section className="card mt-4 overflow-hidden">
        <h2 className="px-5 py-4 text-base">{t('products.buyers')}</h2>
        {buyers.length ? (
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  <th>{t('orders.customer')}</th>
                  <th className="num">{t('customers.orders')}</th>
                  <th className="num">{t('orders.pieces')}</th>
                </tr>
              </thead>
              <tbody>
                {buyers.map((buyer) => (
                  <tr key={buyer.number}>
                    <td>
                      <Link to={`/customers/${buyer.number}`} className="font-medium text-heading hover:text-brand">
                        {customerName(customersByNumber.get(buyer.number))}
                      </Link>
                      <span className="block text-xs text-muted">{buyer.number}</span>
                    </td>
                    <td className="num">{buyer.orders.size}</td>
                    <td className="num font-medium text-heading">{buyer.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <EmptyState title={t('products.noBuyers')} />
        )}
      </section>
    </>
  )
}
