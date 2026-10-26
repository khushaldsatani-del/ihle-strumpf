import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui.jsx'

export default function NotFound() {
  const { t } = useTranslation()
  return (
    <div className="card">
      <EmptyState
        title={t('notFound.title')}
        text={t('notFound.text')}
        action={
          <Link to="/orders" className="btn btn-primary">
            {t('nav.orders')}
          </Link>
        }
      />
    </div>
  )
}
