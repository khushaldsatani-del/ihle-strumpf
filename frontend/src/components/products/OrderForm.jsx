import { useEffect, useId, useRef, useState } from 'react'
import { Check, ShoppingCart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '../common/Loading.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCart } from '../../context/CartContext.jsx'
import { variantOf } from '../../context/CatalogContext.jsx'
import usePrices from '../../hooks/usePrices.js'
import formatPrice from '../../utils/formatPrice.js'
import QuantityInput from './QuantityInput.jsx'

const clamp = (value) => Math.min(Math.max(parseInt(value, 10) || 1, 1), 999)

/**
 * Price and order fields of one product. Only rendered for logged-in customers; guests get nothing.
 * Two versions:
 * - default (product cards): minimal — price, Kommission, a quantity box and "add to cart"
 * - large (product page): an order box with the chosen variant, labelled fields, − / + and the line total
 * size / color can be given from outside (product page); otherwise the product's first SKU is used.
 * summary = text describing the chosen variant, shown in the large version (e.g. "Schwarz · 39–42").
 * The price is the customer's own price of exactly that SKU (NAV prices differ per size).
 */
export default function OrderForm({ product, size, color, summary, large = false }) {
  const { t, i18n } = useTranslation()
  const id = useId()
  const { isLoggedIn } = useAuth()
  const { add } = useCart()
  const priceData = usePrices()
  const [quantity, setQuantity] = useState('1')
  const [commission, setCommission] = useState('')
  const [added, setAdded] = useState(false)
  const timer = useRef(0)

  useEffect(() => () => clearTimeout(timer.current), [])

  if (!isLoggedIn) return null

  const variant = variantOf(product, color ?? product.variants[0].color, size ?? product.variants[0].size)
  const price = priceData?.prices[variant.sku]
  // While the customer's prices load, a small placeholder stands where the price will appear
  const money = (amount) =>
    price === undefined ? (
      <Skeleton className="inline-block h-[0.9em] w-16 align-middle" />
    ) : (
      formatPrice(amount, priceData.currency, i18n.resolvedLanguage)
    )
  const count = clamp(quantity)

  const onSubmit = (event) => {
    event.preventDefault()
    add({ sku: variant.sku, productId: product.id, commission, quantity: count })
    setAdded(true)
    setQuantity('1')
    setCommission('')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setAdded(false), 1800)
  }

  const button = (
    <button type="submit" className="order-btn" data-added={added || undefined}>
      {added ? (
        <Check size={18} strokeWidth={2.5} aria-hidden="true" />
      ) : (
        large && <ShoppingCart size={18} strokeWidth={1.75} aria-hidden="true" />
      )}
      {/* aria-live: the confirmation is read out */}
      <span aria-live="polite">{t(added ? 'order.added' : 'order.add')}</span>
    </button>
  )

  if (large) {
    const unit = t(`filters.units.${product.unit}`, { defaultValue: product.unit })

    return (
      <form className="order-box" onSubmit={onSubmit}>
        <div className="order-box__head">
          <div>
            <p className="order-box__price">{money(price)}</p>
            <p className="order-box__note">{t('order.perUnit', { unit })}</p>
          </div>
          {summary && <p className="order-box__variant">{summary}</p>}
        </div>

        <div className="order-box__fields">
          <div className="order-field">
            <label htmlFor={`${id}-quantity`}>{t('order.quantity')}</label>
            <QuantityInput id={`${id}-quantity`} value={count} onChange={(next) => setQuantity(String(next))} />
          </div>
          <label className="order-field min-w-0 flex-1">
            <span>{t('order.commission')}</span>
            <input
              type="text"
              value={commission}
              maxLength={30}
              placeholder={t('order.commissionPlaceholder')}
              autoComplete="off"
              onChange={(event) => setCommission(event.target.value)}
            />
          </label>
        </div>

        <div className="order-box__total">
          <span>{t('order.total')}</span>
          <strong aria-live="polite">{money(price * count)}</strong>
        </div>

        {button}
      </form>
    )
  }

  return (
    <form className="order-form" onSubmit={onSubmit}>
      <p className="order-price">{money(price)}</p>

      <input
        type="text"
        className="order-input"
        value={commission}
        maxLength={30}
        placeholder={t('order.commission')}
        aria-label={t('order.commission')}
        autoComplete="off"
        onChange={(event) => setCommission(event.target.value)}
      />

      <div className="order-line">
        <input
          type="number"
          inputMode="numeric"
          className="order-input order-input--qty"
          min="1"
          max="999"
          required
          value={quantity}
          aria-label={t('order.quantity')}
          onChange={(event) => setQuantity(event.target.value)}
          onFocus={(event) => event.target.select()}
        />
        {button}
      </div>
    </form>
  )
}
