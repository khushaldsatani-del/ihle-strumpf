import { useEffect, useId, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import useClickOutside from '../../hooks/useClickOutside.js'

// Spring "pop" + fade for the panel
const panel = {
  hidden: { opacity: 0, scale: 0.94, y: -8, transition: { duration: 0.15 } },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 420, damping: 28 } },
}

// One row: a link when it has "to", otherwise a button. "checked" turns it into a radio item.
function MenuItem({ item, close }) {
  const { label, to, onSelect, icon: Icon, checked } = item
  const props = {
    role: checked === undefined ? 'menuitem' : 'menuitemradio',
    'aria-checked': checked,
    tabIndex: -1,
    className: 'menu-item',
    onClick: () => {
      onSelect?.()
      close()
    },
  }
  const body = (
    <>
      {Icon && <Icon size={18} strokeWidth={1.75} aria-hidden="true" />}
      <span className="flex-1">{label}</span>
      {checked && <Check size={16} aria-hidden="true" />}
    </>
  )

  return to ? (
    <Link to={to} {...props}>
      {body}
    </Link>
  ) : (
    <button type="button" {...props}>
      {body}
    </button>
  )
}

/**
 * Dropdown shared by the products, language and user menus.
 * renderTrigger(triggerProps) must spread triggerProps on the <button> that opens the menu.
 * items: [{ key, label, to?, onSelect?, icon?, checked? }]
 */
export default function DropdownMenu({
  open,
  onOpenChange,
  renderTrigger,
  items,
  header = null,
  label,
  align = 'right',
  openOnHover = false,
}) {
  const id = useId()
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const focusFirst = useRef(false)
  const openedByHover = useRef(false)
  const hoverTimer = useRef(0)

  useClickOutside(rootRef, () => onOpenChange(false), open)

  // Opened with the keyboard: move focus to the first item
  useEffect(() => {
    if (open && focusFirst.current) panelRef.current?.querySelector('[role^="menuitem"]')?.focus()
    focusFirst.current = false
  }, [open])

  useEffect(() => () => clearTimeout(hoverTimer.current), [])

  const menuItems = () => [...(panelRef.current?.querySelectorAll('[role^="menuitem"]') ?? [])]

  const triggerProps = {
    ref: triggerRef,
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    'aria-controls': open ? id : undefined,
    onClick: (event) => {
      // Already opened by hover: the first click only "pins" the menu
      if (open && openedByHover.current) {
        openedByHover.current = false
        return
      }
      focusFirst.current = event.detail === 0
      onOpenChange(!open)
    },
    onKeyDown: (event) => {
      if (event.key !== 'ArrowDown') return
      event.preventDefault()
      if (open) menuItems()[0]?.focus()
      else {
        focusFirst.current = true
        onOpenChange(true)
      }
    },
  }

  // Arrow keys / Home / End move through the items, Tab leaves and closes
  const onPanelKeyDown = (event) => {
    const elements = menuItems()
    const index = elements.indexOf(document.activeElement)
    const last = elements.length - 1
    const targets = { ArrowDown: index >= last ? 0 : index + 1, ArrowUp: index <= 0 ? last : index - 1, Home: 0, End: last }

    if (event.key in targets) {
      event.preventDefault()
      elements[targets[event.key]]?.focus()
    } else if (event.key === 'Tab') {
      onOpenChange(false)
    }
  }

  const onRootKeyDown = (event) => {
    if (event.key !== 'Escape' || !open) return
    onOpenChange(false)
    triggerRef.current?.focus()
  }

  // Hover only reacts to a real mouse, so a touch tap does not open and close at once
  const hoverProps = openOnHover
    ? {
        onPointerEnter: (event) => {
          if (event.pointerType !== 'mouse') return
          clearTimeout(hoverTimer.current)
          if (!open) {
            openedByHover.current = true
            onOpenChange(true)
          }
        },
        onPointerLeave: (event) => {
          if (event.pointerType !== 'mouse') return
          hoverTimer.current = setTimeout(() => onOpenChange(false), 180)
        },
      }
    : {}

  return (
    <div ref={rootRef} className="relative flex items-center" onKeyDown={onRootKeyDown} {...hoverProps}>
      {renderTrigger(triggerProps)}

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            id={id}
            role="menu"
            aria-label={label}
            className={`nav-panel absolute top-full z-20 mt-3 min-w-56 rounded-3xl p-2 before:absolute before:inset-x-0 before:-top-3 before:h-3 ${
              align === 'left' ? 'left-0 origin-top-left' : 'right-0 origin-top-right'
            }`}
            variants={panel}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onKeyDown={onPanelKeyDown}
          >
            {header}
            {items.map((item) => (
              <MenuItem key={item.key} item={item} close={() => onOpenChange(false)} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
