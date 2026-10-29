import { useTranslation } from 'react-i18next'

/**
 * The totals under an order, like the old shop's order overview (Ihle's wish): goods value, online discount,
 * total excl. VAT, VAT per rate and total incl. VAT. totals = orderTotals(…), money = amount → "4,41 €".
 */
export default function OrderTotals({ totals, money, className = '' }) {
  const { t } = useTranslation()
  const row = 'flex items-baseline justify-between gap-6'

  return (
    <dl className={`grid gap-1.5 text-sm text-body tabular-nums ${className}`}>
      <div className={row}>
        <dt>{t('totals.goods')}</dt>
        <dd>{money(totals.goods)}</dd>
      </div>
      <div className={row}>
        <dt>{t('totals.discount')}</dt>
        <dd>{money(totals.discount)}</dd>
      </div>
      <div className={`${row} font-semibold text-heading`}>
        <dt>{t('totals.net')}</dt>
        <dd>{money(totals.net)}</dd>
      </div>
      {totals.vat.map(({ rate, amount }) => (
        <div key={rate} className={row}>
          <dt>{t('totals.vat', { rate })}</dt>
          <dd>{money(amount)}</dd>
        </div>
      ))}
      <div className={`${row} mt-1 border-t border-slate-200 pt-2 text-base font-bold text-heading`}>
        <dt>{t('totals.gross')}</dt>
        <dd>{money(totals.gross)}</dd>
      </div>
    </dl>
  )
}
