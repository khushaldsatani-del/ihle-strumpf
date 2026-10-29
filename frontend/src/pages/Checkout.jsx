import { useId, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, CircleCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router-dom'
import { PageLoader } from '../components/common/Loading.jsx'
import RollText from '../components/common/RollText.jsx'
import OrderTotals from '../components/order/OrderTotals.jsx'
import ProductImage from '../components/products/ProductImage.jsx'
import SortDropdown from '../components/products/SortDropdown.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useCatalog } from '../context/CatalogContext.jsx'
import { colorLabel, sizeLabel } from '../data/filters.js'
import usePrices from '../hooks/usePrices.js'
import { api } from '../utils/api.js'
import countryName from '../utils/countryName.js'
import { showNumber } from '../utils/articleNumber.js'
import formatPrice from '../utils/formatPrice.js'
import { orderTotals } from '../utils/orderTotals.js'
import { useProductText } from '../utils/productText.js'

// Longest delivery note; the backend cuts at the same length
const NOTE_MAX = 250

const addressLines = (address) => [address.company, address.street, `${address.zip} ${address.city}`, countryName(address.country)]

// Address as a small block of lines
function Address({ address }) {
  return (
    <address className="not-italic leading-relaxed">
      {addressLines(address).map((line, index) => (
        <span key={line} className={`block ${index === 0 ? 'font-semibold text-heading' : ''}`}>
          {line}
        </span>
      ))}
    </address>
  )
}

// "Anmerkung zur Lieferung": free text for the delivery (contact person, delivery hours …), optional
function DeliveryNote({ value, onChange }) {
  const { t } = useTranslation()
  const hintId = useId()
  return (
    <label className="order-field mt-5 max-w-[34rem]">
      <span>{t('checkout.deliveryNote')}</span>
      <textarea rows={3} maxLength={NOTE_MAX} value={value} aria-describedby={hintId} onChange={(event) => onChange(event.target.value)} />
      <span id={hintId} className="text-xs font-normal text-body">
        {t('checkout.deliveryNoteHint', { max: NOTE_MAX, left: NOTE_MAX - value.length })}
      </span>
    </label>
  )
}

// Radio button shown as a selectable row
function Choice({ name, value, checked, onChange, children }) {
  return (
    <label className="choice">
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} />
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  )
}

/**
 * One step of the checkout: number, title, and either its content (while active),
 * or a one-line summary with a "change" link (once done).
 */
const STEP_VARIANTS = { open: { height: 'auto', opacity: 1 }, closed: { height: 0, opacity: 0 } }

