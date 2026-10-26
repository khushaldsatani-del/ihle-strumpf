import { useTranslation } from 'react-i18next'

const IMAGES = '/images/sock-shapes'

// The three shapes, in the order of the design. Texts: home.shapes.items.<id> in the translation files.
// position = which part of the picture stays visible when it is cropped to the card
// (the pictures are never scaled; short.webp has extra width on its right so its foot sits further left)
const SHAPES = [
  { id: 'short', image: 'short-lavender.webp', position: 'right center' },
  { id: 'footlet', image: 'short.webp', position: 'right center' },
  { id: 'knee', image: 'knee.webp', position: 'right center' },
]

const panel = 'shape-panel relative overflow-hidden rounded-2xl bg-[#fbf8f3] lg:rounded-[1.25rem]'

/**
 * Home "Socken Formen": a wide banner and three numbered cards.
 * Every picture already contains the cream area with the wave on its left, so on large screens the text
 * sits on top of the picture. On smaller screens the picture is shown above the text instead.
 * Sizes inside the panels use container units (cqw), so text and spacing scale with the panel like in the design.
 */
export default function SockShapes() {
  const { t } = useTranslation()

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[96rem] px-4 pb-14 sm:px-8 sm:pb-20 lg:px-16">
        <h2 className="text-[2rem] font-bold tracking-tight text-heading sm:text-[2.625rem]">{t('home.shapes.title')}</h2>

        {/* Banner */}
        <div className={`${panel} @container mt-6 sm:mt-8 lg:aspect-[665/205]`}>
          <img
            src={`${IMAGES}/banner.webp`}
            alt=""
            width="1920"
            height="647"
            loading="lazy"
            className="aspect-[16/7] w-full object-cover object-right lg:absolute lg:inset-0 lg:aspect-auto lg:h-full lg:origin-bottom-left lg:scale-[1.06] lg:object-center"
          />
          <div className="relative p-5 sm:p-7 lg:flex lg:h-full lg:w-[52%] lg:flex-col lg:justify-center lg:py-0 lg:pl-[5.7cqw] lg:pr-0">
            <h3 className="text-xl font-bold leading-tight text-heading sm:text-2xl lg:text-[clamp(1.4rem,2.65cqw,2.4rem)]">
              <span className="block">{t('home.shapes.banner.titleLine1')}</span>
              <span className="block text-[#6f8f7b]">{t('home.shapes.banner.titleLine2')}</span>
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-body lg:mt-[1.6cqw] lg:max-w-[44cqw] lg:text-[clamp(0.8rem,1.12cqw,1rem)] lg:leading-[1.6]">
              {t('home.shapes.banner.text')}
            </p>
          </div>
        </div>

        {/* Cards */}
        <ol className="mt-4 grid gap-4 md:grid-cols-3 lg:mt-6 lg:gap-6">
          {SHAPES.map(({ id, image, position }, index) => (
            <li key={id} className={`${panel} @container xl:aspect-[212/187]`}>
              {/* Phones show the cards as text only; the picture appears from tablet width up */}
              <img
                src={`${IMAGES}/${image}`}
                alt=""
                width="1100"
                height="854"
                loading="lazy"
                className="hidden aspect-[16/10] w-full object-cover md:block xl:absolute xl:inset-0 xl:aspect-auto xl:h-full"
                style={{ objectPosition: position }}
              />
              <div className="relative p-5 xl:w-[53cqw] xl:pb-[4cqw] xl:pl-[7.5cqw] xl:pr-0 xl:pt-[12.5cqw]">
                <span
                  aria-hidden="true"
                  className="flex size-8 items-center justify-center rounded-full bg-[#dfead9] text-sm font-semibold text-heading xl:size-[7.5cqw] xl:text-[3.2cqw]"
                >
                  {index + 1}
                </span>
                <h3 className="mt-3 text-lg font-bold text-heading xl:mt-[3.6cqw] xl:text-[clamp(1rem,4.1cqw,1.25rem)]">
                  {t(`home.shapes.items.${id}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-body xl:mt-[2.6cqw] xl:text-[clamp(0.72rem,3.05cqw,0.875rem)] xl:leading-[1.45]">
                  {t(`home.shapes.items.${id}.text`)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
