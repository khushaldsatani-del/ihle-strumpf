import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink } from 'react-router-dom'
import { NAV_LINKS } from '../../config/navigation.js'
import { CATEGORIES, categoryPath } from '../../data/categories.js'
import { LanguageToggle } from './LanguageSwitcher.jsx'
import SearchBar from './SearchBar.jsx'

// Sheet slides down, then the links come in one after another
const sheet = {
  hidden: { y: '-100%', transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } },
  visible: { y: 0, transition: { type: 'spring', stiffness: 260, damping: 30 } },
}
const content = { hidden: { opacity: 0 }, visible: { opacity: 1 } }
const list = { visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }
const row = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }

// Opening / closing of an accordion part
const accordion = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.25 },
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled])'
const linkClass = 'flex min-h-14 flex-1 items-center rounded-2xl text-2xl font-semibold tracking-tight active:scale-[0.98]'

// Hamburger button that turns into an X (shown below the desktop breakpoint).
export function MenuToggle({ open, onClick, ref }) {
  const { t } = useTranslation()

  return (
    <button
      ref={ref}
      type="button"
      className="nav-btn lg:hidden"
      aria-label={t(open ? 'nav.closeMenu' : 'nav.openMenu')}
      aria-expanded={open}
      aria-controls="mobile-menu"
      onClick={onClick}
    >
      <span className="burger" data-open={open || undefined} aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </button>
  )
}

// Small arrow button that opens / closes one accordion part
function AccordionButton({ open, controls, label, onClick }) {
  return (
    <button type="button" className="nav-btn" aria-label={label} aria-expanded={open} aria-controls={controls} onClick={onClick}>
      <ChevronDown size={22} aria-hidden="true" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
    </button>
  )
}

/**
 * Full-height menu sheet for phones and tablets.
 * containerRef = the navbar element; focus is kept inside it while the sheet is open.
 */
export default function MobileMenu({ containerRef, onClose }) {
  const { t } = useTranslation()
  const [showCategories, setShowCategories] = useState(false)
  const [openCategory, setOpenCategory] = useState(null) // code of the category whose groups are shown

  // Lock the page scroll and trap Tab inside the navbar + sheet
  useEffect(() => {
    const container = containerRef.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event) => {
      if (event.key !== 'Tab') return
      const focusable = [...container.querySelectorAll(FOCUSABLE)].filter((el) => el.getClientRects().length > 0)
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const current = document.activeElement

      if (!container.contains(current) || (!event.shiftKey && current === last)) {
        event.preventDefault()
        first?.focus()
      } else if (event.shiftKey && current === first) {
        event.preventDefault()
        last?.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [containerRef])

  return (
    <motion.div
      id="mobile-menu"
      className="nav-sheet pointer-events-auto fixed inset-0 z-0"
      variants={sheet}
      initial="hidden"
      animate="visible"
      exit="hidden"
    >
      <motion.div variants={content} className="flex h-full flex-col overflow-y-auto overscroll-contain px-4 pb-6 pt-22">
        {/* Search on phones (tablets keep it in the bar) */}
        <div className="mb-4 md:hidden">
          <SearchBar alwaysOpen />
        </div>

        <motion.ul variants={list} className="flex flex-col">
          <motion.li variants={row}>
            <div className="flex items-center gap-2">
              <NavLink to="/products" className={linkClass} onClick={onClose}>
                {t('nav.allProducts')}
              </NavLink>
              <AccordionButton
                open={showCategories}
                controls="mobile-categories"
                label={t('nav.productCategories')}
                onClick={() => setShowCategories((value) => !value)}
              />
            </div>

            {/* Categories; a category with product groups opens as a second accordion level */}
            <AnimatePresence initial={false}>
              {showCategories && (
                <motion.ul id="mobile-categories" className="overflow-hidden border-l border-(--nav-border) pl-4" {...accordion}>
                  {CATEGORIES.map(({ code, nameKey, color, groups }) => {
                    const isOpen = openCategory === code
                    return (
                      <li key={code}>
                        <div className="flex items-center gap-2">
                          <Link
                            to={categoryPath(code)}
                            className="flex min-h-11 flex-1 items-center gap-3 text-base font-semibold"
                            onClick={onClose}
                          >
                            <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                            {t(nameKey)}
                          </Link>
                          {groups.length > 0 && (
                            <AccordionButton
                              open={isOpen}
                              controls={`mobile-groups-${code}`}
                              label={t(nameKey)}
                              onClick={() => setOpenCategory(isOpen ? null : code)}
                            />
                          )}
                        </div>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.ul id={`mobile-groups-${code}`} className="overflow-hidden pl-[1.375rem]" {...accordion}>
                              {groups.map((group) => (
                                <li key={group.code}>
                                  <Link
                                    to={categoryPath(code, group.code)}
                                    className="flex min-h-11 items-center text-[0.95rem] text-(--nav-fg-muted)"
                                    onClick={onClose}
                                  >
                                    {t(group.nameKey)}
                                  </Link>
                                </li>
                              ))}
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </li>
                    )
                  })}
                </motion.ul>
              )}
            </AnimatePresence>
          </motion.li>

          {NAV_LINKS.map(({ to, labelKey }) => (
            <motion.li key={to} variants={row} className="flex">
              <NavLink to={to} className={linkClass} onClick={onClose}>
                {t(labelKey)}
              </NavLink>
            </motion.li>
          ))}
        </motion.ul>

        {/* Language switch on phones (tablets keep it in the bar) */}
        <div className="mt-auto pt-8 md:hidden">
          <LanguageToggle />
        </div>
      </motion.div>
    </motion.div>
  )
}
