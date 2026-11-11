import { useTranslation } from 'react-i18next'
import { LANGUAGES, setLanguage } from '../../i18n/index.js'
import { Flag } from './Flag.jsx'

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
