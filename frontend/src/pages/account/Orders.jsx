import { useEffect, useId, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, ChevronRight, ImageOff, Package, RotateCcw, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { LoadError, OrderListSkeleton, PageLoader } from '../../components/common/Loading.jsx'
import RollText from '../../components/common/RollText.jsx'
import SortDropdown from '../../components/products/SortDropdown.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCart } from '../../context/CartContext.jsx'
import { photosOf, useCatalog } from '../../context/CatalogContext.jsx'
import { colorLabel, sizeLabel } from '../../data/filters.js'
import { api, photoUrl } from '../../utils/api.js'
import formatPrice from '../../utils/formatPrice.js'

// new = received by the shop, exported = collected by Ihle's ERP (NAV) for processing
const STATUS_STYLE = {
  new: 'bg-[#fdf3e2] text-[#8a5a1c]',
  exported: 'bg-[#e8f3ec] text-[#2f6b45]',
}

const PERIODS = ['all', '30', '90', '365']
const PAGE = 10 // orders shown at first; "show more" adds the next ten

// Everything a customer might search an order by: number, own receipt number, products, SKUs, Kommission, address
const searchText = (order) =>
  [
    order.orderNo,
    order.receiptNo,
    order.delivery.company,
    order.delivery.city,
    ...order.items.flatMap((item) => [item.name, item.sku, item.commission]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

// showTotal: only with several lines; a single line's total is the order total, shown once in the summary
function OrderLine({ item, money, showTotal }) {
  const { t } = useTranslation()
  const { byId } = useCatalog()
  // The photo and link only exist while the article is in the shop; older lines still show their text
  const product = byId.get(item.productId)
  const photo = product && photosOf(product, item.color)[0]
  const name = item.name || item.sku

  // Three columns: product · quantity × unit price · line total, so the amounts line up from line to line
  return (
    <li className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-start gap-x-4 gap-y-1 py-4 sm:grid-cols-[3rem_minmax(0,1fr)_8rem_6rem]">
      <span className="row-span-2 grid size-12 place-items-center overflow-hidden rounded-lg border border-slate-200 bg-white text-body/40 sm:row-span-1">
        {photo ? (
          <img src={photoUrl(photo)} alt="" loading="lazy" className="size-full object-contain p-1" />
        ) : (
          <ImageOff size={16} strokeWidth={1.5} aria-hidden="true" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-[0.9375rem] font-semibold leading-snug text-heading">
          {product ? (
            <Link to={`/products/${product.id}`} className="product-link">
              {name}
            </Link>
          ) : (
            name
          )}
        </span>
        {item.size && (
          <span className="mt-0.5 block text-[0.8125rem] text-body">
            {colorLabel(item.colorName, item.color)} · {sizeLabel(item.size)}
          </span>
        )}
        <span className="block whitespace-nowrap text-xs text-body/70 tabular-nums">{item.sku}</span>
        {item.commission && (
          // The Kommission is often a patient name, so it wraps rather than being cut off
          <span className="mt-1.5 inline-block max-w-full rounded-md bg-[#f5f1ec] px-2 py-0.5 text-xs leading-relaxed text-body">
            {t('order.commission')} <span className="break-words font-semibold text-heading">{item.commission}</span>
          </span>
        )}
      </span>
      {/* Amounts grow in weight from left to right: unit price (light) → line total (medium) → order total (summary) */}
      <span className="col-start-2 text-[0.8125rem] text-body tabular-nums sm:col-start-auto sm:pt-0.5 sm:text-right">
        {item.amount} × {money(item.unitPrice)}
      </span>
      <span className="col-start-3 row-start-1 text-right text-sm font-medium text-heading tabular-nums sm:col-start-auto sm:row-start-auto sm:pt-0.5">
        {showTotal && money(item.amount * item.unitPrice)}
      </span>
    </li>
  )
}

// Small label above a value, as on the addresses page
const Label = ({ children }) => <dt className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-[#8a5a3c]">{children}</dt>

function OrderCard({ order, open, onToggle, onReorder, money, date }) {
  const { t } = useTranslation()
  const panelId = `order-${order.orderNo}`
  const address = order.delivery

  return (
    <li className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        className={`flex w-full flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 text-left transition-colors sm:px-6 ${open ? '' : 'hover:bg-[#faf8f4]'}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        {/* Phones: number and date take the first line, status and total the second */}
        <span className="min-w-0 basis-full sm:basis-0 sm:flex-1">
          <span className="block font-bold text-heading">{t('accountOrders.order', { number: order.orderNo })}</span>
          <span className="block text-sm text-body">
            {date(order.date)} · {t('accountOrders.lines', { count: order.items.length })}
          </span>
        </span>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[order.status] || STATUS_STYLE.new}`}>
          {t(`accountOrders.status.${order.status}`, { defaultValue: order.status })}
        </span>
        {/* The total belongs to the closed row; once open, the summary below shows it */}
        <span className={`ml-auto text-base font-bold text-heading tabular-nums transition-opacity sm:ml-0 ${open ? 'invisible opacity-0' : ''}`} aria-hidden={open}>
          {money(order.total)}
        </span>
        <ChevronDown size={20} strokeWidth={1.75} aria-hidden="true" className={`shrink-0 text-body transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              <ul className="divide-y divide-slate-100 border-t border-slate-100">
                {order.items.map((item, index) => (
                  <OrderLine key={`${item.sku}-${index}`} item={item} money={money} showTotal={order.items.length > 1} />
                ))}
              </ul>

              {/* Delivery address, receipt number and total in one quiet panel, each with a small label */}
              <dl className="mt-2 grid gap-5 rounded-xl bg-[#faf8f4] p-4 text-sm text-body sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:p-5">
                <div className="min-w-0">
                  <Label>{t('checkout.delivery')}</Label>
                  <dd className="mt-1.5 leading-relaxed">
                    <span className="block font-medium text-heading">{address.company}</span>
                    {address.street}, {address.zip} {address.city}
                  </dd>
                </div>
                <div className="min-w-0">
                  <Label>{t('checkout.receipt')}</Label>
                  <dd className="mt-1.5 break-words text-heading">{order.receiptNo || '–'}</dd>
                </div>
                <div className="flex flex-col gap-2 sm:items-end sm:text-right">
                  <Label>{t('accountOrders.totalNet')}</Label>
                  <dd className="text-xl font-bold text-heading tabular-nums">{money(order.total)}</dd>
                  {/* A quiet secondary action: the order itself is the content here */}
                  <button
                    type="button"
                    className="inline-flex w-fit items-center gap-1.5 text-[0.8125rem] font-semibold text-heading underline decoration-slate-900/25 underline-offset-4 transition-colors hover:decoration-slate-900"
                    onClick={() => onReorder(order)}
                  >
                    <RotateCcw size={13} strokeWidth={2} aria-hidden="true" />
                    {t('accountOrders.reorder')}
                  </button>
                </div>
              </dl>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

/**
 * The logged-in customer's own orders (/account/orders), newest first. Each order opens to show its lines
 * with Kommission and prices as ordered, the delivery address and the customer's receipt number.
 * "Order again" puts the lines that are still in the shop back into the cart.
 */
export default function Orders() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { isLoggedIn, checking, user } = useAuth()
  const { bySku } = useCatalog()
  const { add } = useCart()
  const fieldId = useId()
  // The period filter counts back from when the page was opened
  const [now] = useState(() => Date.now())
  const [state, setState] = useState({ status: 'loading', orders: [] })
  const [openNo, setOpenNo] = useState(undefined) // undefined = the newest shown order is open
  const [notice, setNotice] = useState(null)
  const [filter, setFilter] = useState({ query: '', status: 'all', period: 'all' })
  // How many orders are shown; starts again at one page whenever the search or filters change
  const [shown, setShown] = useState({ count: PAGE, filter })
  const number = user?.customerNumber
  // Raised by the "retry" button after a failed load
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!number) return undefined
    let active = true
    api('/shop/orders').then(
      (data) => active && setState({ status: 'ready', orders: data.orders }),
      () => active && setState({ status: 'error', orders: [] }),
    )
    return () => {
      active = false
    }
  }, [number, attempt])

  const retry = () => {
    setState({ status: 'loading', orders: [] })
    setAttempt((count) => count + 1)
  }

  if (checking) return <PageLoader />
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: '/account/orders' }} />

  const money = (amount) => formatPrice(amount, 'EUR', i18n.resolvedLanguage)
  const date = (iso) =>
    new Intl.DateTimeFormat(i18n.resolvedLanguage, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(
      new Date(iso),
    )
  const { orders } = state
  const needle = filter.query.trim().toLowerCase()
  const since = filter.period === 'all' ? null : now - Number(filter.period) * 86400000
  const filtered = orders.filter(
    (order) =>
      (filter.status === 'all' || order.status === filter.status) &&
      (!since || new Date(order.date).getTime() >= since) &&
      (!needle || searchText(order).includes(needle)),
  )
  const filtering = needle !== '' || filter.status !== 'all' || filter.period !== 'all'
  const count = shown.filter === filter ? shown.count : PAGE
  const visible = filtered.slice(0, count)
  const openOrder = openNo === undefined ? visible[0]?.orderNo : openNo
  const setValue = (key) => (value) => {
    setFilter({ ...filter, [key]: value })
    setOpenNo(undefined)
  }
  const change = (key) => (event) => setValue(key)(event.target.value)
  const resetFilter = () => {
    setFilter({ query: '', status: 'all', period: 'all' })
    setOpenNo(undefined)
  }

  // Lines whose SKU is no longer in the shop (blocked, no photo) are skipped and counted
  const reorder = (order) => {
    const available = order.items.filter((item) => bySku.has(item.sku))
    available.forEach((item) => add({ sku: item.sku, productId: item.productId, commission: item.commission, quantity: item.amount }))
    const skipped = order.items.length - available.length
    if (!available.length) return setNotice(t('accountOrders.nothingAvailable'))
    if (skipped) return setNotice(t('accountOrders.someSkipped', { count: skipped }))
    navigate('/cart')
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-6 sm:px-8 lg:pt-8">
      <nav aria-label={t('product.breadcrumb')}>
        <ol className="flex flex-wrap items-center gap-x-1.5 text-sm text-body">
          <li>{t('nav.account')}</li>
          <li className="flex items-center gap-1.5 font-semibold text-heading" aria-current="page">
            <ChevronRight size={14} aria-hidden="true" />
            {t('nav.myOrders')}
          </li>
        </ol>
      </nav>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4 lg:mt-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl">{t('nav.myOrders')}</h1>
        </div>
        {state.status === 'ready' && orders.length > 0 && (
          <p className="text-sm text-body" aria-live="polite">
            {filtering ? t('accountOrders.found', { count: filtered.length, total: orders.length }) : t('accountOrders.count', { count: orders.length })}
          </p>
        )}
      </div>

      {/* Search and filters: only once there is something to search */}
      {state.status === 'ready' && orders.length > 0 && (
        // Phones: search, status and period stacked (labels like "Gesamter Zeitraum" need the width); wider: one row
        <div className="mt-8 grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_13.5rem_13.5rem]">
          <div className="order-field">
            <label htmlFor={`${fieldId}-q`}>{t('accountOrders.search')}</label>
            <span className="relative">
              <Search size={17} strokeWidth={1.75} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-body" />
              <input
                id={`${fieldId}-q`}
                type="search"
                value={filter.query}
                onChange={change('query')}
                placeholder={t('accountOrders.searchPlaceholder')}
                autoComplete="off"
                className="h-12 w-full rounded-[0.65rem] border border-slate-900/20 bg-white pl-10 pr-3 text-[0.9rem] text-heading transition-[border-color,box-shadow] focus-visible:border-[#3b1f12] focus-visible:shadow-[0_0_0_3px_rgb(59_31_18/0.14)] focus-visible:outline-none"
              />
            </span>
          </div>
          <SortDropdown
            field
            label={t('accountOrders.statusLabel')}
            value={filter.status}
            options={[
              { value: 'all', label: t('accountOrders.allStatuses') },
              { value: 'new', label: t('accountOrders.status.new') },
              { value: 'exported', label: t('accountOrders.status.exported') },
            ]}
            onChange={setValue('status')}
          />
          <SortDropdown
            field
            label={t('accountOrders.period')}
            value={filter.period}
            options={PERIODS.map((key) => ({ value: key, label: t(`accountOrders.periods.${key}`) }))}
            onChange={setValue('period')}
          />
        </div>
      )}

      {notice && (
        <p className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#faf8f4] px-5 py-4 text-sm text-body" role="status">
          {notice}
          <Link to="/cart" className="font-semibold text-heading underline underline-offset-4">
            {t('accountOrders.toCart')}
          </Link>
        </p>
      )}

      {state.status === 'loading' && <OrderListSkeleton />}
      {state.status === 'error' && (
        <div className="mt-8">
          <LoadError text={t('accountOrders.loadError')} onRetry={retry} />
        </div>
      )}

      {state.status === 'ready' && orders.length === 0 && (
        <section className="mt-10 flex flex-col items-center gap-4 rounded-2xl bg-[#faf8f4] px-6 py-16 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-[#f1e9e2] text-[#3b1f12]">
            <Package size={28} strokeWidth={1.5} aria-hidden="true" />
          </span>
          <h2 className="text-2xl font-bold text-heading">{t('accountOrders.emptyTitle')}</h2>
          <p className="max-w-md text-body">{t('accountOrders.emptyText')}</p>
          <Link to="/products" className="auth-btn mt-2">
            <RollText>{t('cart.toProducts')}</RollText>
          </Link>
        </section>
      )}

      {state.status === 'ready' && orders.length > 0 && filtered.length === 0 && (
        <div className="mt-8 rounded-2xl bg-[#faf8f4] px-6 py-12 text-center">
          <p className="font-bold text-heading">{t('accountOrders.noMatchTitle')}</p>
          <p className="mt-1 text-sm text-body">{t('accountOrders.noMatchText')}</p>
          <button type="button" className="mt-4 text-sm font-semibold text-heading underline underline-offset-4" onClick={resetFilter}>
            {t('accountOrders.resetFilter')}
          </button>
        </div>
      )}

      {state.status === 'ready' && visible.length > 0 && (
        <ul className="mt-6 flex flex-col gap-4">
          {visible.map((order) => (
            <OrderCard
              key={order.orderNo}
              order={order}
              open={order.orderNo === openOrder}
              onToggle={() => setOpenNo(order.orderNo === openOrder ? null : order.orderNo)}
              onReorder={reorder}
              money={money}
              date={date}
            />
          ))}
        </ul>
      )}

      {visible.length < filtered.length && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <button type="button" className="auth-btn" onClick={() => setShown({ count: count + PAGE, filter })}>
            <RollText>{t('accountOrders.showMore')}</RollText>
          </button>
          <p className="text-xs text-body">{t('accountOrders.shownOf', { shown: visible.length, total: filtered.length })}</p>
        </div>
      )}
    </div>
  )
}
