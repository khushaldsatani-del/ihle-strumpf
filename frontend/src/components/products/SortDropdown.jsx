import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronDown } from 'lucide-react'
import useClickOutside from '../../hooks/useClickOutside.js'

/**
 * Dropdown in the style of the site (replaces the browser's own select box). Used for "Sort by" and "Show".
 * openUp = the list opens above the button (for the page navigation at the bottom of the page).
 * field = form-field look: small label above a full-width button, the list as wide as the button (filters, checkout).
 * options: [{ value, label, description?, disabled?, hint? }]; description = a second, smaller line (field look only,
 * e.g. the street and city under a company name). disabled = the whole dropdown can't be opened.
 * Keyboard: Arrow keys move, Enter or Space chooses, Escape closes.
 */
export default function SortDropdown({ label, value, options, onChange, openUp = false, field = false, disabled = false }) {
  const id = useId()
  const rootRef = useRef(null)
  const buttonRef = useRef(null)
  const listRef = useRef(null)
  const [open, setOpen] = useState(false)
  const current = options.find((option) => option.value === value) ?? options[0]

  useClickOutside(rootRef, () => setOpen(false), open)

  // Opening moves the focus to the chosen option
  useEffect(() => {
    if (open) listRef.current?.querySelector('[aria-selected="true"]')?.focus()
  }, [open])

  const close = () => {
    setOpen(false)
    buttonRef.current?.focus()
  }

  const choose = (next) => {
    onChange(next)
    close()
  }

  const onListKeyDown = (event) => {
    const items = [...listRef.current.querySelectorAll('[role="option"]')]
    const index = items.indexOf(document.activeElement)
    const last = items.length - 1
    const targets = { ArrowDown: index >= last ? 0 : index + 1, ArrowUp: index <= 0 ? last : index - 1, Home: 0, End: last }

    if (event.key in targets) {
      event.preventDefault()
      items[targets[event.key]]?.focus()
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (index >= 0 && !options[index].disabled) choose(options[index].value)
    } else if (event.key === 'Escape') {
      event.stopPropagation()
      close()
    } else if (event.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className={`relative flex ${field ? 'flex-col gap-1' : 'items-center gap-2'}`}>
      <span id={`${id}-label`} className={field ? 'text-[0.72rem] font-bold text-heading' : 'font-bold'}>
        {label}
      </span>
      <button
        ref={buttonRef}
        type="button"
        className={`sort-btn ${field ? 'sort-btn--field' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-value`}
        disabled={disabled}
        onClick={() => setOpen((isOpen) => !isOpen)}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
          event.preventDefault()
          setOpen(true)
        }}
      >
        <span id={`${id}-value`}>{current ? [current.label, current.description].filter(Boolean).join(', ') : ''}</span>
        <ChevronDown size={16} aria-hidden="true" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            role="listbox"
            aria-labelledby={`${id}-label`}
            className={`sort-list absolute right-0 z-20 rounded-2xl p-1.5 ${
              field
                ? 'left-0 top-full mt-2 origin-top'
                : openUp
                  ? 'bottom-full mb-2 min-w-24 origin-bottom-right'
                  : 'top-full mt-2 min-w-48 origin-top-right'
            }`}
            initial={{ opacity: 0, scale: 0.96, y: openUp ? 6 : -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: openUp ? 6 : -6 }}
            transition={{ duration: 0.16 }}
            onKeyDown={onListKeyDown}
          >
            {options.map((option) => {
              const selected = option.value === value
              return (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={selected}
                  aria-disabled={option.disabled || undefined}
                  tabIndex={-1}
                  className={`sort-option ${option.description ? 'sort-option--two-lines' : ''}`}
                  onClick={() => !option.disabled && choose(option.value)}
                >
                  <span className="min-w-0 flex-1">
                    {option.label}
                    {option.description && <span className="sort-option__description">{option.description}</span>}
                  </span>
                  {option.hint && <span className="text-xs font-normal">{option.hint}</span>}
                  {selected && <Check size={16} strokeWidth={2.25} aria-hidden="true" />}
                </li>
              )
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
