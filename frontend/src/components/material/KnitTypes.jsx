import { useTranslation } from 'react-i18next'
import BrandText from '../landing/BrandText.jsx'
import Reveal from '../landing/Reveal.jsx'
import ZoomLens from '../landing/ZoomLens.jsx'

// The four knit types, compared side by side. Texts: material.knit.types.<key>; swatch photo:
// images/material/knit-<key>.webp (background removed). gauge = stitches per inch where it is a fixed value;
// padding = how much of the sock is padded (terry).
const TYPES = [
  { key: 'smooth', gauge: 14, padding: 'none' },
  { key: 'fine', gauge: 22, padding: 'none' },
  { key: 'plush', padding: 'full' },
  { key: 'semi', padding: 'partial' },
]

// "Knit": title and text, then a simple comparison of the four knit types: swatch, name, gauge and padding.
export default function KnitTypes() {
  const { t } = useTranslation()

  return (
    <section id="gestrick" className="lp-section bg-ihle-mist">
      <div className="lp-container">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <h2 className="type-section-title">
              {t('material.knit.titleLine1')}
              <br />
              {t('material.knit.titleLine2')}
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="lg:pt-12">
            <p className="type-lead">
              <BrandText>{t('material.knit.text')}</BrandText>
            </p>
          </Reveal>
        </div>

        <Reveal className="mt-12 rounded-[1.75rem] bg-white px-5 py-3 shadow-[0_20px_50px_-36px_rgb(22_53_91/0.45)] sm:px-8 lg:mt-16 lg:px-10">
          {/* column titles (desktop) */}
          <div
            aria-hidden="true"
            className="hidden grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,0.8fr)] gap-8 border-b border-ihle-blue/10 py-4 lg:grid"
          >
            <span />
            <span />
            <span className="lp-caption">{t('material.knit.compare.gauge')}</span>
            <span className="lp-caption">{t('material.knit.compare.padding')}</span>
          </div>

          <ul>
            {TYPES.map((type) => (
              <li
                key={type.key}
                className="grid items-center gap-x-8 gap-y-4 border-b border-ihle-blue/10 py-7 last:border-b-0 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,0.8fr)] lg:py-8"
              >
                <ZoomLens
                  src={`/images/material/knit-${type.key}.webp`}
                  width="1600"
                  height="380"
                  label={`${t(`material.knit.types.${type.key}.title`)} – ${t('material.knit.compare.magnify')}`}
                  title={t(`material.knit.types.${type.key}.title`)}
                  subtitle={t(`material.knit.types.${type.key}.tag`)}
                  text={t(`material.knit.types.${type.key}.text`)}
                />
                <p className="text-lg font-medium text-ihle-blue sm:text-xl">{t(`material.knit.types.${type.key}.title`)}</p>
                <dl className="contents">
                  <div className="flex items-baseline justify-between gap-4 lg:block">
                    <dt className="lp-caption lg:sr-only">{t('material.knit.compare.gauge')}</dt>
                    <dd className="text-[0.9375rem] font-medium text-ihle-blue">
                      {type.gauge ? t('material.knit.compare.perInch', { count: type.gauge }) : '–'}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 lg:block">
                    <dt className="lp-caption lg:sr-only">{t('material.knit.compare.padding')}</dt>
                    <dd className="flex items-center gap-2 text-[0.9375rem] font-medium text-ihle-blue">
                      {/* three dots: none, partly or fully padded */}
                      <span aria-hidden="true" className="flex gap-1">
                        {[0, 1, 2].map((dot) => (
                          <span
                            key={dot}
                            className={`size-2 rounded-full ${
                              dot < { none: 0, partial: 2, full: 3 }[type.padding] ? 'bg-ihle-accent' : 'bg-ihle-blue/15'
                            }`}
                          />
                        ))}
                      </span>
                      {t(`material.knit.compare.${type.padding}`)}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </Reveal>

      </div>
    </section>
  )
}
