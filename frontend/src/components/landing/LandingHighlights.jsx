import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Reveal from './Reveal.jsx'

// The highlighted articles: photo in /images/highlights/<id>.webp, name and text in home.highlights.items.<id>
const IDS = ['40012_053', '40012_058', '40013_001', '40015_013', '40012_004', '40011_021', '40002_059', '40002_053']

// "Highlights": a row of product cards that scrolls sideways (swipe, trackpad or the arrow buttons),
// with a thin progress line showing where in the row you are.
export default function LandingHighlights() {
  const { t } = useTranslation()
  const trackRef = useRef(null)
  const targetRef = useRef(null) // card index the arrows are scrolling to, so quick clicks add up
  const [view, setView] = useState({ start: 0, size: 1, atStart: true, atEnd: false })

  // Width of one card plus the gap (1.5rem)
  const stepWidth = () => (trackRef.current?.querySelector('li')?.offsetWidth ?? 0) + 24

  const measure = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const max = track.scrollWidth - track.clientWidth
    if (targetRef.current !== null && Math.abs(track.scrollLeft - Math.min(targetRef.current * stepWidth(), max)) < 2) {
      targetRef.current = null
    }
    setView({
      start: track.scrollLeft / track.scrollWidth,
      size: track.clientWidth / track.scrollWidth,
      atStart: track.scrollLeft <= 2,
      atEnd: track.scrollLeft >= max - 2,
    })
  }, [])

  useEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure])

  // One card further; a click during the slide continues from where the slide is heading
  const step = (direction) => {
    const track = trackRef.current
    const width = stepWidth()
    if (!track || width <= 24) return
    const lastIndex = Math.ceil((track.scrollWidth - track.clientWidth) / width)
    const from = targetRef.current ?? Math.round(track.scrollLeft / width)
    const next = Math.min(Math.max(from + direction, 0), lastIndex)
    targetRef.current = next
    track.scrollTo({ left: next * width, behavior: 'smooth' })
  }

  return (
    <section className="lp-section bg-white">
      <div className="lp-container">
        <Reveal>
          <p className="lp-label">{t('landing.highlights.label')}</p>
          <h2 className="lp-title mt-5">{t('home.highlights.title')}</h2>
        </Reveal>

        <ul
          ref={trackRef}
          className="lp-slider mt-10"
          onScroll={measure}
          aria-label={t('home.highlights.title')}
        >
          {IDS.map((id) => (
            <li key={id}>
              <Link to="/products" className="lp-product group block">
                <div className="lp-tile aspect-square">
                  <img
                    src={`/images/highlights/${id}.webp`}
                    alt=""
                    width="900"
                    height="900"
                    loading="lazy"
                    className="size-full object-contain p-5"
                  />
                </div>
                <div className="mt-4 flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-medium not-italic leading-snug">{t(`home.highlights.items.${id}.name`)}</h3>
                    <p className="mt-1.5 text-sm leading-normal">{t(`home.highlights.items.${id}.description`)}</p>
                  </div>
                  <span className="lp-round lp-card-arrow size-10" aria-hidden="true">
                    <ArrowRight size={17} strokeWidth={1.75} />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex items-center gap-6">
          <div aria-hidden="true" className="relative h-px flex-1 bg-ihle-blue/15">
            <span
              className="absolute -top-px h-[3px] rounded-full bg-ihle-blue transition-[left,width] duration-300"
              style={{ left: `${view.start * 100}%`, width: `${view.size * 100}%` }}
            />
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              className="lp-round size-13 shadow-[inset_0_0_0_1px_rgb(22_53_91/0.18)] hover:bg-ihle-mist disabled:opacity-40"
              aria-label={t('home.highlights.previous')}
              disabled={view.atStart}
              onClick={() => step(-1)}
            >
              <ArrowLeft size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="lp-round size-13 bg-ihle-primary text-white hover:bg-ihle-primary-dark disabled:opacity-40"
              aria-label={t('home.highlights.next')}
              disabled={view.atEnd}
              onClick={() => step(1)}
            >
              <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
