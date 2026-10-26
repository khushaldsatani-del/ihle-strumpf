import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import PlaceholderPage from '../components/common/PlaceholderPage.jsx'

export default function NotFound() {
  const { t } = useTranslation()

  return (
    <PlaceholderPage title={t('pages.notFound')}>
      <Link to="/" className="font-semibold text-brand underline underline-offset-4">
        {t('pages.backHome')}
      </Link>
    </PlaceholderPage>
  )
}
