import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { CATEGORIES, categoryPath } from '../../data/categories.js'
import useClickOutside from '../../hooks/useClickOutside.js'

// Spring "pop" + fade for the panel
const panel = {
  hidden: { opacity: 0, scale: 0.96, y: -8, transition: { duration: 0.15 } },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 420, damping: 30 } },
}

/**
 * "All products" with a mega menu: categories on the left, the product groups of the chosen category on the right.
 * The label links to /products; the arrow (or hovering with a mouse) opens the menu.
 * Keyboard: Arrow up/down moves through categories or groups, Arrow right/left switches between the two columns.
 */
export default function ProductsDropdown({ open, onOpenChange, active }) {
  const { t } = useTranslation()
  const id = useId()
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const focusFirst = useRef(false)
  const openedByHover = useRef(false)
  const hoverTimer = useRef(0)
  const [selected, setSelected] = useState(CATEGORIES[0].code)
  const category = CATEGORIES.find(({ code }) => code === selected)

  const close = () => onOpenChange(false)
  // Opening always starts with the first category
  const show = () => {
    setSelected(CATEGORIES[0].code)
    onOpenChange(true)
  }

  useClickOutside(rootRef, close, open)

  // Opened with the keyboard: move focus to the selected category
  useEffect(() => {
    if (open && focusFirst.current) panelRef.current?.querySelector('[role="tab"][aria-selected="true"]')?.focus()
    focusFirst.current = false
  }, [open])

  useEffect(() => () => clearTimeout(hoverTimer.current), [])

  const tabs = () => [...(panelRef.current?.querySelectorAll('[role="tab"]') ?? [])]
  const groupLinks = () => [...(panelRef.current?.querySelectorAll('[role="tabpanel"] a') ?? [])]

  // Moves focus inside a list with the arrow keys; returns true when the key was used
  const moveFocus = (event, elements) => {
    const index = elements.indexOf(document.activeElement)
    const last = elements.length - 1
    const targets = { ArrowDown: index >= last ? 0 : index + 1, ArrowUp: index <= 0 ? last : index - 1, Home: 0, End: last }
    if (!(event.key in targets)) return false
    event.preventDefault()
    elements[targets[event.key]]?.focus()
    return true
  }

  const onTabKeyDown = (event) => {
    if (moveFocus(event, tabs())) return
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      // first product group, or the "View all" link when the category has no groups
      const target = panelRef.current?.querySelector('[role="tabpanel"] ul a') ?? groupLinks()[0]
      target?.focus()
    }
  }

  const onGroupKeyDown = (event) => {
    if (moveFocus(event, groupLinks())) return
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      panelRef.current?.querySelector('[role="tab"][aria-selected="true"]')?.focus()
    }
  }

  const onTriggerClick = (event) => {
    // Already opened by hover: the first click only "pins" the menu
    if (open && openedByHover.current) {
      openedByHover.current = false
      return
    }
    focusFirst.current = event.detail === 0
    if (open) close()
    else show()
  }

  const onTriggerKeyDown = (event) => {
    if (event.key !== 'ArrowDown') return
    event.preventDefault()
    if (open) tabs()[0]?.focus()
    else {
      focusFirst.current = true
      show()
    }
  }

  return (
    <div
      ref={rootRef}
      className="relative flex items-center"
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || !open) return
        close()
        triggerRef.current?.focus()
      }}
      // Focus moved out of the menu with Tab: close it
      onBlur={(event) => {
        if (open && event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) close()
      }}
      // Hover only reacts to a real mouse, so a touch tap does not open and close at once
      onPointerEnter={(event) => {
        if (event.pointerType !== 'mouse') return
        clearTimeout(hoverTimer.current)
        if (!open) {
          openedByHover.current = true
          show()
        }
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== 'mouse') return
        hoverTimer.current = setTimeout(close, 200)
      }}
    >
      <Link to="/products" className="nav-link pr-0" aria-current={active ? 'page' : undefined}>
        {t('nav.allProducts')}
      </Link>
      <button
        ref={triggerRef}
        type="button"
        className="nav-link min-w-11 justify-center px-0"
        aria-label={t('nav.productCategories')}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={onTriggerClick}
        onKeyDown={onTriggerKeyDown}
      >
        <ChevronDown size={16} aria-hidden="true" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          // The top padding bridges the gap to the bar, so the pointer can travel into the panel
          <div className="absolute left-0 top-full z-20 pt-3">
            <motion.div
              ref={panelRef}
              id={id}
              role="group"
              aria-label={t('nav.productCategories')}
              className="nav-panel w-[min(40rem,calc(100vw-3rem))] origin-top-left rounded-3xl p-2"
              variants={panel}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="grid grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
                {/* Categories */}
                <div role="tablist" aria-orientation="vertical" aria-label={t('nav.productCategories')} className="pr-2">
                  {CATEGORIES.map(({ code, nameKey, color }) => {
                    const isSelected = code === selected
                    return (
                      <button
                        key={code}
                        type="button"
                        role="tab"
                        id={`${id}-tab-${code}`}
                        aria-selected={isSelected}
                        aria-controls={`${id}-groups`}
                        tabIndex={isSelected ? 0 : -1}
                        className="menu-item mega-tab"
                        onClick={() => setSelected(code)}
                        onFocus={() => setSelected(code)}
                        onPointerEnter={(event) => event.pointerType === 'mouse' && setSelected(code)}
                        onKeyDown={onTabKeyDown}
                      >
                        <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                        <span className="flex-1 whitespace-normal">{t(nameKey)}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Product groups of the selected category */}
                <div
                  role="tabpanel"
                  id={`${id}-groups`}
                  aria-labelledby={`${id}-tab-${selected}`}
                  className="min-h-64 border-l border-(--nav-border) pl-2"
                  onKeyDown={onGroupKeyDown}
                >
                  <div className="flex min-h-11 items-center justify-between gap-3 pl-3.5 pr-1">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-(--nav-fg-muted)">{t(category.nameKey)}</p>
                    <Link to={categoryPath(category.code)} className="mega-view-all" onClick={close}>
                      {t('nav.viewAll')}
                    </Link>
                  </div>

                  {category.groups.length > 0 ? (
                    <ul>
                      {category.groups.map(({ code, nameKey }) => (
                        <li key={code}>
                          <Link to={categoryPath(category.code, code)} className="menu-item min-h-10 whitespace-normal" onClick={close}>
                            {t(nameKey)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-3.5 py-2 text-sm leading-relaxed text-(--nav-fg-muted)">{t('nav.megaEmpty')}</p>
                  )}
                </div>
              </div>

              <div className="mt-2 border-t border-(--nav-border) pt-2">
                <Link to="/products" className="menu-item justify-between font-semibold" onClick={close}>
                  {t('nav.viewAllProducts')}
                  <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
