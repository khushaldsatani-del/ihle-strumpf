import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router-dom'
import { NAV_LINKS } from '../../config/navigation.js'
import ProductsDropdown from './ProductsDropdown.jsx'

// Pill behind the active link. The shared layoutId makes it slide from link to link.
function ActivePill({ pathname }) {
  return (
    <motion.span
      layoutId="nav-active-pill"
      layoutDependency={pathname}
      className="nav-pill"
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
    />
  )
}

// Desktop text links: All products (with dropdown), Material, Services, About us.
export default function NavLinks({ productsMenu }) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const productsActive = pathname.startsWith('/products')

  return (
    <ul className="hidden items-center lg:flex">
      <li className="relative flex items-center">
        {productsActive && <ActivePill pathname={pathname} />}
        <ProductsDropdown {...productsMenu} active={productsActive} />
      </li>

      {NAV_LINKS.map(({ to, labelKey }) => (
        <li key={to} className="relative">
          <NavLink to={to} className="nav-link">
            {({ isActive }) => (
              <>
                {isActive && <ActivePill pathname={pathname} />}
                <span className="relative">{t(labelKey)}</span>
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  )
}
