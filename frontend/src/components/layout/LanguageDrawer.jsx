import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import { Check, Globe, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '../../i18n/index.js'
import RollText from '../common/RollText.jsx'

// Stripes of the simple flags: [direction, ...colours]
const STRIPES = {
  de: ['rows', '#000000', '#dd0000', '#ffce00'],
  fr: ['columns', '#002654', '#ffffff', '#ce1126'],
  it: ['columns', '#009246', '#ffffff', '#ce2b37'],
  nl: ['rows', '#ae1c28', '#ffffff', '#21468b'],
}

// Small flag with rounded corners (className sets its size)
export function Flag({ code, className = 'h-8 w-[2.9rem] rounded-md' }) {
  const clipId = useId()
  const base = { 'aria-hidden': true, className: `shrink-0 shadow-[0_0_0_1px_rgb(0_0_0/0.06)] ${className}` }

  if (code === 'en') {
    return (
      <svg viewBox="0 0 60 40" preserveAspectRatio="xMidYMid slice" {...base}>
        <clipPath id={clipId}>
          <path d="M30,20 h30 v20 z v20 h-30 z h-30 v-20 z v-20 h30 z" />
        </clipPath>
        <path d="M0,0 h60 v40 h-60 z" fill="#012169" />
        <path d="M0,0 L60,40 M60,0 L0,40" stroke="#fff" strokeWidth="7" />
        <path d="M0,0 L60,40 M60,0 L0,40" stroke="#c8102e" strokeWidth="4.5" clipPath={`url(#${clipId})`} />
        <path d="M30,0 v40 M0,20 h60" stroke="#fff" strokeWidth="12" />
        <path d="M30,0 v40 M0,20 h60" stroke="#c8102e" strokeWidth="7" />
      </svg>
    )
  }

  if (code === 'es') {
    return (
      <svg viewBox="0 0 60 40" preserveAspectRatio="none" {...base}>
        <path d="M0,0 h60 v40 h-60 z" fill="#aa151b" />
        <path d="M0,10 h60 v20 h-60 z" fill="#f1bf00" />
        {/* simplified coat of arms */}
        <path d="M15,15 h7 v7 a3.5,3.5 0 0 1 -7,0 z" fill="#aa151b" stroke="#8a6d00" strokeWidth="0.8" />
      </svg>
    )
  }

  const [direction, ...colors] = STRIPES[code]
  return (
    <svg viewBox="0 0 60 40" preserveAspectRatio="none" {...base}>
      {colors.map((color, index) =>
        direction === 'rows' ? (
          <rect key={color} x="0" y={(40 / 3) * index} width="60" height={40 / 3 + 0.5} fill={color} />
        ) : (
          <rect key={color} x={20 * index} y="0" width="20.5" height="40" fill={color} />
        ),
      )}
    </svg>
  )
}

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), a[href]'

/**
 * Language panel that slides in from the right, over a dimmed page.
 * Render it inside <AnimatePresence>. Closes with the X, a click on the dimmed page or Escape (handled by the navbar).
 * selected / onSelect = the language picked in the panel; onConfirm switches the site to it.
 */
export default function LanguageDrawer({ selected, onSelect, onConfirm, onClose }) {
  const { t } = useTranslation()
  const titleId = useId()
  const panelRef = useRef(null)
  const closeRef = useRef(null)

  // While open: lock the page scroll, keep Tab inside the panel, and give the focus back afterwards
  useEffect(() => {
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKeyDown = (event) => {
      if (event.key !== 'Tab') return
      const focusable = [...panelRef.current.querySelectorAll(FOCUSABLE)]
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const current = document.activeElement

      if (!panelRef.current.contains(current) || (!event.shiftKey && current === last)) {
        event.preventDefault()
        first.focus()
      } else if (event.shiftKey && current === first) {
        event.preventDefault()
        last.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus?.()
    }
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      {/* Dimmed page */}
      <motion.div
        className="absolute inset-0 bg-black/45"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      />

      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="language-drawer absolute inset-y-0 right-0 flex w-full max-w-[21.5rem] flex-col bg-[#faf8f4] px-6 pb-6 pt-9 shadow-2xl sm:px-7 sm:pb-8"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 34 }}
      >
        <div className="flex items-start gap-4">
          <Globe aria-hidden="true" size={34} strokeWidth={1.5} className="mt-0.5 shrink-0 text-heading" />
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-2xl font-bold tracking-tight text-heading">
              {t('nav.language')}
            </h2>
            <p className="mt-1.5 text-sm text-body">{t('nav.languageHint')}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label={t('nav.close')}
            className="-mr-2 -mt-1 flex size-11 shrink-0 items-center justify-center rounded-full text-heading transition-colors hover:bg-black/5"
            onClick={onClose}
          >
            <X aria-hidden="true" size={24} strokeWidth={1.75} />
          </button>
        </div>

        <div role="radiogroup" aria-labelledby={titleId} className="mt-8 flex-1 overflow-y-auto">
          {LANGUAGES.map(({ code, name }) => {
            const checked = code === selected
            return (
              <label
                key={code}
                lang={code}
                className={`language-option flex min-h-16 cursor-pointer items-center gap-5 rounded-2xl px-4 transition-colors ${
                  checked ? 'bg-[#f1e9e2]' : 'hover:bg-[#f5efe9]'
                }`}
              >
                <input
                  type="radio"
                  name="language"
                  value={code}
                  checked={checked}
                  className="sr-only"
                  onChange={() => onSelect(code)}
                />
                <Flag code={code} />
                <span className="flex-1 text-lg text-heading">{name}</span>
                <span
                  aria-hidden="true"
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    checked ? 'border-[#3d1f10] bg-[#3d1f10] text-white' : 'border-slate-300 bg-white/60'
                  }`}
                >
                  {checked && <Check size={16} strokeWidth={2.5} />}
                </span>
              </label>
            )
          })}
        </div>

        <button
          type="button"
          onClick={onConfirm}
          className="mt-6 flex min-h-16 w-full items-center justify-center rounded-full bg-[#3d1f10] text-lg font-semibold text-white transition-[background-color,transform] duration-300 hover:bg-[#54301c] active:scale-[0.98]"
        >
          <RollText>{t('nav.confirm')}</RollText>
        </button>
      </motion.div>
    </div>,
    document.body,
  )
}
