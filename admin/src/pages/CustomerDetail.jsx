import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { OrderStatus, PaymentLabel } from '../components/StatusBadges.jsx'
import { Badge, EmptyState, PageHeader, TableWrap } from '../components/ui.jsx'
import { useData } from '../context/contexts.js'
import { formatDate, formatDateTime, formatMoney } from '../utils/format.js'
import { addressLines, customerName } from '../utils/names.js'
import { orderTotals, priceFieldFor } from '../utils/orders.js'
import { articleId } from '../utils/sku.js'

function Info({ label, children }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium break-words text-heading">{children || '–'}</dd>
    </div>
  )
}

export default function CustomerDetail() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { number } = useParams()
  const { customersByNumber, orders, variantsBySku } = useData()
  const customer = customersByNumber.get(number)
  const back = { to: '/customers', label: t('customers.title') }

  const customerOrders = useMemo(() => orders.filter((order) => order.customerNumber === number), [orders, number])

  // What this customer orders most, by pieces over all their orders
  const topProducts = useMemo(() => {
    const totals = new Map()
    customerOrders.forEach((order) =>
      order.items.forEach((item) => {
        const product = variantsBySku.get(item.sku)?.product
        if (!product) return
        const entry = totals.get(product.articleNo) || { product, amount: 0 }
        entry.amount += item.amount
        totals.set(product.articleNo, entry)
      }),
    )
    return [...totals.values()].sort((a, b) => b.amount - a.amount).slice(0, 6)
  }, [customerOrders, variantsBySku])

  if (!customer) {
    return (
      <>
        <PageHeader title={t('customers.notFound')} back={back} />
        <div className="card">
          <EmptyState title={t('customers.notFound')} text={t('customers.notFoundText', { number })} />
        </div>
      </>
    )
  }

  const revenue = customerOrders.reduce((sum, order) => sum + orderTotals(order).totalNet, 0)

  return (
    <>
      <PageHeader
        back={back}
        title={customerName(customer)}
        description={`${t('customers.number')} ${customer.number} · ${customer.billing.city}, ${customer.billing.country}`}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="card p-5 xl:col-span-2">
          <h2 className="text-base">{t('customers.details')}</h2>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
            <Info label={t('customers.email')}>{customer.email}</Info>
            <Info label={t('customers.phone')}>{customer.billing.phone}</Info>
            <Info label={t('customers.vatId')}>{customer.vatId}</Info>
            <Info label={t('customers.priceGroup')}>
              <span className="inline-flex flex-wrap items-center gap-2">
                <Badge tone="brand">{customer.priceGroup}</Badge>
                <span className="text-xs font-medium text-muted">
                  {t('customers.seesPrice', { field: t(`priceFields.${priceFieldFor(customer.priceGroup)}`) })}
                </span>
              </span>
            </Info>
            <Info label={t('customers.payment')}>
              <PaymentLabel customer={customer} />
            </Info>
            <Info label={t('customers.shippingAgent')}>{customer.shippingAgent}</Info>
            <Info label={t('customers.salesperson')}>{customer.salesperson}</Info>
            <Info label={t('customers.group')}>{customer.group}</Info>
            <Info label={t('customers.updated')}>
              {formatDate(customer.updatedAt)} · {t(`common.source.${customer.source || 'demo'}`)}
            </Info>
          </dl>
          <p className="mt-5 rounded-xl bg-surface px-3 py-2.5 text-xs text-muted">{t('customers.navNote')}</p>
        </section>

        <section className="card p-5">
          <h2 className="text-base">{t('customers.summary')}</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <Info label={t('customers.orders')}>{customerOrders.length}</Info>
            <Info label={t('customers.revenue')}>{formatMoney(revenue)}</Info>
            <Info label={t('customers.lastOrder')}>{customerOrders[0] ? formatDate(customerOrders[0].date) : '–'}</Info>
            <Info label={t('customers.addresses')}>{1 + customer.shippingAddresses.length}</Info>
          </dl>
          <h3 className="mt-6 text-xs font-semibold tracking-wider text-muted uppercase">{t('customers.topProducts')}</h3>
          {topProducts.length ? (
            <ul className="mt-2 divide-y divide-line text-sm">
              {topProducts.map(({ product, amount }) => (
                <li key={product.articleNo} className="flex justify-between gap-3 py-2">
                  <Link to={`/products/${articleId(product.articleNo)}`} className="truncate text-heading hover:text-brand">
                    {product.name}
                  </Link>
                  <span className="shrink-0 text-muted tabular-nums">{t('common.pieces', { count: amount })}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">{t('customers.noOrders')}</p>
          )}
        </section>
      </div>

      <section className="card mt-4 p-5">
        <h2 className="text-base">{t('customers.addresses')}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[{ ...customer.billing, billing: true }, ...customer.shippingAddresses].map((address, index) => (
            <address key={index} className="rounded-xl border border-line p-4 text-sm leading-relaxed text-heading not-italic">
              <span className="mb-2 block">
                <Badge tone={address.billing ? 'brand' : 'neutral'}>
                  {address.billing ? t('customers.billingAddress') : t('customers.shippingAddressN', { n: index })}
                </Badge>
              </span>
              {addressLines(address).map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
          ))}
        </div>
        {!customer.shippingAddresses.length && <p className="mt-3 text-xs text-muted">{t('customers.noShipping')}</p>}
      </section>

      <section className="card mt-4 overflow-hidden">
        <h2 className="px-5 py-4 text-base">{t('customers.orderHistory')}</h2>
        {customerOrders.length ? (
          <TableWrap>
            <table className="table table-clickable">
              <thead>
                <tr>
                  <th>{t('orders.orderNo')}</th>
                  <th>{t('orders.date')}</th>
                  <th className="num">{t('orders.lines')}</th>
                  <th className="num">{t('orders.total')}</th>
                  <th>{t('orders.statusLabel')}</th>
                </tr>
              </thead>
              <tbody>
                {customerOrders.map((order) => (
                  <tr key={order.orderNo} onClick={() => navigate(`/orders/${order.orderNo}`)}>
                    <td className="font-semibold text-heading">
                      <Link to={`/orders/${order.orderNo}`} onClick={(event) => event.stopPropagation()}>
                        {order.orderNo}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap text-muted">{formatDateTime(order.date)}</td>
                    <td className="num">{order.items.length}</td>
                    <td className="num font-medium text-heading">{formatMoney(orderTotals(order).totalNet)}</td>
                    <td>
                      <OrderStatus status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <EmptyState title={t('customers.noOrders')} />
        )}
      </section>
    </>
  )
}
