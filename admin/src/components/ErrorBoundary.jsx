import { AlertTriangle, RotateCw } from 'lucide-react'
import { Component } from 'react'
import { useTranslation } from 'react-i18next'

function ErrorScreen({ onRetry }) {
  const { t } = useTranslation()
  return (
    <div className="card mx-auto max-w-md p-6 text-center" role="alert">
      <AlertTriangle size={28} className="mx-auto text-warn" aria-hidden="true" />
      <p className="mt-3 font-heading font-bold text-heading">{t('common.crashTitle')}</p>
      <p className="mt-1 text-sm text-muted">{t('common.crashText')}</p>
      <button type="button" className="btn btn-primary mt-4" onClick={onRetry}>
        <RotateCw size={16} aria-hidden="true" />
        {t('common.reloadPage')}
      </button>
    </div>
  )
}

// If a page fails while rendering, show a message with a reload button instead of a blank screen.
// resetKey (the current path) clears the error when the admin switches to another page.
export default class ErrorBoundary extends Component {
  state = { error: null, key: this.props.resetKey }

  static getDerivedStateFromError(error) {
    return { error }
  }

  static getDerivedStateFromProps(props, state) {
    return props.resetKey !== state.key ? { error: null, key: props.resetKey } : null
  }

  componentDidCatch(error, info) {
    console.error('Admin page crashed:', error, info.componentStack)
  }

  render() {
    if (this.state.error) return <ErrorScreen onRetry={() => window.location.reload()} />
    return this.props.children
  }
}
