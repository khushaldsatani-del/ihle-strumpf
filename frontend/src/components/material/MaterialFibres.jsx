import { useTranslation } from 'react-i18next'
import BrandText from '../landing/BrandText.jsx'
import Reveal from '../landing/Reveal.jsx'

// The five materials from the ihle® catalogue (texts: material.fibres.items.<key>), each with a photo of a knitted
// swatch in that yarn (images/material/fibre-<key>.webp, background removed)
const FIBRES = ['cotton', 'wool', 'silver', 'sensico', 'synthetic']

// "Materials": the catalogue's question and claim on the left, its text on the right; then one card per material
// with a knitted swatch, the name and what it is good for.
export default function MaterialFibres() {
  const { t } = useTranslation()

  return (
    <section className="lp-section bg-[#f8eef0]">
      <div className="lp-container">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <h2 className="type-section-title">{t('material.fibres.title')}</h2>
            <p className="type-subtitle mt-5 text-ihle-accent!">
              {t('material.fibres.question')}
              <br />
              {t('material.fibres.claim')}
            </p>
          </Reveal>
          <Reveal delay={0.1} className="lg:pt-3">
            <p className="type-lead">
              <BrandText>{t('material.fibres.text')}</BrandText>
            </p>
          </Reveal>
        </div>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-14 lg:grid-cols-6">
          {FIBRES.map((key, index) => (
            <Reveal
              as="li"
              key={key}
              delay={(index % 3) * 0.08}
              className={`flex flex-col rounded-[1.5rem] bg-white p-7 shadow-[0_20px_50px_-36px_rgb(22_53_91/0.45)] sm:p-8 lg:col-span-2 ${
                index === 3 ? 'lg:col-start-2' : ''
              }`}
            >
              <img
                src={`/images/material/fibre-${key}.webp`}
                alt=""
                width="640"
                height="235"
                loading="lazy"
                className="fibre-swatch"
              />
              <h3 className="mt-6 text-xl font-medium not-italic leading-snug text-ihle-blue">
                {t(`material.fibres.items.${key}.title`)}
              </h3>
              <p className="type-body mt-2">
                <BrandText>{t(`material.fibres.items.${key}.text`)}</BrandText>
              </p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
