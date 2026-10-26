import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { PaymentLabel } from '../components/StatusBadges.jsx'
import { Badge, EmptyState, PageHeader, Pagination, SearchField, TableWrap } from '../components/ui.jsx'
import { useData } from '../context/contexts.js'
import { PRICE_GROUPS } from '../data/pricing.js'
import usePaged from '../hooks/usePaged.js'
import { formatDate, formatMoney } from '../utils/format.js'
import { customerName } from '../utils/names.js'
import { orderTotals } from '../utils/orders.js'

export default function Customers() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { customers, orders } = useData()
  const [query, setQuery] = useState('')
  const [priceGroup, setPriceGroup] = useState('all')
  const [payment, setPayment] = useState('all')

  // Orders per customer: count, net revenue and the last order date
  const orderStats = useMemo(() => {
    const stats = new Map()
    orders.forEach((order) => {
      const entry = stats.get(order.customerNumber) || { count: 0, revenue: 0, last: null }
      entry.count += 1
      entry.revenue += orderTotals(order).totalNet
      if (!entry.last || order.date > entry.last) entry.last = order.date
      stats.set(order.customerNumber, entry)
    })
    return stats
  }, [orders])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return customers
      .filter((customer) => priceGroup === 'all' || customer.priceGroup === priceGroup)
      .filter((customer) => payment === 'all' || (customer.paymentCode || customer.paymentMethod) === payment)
      .filter((customer) => {
        if (!needle) return true
        const haystack = [customer.number, customerName(customer), customer.email, customer.billing.city, customer.billing.postcode]
        return haystack.some((value) => value?.toLowerCase().includes(needle))
      })
      .sort((a, b) => a.number.localeCompare(b.number))
  }, [customers, query, priceGroup, payment])

  const paged = usePaged(filtered, `${query}|${priceGroup}|${payment}`)

  return (
    <>
      <PageHeader title={t('customers.title')} description={t('customers.subtitle', { count: customers.length })} />

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
          <SearchField value={query} onChange={setQuery} placeholder={t('customers.search')} />
          <div className="flex gap-3 sm:ml-auto">
            <select className="field sm:w-44" value={priceGroup} onChange={(event) => setPriceGroup(event.target.value)} aria-label={t('customers.priceGroup')}>
              <option value="all">{t('customers.allPriceGroups')}</option>
              {PRICE_GROUPS.map((group) => (
                <option key={group.code} value={group.code}>
                  {group.code}
                </option>
              ))}
            </select>
            <select className="field sm:w-44" value={payment} onChange={(event) => setPayment(event.target.value)} aria-label={t('customers.payment')}>
              <option value="all">{t('customers.allPayments')}</option>
              {['purchaseorder', 'debit', 'VORKASSE'].map((code) => (
                <option key={code} value={code}>
                  {t(`payment.${code}`)}
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
                    <th>{t('customers.number')}</th>
                    <th>{t('customers.company')}</th>
                    <th>{t('customers.priceGroup')}</th>
                    <th>{t('customers.payment')}</th>
                    <th className="num">{t('customers.orders')}</th>
                    <th className="num">{t('customers.revenue')}</th>
                    <th>{t('customers.lastOrder')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.items.map((customer) => {
                    const stats = orderStats.get(customer.number)
                    return (
                      <tr key={customer.number} onClick={() => navigate(`/customers/${customer.number}`)}>
                        <td className="font-semibold text-heading">
                          <Link to={`/customers/${customer.number}`} onClick={(event) => event.stopPropagation()}>
                            {customer.number}
                          </Link>
                        </td>
                        <td className="max-w-60">
                          <span className="block truncate font-medium text-heading">{customerName(customer)}</span>
                          <span className="text-xs text-muted">
                            {customer.billing.postcode} {customer.billing.city} · {customer.billing.country}
                          </span>
                        </td>
                        <td>
                          <Badge tone="brand">{customer.priceGroup}</Badge>
                        </td>
                        <td className="whitespace-nowrap">
                          <PaymentLabel customer={customer} />
                        </td>
                        <td className="num">{stats?.count || 0}</td>
                        <td className="num">{formatMoney(stats?.revenue || 0)}</td>
                        <td className="whitespace-nowrap text-muted">{stats ? formatDate(stats.last) : '–'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </TableWrap>
            <Pagination page={paged.page} pageCount={paged.pageCount} total={paged.total} onChange={paged.setPage} />
          </>
        ) : (
          <EmptyState title={t(customers.length ? 'common.noResults' : 'customers.empty')} text={t(customers.length ? 'common.noResultsText' : 'customers.emptyText')} />
        )}
      </div>
    </>
  )
}
