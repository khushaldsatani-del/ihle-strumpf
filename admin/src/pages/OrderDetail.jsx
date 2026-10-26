import { CheckCircle2, Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import ProductThumb from '../components/ProductThumb.jsx'
import { ColorDot, OrderStatus, PaymentLabel } from '../components/StatusBadges.jsx'
import { EmptyState, PageHeader, TableWrap } from '../components/ui.jsx'
import { useData } from '../context/contexts.js'
import { formatDateTime, formatMoney, formatSize } from '../utils/format.js'
import { addressLines, colorName, customerName } from '../utils/names.js'
import { download } from '../utils/api.js'
import { ORDER_DISCOUNT_RATE, orderTotals } from '../utils/orders.js'
import { colorPhoto } from '../utils/products.js'
import { articleId } from '../utils/sku.js'

function AddressCard({ title, address }) {
  return (
    <div>
      <h3 className="text-xs font-semibold tracking-wider text-muted uppercase">{title}</h3>
      <address className="mt-2 text-sm leading-relaxed text-heading not-italic">
        {addressLines(address).map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </address>
    </div>
  )
}

export default function OrderDetail() {
  const { t } = useTranslation()
  const { orderNo } = useParams()
  const { orders, customersByNumber, variantsBySku, markExported } = useData()
  const order = orders.find((entry) => entry.orderNo === orderNo)
  const back = { to: '/orders', label: t('orders.title') }

  if (!order) {
    return (
      <>
        <PageHeader title={t('orders.notFound')} back={back} />
        <div className="card">
          <EmptyState title={t('orders.notFound')} text={t('orders.notFoundText', { orderNo })} />
        </div>
      </>
    )
  }

  const customer = customersByNumber.get(order.customerNumber)
  const totals = orderTotals(order)

  // The backend builds the XML, exactly as NAV will receive it
  const downloadXml = () => download(`/admin/orders/${encodeURIComponent(order.orderNo)}/xml`, `${order.orderNo}.xml`)

  return (
    <>
      <PageHeader
        back={back}
        title={t('orders.detailTitle', { orderNo: order.orderNo })}
        description={formatDateTime(order.date)}
        actions={
          <>
            <button type="button" className="btn btn-secondary" onClick={downloadXml}>
              <Download size={16} aria-hidden="true" />
              {t('orders.downloadXml')}
            </button>
            {order.status === 'new' && (
              <button type="button" className="btn btn-primary" onClick={() => markExported(order.orderNo)}>
                <CheckCircle2 size={16} aria-hidden="true" />
                {t('orders.markExported')}
              </button>
            )}
          </>
        }
      />

      {/* The order lines need the full width until very wide screens; the customer cards sit below them */}
      <div className="grid gap-4 2xl:grid-cols-3">
        <section className="card overflow-hidden 2xl:col-span-2">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="text-base">{t('orders.items', { count: order.items.length })}</h2>
            <OrderStatus status={order.status} />
          </div>
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  <th>{t('orders.product')}</th>
                  <th>{t('orders.variant')}</th>
                  <th>{t('orders.commission')}</th>
                  <th className="num">{t('orders.amount')}</th>
                  <th className="num">{t('orders.unitPrice')}</th>
                  <th className="num">{t('orders.lineTotal')}</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => {
                  const match = variantsBySku.get(item.sku)
                  return (
                    <tr key={item.sku}>
                      <td className="min-w-60">
                        <div className="flex items-center gap-3">
                          <ProductThumb photo={match && colorPhoto(match.product, match.variant.color)} size="size-10" />
                          <div className="min-w-0">
                            {match ? (
                              <Link to={`/products/${articleId(match.product.articleNo)}`} className="font-medium text-heading hover:text-brand">
                                {match.product.name}
                              </Link>
                            ) : (
                              <span className="text-muted">{t('orders.unknownProduct')}</span>
                            )}
                            <span className="block font-mono text-xs text-muted">{item.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap">
                        {match && (
                          <span className="inline-flex items-center gap-2">
                            <ColorDot code={match.variant.color} />
                            {colorName(match.variant)} · {formatSize(match.variant.size)}
                          </span>
                        )}
                      </td>
                      <td>{item.commission || <span className="text-muted">–</span>}</td>
                      <td className="num">{item.amount}</td>
                      <td className="num">{formatMoney(item.unitPrice)}</td>
                      <td className="num font-medium text-heading">{formatMoney(item.amount * item.unitPrice)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </TableWrap>
          <dl className="ml-auto max-w-sm space-y-2 border-t border-line px-5 py-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">{t('orders.lineSum')}</dt>
              <dd className="tabular-nums">{formatMoney(totals.lineSum)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">{t('orders.discount', { rate: ORDER_DISCOUNT_RATE * 100 })}</dt>
              <dd className="tabular-nums">{formatMoney(totals.discount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">{t('orders.shipping')}</dt>
              <dd className="tabular-nums">{formatMoney(totals.shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 font-semibold text-heading">
              <dt>{t('orders.totalNet')}</dt>
              <dd className="tabular-nums">{formatMoney(totals.totalNet)}</dd>
            </div>
          </dl>
          <p className="border-t border-line bg-surface px-5 py-3 text-xs text-muted">{t('orders.discountNote')}</p>
        </section>

        <aside className="grid content-start gap-4 md:grid-cols-2 2xl:grid-cols-1">
          <section className="card p-5">
            <h2 className="text-base">{t('orders.customer')}</h2>
            {customer ? (
              <>
                <Link to={`/customers/${customer.number}`} className="mt-3 block font-semibold text-heading hover:text-brand">
                  {customerName(customer)}
                </Link>
                <p className="text-sm text-muted">
                  {t('customers.number')} {customer.number} · {customer.email}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted">{order.customerNumber}</p>
            )}
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
              <div>
                <dt className="text-xs text-muted">{t('customers.payment')}</dt>
                <dd className="font-medium text-heading">
                  <PaymentLabel customer={customer} />
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">{t('customers.shippingAgent')}</dt>
                <dd className="font-medium text-heading">{customer?.shippingAgent || 'GLS'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">{t('orders.receiptNo')}</dt>
                <dd className="font-medium text-heading">{order.receiptNo || '–'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">{t('customers.salesperson')}</dt>
                <dd className="font-medium text-heading">{customer?.salesperson || '–'}</dd>
              </div>
            </dl>
          </section>
          {customer && (
            <section className="card space-y-5 p-5">
              {/* The addresses saved with the order, i.e. what goes to NAV, even if the customer's data changed since */}
              <AddressCard title={t('orders.billingAddress')} address={order.billing} />
              <AddressCard title={t('orders.shippingAddress')} address={order.shippingAddress || order.billing} />
            </section>
          )}
        </aside>
      </div>
    </>
  )
}
