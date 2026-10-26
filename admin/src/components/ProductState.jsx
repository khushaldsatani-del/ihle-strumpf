import { useTranslation } from 'react-i18next'
import { productState } from '../utils/products.js'
import { Badge } from './ui.jsx'

const TONES = { visible: 'ok', waiting: 'warn', blocked: 'danger' }

export default function ProductState({ product }) {
  const { t } = useTranslation()
  const state = productState(product)
  return <Badge tone={TONES[state]}>{t(`products.state.${state}`)}</Badge>
}
