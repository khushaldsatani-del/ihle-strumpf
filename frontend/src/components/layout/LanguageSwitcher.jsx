import { useState } from 'react'
import { AnimatePresence } from 'motion/react'
import { Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LANGUAGES, setLanguage } from '../../i18n/index.js'
import LanguageDrawer, { Flag } from './LanguageDrawer.jsx'

// Globe button in the navbar, with the flag of the active language on its corner.
// It opens the language panel; "Confirm" there switches the whole site (remembered for the next visit).
export default function LanguageSwitcher({ open, onOpenChange }) {
  const { t, i18n } = useTranslation()
  // Language picked in the panel before confirming; starts at the active one whenever the panel opens
  const [selected, setSelected] = useState(i18n.resolvedLanguage)

  const toggle = () => {
    if (!open) setSelected(i18n.resolvedLanguage)
    onOpenChange(!open)
  }

  const confirm = () => {
    setLanguage(selected)
    onOpenChange(false)
  }

  return (
    <>
      <button
        type="button"
        className="nav-btn"
        aria-label={t('nav.language')}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
      >
        <Globe size={20} strokeWidth={1.75} aria-hidden="true" />
        <Flag code={i18n.resolvedLanguage} className="absolute right-0 top-1 h-3.5 w-5 rounded-[3px] ring-2 ring-white" />
      </button>

      <AnimatePresence>
        {open && <LanguageDrawer selected={selected} onSelect={setSelected} onConfirm={confirm} onClose={() => onOpenChange(false)} />}
      </AnimatePresence>
    </>
  )
}

// All languages as small flag buttons, for the bottom of the mobile menu (switches immediately)
export function LanguageToggle() {
  const { t, i18n } = useTranslation()

  return (
    <div role="group" aria-label={t('nav.language')} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {LANGUAGES.map(({ code, name }) => {
        const active = code === i18n.resolvedLanguage
        return (
          <button
            key={code}
            type="button"
            lang={code}
            aria-pressed={active}
            className={`flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-semibold transition-colors ${
              active ? 'bg-(--nav-pill) text-(--nav-accent)' : 'text-(--nav-fg) hover:bg-(--nav-hover)'
            }`}
            onClick={() => setLanguage(code)}
          >
            <Flag code={code} className="h-4 w-6 rounded-[3px]" />
            {name}
          </button>
        )
      })}
    </div>
  )
}
