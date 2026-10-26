import { useTranslation } from 'react-i18next'
import KnitTypes from '../components/material/KnitTypes.jsx'
import MaterialHero from '../components/material/MaterialHero.jsx'
import MaterialIntro from '../components/material/MaterialIntro.jsx'

// Material page: hero, "Our materials", the knit types, then a temporary section (to be replaced).
export default function Material() {
  const { t } = useTranslation()

  return (
    <>
      <MaterialHero />
      <MaterialIntro />
      <KnitTypes />

      {/* TEMPORARY section: placeholder for the next part of the page */}
      <section className="flex min-h-[70vh] flex-col items-center justify-center gap-3 bg-white px-6 py-24 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-clay">{t('material.next.eyebrow')}</p>
        <h2 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl">{t('material.next.title')}</h2>
        <p className="max-w-md text-body">{t('material.next.text')}</p>
      </section>
    </>
  )
}
