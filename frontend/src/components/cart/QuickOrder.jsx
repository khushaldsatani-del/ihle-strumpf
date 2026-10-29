import { useId, useRef, useState } from 'react'
import { CircleAlert, CircleCheck, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import QuantityInput from '../products/QuantityInput.jsx'
import { useCart } from '../../context/CartContext.jsx'
import { useCatalog } from '../../context/CatalogContext.jsx'
import { findByNumber, findSku, showNumber } from '../../utils/articleNumber.js'
import { useProductText } from '../../utils/productText.js'

/**
 * Quick order on the cart page: customers who know Ihle's full article numbers ("40 000 001 12", with or without
 * spaces) type number, quantity and an optional Kommission and add the line without opening the product.
 */
export default function QuickOrder() {
  const { t } = useTranslation()
  const id = useId()
  const inputRef = useRef(null)
  const { status, products } = useCatalog()
  const { add } = useCart()
  const text = useProductText()
  const [number, setNumber] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [commission, setCommission] = useState('')
  const [message, setMessage] = useState(null) // { ok: boolean, text }

  const onSubmit = (event) => {
    event.preventDefault()
    const typed = number.trim()
    if (!typed || status !== 'ready') return

    const found = findSku(typed, products)
    if (!found) {
      // a known article or colour without the size is "incomplete", anything else "not found"
      const partial = findByNumber(typed, products)
      setMessage({ ok: false, text: t(partial ? 'quickOrder.incomplete' : 'quickOrder.notFound', { number: typed }) })
      return
    }

    add({ sku: found.variant.sku, productId: found.product.id, commission, quantity })
    setMessage({
      ok: true,
      text: t('quickOrder.added', { count: quantity, number: showNumber(found.variant.sku), name: text.name(found.product) }),
    })
    setNumber('')
    setQuantity(1)
    setCommission('')
    inputRef.current?.focus()
  }

  return (
    <section aria-labelledby={`${id}-title`} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 id={`${id}-title`} className="flex items-center gap-2 text-base font-bold text-heading sm:text-lg">
        <Zap size={18} strokeWidth={1.75} className="text-[#8a5a3c]" aria-hidden="true" />
        {t('quickOrder.title')}
      </h2>
      <p className="mt-1 text-sm text-body">{t('quickOrder.intro')}</p>

      <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_auto_minmax(0,1fr)_auto] sm:items-end">
        <label className="order-field min-w-0">
          <span>{t('quickOrder.number')}</span>
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            spellCheck="false"
            value={number}
            placeholder={showNumber('40 000 001 12')}
            aria-describedby={message ? `${id}-message` : undefined}
            onChange={(event) => {
              setNumber(event.target.value)
              setMessage(null)
            }}
          />
        </label>
        <div className="order-field">
          <span id={`${id}-qty`}>{t('order.quantity')}</span>
          <QuantityInput value={quantity} label={t('order.quantity')} onChange={setQuantity} />
        </div>
        <label className="order-field min-w-0">
          <span>{t('order.commission')}</span>
          <input
            type="text"
            maxLength={30}
            value={commission}
            placeholder={t('order.commissionPlaceholder')}
            onChange={(event) => setCommission(event.target.value)}
          />
        </label>
        <button type="submit" className="auth-btn h-10 px-5 text-sm" disabled={status !== 'ready' || !number.trim()}>
          {t('quickOrder.add')}
        </button>
      </form>

      <div aria-live="polite">
        {message && (
          <p
            id={`${id}-message`}
            className={`mt-3 flex items-start gap-2 rounded-xl p-3 text-sm font-medium ${
              message.ok ? 'bg-[#eef6ef] text-[#24613a]' : 'bg-[#fdf0ee] text-[#a3261a]'
            }`}
          >
            {message.ok ? (
              <CircleCheck size={17} strokeWidth={1.75} className="mt-px shrink-0" aria-hidden="true" />
            ) : (
              <CircleAlert size={17} strokeWidth={1.75} className="mt-px shrink-0" aria-hidden="true" />
            )}
            {message.text}
          </p>
        )}
      </div>
    </section>
  )
}
