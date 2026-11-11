import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

// Ihle's own product photos (images/hero/slides/<key>-1000|2000.webp), in the order they are shown.
// focus = which part of the photo stays visible when the frame crops it.
const SLIDES = [
  { key: 'diabetic', focus: '62% 75%' },
  { key: 'stump-red', focus: '50% 50%' },
  { key: 'leg-sleeve', focus: '48% 55%' },
  { key: 'sock-on', focus: '50% 50%' },
  { key: 'thigh', focus: '40% 60%' },
  { key: 'brace', focus: '50% 30%' },
  { key: 'stump-fit', focus: '45% 45%' },
  { key: 'arm', focus: '45% 50%' },
]

const SECONDS = 4 // per photo

// Landing page hero, edge to edge: on the left an Ihle-blue panel with only the claim and one button, on the right
// the photos large, changing every few seconds. The new photo fades in on top of the old one, which stays fully
// visible underneath until it is covered, so the change never flashes. Along the bottom of the photo a thin bar
// per photo fills up (like a story), with the counter and what the photo shows; a bar jumps to its photo.
export default function LandingHero() {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  // the photo on top and the one it is covering
  const [{ active, previous }, setSlides] = useState({ active: 0, previous: null })
  const show = (index) => setSlides((current) => (index === current.active ? current : { active: index, previous: current.active }))

  // next photo after SECONDS (restarts when someone picks a photo)
  useEffect(() => {
    const timer = setTimeout(() => show((active + 1) % SLIDES.length), SECONDS * 1000)
    return () => clearTimeout(timer)
  }, [active])

  return (
    <section className="relative grid bg-ihle-blue lg:h-[clamp(34rem,calc(100svh-7.5rem),46rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* Photos */}
      <div className="relative aspect-[4/3] overflow-hidden bg-white sm:aspect-[16/10] lg:order-2 lg:aspect-auto">
        {SLIDES.map(({ key, focus }, index) => (
          <img
            key={key}
            src={`/images/hero/slides/${key}-2000.webp`}
            srcSet={`/images/hero/slides/${key}-1000.webp 1000w, /images/hero/slides/${key}-2000.webp 2000w`}
            sizes="(min-width: 1024px) 60vw, 100vw"
            alt={index === active ? t(`landing.hero.slides.${key}`) : ''}
            aria-hidden={index === active ? undefined : true}
            width="2000"
            height="1333"
            // all photos load right away (small files), so a photo is ready before it is shown
            fetchPriority={index === 0 ? 'high' : 'low'}
            decoding="async"
            style={{ objectPosition: focus }}
            className={`absolute inset-0 size-full object-cover ${
              index === active
                ? `z-20 opacity-100 transition-opacity ease-in-out ${reduceMotion ? 'duration-300' : 'duration-[1200ms]'}`
                : index === previous
                  ? 'z-10 opacity-100'
                  : 'z-0 opacity-0'
            }`}
          />
        ))}

        {/* bottom: counter, what the photo shows, and one bar per photo */}
        <div className="absolute inset-x-0 bottom-0 z-30 bg-linear-to-t from-ihle-blue/55 to-transparent px-5 pb-4 pt-14 text-white sm:px-8 sm:pb-6">
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <p className="font-medium" aria-live="polite">
              {t(`landing.hero.slides.${SLIDES[active].key}`)}
            </p>
            <p className="shrink-0 tabular-nums text-white/80">
              {String(active + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
            </p>
          </div>
          <div className="mt-3 flex gap-1.5">
            {SLIDES.map(({ key }, index) => (
              <button
                key={key}
                type="button"
                aria-label={t('landing.hero.showPhoto', { number: index + 1, total: SLIDES.length })}
                aria-current={index === active || undefined}
                onClick={() => show(index)}
                className="flex h-5 flex-1 items-center"
              >
                <span className="block h-[3px] w-full overflow-hidden rounded-full bg-white/35">
                  <span
                    key={index === active ? `run-${active}` : 'idle'}
                    className="block h-full rounded-full bg-white"
                    style={
                      index === active
                        ? { animation: `hero-progress ${SECONDS}s linear forwards` }
                        : { width: index < active ? '100%' : '0%' }
                    }
                  />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Claim and button on Ihle blue; on desktop it lines up with the page content on the left */}
      <div className="flex items-center px-6 py-12 sm:px-10 lg:order-1 lg:py-16 lg:pl-[max(var(--lp-gutter),calc((100vw-77.5rem)/2))] lg:pr-12">
        <div>
          <motion.h1
            className="type-display text-white! lg:text-[clamp(3rem,1.2rem+2.6vw,4.25rem)]"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {t('landing.hero.title')}
          </motion.h1>
          <motion.span
            aria-hidden="true"
            className="mt-7 block h-[3px] w-16 rounded-full bg-ihle-primary"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ originX: 0 }}
          />
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <Link to="/products" className="lp-btn lp-btn--yellow">
              {t('home.hero.cta')}
              <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
