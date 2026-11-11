import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import Reveal from '../components/landing/Reveal.jsx'
import LandingSockShapes from '../components/landing/LandingSockShapes.jsx'
import CuffTypes from '../components/material/CuffTypes.jsx'
import KnitTypes from '../components/material/KnitTypes.jsx'
import MaterialHero from '../components/material/MaterialHero.jsx'
import MaterialFibres from '../components/material/MaterialFibres.jsx'
import MaterialIntro from '../components/material/MaterialIntro.jsx'

// Last section: on the grey Ihle fabric ("Fond"), the way to the products or to a retailer
function MaterialClosing() {
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
        loading="lazy"
        className="absolute inset-0 -z-10 size-full object-cover object-right"
      />
      <Reveal className="lp-container py-20 lg:py-28">
        <h2 className="type-section-title max-w-[32rem]">{t('material.closing.title')}</h2>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/products" className="btn-primary">
            {t('home.hero.cta')}
            <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
          </Link>
          <Link to="/#haendler" className="btn-secondary">
            {t('landing.hero.findDealer')}
          </Link>
        </div>
      </Reveal>
    </section>
  )
}

// Material page in the Ihle design: hero, "Our materials", the five yarns (catalogue), knit types, cuffs, the sock shapes (moved here from
// the home page) and a closing call to action.
export default function Material() {
  return (
    <div className="lp">
      <MaterialHero />
      <MaterialIntro />
      <MaterialFibres />
      <KnitTypes />
      <CuffTypes />
      <LandingSockShapes />
      <MaterialClosing />
    </div>
  )
}
