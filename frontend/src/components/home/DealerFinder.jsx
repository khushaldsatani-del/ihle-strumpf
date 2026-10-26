import { lazy, Suspense, useState } from 'react'
import { MapPin, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '../common/Loading.jsx'
import RollText from '../common/RollText.jsx'

// The map library is large and the map sits at the bottom of the home page, so it loads separately
const DealerMap = lazy(() => import('./DealerMap.jsx'))

const GEOCODER = 'https://nominatim.openstreetmap.org/search'

// Looks up a postcode or place name with the OpenStreetMap geocoder. Returns { lat, lon, label } or null.
async function findPlace(query, language) {
  const params = new URLSearchParams({ q: query, format: 'jsonv2', limit: '1', 'accept-language': language })
  // A bare 5-digit number is treated as a German postcode
  if (/^\d{5}$/.test(query)) params.set('countrycodes', 'de')

  const response = await fetch(`${GEOCODER}?${params}`)
  if (!response.ok) throw new Error(`Geocoder answered ${response.status}`)
  const [place] = await response.json()
  return place ? { lat: Number(place.lat), lon: Number(place.lon), label: place.display_name } : null
}

// Home "Find a retailer": text and place search on the left, a real map on the right.
export default function DealerFinder() {
  const { t, i18n } = useTranslation()
  const [query, setQuery] = useState('')
  const [target, setTarget] = useState(null)
  const [status, setStatus] = useState('idle') // 'idle' | 'loading' | 'notFound' | 'error'

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
    <section className="bg-white">
      <div className="mx-auto grid max-w-[96rem] grid-cols-[minmax(0,1fr)] items-center gap-8 px-4 pb-14 sm:px-8 sm:pb-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16 lg:px-16">
        <div className="min-w-0 lg:max-w-xl">
          {/* centred on phones, left-aligned from tablet width up */}
          <h2 className="text-center text-[2rem] font-bold leading-tight tracking-tight text-heading sm:text-[2.625rem] md:text-left">
            <span className="block">{t('home.dealers.titleLine1')}</span>
            <span className="block">
              <span className="text-[#5a2d0c]">{t('home.dealers.titleHighlight')}</span> {t('home.dealers.titleRest')}
            </span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-body">{t('home.dealers.text')}</p>

          <form role="search" onSubmit={onSubmit} className="dealer-search mt-6">
            <MapPin aria-hidden="true" size={18} strokeWidth={1.75} className="ml-4 shrink-0 text-[#6b5a50]" />
            <input
              type="search"
              value={query}
              placeholder={t('home.dealers.placeholder')}
              aria-label={t('home.dealers.placeholder')}
              autoComplete="postal-code"
              enterKeyHint="search"
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="submit" disabled={status === 'loading'}>
              <Search aria-hidden="true" size={16} strokeWidth={2.25} className="shrink-0" />
              <RollText>{t('home.dealers.button')}</RollText>
            </button>
          </form>

          {/* Result messages (also announced to screen readers) */}
          <p aria-live="polite" className="mt-2 min-h-5 pl-4 text-sm text-[#8a3b12]">
            {status === 'notFound' && t('home.dealers.notFound')}
            {status === 'error' && t('home.dealers.error')}
          </p>
        </div>

        <div className="aspect-[4/3] min-w-0 overflow-hidden rounded-3xl bg-[#f1ede4] lg:aspect-[405/320] lg:rounded-[2rem]">
          <Suspense fallback={<Skeleton className="size-full rounded-none" />}>
            <DealerMap target={target} label={t('home.dealers.mapLabel')} />
          </Suspense>
        </div>
      </div>
    </section>
  )
}
