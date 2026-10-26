import { useEffect, useId, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { useTranslation } from 'react-i18next'
import CuffTypes from './CuffTypes.jsx'

const EASE = [0.22, 1, 0.36, 1]

// Gauge scale shown under the intro text: ihle knits from 6 to 36 stitches per inch
const GAUGE = { min: 6, max: 36, marks: [14, 22] } // 14 = classic, 22 = extra fine
const position = (value) => `${((value - GAUGE.min) / (GAUGE.max - GAUGE.min)) * 100}%`

// The four knit types. Texts: material.knit.types.<key>.
// swatch: 'stitch' (rows of V-shaped stitches, cell = size of one stitch), 'loop' (terry loops) or 'half' (both)
// The samples are drawn in warm yarn tones (beige to caramel)
const PLUSH = '#a87f5e' // colour of the padded (terry) areas
const TYPES = [
  { key: 'smooth', swatch: 'stitch', cell: 18, background: '#c9a583' },
  { key: 'fine', swatch: 'stitch', cell: 10, background: '#dcc5ad' },
  { key: 'plush', swatch: 'loop', cell: 13, background: PLUSH },
  { key: 'semi', swatch: 'half', cell: 18, background: '#c9a583' },
]

// Drawn knit sample: a strip filled with a repeating stitch pattern
function Swatch({ swatch, cell, background }) {
  const id = useId()
  const stroke = 'rgb(255 255 255 / 0.6)'

  return (
    <svg aria-hidden="true" className="knit-swatch" preserveAspectRatio="xMidYMid slice" viewBox="0 0 320 120">
      <defs>
        {/* one knit stitch: a "V"; stacked rows give the typical knit look */}
        <pattern id={`${id}-stitch`} width={cell} height={cell} patternUnits="userSpaceOnUse">
          <path
            d={`M0 ${cell * 0.08} L${cell / 2} ${cell * 0.9} L${cell} ${cell * 0.08}`}
            fill="none"
            stroke={stroke}
            strokeWidth={cell * 0.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </pattern>
        {/* terry loops of the plush side */}
        <pattern id={`${id}-loop`} width="13" height="13" patternUnits="userSpaceOnUse">
          <circle cx="6.5" cy="6.5" r="4.2" fill="none" stroke="rgb(255 255 255 / 0.45)" strokeWidth="2" />
        </pattern>
      </defs>

      <rect width="320" height="120" fill={background} />
      {swatch === 'half' ? (
        <>
          <rect width="150" height="120" fill={PLUSH} />
          <rect width="150" height="120" fill={`url(#${id}-loop)`} />
          <rect x="150" width="170" height="120" fill={`url(#${id}-stitch)`} />
        </>
      ) : (
        <rect width="320" height="120" fill={`url(#${id}-${swatch === 'loop' ? 'loop' : 'stitch'})`} />
      )}
    </svg>
  )
}

// Cards rise in one after another when they scroll into view
const cards = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }
const card = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }

const DRIFT = 0.18 // share of the scroll distance by which the panel itself moves (the "slow" movement)
const MAX_DRIFT = 56 // px; the panel never drifts further than this, however long the content is

/**
 * Material page: "Gestrick" (the knit), shown inside one rounded brown panel (#633320), with white cards.
 * Scroll effect: while the page scrolls past, the panel stays in view and only drifts up slowly,
 * and the content scrolls inside it. When the content has reached its end, the page moves on.
 * How it works: the section is taller than the panel by the hidden part of the content; the panel is
 * sticky, and the content is shifted up by the distance scrolled so far (no inner scrollbar).
 */
export default function KnitTypes() {
  const { t } = useTranslation()
  const trackRef = useRef(null)
  const panelRef = useRef(null)
  const contentRef = useRef(null)
  const [hidden, setHidden] = useState(0) // px of content that does not fit into the panel

  // Measure how much of the content is hidden; again whenever sizes change
  useEffect(() => {
    const measure = () => {
      // the observer can still fire once while the page is being left
      if (!contentRef.current || !panelRef.current) return
      setHidden(Math.max(0, contentRef.current.offsetHeight - panelRef.current.clientHeight))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(contentRef.current)
    observer.observe(panelRef.current)
    return () => observer.disconnect()
  }, [])

  // Distance scrolled since the panel became sticky, from 0 to "hidden"
  const { scrollY } = useScroll()
  const scrolled = useTransform(scrollY, () => {
    const track = trackRef.current
    const panel = panelRef.current
    if (!track || !panel) return 0
    const stickyTop = parseFloat(getComputedStyle(panel).top) || 0
    return Math.min(Math.max(stickyTop - track.getBoundingClientRect().top, 0), hidden)
  })
  const contentY = useTransform(scrolled, (value) => -value)
  const panelY = useTransform(scrolled, (value) => -Math.min(value * DRIFT, MAX_DRIFT))

  return (
    <section className="bg-white px-3 py-6 sm:px-4 lg:px-6 lg:py-10">
      {/* the extra height is the scroll distance during which the panel stays in view */}
      <div ref={trackRef} className="knit-track mx-auto max-w-[96rem]" style={{ '--hidden': `${hidden}px` }}>
        <motion.div ref={panelRef} className="knit-panel" style={{ y: panelY }}>
          <motion.div ref={contentRef} style={{ y: contentY }} className="px-5 py-12 sm:px-8 lg:px-14 lg:py-16">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
              <div className="lg:col-span-5">
                <p className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.2em] text-panel-ink">
                  <span aria-hidden="true" className="h-px w-10 bg-panel-ink/50" />
                  {t('material.knit.eyebrow')}
                </p>
                <h2 className="material-intro__title material-intro__title--large mt-7 text-white">
                  <span className="block">{t('material.knit.titleLine1')}</span>
                  <span className="block text-panel-accent">{t('material.knit.titleLine2')}</span>
                </h2>
              </div>

              <div className="lg:col-span-6 lg:col-start-7 lg:pt-12">
                <p className="text-base leading-relaxed text-panel-ink">{t('material.knit.text')}</p>

                {/* Gauge scale */}
                <div className="knit-gauge mt-10" role="img" aria-label={t('material.knit.gaugeLabel')}>
                  <div className="knit-gauge__track">
                    {GAUGE.marks.map((value) => (
                      <span key={value} className="knit-gauge__mark" style={{ left: position(value) }}>
                        <span className="knit-gauge__value">{value}</span>
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-between text-sm font-bold text-panel-ink">
                    <span>{GAUGE.min}</span>
                    <span className="font-medium">{t('material.knit.gaugeUnit')}</span>
                    <span>{GAUGE.max}</span>
                  </div>
                </div>
              </div>
            </div>

            <motion.ul
              variants={cards}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              className="material-intro__cards"
            >
              {TYPES.map(({ key, ...swatch }) => (
                <motion.li key={key} variants={card} className="knit-card">
                  <div className="knit-card__sample">
                    <Swatch {...swatch} />
                  </div>
                  <div className="p-6 lg:p-7">
                    <p className="knit-card__tag">{t(`material.knit.types.${key}.tag`)}</p>
                    <h3 className="mt-4 text-lg font-bold text-heading">{t(`material.knit.types.${key}.title`)}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-body">{t(`material.knit.types.${key}.text`)}</p>
                  </div>
                </motion.li>
              ))}
            </motion.ul>

            {/* Second part inside the same panel: the cuffs */}
            <CuffTypes />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
