import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import PlaceholderPage from '../components/common/PlaceholderPage.jsx'

// Placeholder: shows the search term from /search?q=…
export default function Search() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q')

  return (
    <PlaceholderPage title={t('pages.search')}>
      {query && <p className="text-lg text-body">{t('pages.searchFor', { query })}</p>}
    </PlaceholderPage>
  )
}
