import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

// Highlighted products. Names and descriptions are in the translation files (home.highlights.items.<id>).
// Placeholder data until the products come from the backend.
const ITEMS = [
  { id: '40012_053', to: '/products' },
  { id: '40012_058', to: '/products' },
  { id: '40013_001', to: '/products' },
  { id: '40015_013', to: '/products' },
  { id: '40012_004', to: '/products' },
  { id: '40011_021', to: '/products' },
  { id: '40002_059', to: '/products' },
  { id: '40002_053', to: '/products' },
]
const COUNT = ITEMS.length

// The list is rendered three times in a row so the carousel can go round endlessly in both directions
const LOOP = [...ITEMS, ...ITEMS, ...ITEMS]

// Length of the slide (keep in sync with .highlight-track in global.css)
const MOVE_MS = 750
const DESKTOP = '(min-width: 1024px)'

// Home "Highlights": a minimal product carousel with picture, name and short description (no prices).
export default function Highlights() {
  const { t } = useTranslation()
  const [position, setPosition] = useState(COUNT) // index of the first visible card inside LOOP
  const [jumping, setJumping] = useState(false) // true while the row is re-centred without animation
  const [perView, setPerView] = useState(() => (window.matchMedia(DESKTOP).matches ? 4 : 2))
  const settleTimer = useRef(0)

  // Cards per view follow the layout: 4 on desktop, 2 below
  useEffect(() => {
    const query = window.matchMedia(DESKTOP)
    const update = () => setPerView(query.matches ? 4 : 2)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => () => clearTimeout(settleTimer.current), [])

  // Slide by one card. Clicks during a slide simply extend it, so quick clicking stays fluid.
  const step = (direction) => {
    setJumping(false)
    setPosition((current) => Math.min(Math.max(current + direction, 1), LOOP.length - perView - 1))

    // Once the row has come to rest, move back to the middle copy of the list
    // (the same cards are on screen there, so the jump is invisible)
    clearTimeout(settleTimer.current)
    settleTimer.current = setTimeout(() => {
      setJumping(true)
      setPosition((current) => (((current % COUNT) + COUNT) % COUNT) + COUNT)
    }, MOVE_MS + 60)
  }

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[96rem] px-4 pb-14 pt-6 sm:px-8 sm:pb-20 lg:px-16">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[2rem] font-bold tracking-tight text-heading sm:text-[2.625rem]">{t('home.highlights.title')}</h2>

          {/* The cards travel in the direction of the arrow: > moves them left to right, < right to left */}
          <div className="flex shrink-0 gap-2">
            <button type="button" className="highlight-arrow" aria-label={t('home.highlights.previous')} onClick={() => step(1)}>
              <ChevronLeft aria-hidden="true" size={22} strokeWidth={2} />
            </button>
            <button type="button" className="highlight-arrow" aria-label={t('home.highlights.next')} onClick={() => step(-1)}>
              <ChevronRight aria-hidden="true" size={22} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-hidden sm:mt-8">
          <ul
            className="highlight-track"
            data-jumping={jumping || undefined}
            style={{ '--position': position }}
          >
            {LOOP.map(({ id, to }, index) => {
              const visible = index >= position && index < position + perView

              return (
                // Cards outside the view are inert, so they are skipped by the keyboard and screen readers
                <li key={`${id}-${index}`} className="highlight-slide" inert={!visible}>
                  <Link to={to} className="highlight-card group block">
                    <div className="aspect-square overflow-hidden bg-white">
                      {/* The photos are cut-outs with a transparent background, so they sit directly on the white section */}
                      <img
                        src={`/images/highlights/${id}.webp`}
                        alt=""
                        width="900"
                        height="900"
                        className="size-full object-contain"
                      />
                    </div>
                    <h3 className="mt-3 pr-3 text-base font-bold text-heading sm:text-lg">
                      {t(`home.highlights.items.${id}.name`)}
                    </h3>
                    <p className="mt-1 pr-3 text-sm text-body sm:text-base">
                      {t(`home.highlights.items.${id}.description`)}
                    </p>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
