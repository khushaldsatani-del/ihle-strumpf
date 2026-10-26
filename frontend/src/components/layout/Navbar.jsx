import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import { SHOW_CART } from '../../config/features.js'
import { useAuth } from '../../context/AuthContext.jsx'
import useScrollPosition from '../../hooks/useScrollPosition.js'
import CartIcon from './CartIcon.jsx'
import LanguageSwitcher from './LanguageSwitcher.jsx'
import MobileMenu, { MenuToggle } from './MobileMenu.jsx'
import NavLinks from './NavLinks.jsx'
import SearchBar from './SearchBar.jsx'
import UserMenu from './UserMenu.jsx'

const SHRINK_AFTER = 24 // px scrolled before the bar gets smaller
const HIDE_AFTER = 480 // px scrolled before the bar may hide on scroll-down

// Main navigation: a white bar fixed at the top with a small gap around it (page content starts below it).
export default function Navbar() {
  const { t } = useTranslation()
  const location = useLocation()
  const { isLoggedIn } = useAuth()
  const { y, direction } = useScrollPosition()
  const [openMenu, setOpenMenu] = useState(null) // 'products' | 'search' | 'language' | 'user' | 'mobile' | null
  const [keyboardFocus, setKeyboardFocus] = useState(false)
  const headerRef = useRef(null)
  const toggleRef = useRef(null)

  const scrolled = y > SHRINK_AFTER
  const hidden = direction === 'down' && y > HIDE_AFTER && !openMenu && !keyboardFocus
  const mobileOpen = openMenu === 'mobile'

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
    <header
      ref={headerRef}
      data-scrolled={scrolled || undefined}
      className={`navbar pointer-events-none fixed inset-x-0 top-0 z-50 transition-transform duration-300 ${
        hidden ? '-translate-y-[120%]' : ''
      }`}
      onFocus={(event) => setKeyboardFocus(event.target.matches(':focus-visible'))}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setKeyboardFocus(false)
      }}
    >
      <a href="#main" className="skip-link">
        {t('nav.skip')}
      </a>

      <nav aria-label={t('nav.main')} className="navbar__bar pointer-events-auto relative z-10 flex items-center gap-1">
        {/* Desktop: logo and icon groups share the free space equally, so the links sit in the middle */}
        <div className="flex lg:flex-1">
          <Link to="/" aria-label={t('nav.home')} className="nav-logo flex h-11 shrink-0 items-center rounded-full">
            <img src="/images/logo-black.png" alt="" width="2081" height="755" />
          </Link>
        </div>

        <NavLinks productsMenu={menu('products')} />

        <div className="ml-auto flex items-center justify-end gap-0.5 lg:ml-0 lg:flex-1">
          {/* Search and language live in the mobile menu on phones */}
          <div className="hidden md:block">
            <SearchBar {...menu('search')} />
          </div>
          {/* The cart belongs to the logged-in customer; guests cannot order */}
          {SHOW_CART && isLoggedIn && <CartIcon />}
          <div className="hidden md:block">
            <LanguageSwitcher {...menu('language')} />
          </div>
          <UserMenu {...menu('user')} />
          <MenuToggle ref={toggleRef} open={mobileOpen} onClick={() => menu('mobile').onOpenChange(!mobileOpen)} />
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && <MobileMenu containerRef={headerRef} onClose={() => setOpenMenu(null)} />}
      </AnimatePresence>
    </header>
  )
}
