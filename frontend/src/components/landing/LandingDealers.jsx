import { lazy, Suspense, useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { Skeleton } from '../common/Loading.jsx'
import { findPlace } from '../../utils/findPlace.js'
import Reveal from './Reveal.jsx'

// The map library is large and the map sits at the bottom of the page, so it loads separately
const DealerMap = lazy(() => import('../home/DealerMap.jsx'))

// Ihle's factory outlet (Reuterweg 1, Gewerbegebiet Heinzebank, Wolkenstein) as start point of the map
const OUTLET = { lat: 50.6759, lon: 13.1168 }
const START = { center: [OUTLET.lat, OUTLET.lon], zoom: 12 }

// "Find a retailer": text and place search on the left, the map card with the factory outlet on the right.
export default function LandingDealers() {
  const { t, i18n } = useTranslation()
  const [query, setQuery] = useState('')
  const [target, setTarget] = useState(null)
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'notFound' | 'error'
  const { hash } = useLocation()

  // Arriving from "Find a retailer" on another page (/#haendler): scroll down here once the page has settled
  useEffect(() => {
    if (hash !== '#haendler') return undefined
    const timer = setTimeout(() => document.getElementById('haendler')?.scrollIntoView({ behavior: 'smooth' }), 150)
    return () => clearTimeout(timer)
  }, [hash])

  const onSubmit = async (event) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed || status === 'loading') return

    setStatus('loading')
    try {
      const place = await findPlace(trimmed, i18n.resolvedLanguage)
      if (place) setTarget(place)
      setStatus(place ? 'idle' : 'notFound')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="haendler" className="lp-section relative isolate overflow-hidden bg-ihle-mist">
      <div className="lp-container grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal className="min-w-0">
          <p className="lp-label">{t('landing.dealers.label')}</p>
          <h2 className="lp-title mt-5 max-w-[37rem]">
            {t('home.dealers.titleLine1')} {t('home.dealers.titleHighlight')} {t('home.dealers.titleRest')}
          </h2>
          <p className="mt-5 max-w-[34rem] text-base leading-[1.65]">{t('landing.dealers.text')}</p>

          <form role="search" onSubmit={onSubmit} className="lp-search mt-8 max-w-[33rem]">
            <MapPin aria-hidden="true" size={18} strokeWidth={1.75} className="ml-3.5 shrink-0 text-ihle-blue" />
            <input
              type="search"
              value={query}
              placeholder={t('home.dealers.placeholder')}
              aria-label={t('home.dealers.placeholder')}
              autoComplete="postal-code"
              enterKeyHint="search"
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="submit" className="lp-btn lp-btn--yellow min-h-11 px-5 sm:px-7" disabled={status === 'loading'}>
              {t('home.dealers.button')}
            </button>
          </form>

          {/* Result messages (also announced to screen readers) */}
          <p aria-live="polite" className="mt-2 min-h-5 pl-5 text-sm text-[#b64558]">
            {status === 'notFound' && t('home.dealers.notFound')}
            {status === 'error' && t('home.dealers.error')}
          </p>
        </Reveal>

        <Reveal delay={0.1} className="min-w-0 overflow-hidden rounded-[1.25rem] bg-white shadow-[0_20px_50px_rgb(22_53_91/0.1)]">
          <div className="aspect-[4/3.4] sm:aspect-[588/420]">
            <Suspense fallback={<Skeleton className="size-full rounded-none" />}>
              <DealerMap
                target={target}
                label={t('home.dealers.mapLabel')}
                start={START}
                outlet={{
                  ...OUTLET,
                  name: t('landing.dealers.outlet'),
                  lines: ['Reuterweg 1 · 09429 Wolkenstein', t('footer.addressArea'), t('landing.footer.outlet')],
                  routeLabel: t('landing.dealers.route'),
                }}
                locateLabel={t('landing.dealers.locate')}
                locateError={t('landing.dealers.locateError')}
              />
            </Suspense>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
