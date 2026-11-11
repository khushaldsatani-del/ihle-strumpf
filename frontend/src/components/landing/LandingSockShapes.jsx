import { useTranslation } from 'react-i18next'
import BrandText from './BrandText.jsx'
import Reveal from './Reveal.jsx'

// The three sock shapes, as in the ihle® catalogue: the texts in the catalogue's order on the left,
// the three drawings from short to long on the right (images/sock-shapes/shape-<key>.webp, background removed).
const TEXT_ORDER = ['short', 'knee', 'footlet']
const PICTURES = [
  { key: 'footlet', width: 900, height: 761, className: 'w-[36%]' },
  { key: 'short', width: 900, height: 871, className: 'w-[32%]' },
  { key: 'knee', width: 730, height: 1422, className: 'w-[25%]' },
]

// "Sock shapes" ("Strumpf und Schuh = passt."): text on the left, the three socks side by side on a white card.
export default function LandingSockShapes() {
  const { t } = useTranslation()

  return (
    <section className="lp-section bg-white">
      <div className="lp-container grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
        <Reveal className="min-w-0">
          <h2 className="lp-title">{t('landing.shapes.title')}</h2>
          <p className="type-body mt-4">
            <BrandText>{t('home.shapes.banner.text')}</BrandText>
          </p>

          <dl className="mt-8 space-y-6">
            {TEXT_ORDER.map((key) => (
              <div key={key}>
                <dt className="text-lg font-medium text-ihle-blue">{t(`home.shapes.items.${key}.title`)}</dt>
                <dd className="type-body mt-1 text-[0.9375rem]">{t(`home.shapes.items.${key}.text`)}</dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal delay={0.1} className="min-w-0">
          <ul className="flex items-end justify-between gap-3">
            {PICTURES.map(({ key, width, height, className }) => (
              <li key={key} className={`flex flex-col items-center ${className}`}>
                <img
                  src={`/images/sock-shapes/shape-${key}.webp`}
                  alt={t(`landing.shapes.alt.${key}`)}
                  width={width}
                  height={height}
                  loading="lazy"
                  className="h-auto w-full origin-bottom transition-transform duration-500 ease-out hover:scale-[1.08]"
                />
                <span className="type-subtitle mt-5 text-[1.125rem] sm:text-[1.375rem]">{t(`home.shapes.items.${key}.title`)}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
