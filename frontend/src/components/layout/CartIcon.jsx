import { ShoppingCart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext.jsx'

// Cart link with a badge for the number of items in the cart.
// Only rendered for logged-in customers and when SHOW_CART is true (see Navbar.jsx).
export default function CartIcon() {
  const { t } = useTranslation()
  const { count } = useCart()

  return (
    <Link to="/cart" className="nav-btn" aria-label={t('nav.cartCount', { count })}>
      <ShoppingCart size={20} strokeWidth={1.75} aria-hidden="true" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-0.5 top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-(--nav-badge-bg) px-1 text-[0.65rem] font-bold leading-none text-(--nav-badge-fg)"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
