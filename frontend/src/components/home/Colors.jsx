import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import RollText from '../common/RollText.jsx'

// Colour swatches in the order of the design (3 rows of 8). Names: home.colors.names.<id> in the translation files.
const COLORS = [
  { id: 'black', hex: '#000000' },
  { id: 'marine', hex: '#1c2251' },
  { id: 'gray', hex: '#8c8c8c' },
  { id: 'anthracite', hex: '#4a4a4a' },
  { id: 'graphite', hex: '#7a706b' },
  { id: 'brown', hex: '#3b1d17' },
  { id: 'white', hex: '#ffffff' },
  { id: 'silver', hex: '#c4c4c4' },
  { id: 'beige', hex: '#c9a27a' },
  { id: 'nature', hex: '#fde8cf' },
  { id: 'pearl', hex: '#c47f52' },
  { id: 'beigeMottled', hex: '#a58d77' },
  { id: 'denimBlueMelange', hex: '#6f9fc9' },
  { id: 'lightGreyMelange', hex: '#b3b3b3' },
  { id: 'darkGreyMelange', hex: '#5f5f5f' },
  { id: 'yellow', hex: '#fcd920' },
  { id: 'red', hex: '#d3122b' },
  { id: 'green', hex: '#2a6a41' },
  { id: 'pink', hex: '#ec8fb0' },
  { id: 'purple', hex: '#5c1d7c' },
  { id: 'turquoise', hex: '#3ab7c0' },
  { id: 'royalBlue', hex: '#1c3fa6' },
]

/**
 * Home "Farben": text on the left, a frosted card with the colour swatches, the sock picture behind.
 * On large screens everything sits on top of the picture and scales with the panel (container units, cqw);
 * on smaller screens picture, text and swatches are stacked.
 */
export default function Colors() {
  const { t } = useTranslation()

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[96rem] px-4 pb-14 sm:px-8 sm:pb-20 lg:px-16">
        <div className="color-panel @container relative overflow-hidden rounded-2xl bg-[#f7f3ee] lg:aspect-[1000/345] lg:rounded-[1.25rem]">
          {/* Phones and tablets show no picture; it appears on large screens, behind the text */}
          <img
            src="/images/colors/banner.webp"
            alt=""
            width="1774"
            height="887"
            loading="lazy"
            className="hidden size-full object-cover object-right lg:absolute lg:inset-0 lg:block"
          />

          {/* Text */}
          <div className="relative p-5 sm:p-7 lg:flex lg:h-full lg:w-[33cqw] lg:flex-col lg:justify-center lg:py-0 lg:pl-[2.6cqw] lg:pr-0">
            <h2 className="text-[2rem] font-bold tracking-tight text-heading sm:text-[2.625rem]">
              {t('home.colors.title')}
            </h2>
            <h3 className="mt-3 text-lg font-bold leading-snug text-heading lg:mt-[1.7cqw] lg:text-[1.85cqw]">
              <span className="block">{t('home.colors.subtitleLine1')}</span>
              <span className="block">{t('home.colors.subtitleLine2')}</span>
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-body lg:mt-[1.2cqw] lg:text-[clamp(0.8rem,1.22cqw,1.05rem)] lg:leading-[1.65]">
              {t('home.colors.text')}
            </p>
            <Link
              to="/products"
              className="group mt-5 inline-flex min-h-11 items-center gap-3 self-start rounded-full bg-[#4a2413] px-5 text-sm font-semibold text-white transition-[background-color,transform] duration-300 hover:bg-[#633320] active:scale-[0.96] lg:mt-[2.6cqw] lg:min-h-[3.7cqw] lg:px-[2.3cqw] lg:text-[clamp(0.8rem,1.2cqw,1.05rem)]"
            >
              <RollText>{t('home.colors.cta')}</RollText>
              <ArrowRight aria-hidden="true" className="size-[1.4em] transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Frosted card with the swatches */}
          <div className="color-card relative mx-5 mb-5 rounded-2xl sm:mx-7 sm:mb-7 lg:absolute lg:left-[36.5%] lg:top-[17.4%] lg:m-0 lg:h-[65.2%] lg:w-[46.4%] lg:rounded-[1.6cqw]">
            <ul className="grid grid-cols-4 gap-x-1 gap-y-4 p-4 sm:grid-cols-8 lg:h-full lg:content-between lg:gap-0 lg:px-[0.9cqw] lg:py-[2.1cqw]">
              {COLORS.map(({ id, hex }) => (
                <li key={id} className="color-item flex flex-col items-center gap-1.5 lg:gap-[0.75cqw]">
                  <span
                    aria-hidden="true"
                    className="color-swatch size-9 rounded-full lg:size-[3.4cqw]"
                    style={{ backgroundColor: hex }}
                  />
                  <span className="text-center text-[0.68rem] font-medium leading-tight text-body lg:min-h-[2.2em] lg:text-[clamp(0.55rem,0.82cqw,0.75rem)]">
                    {t(`home.colors.names.${id}`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
