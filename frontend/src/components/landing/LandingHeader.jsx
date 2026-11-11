import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { ChevronDown, LogOut, MapPin, Package, Settings, ShoppingCart, User, UserCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { NAV_LINKS } from '../../config/navigation.js'
import { SHOW_CART } from '../../config/features.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCart } from '../../context/CartContext.jsx'
import useScrollPosition from '../../hooks/useScrollPosition.js'
import { LANGUAGES, setLanguage } from '../../i18n/index.js'
import CartIcon from '../layout/CartIcon.jsx'
import DropdownMenu from '../layout/DropdownMenu.jsx'
import { Flag } from '../layout/Flag.jsx'
import MobileMenu, { MenuToggle } from '../layout/MobileMenu.jsx'
import ProductsDropdown from '../layout/ProductsDropdown.jsx'
import SearchBar from '../layout/SearchBar.jsx'
import UserMenu from '../layout/UserMenu.jsx'
import { scrollToDealers } from './scrollToDealers.js'

const PHONE = '+49 (0) 37369 84690'
const SCROLLED_AFTER = 40 // px: past the top bar, the header gets smaller

// A small flag per language, as the "icon" of its menu row (the menu passes icon props, which a flag doesn't need)
const FLAG_ICONS = Object.fromEntries(
  LANGUAGES.map(({ code }) => [code, () => <Flag code={code} className="h-3.5 w-5 rounded-[3px]" />]),
)

// Language menu in the top bar: flag and code of the active language; the menu lists every language with its
// flag and name and switches the whole site at once
function LanguageMenu({ open, onOpenChange }) {
  const { t, i18n } = useTranslation()
  const current = i18n.resolvedLanguage

  const items = LANGUAGES.map(({ code, name }) => ({
    key: code,
    label: name,
    icon: FLAG_ICONS[code],
    checked: code === current,
    onSelect: () => setLanguage(code),
  }))

  return (
    <DropdownMenu
      open={open}
      onOpenChange={onOpenChange}
      items={items}
      label={t('nav.language')}
      renderTrigger={(triggerProps) => (
        <button
          type="button"
          className="flex min-h-9 items-center gap-2 text-[0.8125rem] font-medium uppercase"
          aria-label={`${t('nav.language')}: ${LANGUAGES.find(({ code }) => code === current)?.name ?? current}`}
          {...triggerProps}
        >
          <Flag code={current} className="h-3.5 w-5 rounded-[3px]" />
          {current}
          <ChevronDown
            size={14}
            strokeWidth={2}
            aria-hidden="true"
            className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    />
  )
}

// Top bar account entry: "Retailer login" for guests, the company with the account menu when logged in
function TopbarAccount({ open, onOpenChange }) {
  const { t } = useTranslation()
  const { isLoggedIn, user, logout } = useAuth()

  if (!isLoggedIn) {
    return (
      <Link to="/login" className="flex min-h-9 items-center gap-1.5 text-sm">
        <User size={16} strokeWidth={1.75} aria-hidden="true" />
        {t('landing.topbar.login')}
      </Link>
    )
  }

  const items = [
    { key: 'orders', label: t('nav.myOrders'), to: '/account/orders', icon: Package },
    { key: 'addresses', label: t('nav.addresses'), to: '/account/addresses', icon: MapPin },
    { key: 'settings', label: t('nav.settings'), to: '/account/settings', icon: Settings },
    { key: 'logout', label: t('nav.logout'), onSelect: logout, icon: LogOut },
  ]

  return (
    <DropdownMenu
      open={open}
      onOpenChange={onOpenChange}
      items={items}
      label={t('nav.account')}
      renderTrigger={(triggerProps) => (
        <button type="button" className="flex min-h-9 max-w-56 items-center gap-1.5 text-sm" {...triggerProps}>
          <UserCheck size={16} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
          <span className="truncate">{user.company}</span>
        </button>
      )}
    />
  )
}

function TopbarCart() {
  const { t } = useTranslation()
  const { count } = useCart()
  return (
    <Link to="/cart" className="relative flex min-h-9 items-center px-1" aria-label={t('nav.cartCount', { count })}>
      <ShoppingCart size={17} strokeWidth={1.75} aria-hidden="true" />
      <span
        aria-hidden="true"
        className="ml-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-ihle-accent px-1 text-[0.65rem] font-bold text-white"
      >
        {count > 99 ? '99+' : count}
      </span>
    </Link>
  )
}

/**
 * Header of every page (Ihle corporate design), sticky as a whole: a dark-blue top bar on desktop (factory outlet,
 * languages, login, cart) and the white bar with the links on the left and the big ihle® logo on the right.
 * The product mega menu, the search, the account menu and the mobile menu are the shop's own.
 */
export default function LandingHeader() {
  const { t } = useTranslation()
  const location = useLocation()
  const { isLoggedIn } = useAuth()
  const { y, direction } = useScrollPosition()
  const [openMenu, setOpenMenu] = useState(null) // 'products' | 'search' | 'language' | 'account' | 'user' | 'mobile' | null
  const headerRef = useRef(null)
  const toggleRef = useRef(null)
  const scrolled = y > SCROLLED_AFTER
  const mobileOpen = openMenu === 'mobile'
  const showCart = SHOW_CART && isLoggedIn
  // Desktop: the blue top bar slides away while scrolling down and comes back as soon as you scroll up (always
  // shown at the top of the page and while its language or account menu is open)
  const topbarHidden = scrolled && direction === 'down' && openMenu !== 'language' && openMenu !== 'account'

  // Props for one menu; opening one closes the others
  const menu = (name) => ({
    open: openMenu === name,
    onOpenChange: (next) => setOpenMenu((current) => (next ? name : current === name ? null : current)),
  })

  // Close everything after navigating
  const [lastLocationKey, setLastLocationKey] = useState(location.key)
  if (lastLocationKey !== location.key) {
    setLastLocationKey(location.key)
    setOpenMenu(null)
  }

  // Escape closes the open menu
  useEffect(() => {
    if (!openMenu) return undefined
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return
      if (openMenu === 'mobile') toggleRef.current?.focus()
      setOpenMenu(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [openMenu])

  // Close when the layout switches between phone / tablet / desktop
  useEffect(() => {
    const queries = ['(min-width: 768px)', '(min-width: 1024px)'].map((query) => window.matchMedia(query))
    const close = () => setOpenMenu(null)
    queries.forEach((query) => query.addEventListener('change', close))
    return () => queries.forEach((query) => query.removeEventListener('change', close))
  }, [])

  return (
    <>
      <a href="#main" className="skip-link z-[70]">
        {t('nav.skip')}
      </a>

      {/* The open menu locks the page scroll, which would send a sticky header back to the top of the page:
          meanwhile the header is fixed, and this placeholder keeps its space so nothing moves */}
      {mobileOpen && <div aria-hidden="true" className="h-18 lg:hidden" />}
      <header
        ref={headerRef}
        data-scrolled={scrolled || undefined}
        className={`lp-header z-50 transition-transform duration-300 ease-out ${mobileOpen ? 'fixed inset-x-0 top-0' : 'sticky top-0'} ${
          topbarHidden ? 'lg:-translate-y-9' : ''
        }`}
      >
        {/* Top bar (desktop): part of the sticky header; slides out above the window while scrolling down */}
        <div className="lp-topbar relative z-20 hidden lg:block">
          <div className="lp-container flex h-9 items-center justify-between gap-6 text-sm">
            <p>
              {t('landing.topbar.outlet')} · <a href={`tel:${PHONE.replace(/[^\d+]/g, '')}`}>Tel. {PHONE}</a>
            </p>
            <div className="flex items-center gap-4">
              <LanguageMenu {...menu('language')} />
              <span aria-hidden="true" className="h-4 w-px bg-white/25" />
              <TopbarAccount {...menu('account')} />
              {showCart && <TopbarCart />}
            </div>
          </div>
        </div>

        <nav aria-label={t('nav.main')} className="lp-bar relative z-10">
          <div className="lp-container lp-bar__inner gap-2">
            {/* Phones and tablets: logo on the left */}
            <Link to="/" aria-label={t('nav.home')} className="lp-logo shrink-0 lg:hidden">
              <img src="/images/landing/logo-ihle.svg" alt="" width="233" height="95" />
            </Link>

            {/* Desktop: links on the left */}
            <ul className="hidden flex-1 items-center lg:flex">
              <li>
                <NavLink to="/" end className="nav-link -ml-[0.85rem]">
                  {t('landing.nav.home')}
                </NavLink>
              </li>
              <li className="relative flex items-center">
                <ProductsDropdown
                  {...menu('products')}
                  label={t('landing.nav.products')}
                  active={location.pathname.startsWith('/products')}
                />
              </li>
              {NAV_LINKS.map(({ to, labelKey }) => (
                <li key={to}>
                  <NavLink to={to} className="nav-link">
                    {t(labelKey)}
                  </NavLink>
                </li>
              ))}
              <li>
                {/* on the home page it scrolls down to the dealer search; elsewhere it opens the home page there */}
                <Link to="/#haendler" className="nav-link" onClick={scrollToDealers}>
                  {t('landing.nav.dealers')}
                </Link>
              </li>
              <li className="ml-2">
                <SearchBar {...menu('search')} />
              </li>
            </ul>

            {/* Desktop: the big logo on the right */}
            <div className="hidden lg:flex">
              <Link to="/" aria-label={t('nav.home')} className="lp-logo">
                <img src="/images/landing/logo-ihle.svg" alt="" width="233" height="95" />
              </Link>
            </div>

            {/* Phones and tablets: search (tablet), cart, account and the menu button on the right */}
            <div className="ml-auto flex items-center gap-1 lg:hidden">
              <div className="hidden md:block">
                <SearchBar {...menu('search')} />
              </div>
              {showCart && <CartIcon />}
              <UserMenu {...menu('user')} />
              <MenuToggle
                ref={toggleRef}
                open={mobileOpen}
                onClick={() => menu('mobile').onOpenChange(!mobileOpen)}
              />
            </div>
          </div>
        </nav>

        <AnimatePresence>
          {mobileOpen && <MobileMenu containerRef={headerRef} onClose={() => setOpenMenu(null)} />}
        </AnimatePresence>
      </header>
    </>
  )
}
