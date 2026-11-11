import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import BrandText from './BrandText.jsx'
import Reveal from './Reveal.jsx'

// Colour swatches in two groups. Names: home.colors.names.<id> in the translation files.
const GROUPS = [
  {
    key: 'classic',
    colors: [
      { id: 'black', hex: '#1f1f1f' },
      { id: 'marine', hex: '#1c2a4a' },
      { id: 'gray', hex: '#8c8f94' },
      { id: 'anthracite', hex: '#3e4247' },
      { id: 'graphite', hex: '#55595e' },
      { id: 'white', hex: '#ffffff' },
      { id: 'nature', hex: '#ede6d6' },
      { id: 'beige', hex: '#d8c7a8' },
      { id: 'silver', hex: '#c9cbce' },
    ],
  },
  {
    key: 'colourful',
    colors: [
      { id: 'yellow', hex: '#f2c230' },
      { id: 'turquoise', hex: '#3fa7b5' },
      { id: 'red', hex: '#c8102e' },
      { id: 'green', hex: '#4c9a5b' },
      { id: 'pink', hex: '#f2a7b8' },
      { id: 'purple', hex: '#8a5fa8' },
      { id: 'royalBlue', hex: '#2547a8' },
    ],
  },
]

// "Colours": text and button on the left, the colour swatches on the right.
export default function LandingColors() {
  const { t } = useTranslation()

  return (
    <section className="lp-section bg-white">
      <div className="lp-container grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,46.5rem)] lg:gap-14">
        <Reveal className="min-w-0">
          <p className="lp-label">{t('landing.colors.label')}</p>
          <h2 className="lp-title mt-5 max-w-[26rem]">
            {t('home.colors.subtitleLine1')} {t('home.colors.subtitleLine2')}
          </h2>
          <p className="type-body mt-5 max-w-[28rem]">
            <BrandText>{t('home.colors.text')}</BrandText>
          </p>
          <Link to="/products" className="lp-btn lp-btn--yellow mt-8">
            {t('home.colors.cta')}
            <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
          </Link>
        </Reveal>

        <Reveal
          delay={0.1}
          className="min-w-0"
        >
          {GROUPS.map(({ key, colors }, index) => (
            <div key={key} className={index > 0 ? 'mt-8 border-t border-ihle-blue/10 pt-8' : ''}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg leading-tight">{t(`landing.colors.groups.${key}`)}</h3>
                <span className="lp-caption">{t('landing.colors.tones', { count: colors.length })}</span>
              </div>
              <ul className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(3.5rem,1fr))] gap-x-3 gap-y-6">
                {colors.map(({ id, hex }) => (
                  <li key={id} className="lp-swatch-item flex flex-col items-center">
                    <span
                      aria-hidden="true"
                      className={`lp-swatch ${id === 'white' ? 'lp-swatch--light' : ''}`}
                      style={{ backgroundColor: hex }}
                    />
                    <span className="mt-2.5 text-center text-xs font-medium leading-tight text-ihle-ink">
                      {t(`home.colors.names.${id}`)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
