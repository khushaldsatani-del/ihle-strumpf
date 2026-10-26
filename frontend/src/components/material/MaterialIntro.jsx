import { motion } from 'motion/react'
import { Infinity as InfinityIcon, Leaf, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const EASE = [0.22, 1, 0.36, 1]

// Three wavy vertical lines (warmth / comfort), drawn to match the line icons next to it
function WavesIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {[6, 12, 18].map((x) => (
        <path key={x} d={`M${x} 3c-2 3 2 6 0 9s2 6 0 9`} />
      ))}
    </svg>
  )
}

// The four qualities; texts: material.intro.features.<key>.
// tint = accent of the card, taken from the landing page: sage green, footer teal, beige, brand navy
const FEATURES = [
  { key: 'fibres', icon: Leaf, tint: 'var(--color-moss)' },
  { key: 'quality', icon: Shield, tint: 'var(--color-teal)' },
  { key: 'comfort', icon: WavesIcon, tint: '#c9a27a' },
  { key: 'durable', icon: InfinityIcon, tint: 'var(--color-brand)' },
]

// The fibres named in the row of tags; texts: material.intro.fibres.<key>
const FIBRES = ['cotton', 'wool', 'polyamide', 'elastane', 'silver']

// Cards rise in one after another when the section scrolls into view
const cards = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }
const card = { hidden: { opacity: 0, y: 28 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }

/**
 * Second section of the material page: "Our materials". No picture, the typography carries it.
 * Top: label and a large headline on the left, the lead text and the fibres as tags on the right.
 * Below: four numbered cards, one per quality, each with an accent colour that the landing page also uses.
 */
export default function MaterialIntro() {
  const { t } = useTranslation()

  return (
    <section className="material-intro">
      <div className="mx-auto max-w-[96rem] px-5 py-16 sm:px-8 lg:px-16 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <p className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.2em] text-clay">
              <span aria-hidden="true" className="h-px w-10 bg-clay/60" />
              {t('material.intro.eyebrow')}
            </p>
            <h2 className="material-intro__title mt-7">
              <span className="block">{t('material.intro.titleLine1')}</span>
              <span className="block text-moss">{t('material.intro.titleLine2')}</span>
            </h2>
          </div>

          <div className="lg:col-span-5 lg:col-start-8 lg:pt-12">
            <p className="text-base leading-relaxed text-body">{t('material.intro.text')}</p>

            <p className="mt-9 text-xs font-bold uppercase tracking-[0.2em] text-clay/80">{t('material.intro.fibresLabel')}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {FIBRES.map((key) => (
                <li key={key} className="material-intro__tag">
                  {t(`material.intro.fibres.${key}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <motion.ol
          variants={cards}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          className="material-intro__cards"
        >
          {FEATURES.map(({ key, icon: Icon, tint }, index) => (
            <motion.li key={key} variants={card} className="material-card" style={{ '--tint': tint }}>
              <div className="flex items-start justify-between">
                <span className="material-card__icon">
                  <Icon aria-hidden="true" className="size-6" strokeWidth={1.6} />
                </span>
                <span aria-hidden="true" className="material-card__number">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="mt-8 text-lg font-bold leading-snug text-heading">{t(`material.intro.features.${key}.title`)}</h3>
              <p className="mt-3 text-sm leading-relaxed text-body">{t(`material.intro.features.${key}.text`)}</p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  )
}
