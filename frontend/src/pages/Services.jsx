import { useTranslation } from 'react-i18next'
import PlaceholderPage from '../components/common/PlaceholderPage.jsx'

export default function Services() {
  const { t } = useTranslation()

  return <PlaceholderPage title={t('pages.services')} />
}
