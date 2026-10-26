import { useTranslation } from 'react-i18next'
import { colorHex } from '../data/colors.js'
import { Badge } from './ui.jsx'

const ORDER_TONES = { new: 'warn', exported: 'ok' }

export function OrderStatus({ status }) {
  const { t } = useTranslation()
  return <Badge tone={ORDER_TONES[status]}>{t(`orders.status.${status}`)}</Badge>
}

// Payment as NAV sends it: a payment code (purchaseorder / debit), or only a method (VORKASSE = prepayment)
export function PaymentLabel({ customer }) {
  const { t } = useTranslation()
  const key = customer?.paymentCode || customer?.paymentMethod
  return <>{key ? t(`payment.${key}`, { defaultValue: key }) : '–'}</>
}

export function ColorDot({ code, size = 14 }) {
  return (
    <span
      className="inline-block shrink-0 rounded-full border border-line-strong"
      style={{ background: colorHex(code), width: size, height: size }}
      aria-hidden="true"
    />
  )
}
