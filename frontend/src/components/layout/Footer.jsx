import { Mail, MapPin, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import RollText from '../common/RollText.jsx'

// Link columns and the legal row. Labels are i18n keys.
const QUICK_LINKS = [
  { to: '/products', labelKey: 'nav.allProducts' },
  { to: '/material', labelKey: 'footer.materials' },
  { to: '/services', labelKey: 'nav.services' },
  { to: '/about', labelKey: 'nav.about' },
]
const RESOURCES = [
  { to: '/news', labelKey: 'footer.news' },
  { to: '/catalog', labelKey: 'footer.catalog' },
  { to: '/jobs', labelKey: 'footer.jobs' },
]
const LEGAL = [
  { to: '/contact', labelKey: 'footer.contact' },
  { to: '/imprint', labelKey: 'footer.imprint' },
  { to: '/privacy', labelKey: 'footer.privacy' },
  { to: '/terms', labelKey: 'footer.terms' },
]

// Company contact details (not translated)
const PHONE = '+49 37369 84690'
const EMAIL = 'info@ihle-strumpf.de'
// The industrial park's name is a translation key (footer.addressArea); the rest is a proper address
const ADDRESS = ['Ihle Strumpf GmbH', 'Reuterweg 1', 'footer.addressArea', 'D-09429 Wolkenstein']

const label = 'text-[0.7rem] font-bold uppercase tracking-[0.14em] text-(--footer-accent)'
const value = 'text-[0.8rem] text-(--footer-accent) lg:text-sm'

// Column of links with a small heading
function LinkColumn({ title, links }) {
  const { t } = useTranslation()

  return (
    <nav aria-label={title}>
      {/* a small label, not a heading (the nav itself carries the name) */}
      <p className={label}>{title}</p>
      <ul className="mt-3 lg:mt-5">
        {links.map(({ to, labelKey }) => (
          <li key={to}>
            <Link to={to} className="footer-link flex min-h-9 items-center text-sm lg:min-h-10">
              {t(labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// One contact entry: icon, small title (desktop only) and the value
function ContactItem({ icon: Icon, title, children }) {
  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:gap-4">
      <Icon aria-hidden="true" size={22} strokeWidth={1.5} className="shrink-0 text-slate-500" />
      <div>
        <p className="hidden text-sm font-medium text-heading lg:block">{title}</p>
        {children}
      </div>
    </div>
  )
}

// Site footer: newsletter band with a wave, then company text, links, contact details and legal links.
export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="footer bg-white">
      {/* Newsletter band */}
      <div className="bg-(--footer-band) px-6 pb-16 pt-14 text-center text-white sm:pb-14 sm:pt-20">
        <h2 className="mx-auto max-w-2xl text-balance text-2xl font-bold leading-snug text-white sm:text-3xl">
          {t('footer.newsletterTitle')}
        </h2>
        <Link
          to="/newsletter"
          className="mt-7 inline-flex min-h-12 items-center rounded-full bg-white px-10 text-sm font-semibold text-(--footer-band) transition-transform duration-300 hover:scale-[1.03] active:scale-[0.96]"
        >
          <RollText>{t('footer.newsletterButton')}</RollText>
        </Link>
      </div>

      {/* Wavy lower edge of the band, drawn in the band colour and overlapping it by 1px.
          (Band colour on band colour: no seam can show, unlike a white shape laid over the band.) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 60"
        preserveAspectRatio="none"
        className="-mt-px block h-8 w-full text-(--footer-band) sm:h-14"
      >
        <path fill="currentColor" d="M0,0 L0,54 C250,12 420,-4 620,6 C860,18 1000,52 1160,46 C1280,42 1380,26 1440,14 L1440,0 Z" />
      </svg>

      <div className="mx-auto max-w-[96rem] px-4 pb-8 pt-4 sm:px-8 lg:px-16 lg:pt-8">
        <div className="grid gap-x-6 gap-y-8 lg:grid-cols-[1.5fr_1fr_1fr_1.1fr] lg:gap-x-12">
          {/* Company */}
          <div className="lg:max-w-xs">
            <Link to="/" aria-label={t('nav.home')} className="footer-link inline-block rounded">
              <img src="/images/logo-black.png" alt="" width="2081" height="755" loading="lazy" className="h-8 w-auto" />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-body lg:mt-6 lg:text-[0.8rem] lg:leading-[1.75]">
              {t('footer.about')}
            </p>
          </div>

          {/* Link columns (side by side on every screen size) */}
          <div className="grid grid-cols-2 gap-6 lg:contents">
            <LinkColumn title={t('footer.quickLinks')} links={QUICK_LINKS} />
            <LinkColumn title={t('footer.resources')} links={RESOURCES} />
          </div>

          {/* Contact; on phones a 2 x 2 grid together with the opening hours */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-7 border-t border-slate-200 pt-7 lg:grid-cols-1 lg:border-0 lg:pt-0">
            <ContactItem icon={Phone} title={t('footer.phone')}>
              <a href={`tel:${PHONE.replaceAll(' ', '')}`} className={`footer-link ${value}`}>
                {PHONE}
              </a>
            </ContactItem>
            <ContactItem icon={Mail} title={t('footer.mail')}>
              <a href={`mailto:${EMAIL}`} className={`footer-link ${value}`}>
                {EMAIL}
              </a>
            </ContactItem>
            <ContactItem icon={MapPin} title={t('footer.address')}>
              <address className={`not-italic leading-relaxed ${value}`}>
                {ADDRESS.map((line) => (
                  <span key={line} className="block">
                    {line.startsWith('footer.') ? t(line) : line}
                  </span>
                ))}
              </address>
            </ContactItem>
            {/* top padding = icon height + gap, so the text lines up with the address next to it */}
            <p className="pt-[30px] text-[0.8rem] leading-relaxed text-body lg:hidden">
              {t('footer.hoursTitle')} {t('footer.hours')}
            </p>
          </div>
        </div>

        {/* Legal links and (desktop) opening hours */}
        <div className="mt-8 flex flex-wrap items-end justify-between gap-x-10 gap-y-4 lg:mt-10">
          <ul className="flex flex-wrap gap-x-7 gap-y-1">
            {LEGAL.map(({ to, labelKey }) => (
              <li key={to}>
                <Link to={to} className="footer-link flex min-h-9 items-center text-sm">
                  {t(labelKey)}
                </Link>
              </li>
            ))}
          </ul>
          <p className="hidden text-sm leading-relaxed text-body lg:block">
            <span className="block">{t('footer.hoursTitle')}</span>
            <span className="block">{t('footer.hours')}</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
