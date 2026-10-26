import { ShoppingCart, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PageLoader } from '../components/common/Loading.jsx'
import RollText from '../components/common/RollText.jsx'
import QuantityInput from '../components/products/QuantityInput.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { photosOf, useCatalog } from '../context/CatalogContext.jsx'
import { colorLabel, sizeLabel } from '../data/filters.js'
import usePrices from '../hooks/usePrices.js'
import { photoUrl } from '../utils/api.js'
import formatPrice from '../utils/formatPrice.js'

// Centred message with a button (empty cart, or not logged in)
function Notice({ title, text, to, button }) {
  return (
    <section className="flex min-h-[calc(100vh-var(--nav-height))] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-[#f1e9e2] text-[#3b1f12]">
        <ShoppingCart size={28} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <h1 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl">{title}</h1>
      <p className="max-w-md text-body">{text}</p>
      <Link to={to} className="auth-btn mt-2">
        <RollText>{button}</RollText>
      </Link>
    </section>
  )
}

/**
 * Cart of the logged-in customer: one line per product, colour, size and Kommission,
 * with the Kommission as small text, an editable quantity and the net total (price × quantity).
 * "Order" leads to the checkout.
 */
export default function Cart() {
  const { t, i18n } = useTranslation()
  const { isLoggedIn, checking } = useAuth()
  const { items, count, update, remove, clear } = useCart()
  const { bySku } = useCatalog()
  const priceData = usePrices()

  if (checking) return <PageLoader />
  if (!isLoggedIn) {
    return <Notice title={t('cart.title')} text={t('cart.loginText')} to="/login" button={t('nav.login')} />
  }
  if (items.length === 0) {
    return <Notice title={t('cart.emptyTitle')} text={t('cart.emptyText')} to="/products" button={t('cart.toProducts')} />
  }

  const money = (amount) => (priceData ? formatPrice(amount, priceData.currency, i18n.resolvedLanguage) : '…')
  // SKUs no longer in the shop (blocked or removed in NAV since) are left out
  const lines = items.map((item) => ({ item, ...bySku.get(item.sku) })).filter(({ product }) => product)
  const total = lines.reduce((sum, { item }) => sum + (priceData?.prices[item.sku] ?? 0) * item.quantity, 0)

  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-8 lg:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl">{t('cart.title')}</h1>
        <p className="text-sm text-body">{t('cart.count', { count })}</p>
      </div>

      <ul className="mt-8 border-t border-slate-200">
        {lines.map(({ item, product, variant }) => {
          const name = product.name
          const price = priceData?.prices[item.sku] ?? 0

          return (
            <li key={item.key} className="cart-line">
              <Link to={`/products/${product.id}`} className="product-link block size-20 shrink-0 overflow-hidden rounded-2xl bg-[#f5f4f1] sm:size-24">
                <img src={photoUrl(photosOf(product, variant.color)[0])} alt="" className="size-full object-contain p-[10%]" />
              </Link>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium tracking-wide text-body/70">{t('products.articleNo', { number: product.articleNo })}</p>
                <h2 className="mt-0.5 text-base font-bold text-heading sm:text-lg">
                  <Link to={`/products/${product.id}`} className="product-link">
                    {name}
                  </Link>
                </h2>
                <p className="mt-1 text-sm text-body">
                  {colorLabel(variant.colorName, variant.color)} · {sizeLabel(variant.size)} · {money(price)}
                </p>

                {/* The Kommission entered with the product, as small text below the details */}
                {item.commission && (
                  <p className="mt-1 text-xs text-body">
                    {t('order.commission')}: <span className="font-semibold text-heading">{item.commission}</span>
                  </p>
                )}

                <div className="order-field mt-3 w-fit">
                  <span>{t('order.quantity')}</span>
                  <QuantityInput
                    value={item.quantity}
                    label={`${t('order.quantity')}: ${name}`}
                    onChange={(quantity) => update(item.key, { quantity })}
                  />
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end justify-between gap-3">
                <p className="text-base font-bold text-heading sm:text-lg">{money(price * item.quantity)}</p>
                <button type="button" className="cart-remove" aria-label={t('cart.remove', { name })} onClick={() => remove(item.key)}>
                  <Trash2 size={18} strokeWidth={1.75} aria-hidden="true" />
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="mt-8 flex flex-wrap items-start justify-between gap-6">
        <button type="button" className="text-sm font-semibold text-body underline underline-offset-4 hover:text-heading" onClick={clear}>
          {t('cart.clear')}
        </button>

        <div className="w-full sm:w-80">
          <p className="flex items-baseline justify-between gap-4 text-lg font-bold text-heading">
            <span>{t('cart.total')}</span>
            <span aria-live="polite">{money(total)}</span>
          </p>
          <p className="mt-1 text-right text-xs text-body">{t('cart.totalNote')}</p>
          <Link to="/checkout" className="auth-btn mt-5 w-full">
            <RollText>{t('cart.order')}</RollText>
          </Link>
        </div>
      </div>
    </div>
  )
}
