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

const FADE = 0.7 // seconds: photo and caption fade in together

// Landing page hero, edge to edge: on the left an Ihle-blue panel with only the claim and one button, centred in
// the panel and sized to it (it can never run under the photo); on the right the photos large, changing every few
// seconds. The new photo fades in on top of the old one, which stays fully visible underneath, so the change never
// flashes; the caption and counter fade in with it, so they always belong to the photo you see. Along the bottom
// of the photo a thin bar per photo fills up (like a story); a bar jumps to its photo.
export default function LandingHero() {
  const { t, i18n } = useTranslation()
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
    <section className="relative grid bg-ihle-blue lg:h-[clamp(30rem,calc(100svh-11rem),46rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
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
                ? `z-20 opacity-100 transition-opacity ease-in-out ${reduceMotion ? 'duration-300' : 'duration-700'}`
                : index === previous
                  ? 'z-10 opacity-100'
                  : 'z-0 opacity-0'
            }`}
          />
        ))}

        {/* bottom: counter, what the photo shows, and one bar per photo */}
        {/* a darker band at the bottom, so the white caption stays readable on Ihle's white photos */}
        <div className="absolute inset-x-0 bottom-0 z-30 bg-linear-to-t from-ihle-blue/85 via-ihle-blue/45 to-transparent px-5 pb-4 pt-16 text-white sm:px-8 sm:pb-6">
          <motion.div
            key={active}
            className="flex items-baseline justify-between gap-4 text-sm sm:text-[0.9375rem]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduceMotion ? 0.3 : FADE }}
          >
            <p className="font-medium [text-shadow:0_1px_8px_rgb(22_53_91/0.6)]" aria-live="polite">
              {t(`landing.hero.slides.${SLIDES[active].key}`)}
            </p>
            <p className="shrink-0 tabular-nums text-white/90">
              {String(active + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
            </p>
          </motion.div>
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
                <span className="block h-[3px] w-full overflow-hidden rounded-full bg-white/45">
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

      {/* Claim and button on Ihle blue. @container: the claim is sized to the panel's width (cqw), so the long word
          "Funktionsgestricke." always fits, on any screen, and it grows and shrinks with the panel. */}
      <div className="@container flex min-w-0 items-center justify-center px-[8%] py-12 sm:py-16 lg:order-1 lg:justify-start lg:py-12 lg:pl-[max(var(--lp-gutter),calc((100vw-77.5rem)/2))] lg:pr-[3rem]">
        {/* phones and tablets: centred lines; desktop: left-aligned, starting exactly under the first menu link, in
            every language (the panel's left padding is the page column's edge) */}
        <div className="flex min-w-0 max-w-full flex-col items-center text-center lg:items-start lg:text-left">
          <motion.h1
            lang={i18n.resolvedLanguage}
            className="type-display text-[clamp(1.75rem,9cqw,3.5rem)] text-white! hyphens-auto lg:text-[11cqw]"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* one word per line: "Nahtlose / medizinische / Funktionsgestricke." */}
            {t('landing.hero.title')
              .split(' ')
              .map((word, index) => (
                <span key={index} className="block">
                  {word}
                </span>
              ))}
          </motion.h1>
          <motion.span
            aria-hidden="true"
            className="mt-7 block h-[3px] w-16 rounded-full bg-ihle-primary"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ originX: 0.5 }}
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
