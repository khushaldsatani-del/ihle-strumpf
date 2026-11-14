import { useTranslation } from 'react-i18next'
import BrandText from '../landing/BrandText.jsx'
import Reveal from '../landing/Reveal.jsx'

// The three cuff styles. Texts: material.cuffs.types.<key>; drawing: a pencil sketch of a sock with that top
// (images/material/cuff-*-sketch.webp, background removed).
// diabetes = what the text says about people with diabetes: true (made for them), false (not suitable), none
const TYPES = [
  { key: 'loop', sketch: 'cuff-loop-sketch', diabetes: true },
  { key: 'ribLong', sketch: 'cuff-rib-tall-sketch' },
  { key: 'ribShort', sketch: 'cuff-rib-short-sketch', diabetes: false },
]

// "Cuffs": the title centred, then one card per cuff with its sketch.
export default function CuffTypes() {
  const { t } = useTranslation()

  return (
    <section className="lp-section bg-ihle-cream">
      <div className="lp-container">
        <Reveal className="mx-auto max-w-[40rem] text-center">
          <h2 className="type-section-title">
            {t('material.cuffs.titleLine1')} {t('material.cuffs.titleLine2')}
          </h2>
        </Reveal>

        <ul className="mt-12 grid gap-5 md:grid-cols-3 lg:mt-14">
          {TYPES.map(({ key, sketch, diabetes }, index) => (
            <Reveal
              as="li"
              key={key}
              delay={index * 0.08}
              className="flex flex-col rounded-[1.5rem] bg-white p-7 shadow-[0_20px_50px_-36px_rgb(22_53_91/0.45)] sm:p-8"
            >
              <div className="group flex h-72 items-center justify-center">
                <img
                  src={`/images/material/${sketch}.webp`}
                  alt={t(`material.cuffs.types.${key}.title`)}
                  width="640"
                  height="1280"
                  loading="lazy"
                  className="h-full w-auto object-contain transition-transform duration-700 group-hover:scale-[1.05]"
                />
              </div>
              <h3 className="mt-6 text-xl font-medium not-italic leading-snug">{t(`material.cuffs.types.${key}.title`)}</h3>
              <p className="type-body mt-2">
                <BrandText>{t(`material.cuffs.types.${key}.text`)}</BrandText>
              </p>
              {diabetes !== undefined && (
                <div className="mt-auto pt-6">
                  <p className={`lp-pill ${diabetes ? 'bg-[#e8f2ec]' : 'bg-[#f8e9ec]'}`}>
                    <span aria-hidden="true" className={`size-2 rounded-full ${diabetes ? 'bg-[#3f7a55]' : 'bg-[#b64558]'}`} />
                    {t(diabetes ? 'material.cuffs.diabetesYes' : 'material.cuffs.diabetesNo')}
                  </p>
                </div>
              )}
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
