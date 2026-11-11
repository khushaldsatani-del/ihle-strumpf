import { Fragment, useId, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowRight, Check, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import RollText from '../common/RollText.jsx'
import { categoryPath } from '../../data/categories.js'

const EASE = [0.22, 1, 0.36, 1]

// The four ranges in the order of the catalogue. Texts: home.ranges.items.<code>.
// accent = the category colour of the Ihle style guide, the same as its fabric background (turquoise, pink-red,
// salmon, yellow). It only marks the product-line tags; buttons, ticks and lines use Ihle blue and yellow.
const RANGES = [
  { code: 'DIABETES', accent: '#57a3b1' },
  { code: 'UNDERWEAR', accent: '#b64558' },
  { code: 'PROTHETIC', accent: '#f3997b' },
  { code: 'ILO', accent: '#fbbc3d' },
]

// Shows "ihle®" / "ilo®" in bold, like the brand name in the catalogue (always lower case, also in upper-case labels)
function BrandText({ children }) {
  return children.split(/(ihle®|ilo®)/).map((part, index) =>
    index % 2 ? (
      <strong key={index} className="font-bold normal-case text-ihle-blue">
        {part}
      </strong>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  )
}

// The details of one range: the two text blocks with the checklist beside them (where the range has one),
// then a box with the product lines (where it has them) and the link to its products
function Details({ code }) {
  const { t } = useTranslation()
  const item = (key, options) => t(`home.ranges.items.${code}.${key}`, options)
  const blocks = item('blocks', { returnObjects: true })
  const lines = item('lines', { returnObjects: true })
  const list = item('list', { returnObjects: true })

  const button = (
    <div className="ranges-facts__footer">
      <Link to={categoryPath(code)} className="ranges-cta group">
        <RollText>{t('home.ranges.cta')}</RollText>
        <ArrowRight aria-hidden="true" size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </div>
  )

  return (
    <div className="ranges-details">
      <div className={`grid gap-7 md:grid-cols-2 md:gap-10 ${list.length > 0 ? 'xl:grid-cols-3' : ''}`}>
        {blocks.map(({ title, text }) => (
          <div key={title}>
            <h4 className="font-pf text-[1.0625rem] font-medium leading-snug text-ihle-blue">{title}</h4>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-ihle-ink">
              <BrandText>{text}</BrandText>
            </p>
          </div>
        ))}

        {list.length > 0 && (
          <div className="ranges-checklist">
            <p className="ranges-label">
              <BrandText>{item('listTitle')}</BrandText>
            </p>
            <ul className="mt-4 space-y-3">
              {list.map((entry) => (
                <li key={entry} className="flex items-start gap-2.5 text-[0.9375rem] leading-snug text-ihle-ink">
                  <span className="ranges-check">
                    <Check aria-hidden="true" size={11} strokeWidth={3} />
                  </span>
                  {entry}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {lines.length > 0 ? (
        <div className="ranges-facts">
          {/* label, number of lines and a thin line in the range colour running out to the right */}
          <div className="ranges-facts__head">
            <p className="ranges-label">{t('home.ranges.linesLabel')}</p>
            <span className="ranges-facts__count">{lines.length}</span>
            <span aria-hidden="true" className="ranges-facts__rule" />
          </div>
          <div className="ranges-facts__body">
            <ul className="flex min-w-0 flex-1 flex-wrap gap-2">
              {lines.map((line) => (
                <li key={line} className="ranges-chip">
                  {line}
                </li>
              ))}
            </ul>
            {button}
          </div>
        </div>
      ) : (
        <div className="mt-8">{button}</div>
      )}
    </div>
  )
}

/**
 * Home: information about the four product ranges (text only, no pictures), in the Ihle design of the landing
 * page (fonts and colours: .lp-ranges in landing.css).
 * A heading, then an editorial list of the four ranges,
 * one large numbered row each. All rows start closed; a row opens to show the details of its range, one at a time.
 */
export default function Ranges() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(-1) // index of the open row, -1 = all closed (the start)
  const id = useId()

  return (
    <section className="lp-ranges lp-section bg-white">
      <div className="lp-container">
        <h2 className="lp-title">{t('home.ranges.title')}</h2>

        {/* The four ranges */}
        <ul className="ranges-list mt-8 lg:mt-10">
          {RANGES.map(({ code, accent }, index) => {
            const expanded = index === open
            return (
              <li key={code} className="ranges-row" data-open={expanded} style={{ '--accent': accent }}>
                <h3>
                  <button
                    type="button"
                    id={`${id}-head-${code}`}
                    aria-expanded={expanded}
                    aria-controls={`${id}-body-${code}`}
                    className="ranges-head"
                    onClick={() => setOpen(expanded ? -1 : index)}
                  >
                    <span className="ranges-head__number">{String(index + 1).padStart(2, '0')}</span>
                    <span className="ranges-head__title">
                      <span className="ranges-head__name">{t(`categories.${code}`)}</span>
                      <span className="ranges-head__tagline">{t(`home.ranges.items.${code}.tagline`)}</span>
                    </span>
                    <span aria-hidden="true" className="ranges-head__toggle">
                      <Plus size={20} strokeWidth={2} />
                    </span>
                  </button>
                </h3>

                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      key="body"
                      id={`${id}-body-${code}`}
                      role="region"
                      aria-labelledby={`${id}-head-${code}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.5, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <Details code={code} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
