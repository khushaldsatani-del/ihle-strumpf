import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import RollText from '../common/RollText.jsx'

const EASE = [0.22, 1, 0.36, 1]

// Text comes in line by line; the picture rises a little later
const text = { hidden: {}, visible: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } } }
const line = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }

/**
 * First section of the material page: one cream panel, edge to edge, in the colours of the landing page.
 * Left: label, headline, a short text and a button. Right: the yarn picture in an arch,
 * with a soft sage circle behind it and a thin outline of the arch set off to the side.
 */
export default function MaterialHero() {
  const { t } = useTranslation()

  return (
    // Starts directly below the navbar, with no gap
    <section>
      <div className="material-hero">
        <div className="material-hero__inner">
          <motion.div variants={text} initial="hidden" animate="visible" className="material-hero__text">
            <motion.p variants={line} className="flex items-center gap-4 text-xs font-bold uppercase tracking-[0.2em] text-clay">
              <span aria-hidden="true" className="h-px w-10 bg-clay/60" />
              {t('material.hero.eyebrow')}
            </motion.p>
            <motion.h1 variants={line} className="material-hero__title mt-6">
              <span className="block text-heading">{t('material.hero.titleLine1')}</span>
              <span className="block text-clay">{t('material.hero.titleLine2')}</span>
            </motion.h1>
            <motion.p variants={line} className="mt-6 max-w-md text-base leading-relaxed text-body">
              {t('material.hero.text')}
            </motion.p>
            <motion.div variants={line}>
              <Link to="/products" className="material-hero__btn group mt-8">
                <RollText>{t('material.hero.cta')}</RollText>
                <ArrowRight aria-hidden="true" size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Arch picture with its decoration (below the text on phones, beside it from tablet width up) */}
          <motion.div
            className="material-hero__picture"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.3 }}
          >
            <span aria-hidden="true" className="material-hero__sun" />
            <span aria-hidden="true" className="material-hero__outline" />
            <div className="material-hero__frame">
              <img src="/images/material/yarn-textiles.webp" alt={t('material.hero.imageAlt')} width="1145" height="1373" fetchPriority="high" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
