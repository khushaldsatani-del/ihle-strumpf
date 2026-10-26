import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

export function PageHeader({ title, description, actions, back }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && (
          <Link
            to={back.to}
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-brand"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            {back.label}
          </Link>
        )}
        <h1 className="text-2xl tracking-tight break-words sm:text-[1.75rem]">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

const TONES = {
  neutral: 'bg-slate-100 text-slate-700',
  brand: 'bg-[rgb(30_47_95/0.08)] text-brand',
  ok: 'bg-emerald-50 text-ok',
  warn: 'bg-amber-50 text-warn',
  danger: 'bg-red-50 text-danger',
}

export function Badge({ tone = 'neutral', children }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${TONES[tone]}`}>
      {children}
    </span>
  )
}

export function StatCard({ icon: Icon, label, value, hint, to }) {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted">{label}</span>
        {Icon && (
          <span className="grid size-9 place-items-center rounded-xl bg-cream text-brand">
            <Icon size={18} aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="mt-3 font-heading text-[1.75rem] leading-none font-bold text-heading">{value}</p>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </>
  )
  return to ? (
    <Link to={to} className="card block p-5 transition-shadow hover:shadow-[0_10px_30px_-18px_rgb(15_23_42/0.35)]">
      {content}
    </Link>
  ) : (
    <div className="card p-5">{content}</div>
  )
}

export function SearchField({ value, onChange, placeholder }) {
  return (
    <label className="relative block w-full sm:max-w-xs">
      <span className="sr-only">{placeholder}</span>
      <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="field pl-9"
      />
    </label>
  )
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="font-heading font-bold text-heading">{title}</p>
      {text && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Pagination({ page, pageCount, total, onChange }) {
  const { t } = useTranslation()
  if (pageCount <= 1) return null
  return (
    <div className="flex items-center justify-between gap-4 border-t border-line px-4 py-3 text-sm">
      <span className="text-muted">{t('common.pageOf', { page, pages: pageCount, total })}</span>
      <div className="flex gap-2">
        <button type="button" className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft size={16} aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">{t('common.previous')}</span>
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={page >= pageCount}
          onClick={() => onChange(page + 1)}
        >
          <span className="sr-only sm:not-sr-only">{t('common.next')}</span>
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

export function Modal({ title, onClose, children, footer }) {
  const { t } = useTranslation()

  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]"
        aria-label={t('common.close')}
        onClick={onClose}
      />
      <div className="card relative w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-lg">{title}</h2>
          <button type="button" className="rounded-lg p-1.5 text-muted hover:bg-hover" onClick={onClose} aria-label={t('common.close')}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}

// Scrolls wide tables sideways inside their card on small screens instead of the whole page
export function TableWrap({ children }) {
  return <div className="overflow-x-auto">{children}</div>
}