function Step({ number, title, state, summary, onEdit, children }) {
  const { t } = useTranslation()
  const [settled, setSettled] = useState(false)

  return (
    <li className="checkout-step" data-state={state}>
      <div className="flex items-center gap-4">
        <span className="step-num" aria-hidden="true">
          {state === 'done' ? <Check size={16} strokeWidth={3} /> : number}
        </span>
        <h2 className="flex-1 text-lg font-bold" aria-current={state === 'active' ? 'step' : undefined}>
          {title}
        </h2>
        {state === 'done' && (
          <button type="button" className="text-sm font-semibold text-body underline underline-offset-4 hover:text-heading" onClick={onEdit}>
            {t('checkout.change')}
            <span className="sr-only">: {title}</span>
          </button>
        )}
      </div>

      {state === 'done' && summary && <p className="mt-1 pl-12 text-sm text-body">{summary}</p>}

      <AnimatePresence initial={false}>
        {state === 'active' && (
          // Overflow is hidden only while the step opens or closes, so dropdowns inside can reach past its edge
          <motion.div
            className={settled ? '' : 'overflow-hidden'}
            variants={STEP_VARIANTS}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ duration: 0.28 }}
            onAnimationStart={() => setSettled(false)}
            onAnimationComplete={(variant) => setSettled(variant === 'open')}
          >
            <div className="px-1 pb-2 pt-5 sm:pl-12">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}

/**
 * Checkout in five steps: billing address, delivery address, shipping method, payment, order overview.
 * Addresses, payment method and shipping agent are the customer's NAV data. "Place order" sends the order
 * to the backend, which prices it again from the database and keeps it for NAV ("Import Bestellungen").
 */
export default function Checkout() {
  const { t, i18n } = useTranslation()
  const formId = useId()
  const { isLoggedIn, checking, user } = useAuth()
  const { items, clear } = useCart()
  const { bySku } = useCatalog()
  const priceData = usePrices()
  const text = useProductText()
  const [sending, setSending] = useState(false)
  const [orderError, setOrderError] = useState(null)
  const [step, setStep] = useState(0) // open step: 0 billing, 1 delivery, 2 shipping, 3 payment, 4 overview
  const [reached, setReached] = useState(0) // furthest step opened so far
  const [sendTo, setSendTo] = useState('billing') // 'billing' | 'other'
  const [deliveryId, setDeliveryId] = useState(null) // id of a saved address ('' = none chosen)
  const [note, setNote] = useState('') // "Anmerkung zur Lieferung"
  const [receipt, setReceipt] = useState('') // the customer's own receipt / order number (optional)
  const [placed, setPlaced] = useState(null) // summary of the order after "place order"

  if (checking) return <PageLoader />
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: '/checkout' }} />

  // ---------- after ordering ----------
  if (placed) {
    return (
      <section className="flex min-h-[calc(100vh-var(--nav-height))] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <CircleCheck size={56} strokeWidth={1.25} aria-hidden="true" className="text-[#2f6b45]" />
        <h1 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl">{t('checkout.thanksTitle')}</h1>
        <p className="max-w-md text-body">{t('checkout.thanksText', { count: placed.count, total: placed.total })}</p>
        <p className="max-w-md rounded-xl bg-[#faf8f4] px-4 py-3 text-sm text-body">{t('checkout.orderNumber', { number: placed.orderNo })}</p>
        <Link to="/products" className="auth-btn mt-2">
          <RollText>{t('cart.toProducts')}</RollText>
        </Link>
      </section>
    )
  }

  if (items.length === 0) return <Navigate to="/cart" replace />

  // ---------- data ----------
  const money = (amount) => (priceData ? formatPrice(amount, priceData.currency, i18n.resolvedLanguage) : '…')
  // SKUs no longer in the shop are left out, like in the cart
  const lines = items.map((item) => ({ item, ...bySku.get(item.sku) })).filter(({ product }) => product)
  const totals = orderTotals(
    lines.map(({ item, variant }) => ({ amount: item.quantity, unitPrice: priceData?.prices[item.sku] ?? 0, vatRate: variant.vatRate })),
  )

  // Deliveries go to the billing address or one of the customer's delivery addresses from NAV; new addresses
  // can't be typed in (Ihle's wish), so without saved ones there is nothing else to choose
  const savedAddresses = user.shippingAddresses
  const deliverElsewhere = sendTo === 'other' && savedAddresses.length > 0
  const chosenDeliveryId = deliveryId ?? savedAddresses[0]?.id ?? ''
  const savedAddress = savedAddresses.find(({ id }) => id === chosenDeliveryId)
  const deliveryAddress = deliverElsewhere ? savedAddress : user.billingAddress
  const oneLine = (address) => (address ? addressLines(address).join(', ') : '–')
  // The customer's shipping agent and payment method from NAV (GLS / invoice for nearly everyone)
  const shippingLabel = user.shippingAgent
  // Invoices are sent as e-invoices by email (Ihle's wish); the address will come from NAV's customer data,
  // until then it is the customer's email in the shop
  const eInvoice = !['debit', 'VORKASSE'].includes(user.payment)
  const paymentName = t(`checkout.paymentMethods.${user.payment}`, { defaultValue: t('checkout.invoice') })
  const paymentLabel = receipt.trim() ? `${paymentName} · ${t('checkout.receipt')}: ${receipt.trim()}` : paymentName

  // ---------- steps ----------
  const state = (index) => (index === step ? 'active' : index <= reached ? 'done' : 'todo')
  const open = (index) => {
    setStep(index)
    setReached((current) => Math.max(current, index))
  }
  // "Send to this address" skips the delivery step
  const afterBilling = () => open(deliverElsewhere ? 1 : 2)
  const next = (event) => {
    event.preventDefault()
    open(step + 1)
  }

  const delivery = deliverElsewhere ? { type: 'saved', id: chosenDeliveryId } : { type: 'billing' }
  const deliverySummary = deliverElsewhere ? oneLine(deliveryAddress) : t('checkout.sameAsBilling')

  const placeOrder = async () => {
    setSending(true)
    setOrderError(null)
    try {
      const result = await api('/shop/orders', {
        method: 'POST',
        body: {
          items: lines.map(({ item }) => ({ sku: item.sku, quantity: item.quantity, commission: item.commission })),
          delivery,
          receiptNo: receipt.trim(),
          deliveryNote: note.trim(),
        },
      })
      setPlaced({ orderNo: result.orderNo, count: lines.length, total: money(totals.gross) })
      clear()
      window.scrollTo(0, 0)
    } catch (error) {
      setOrderError(t(`checkout.errors.${error.code}`, { defaultValue: t('checkout.errors.serverError') }))
    } finally {
      setSending(false)
    }
  }

  // "Continue", and from the second step on a "Back" link to the step before
  const actions = (previous) => (
    <div className="mt-6 flex items-center justify-between gap-4">
      <button type="submit" className="auth-btn">
        <RollText>{t('checkout.continue')}</RollText>
      </button>
      {previous !== undefined && (
        <button type="button" className="text-sm font-semibold text-body underline underline-offset-4 hover:text-heading" onClick={() => setStep(previous)}>
          {t('checkout.back')}
        </button>
      )}
    </div>
  )

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-8 lg:pt-14">
      <h1 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl">{t('checkout.title')}</h1>

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
        <ol className="border-t border-slate-200">
          {/* 1 Billing address */}
          <Step number={1} title={t('checkout.billing')} state={state(0)} summary={oneLine(user.billingAddress)} onEdit={() => setStep(0)}>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                afterBilling()
              }}
            >
              <div className="text-sm text-body">
                <Address address={user.billingAddress} />
              </div>
              {/* "Elsewhere" means one of the customer's delivery addresses from NAV, so it needs at least one */}
              {savedAddresses.length > 0 && (
                <fieldset className="mt-5 flex flex-col gap-2">
                  <legend className="sr-only">{t('checkout.delivery')}</legend>
                  <Choice name={`${formId}-send`} value="billing" checked={!deliverElsewhere} onChange={setSendTo}>
                    {t('checkout.sendHere')}
                  </Choice>
                  <Choice name={`${formId}-send`} value="other" checked={deliverElsewhere} onChange={setSendTo}>
                    {t('checkout.sendElsewhere')}
                  </Choice>
                </fieldset>
              )}
              {/* Delivered here: the delivery step is skipped, so the note is written in this step */}
              {!deliverElsewhere && <DeliveryNote value={note} onChange={setNote} />}
              {actions()}
            </form>
          </Step>

          {/* 2 Delivery address: one of the customer's delivery addresses from NAV, and the delivery note */}
          <Step
            number={2}
            title={t('checkout.delivery')}
            state={state(1)}
            summary={deliverySummary}
            onEdit={() => {
              setSendTo('other')
              setStep(1)
            }}
          >
            <form onSubmit={next}>
              {/* Company on the first line, street and city below */}
              <div className="max-w-[34rem]">
                <SortDropdown
                  field
                  label={t('checkout.savedAddress')}
                  value={chosenDeliveryId}
                  options={savedAddresses.map((address) => ({
                    value: address.id,
                    label: address.company,
                    description: `${address.street}, ${address.zip} ${address.city}`,
                  }))}
                  onChange={setDeliveryId}
                />
              </div>
              <DeliveryNote value={note} onChange={setNote} />
              {actions(0)}
            </form>
          </Step>

          {/* 3 Shipping method: the customer's agent from NAV (GLS for nearly all). Always selected, cannot be unticked. */}
          <Step number={3} title={t('checkout.shipping')} state={state(2)} summary={shippingLabel} onEdit={() => setStep(2)}>
            <form onSubmit={next}>
              <label className="choice">
                <input type="checkbox" checked readOnly aria-readonly="true" onClick={(event) => event.preventDefault()} />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-heading">{shippingLabel}</span>
                  <span className="block text-sm text-body">{t('checkout.glsText')}</span>
                </span>
              </label>
              <p className="mt-3 text-xs text-body">{t('checkout.shippingNote')}</p>
              {actions(deliverElsewhere ? 1 : 0)}
            </form>
          </Step>

          {/* 4 Payment: the customer's method from NAV, with the customer's own receipt number */}
          <Step number={4} title={t('checkout.payment')} state={state(3)} summary={paymentLabel} onEdit={() => setStep(3)}>
            <form onSubmit={next}>
              <p className="font-semibold text-heading">{paymentName}</p>
              <p className="mt-1 text-sm text-body">
                {!eInvoice ? (
                  t(`checkout.paymentTexts.${user.payment}`)
                ) : user.email ? (
                  <>
                    {t('checkout.eInvoice')} <strong className="break-all font-semibold text-heading">{user.email}</strong>
                  </>
                ) : (
                  t('checkout.eInvoiceNoEmail')
                )}
              </p>
              <label className="order-field mt-4 max-w-[22rem]">
                <span>{t('checkout.receipt')}</span>
                <input type="text" value={receipt} maxLength={35} autoComplete="off" onChange={(event) => setReceipt(event.target.value)} />
              </label>
              {actions(2)}
            </form>
          </Step>

          {/* 5 Order overview */}
          <Step number={5} title={t('checkout.overview')} state={state(4)}>
            <ul className="border-t border-slate-200">
              {lines.map(({ item, product, variant }) => {
                const price = priceData?.prices[item.sku] ?? 0
                return (
                  <li key={item.key} className="flex items-center gap-4 border-b border-slate-200 py-3">
                    <span className="size-14 shrink-0 overflow-hidden rounded-xl bg-[#f5f4f1]">
                      <ProductImage product={product} color={variant.color} className="size-full object-contain p-[10%]" />
                    </span>
                    <span className="min-w-0 flex-1 text-sm text-body">
                      <span className="block font-semibold text-heading">{text.name(product)}</span>
                      <span className="block">
                        {t('products.articleNo', { number: showNumber(variant.sku) })} · {colorLabel(variant.colorName, variant.color)} ·{' '}
                        {sizeLabel(variant.size)}
                      </span>
                      {item.commission && (
                        <span className="block text-xs">
                          {t('order.commission')}: {item.commission}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-right text-sm text-body">
                      <span className="block">
                        {item.quantity} × {money(price)}
                      </span>
                      <span className="block font-bold text-heading">{money(price * item.quantity)}</span>
                    </span>
                  </li>
                )
              })}
            </ul>

            <dl className="mt-5 grid gap-4 text-sm text-body sm:grid-cols-2">
              <div>
                <dt className="font-bold text-heading">{t('checkout.billing')}</dt>
                <dd className="mt-1">
                  <Address address={user.billingAddress} />
                </dd>
              </div>
              <div>
                <dt className="font-bold text-heading">{t('checkout.delivery')}</dt>
                <dd className="mt-1">
                  <Address address={deliveryAddress} />
                </dd>
              </div>
              <div>
                <dt className="font-bold text-heading">{t('checkout.shipping')}</dt>
                <dd className="mt-1">{shippingLabel}</dd>
              </div>
              <div>
                <dt className="font-bold text-heading">{t('checkout.payment')}</dt>
                <dd className="mt-1">{paymentLabel}</dd>
              </div>
              {note.trim() && (
                <div className="sm:col-span-2">
                  <dt className="font-bold text-heading">{t('checkout.deliveryNote')}</dt>
                  <dd className="mt-1 whitespace-pre-line break-words">{note.trim()}</dd>
                </div>
              )}
            </dl>

            {/* Totals as on the invoice, then the order button under them */}
            <div className="mt-6 border-t border-slate-200 pt-5">
              <OrderTotals totals={totals} money={money} className="ml-auto max-w-sm" />
              <div className="mt-5 flex justify-end">
                <button type="button" className="auth-btn" onClick={placeOrder} disabled={sending || lines.length === 0}>
                  <RollText>{t(sending ? 'checkout.sending' : 'checkout.placeOrder')}</RollText>
                </button>
              </div>
            </div>
            {orderError && (
              <p className="mt-4 rounded-xl bg-[#fbeceb] px-4 py-3 text-sm text-[#b3382a]" role="alert">
                {orderError}
              </p>
            )}
          </Step>
        </ol>

        {/* Progress */}
        <aside className="checkout-progress lg:sticky lg:top-[calc(var(--nav-height)+1rem)]">
          <h2 className="text-base font-bold">{t('checkout.progress')}</h2>
          <dl className="mt-4 flex flex-col gap-4 text-sm">
            {[
              [0, t('checkout.billing'), oneLine(user.billingAddress)],
              [1, t('checkout.delivery'), deliverySummary],
              [2, t('checkout.shipping'), shippingLabel],
              [3, t('checkout.payment'), paymentLabel],
              // the last step has no summary line: it is the overview itself, highlighted while it is open
              [4, t('checkout.overview'), null],
            ].map(([index, label, value]) => {
              const done = index < step && index <= reached
              const current = index === 4 && step === 4
              return (
                <div key={label} className={done || current ? '' : 'opacity-45'}>
                  <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-heading">
                    {done && <Check size={14} strokeWidth={3} aria-hidden="true" className="text-[#2f6b45]" />}
                    {label}
                  </dt>
                  {done && value && <dd className="mt-1 text-body">{value}</dd>}
                </div>
              )
            })}
          </dl>
          {/* The same amounts as the totals in the overview, so the two never show different prices:
              the steps to the final amount in small print, the final amount itself prominent */}
          <div className="mt-5 border-t border-slate-200 pt-4 text-sm text-body">
            <dl className="mb-2 grid gap-0.5 text-xs tabular-nums">
              {[
                [t('totals.goods'), totals.goods],
                [t('totals.discount'), totals.discount],
                [t('totals.net'), totals.net],
                ...totals.vat.map(({ rate, amount }) => [t('totals.vat', { rate }), amount]),
              ].map(([label, amount]) => (
                <div key={label} className="flex items-baseline justify-between gap-4">
                  <dt>{label}</dt>
                  <dd>{money(amount)}</dd>
                </div>
              ))}
            </dl>
            <p className="flex items-baseline justify-between gap-4 border-t border-slate-200 pt-2">
              <span>{t('totals.gross')}</span>
              <strong className="text-base text-heading tabular-nums">{money(totals.gross)}</strong>
            </p>
            <p className="mt-0.5 text-xs">{t('cart.count', { count: lines.length })}</p>
          </div>
          <Link to="/cart" className="mt-3 inline-block text-sm font-semibold text-body underline underline-offset-4 hover:text-heading">
            {t('checkout.backToCart')}
          </Link>
        </aside>
      </div>
    </div>
  )
}
