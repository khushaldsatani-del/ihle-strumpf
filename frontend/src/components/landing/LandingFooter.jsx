import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { LANGUAGES, setLanguage } from '../../i18n/index.js'
import { Flag } from '../layout/Flag.jsx'
import BrandText from './BrandText.jsx'

const PHONE = '+49 (0) 37369 84690'
const EMAIL = 'info@ihle-strumpf.de'
const YEAR = new Date().getFullYear()

const QUICK_LINKS = [
  { to: '/products', labelKey: 'landing.nav.products' },
  { to: '/material', labelKey: 'nav.material' },
  { to: '/services', labelKey: 'nav.services' },
  { to: '/about', labelKey: 'nav.about' },
  { to: '/catalog', labelKey: 'footer.catalog' },
  { to: '/jobs', labelKey: 'footer.jobs' },
]

const LEGAL_LINKS = [
  { to: '/imprint', labelKey: 'footer.imprint' },
  { to: '/privacy', labelKey: 'footer.privacy' },
  { to: '/terms', labelKey: 'footer.terms' },
]

// Footer of every page: dark Ihle blue, four columns, legal links and languages.
export default function LandingFooter() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  // The newsletter sign-up has its own page (not built yet); the field only leads there
  const onSubscribe = (event) => {
    event.preventDefault()
    navigate('/newsletter')
  }

  return (
    <footer className="lp-footer relative overflow-hidden bg-ihle-blue text-white/80">
      <div className="lp-container pt-20 lg:pt-24">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div>
            <Link to="/" aria-label={t('nav.home')} className="inline-block">
              <img src="/images/landing/logo-ihle-white.svg" alt="" width="233" height="95" className="w-[9.4rem]" />
            </Link>
            <p className="mt-6 max-w-[17rem] text-[0.9375rem] leading-relaxed [&_strong]:text-white">
              <BrandText>{t('landing.footer.about')}</BrandText>
            </p>
          </div>

          <nav aria-label={t('footer.quickLinks')}>
            <h2 className="text-lg font-medium not-italic text-white">{t('footer.quickLinks')}</h2>
            <ul className="mt-4 space-y-1">
              {QUICK_LINKS.map(({ to, labelKey }) => (
                <li key={to}>
                  <Link to={to} className="inline-flex min-h-9 items-center text-[0.9375rem]">
                    {t(labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-lg font-medium not-italic text-white">{t('footer.contact')}</h2>
            <address className="mt-4 space-y-2.5 text-[0.9375rem] not-italic leading-relaxed">
              <p>Ihle Strumpf GmbH</p>
              <p>Reuterweg 1 · 09429 Wolkenstein</p>
              <p>{t('footer.addressArea')}</p>
              <p>
                <a href={`tel:${PHONE.replace(/[^\d+]/g, '')}`}>Tel. {PHONE}</a>
              </p>
              <p>
                <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
              </p>
              <p>{t('landing.footer.outlet')}</p>
            </address>
          </div>

          <div>
            <h2 className="text-lg font-medium not-italic text-white">{t('footer.newsletter')}</h2>
            <p className="mt-4 text-[0.9375rem] leading-relaxed">{t('footer.newsletterTitle')}</p>
            <form onSubmit={onSubscribe} className="mt-5 flex max-w-[17.5rem] flex-col gap-3">
              <input
                type="email"
                value={email}
                autoComplete="email"
                placeholder={t('landing.footer.emailPlaceholder')}
                aria-label={t('landing.footer.emailPlaceholder')}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12.5 rounded-full bg-white px-5 text-[0.9375rem] text-ihle-blue outline-none focus-visible:ring-2 focus-visible:ring-ihle-accent"
              />
              <button type="submit" className="lp-btn btn-light self-start">
                {t('footer.newsletterButton')}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-5 border-t border-white/15 py-7 text-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <p>© {YEAR} Ihle Strumpf GmbH</p>
            {LEGAL_LINKS.map(({ to, labelKey }) => (
              <Link key={to} to={to}>
                {t(labelKey)}
              </Link>
            ))}
          </div>

          <div role="group" aria-label={t('nav.language')} className="flex flex-wrap gap-2">
            {LANGUAGES.map(({ code, name }) => {
              const active = code === i18n.resolvedLanguage
              return (
                <button
                  key={code}
                  type="button"
                  lang={code}
                  title={name}
                  aria-label={name}
                  aria-pressed={active}
                  className={`inline-flex h-8 items-center gap-2 rounded-full pl-2 pr-3 text-[0.8125rem] font-medium uppercase transition-colors ${
                    active ? 'bg-white text-ihle-blue' : 'text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.3)] hover:bg-white/10'
                  }`}
                  onClick={() => setLanguage(code)}
                >
                  <Flag code={code} className="h-3.5 w-5 rounded-[3px]" />
                  {code}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </footer>
  )
}
