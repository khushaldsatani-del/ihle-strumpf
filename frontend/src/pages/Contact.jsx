import { lazy, Suspense } from 'react'
import { Clock, Mail, MapPin, Phone, Printer, TriangleAlert, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '../components/common/Loading.jsx'
import Reveal from '../components/landing/Reveal.jsx'

const DealerMap = lazy(() => import('../components/home/DealerMap.jsx'))

// Company data from Ihle's contact page
const COMPANY = 'Ihle Strumpf GmbH'
const STREET = 'Reuterweg 1'
const TOWN = 'D-09429 Wolkenstein'
const PHONE = '+49 37369 84690'
const FAX = '+49 37369 846919'
const EMAIL = 'info@ihle-strumpf.de'
const OUTLET = { lat: 50.6759, lon: 13.1168 }

// Field staff, in Ihle's order. role: an extra line under the name (text: contact.<role>)
const STAFF = [
  { name: 'Irene Dick', phone: '0151 26524730' },
  { name: 'Margret Neumann', phone: '0172 6916989' },
  { name: 'Florian Humpisch', phone: '0176 21467625' },
  { name: 'Falk Krähmer', phone: '0151 50812404' },
  { name: 'Dana Aubry', role: 'international', phone: '0171 1137750' },
]

// "0151 26524730" or "+49 37369 84690" -> "tel:+4915126524730"
const telHref = (number) =>
  `tel:${number.startsWith('+') ? number.replace(/[^\d+]/g, '') : `+49${number.replace(/\D/g, '').slice(1)}`}`

// One line of the contact card: icon, small label, value
function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-4 border-t border-ihle-blue/10 py-4 first:border-t-0 first:pt-0 last:pb-0">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ihle-accent-soft text-ihle-accent">
        <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="lp-caption">{label}</p>
        <div className="mt-1 text-base text-ihle-blue">{children}</div>
      </div>
    </div>
  )
}

// Contact page: the claim, then the contact card (address, phone, fax, e-mail), the factory-outlet hours with the
// current notice, and the map; below, the field staff with their mobile numbers.
export default function Contact() {
  const { t } = useTranslation()

  return (
    <div className="lp">
      <section className="lp-section bg-ihle-mist">
        <div className="lp-container">
          <Reveal>
            <h1 className="type-display max-w-[40rem] text-[clamp(1.75rem,1.35rem+1.4vw,2.5rem)]! leading-tight!">
              {t('landing.hero.title')}
              <span className="block opacity-70">Made in Germany.</span>
            </h1>
          </Reveal>

          <div className="mt-10 grid gap-6 lg:mt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-8">
            <div className="flex flex-col gap-6">
              {/* Contact */}
              <Reveal className="rounded-[1.5rem] bg-white p-6 shadow-[0_20px_50px_-36px_rgb(22_53_91/0.45)] sm:p-8">
                <h2 className="type-subtitle">{t('footer.contact')}</h2>
                <div className="mt-6">
                  <Row icon={MapPin} label={t('footer.address')}>
                    <p className="font-medium">{COMPANY}</p>
                    <p>{STREET}</p>
                    <p>{TOWN}</p>
                  </Row>
                  <Row icon={Phone} label={t('contact.phone')}>
                    <a href={telHref(PHONE)} className="contact-link">
                      {PHONE}
                    </a>
                  </Row>
                  <Row icon={Printer} label={t('contact.fax')}>
                    {FAX}
                  </Row>
                  <Row icon={Mail} label={t('contact.email')}>
                    <a href={`mailto:${EMAIL}`} className="contact-link wrap-anywhere">
                      {EMAIL}
                    </a>
                  </Row>
                </div>
              </Reveal>

              {/* Opening hours with the current notice */}
              <Reveal delay={0.06} className="rounded-[1.5rem] bg-white p-6 shadow-[0_20px_50px_-36px_rgb(22_53_91/0.45)] sm:p-8">
                <div className="flex items-start gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ihle-accent-soft text-ihle-accent">
                    <Clock size={18} strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <h2 className="text-lg font-medium not-italic text-ihle-blue">{t('contact.hoursTitle')}</h2>
                    <p className="type-body mt-1">{t('contact.hours')}</p>
                  </div>
                </div>
                <p className="mt-5 flex items-start gap-3 rounded-2xl bg-ihle-accent-soft px-4 py-3 text-[0.9375rem] font-medium text-ihle-accent-ink">
                  <TriangleAlert size={18} strokeWidth={2} aria-hidden="true" className="mt-0.5 shrink-0" />
                  {t('contact.notice')}
                </p>
              </Reveal>
            </div>

            {/* Map */}
            <Reveal delay={0.1} className="overflow-hidden rounded-[1.5rem] bg-white shadow-[0_20px_50px_rgb(22_53_91/0.1)]">
              <div className="h-[24rem] lg:h-full lg:min-h-[28rem]">
                <Suspense fallback={<Skeleton className="size-full rounded-none" />}>
                  <DealerMap
                    label={t('footer.address')}
                    start={{ center: [OUTLET.lat, OUTLET.lon], zoom: 13 }}
                    outlet={{
                      ...OUTLET,
                      name: COMPANY,
                      lines: [`${STREET} · ${TOWN}`, t('contact.hours')],
                      routeLabel: t('contact.route'),
                    }}
                    locateLabel={t('landing.dealers.locate')}
                    locateError={t('landing.dealers.locateError')}
                  />
                </Suspense>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Field staff */}
      <section className="lp-section bg-white">
        <div className="lp-container">
          <Reveal>
            <h2 className="type-section-title">{t('contact.staffTitle')}</h2>
          </Reveal>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {STAFF.map(({ name, role, phone }, index) => (
              <Reveal as="li" key={name} delay={index * 0.06} className="flex flex-col rounded-[1.5rem] bg-ihle-mist p-6 sm:p-7">
                <span className="grid size-11 place-items-center rounded-full bg-white text-ihle-accent">
                  <UserRound size={20} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-medium not-italic leading-snug text-ihle-blue">{name}</h3>
                {role && <p className="type-small mt-1">{t(`contact.${role}`)}</p>}
                <a href={telHref(phone)} className="contact-link mt-auto flex items-center gap-2 pt-4 text-base">
                  <Phone size={17} strokeWidth={1.75} aria-hidden="true" className="text-ihle-accent" />
                  {phone}
                </a>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
