import { Minus, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const MIN = 1
const MAX = 999

// Quantity with minus / plus buttons. value is a number between 1 and 999.
export default function QuantityInput({ id, value, onChange, label }) {
  const { t } = useTranslation()
  const set = (next) => onChange(Math.min(Math.max(Math.round(next) || MIN, MIN), MAX))

  return (
    <div className="qty">
      <button type="button" aria-label={t('order.less')} disabled={value <= MIN} onClick={() => set(value - 1)}>
        <Minus size={16} aria-hidden="true" />
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={MIN}
        max={MAX}
        value={value}
        aria-label={label}
        onChange={(event) => set(Number(event.target.value))}
        onFocus={(event) => event.target.select()}
      />
      <button type="button" aria-label={t('order.more')} disabled={value >= MAX} onClick={() => set(value + 1)}>
        <Plus size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
