import { Infinity as InfinityIcon, Leaf, Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Reveal from '../landing/Reveal.jsx'

// Three wavy vertical lines (warmth / comfort), drawn to match the line icons next to it
function WavesIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {[6, 12, 18].map((x) => (
        <path key={x} d={`M${x} 3c-2 3 2 6 0 9s2 6 0 9`} />
      ))}
    </svg>
  )
}

// The four qualities (texts: material.intro.features.<key>), each on one of the coloured Ihle fabric backgrounds
const FEATURES = [
  { key: 'fibres', icon: Leaf, fabric: 'tuerkis' },
  { key: 'quality', icon: Shield, fabric: 'orthesen' },
  { key: 'comfort', icon: WavesIcon, fabric: 'korsett' },
  { key: 'durable', icon: InfinityIcon, fabric: 'gelb' },
]

// "Our materials": the title, then four cards on the coloured fabric backgrounds.
export default function MaterialIntro() {
  const { t } = useTranslation()

  return (
    <section className="lp-section bg-white">
      <div className="lp-container">
        <Reveal>
          <h2 className="type-section-title">
            {t('material.intro.titleLine1')}
            <br />
            {t('material.intro.titleLine2')}
          </h2>
        </Reveal>

        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:mt-12">
          {FEATURES.map(({ key, icon: Icon, fabric }, index) => (
            <Reveal as="li" key={key} delay={index * 0.08} className="relative isolate min-h-[14rem] overflow-hidden rounded-[1.5rem] bg-ihle-mist">
              <img
                src={`/images/landing/fabric-${fabric}.webp`}
                alt=""
                width="1600"
                height="706"
                loading="lazy"
                className="absolute inset-0 -z-10 size-full object-cover object-right"
              />
              <div className="flex h-full max-w-[22rem] flex-col p-7 sm:p-8">
                <span className="grid size-12 place-items-center rounded-full bg-white text-ihle-blue shadow-[0_8px_20px_-12px_rgb(22_53_91/0.45)]">
                  <Icon width={22} height={22} strokeWidth={1.6} aria-hidden="true" />
                </span>
                <h3 className="type-subtitle mt-auto pt-8">{t(`material.intro.features.${key}.title`)}</h3>
                <p className="type-body mt-2">{t(`material.intro.features.${key}.text`)}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
