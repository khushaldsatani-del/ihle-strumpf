import { useId } from 'react'
import { useTranslation } from 'react-i18next'

// The three cuff styles. Texts: material.cuffs.types.<key>.
// band = height of the ribbed part in the drawing (0 = no ribs, a plain loop cuff with a seam line)
const TYPES = [
  { key: 'loop', band: 0 },
  { key: 'ribLong', band: 46 },
  { key: 'ribShort', band: 22 },
]

// Left / right edge of the drawn sock leg at height y (it narrows slightly towards the bottom)
const TOP = 30
const leftAt = (y) => 22 + (y - TOP) * (8 / 92)
const rightAt = (y) => 120 - leftAt(y)

// Drawing of the top of a sock: opening, leg, and the cuff (seam line or ribs)
function CuffDrawing({ band }) {
  const id = useId()
  const line = '#e5c1a5' // peach lines on the brown panel
  const bottom = TOP + band

  return (
    <svg aria-hidden="true" viewBox="0 0 120 134" className="cuff-drawing">
      <defs>
        <clipPath id={id}>
          <path d={`M${leftAt(TOP)} ${TOP} L${leftAt(122)} 122 Q60 131 ${rightAt(122)} 122 L${rightAt(TOP)} ${TOP} Z`} />
        </clipPath>
      </defs>

      {/* leg */}
      <path
        d={`M${leftAt(TOP)} ${TOP} L${leftAt(122)} 122 Q60 131 ${rightAt(122)} 122 L${rightAt(TOP)} ${TOP} Z`}
        fill="rgb(229 193 165 / 0.14)"
        stroke={line}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {band > 0 ? (
        <g clipPath={`url(#${id})`}>
          {/* ribbed band: a lighter strip with vertical ribs, closed by a curved line */}
          <path d={`M0 ${TOP} H120 V${bottom} Q60 ${bottom + 9} 0 ${bottom} Z`} fill="rgb(229 193 165 / 0.3)" />
          {Array.from({ length: 19 }, (_, index) => 24 + index * 4).map((x) => (
            <path key={x} d={`M${x} ${TOP - 4} V${bottom + 8}`} stroke={line} strokeWidth="1" opacity="0.75" />
          ))}
          <path d={`M${leftAt(bottom)} ${bottom} Q60 ${bottom + 9} ${rightAt(bottom)} ${bottom}`} fill="none" stroke={line} strokeWidth="1.5" />
        </g>
      ) : (
        // loop cuff: only a dashed seam line below the opening
        <path
          d={`M${leftAt(48)} 48 Q60 57 ${rightAt(48)} 48`}
          fill="none"
          stroke={line}
          strokeWidth="1.3"
          strokeDasharray="3 3"
          strokeLinecap="round"
        />
      )}

      {/* opening */}
      <ellipse cx="60" cy={TOP} rx={60 - leftAt(TOP)} ry="9" fill="#4a2413" stroke={line} strokeWidth="1.5" />
    </svg>
  )
}

/**
 * "Bündchen" (cuffs), shown inside the panel of the knit section.
 * Three line drawings of the cuffs (drawn in SVG, straight on the panel) with their texts below.
 */
export default function CuffTypes() {
  const { t } = useTranslation()

  return (
    <div className="cuffs">
      <div className="mx-auto max-w-3xl text-center">
        <p className="flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-[0.2em] text-panel-ink">
          <span aria-hidden="true" className="h-px w-10 bg-panel-ink/50" />
          {t('material.cuffs.eyebrow')}
          <span aria-hidden="true" className="h-px w-10 bg-panel-ink/50" />
        </p>
        <h2 className="material-intro__title mt-7 text-white">
          {t('material.cuffs.titleLine1')} <span className="text-panel-accent">{t('material.cuffs.titleLine2')}</span>
        </h2>
        <p className="mt-6 text-base leading-relaxed text-panel-ink">{t('material.cuffs.text')}</p>
      </div>

      <div className="cuffs__stage">
        <ol className="cuffs__list">
          {TYPES.map(({ key, band }) => (
            <li key={key} className="cuffs__item">
              <CuffDrawing band={band} />
              <h3 className="mt-6 text-lg font-bold text-white">{t(`material.cuffs.types.${key}.title`)}</h3>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-panel-ink">
                {t(`material.cuffs.types.${key}.text`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
