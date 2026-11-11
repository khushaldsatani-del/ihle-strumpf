import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

const rise = (delay) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
})

// Material page hero: the grey Ihle fabric behind, the title and one button on the left, the yarn photo in an arch
// on the right.
export default function MaterialHero() {
  const { t } = useTranslation()

  return (
    <section className="relative isolate overflow-hidden bg-ihle-mist">
      <img
        src="/images/landing/fond-2400.webp"
        srcSet="/images/landing/fond-1200.webp 1200w, /images/landing/fond-2400.webp 2400w"
        sizes="100vw"
        alt=""
        width="2400"
        height="1059"
        className="absolute inset-0 -z-10 size-full object-cover object-[80%_50%] lg:object-right"
      />

      <div className="lp-container grid items-center gap-14 py-14 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-16 lg:py-24">
        <div className="min-w-0">
          <motion.h1 className="type-display max-w-[36rem]" {...rise(0)}>
            {t('material.hero.titleLine1')} {t('material.hero.titleLine2')}
          </motion.h1>
          <motion.div className="mt-8" {...rise(0.12)}>
            <Link to="/products" className="btn-primary">
              {t('material.hero.cta')}
              <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
            </Link>
          </motion.div>

        </div>

        {/* Yarn photo in an arch, with a soft circle behind it */}
        <div className="relative mx-auto w-full max-w-[24rem] lg:max-w-none">
          <span aria-hidden="true" className="absolute -left-[12%] top-[8%] aspect-square w-[70%] rounded-full bg-[#b9c2ce] blur-[56px]" />
          <motion.div
            className="lp-arch relative aspect-[1145/1373] w-full"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <img
              src="/images/material/yarn-textiles.webp"
              alt={t('material.hero.imageAlt')}
              width="1145"
              height="1373"
              fetchPriority="high"
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
