import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { OrderStatus } from '../components/StatusBadges.jsx'
import { EmptyState, PageHeader, Pagination, SearchField, TableWrap } from '../components/ui.jsx'
import { useData } from '../context/contexts.js'
import usePaged from '../hooks/usePaged.js'
import { formatDateTime, formatMoney } from '../utils/format.js'
import { customerName } from '../utils/names.js'
import { orderTotals } from '../utils/orders.js'

const PERIODS = { all: Infinity, 7: 7, 30: 30, 90: 90 }

export default function Orders() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { orders, customersByNumber, variantsBySku } = useData()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const status = params.get('status') || 'all'
  const period = params.get('period') || 'all'

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (value === 'all') next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  // Read the clock once per visit; the period filter counts back from it
  const [now] = useState(() => Date.now())

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const since = now - PERIODS[period] * 86400000
    return orders.filter((order) => {
      if (status !== 'all' && order.status !== status) return false
      if (new Date(order.date).getTime() < since) return false
      if (!needle) return true
      const customer = customersByNumber.get(order.customerNumber)
      // Search by order number, customer, receipt number, SKU, product name or Kommission
      const haystack = [
        order.orderNo,
        order.customerNumber,
        order.receiptNo,
        customerName(customer),
        customer?.billing.city,
        ...order.items.flatMap((item) => [item.sku, item.commission, variantsBySku.get(item.sku)?.product.name]),
      ]
      return haystack.some((value) => value?.toLowerCase().includes(needle))
    })
  }, [now, orders, status, period, query, customersByNumber, variantsBySku])

  const paged = usePaged(filtered, `${status}|${period}|${query}`)

  return (
    <>
      <PageHeader title={t('orders.title')} description={t('orders.subtitle')} />

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
          <SearchField value={query} onChange={setQuery} placeholder={t('orders.search')} />
          <div className="flex gap-3 sm:ml-auto">
            <select className="field sm:w-44" value={status} onChange={(event) => setParam('status', event.target.value)} aria-label={t('orders.statusLabel')}>
              <option value="all">{t('orders.allStatuses')}</option>
              <option value="new">{t('orders.status.new')}</option>
              <option value="exported">{t('orders.status.exported')}</option>
            </select>
            <select className="field sm:w-44" value={period} onChange={(event) => setParam('period', event.target.value)} aria-label={t('orders.period')}>
              {Object.keys(PERIODS).map((key) => (
                <option key={key} value={key}>
                  {t(`orders.periods.${key}`)}
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
                    <th>{t('orders.orderNo')}</th>
                    <th>{t('orders.date')}</th>
                    <th>{t('orders.customer')}</th>
                    <th className="num">{t('orders.lines')}</th>
                    <th className="num">{t('orders.pieces')}</th>
                    <th className="num">{t('orders.total')}</th>
                    <th>{t('orders.statusLabel')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.items.map((order) => {
                    const customer = customersByNumber.get(order.customerNumber)
                    const totals = orderTotals(order)
                    return (
                      <tr key={order.orderNo} onClick={() => navigate(`/orders/${order.orderNo}`)}>
                        <td className="font-semibold text-heading">
                          <Link to={`/orders/${order.orderNo}`} onClick={(event) => event.stopPropagation()}>
                            {order.orderNo}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap text-muted">{formatDateTime(order.date)}</td>
                        <td className="max-w-64">
                          <span className="block truncate font-medium text-heading">{customerName(customer)}</span>
                          <span className="text-xs text-muted">
                            {order.customerNumber} · {customer?.billing.city}
                          </span>
                        </td>
                        <td className="num">{order.items.length}</td>
                        <td className="num">{totals.pieces}</td>
                        <td className="num font-medium text-heading">{formatMoney(totals.totalNet)}</td>
                        <td>
                          <OrderStatus status={order.status} />
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
          <EmptyState title={t(orders.length ? 'common.noResults' : 'orders.empty')} text={t(orders.length ? 'common.noResultsText' : 'orders.emptyText')} />
        )}
      </div>
    </>
  )
}
