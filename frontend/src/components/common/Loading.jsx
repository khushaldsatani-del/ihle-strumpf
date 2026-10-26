import { Loader2, RotateCw, WifiOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// Shared loading and error states, so every page waits and fails the same calm way.

// Grey placeholder block that gently pulses (shape it with className)
export function Skeleton({ className = '' }) {
  return <span aria-hidden="true" className={`block animate-pulse rounded-md bg-slate-900/[0.06] ${className}`} />
}

// Centred spinner for a whole page (route loading, login check)
export function PageLoader({ label }) {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-[calc(100vh-var(--nav-height))] items-center justify-center px-6 py-16" role="status" aria-live="polite">
      <span className="flex items-center gap-3 text-sm text-body">
        <Loader2 size={20} strokeWidth={1.75} className="animate-spin" aria-hidden="true" />
        {label || t('common.loading')}
      </span>
    </div>
  )
}

// Something could not be loaded: a short explanation and a retry button
export function LoadError({ text, onRetry }) {
  const { t } = useTranslation()
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl bg-[#faf8f4] px-6 py-12 text-center" role="alert">
      <WifiOff size={26} strokeWidth={1.5} className="text-body" aria-hidden="true" />
      <p className="font-semibold text-heading">{t('common.loadErrorTitle')}</p>
      <p className="text-sm text-body">{text || t('common.loadErrorText')}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-900/15 bg-white px-3 text-sm font-semibold text-heading transition-colors hover:border-slate-900/40"
        >
          <RotateCw size={14} strokeWidth={2} aria-hidden="true" />
          {t('common.retry')}
        </button>
      )}
    </div>
  )
}

// Product cards while the catalogue loads (same grid as the real cards)
export function ProductGridSkeleton({ count = 8, className = '' }) {
  const { t } = useTranslation()
  return (
    <ul className={className} aria-busy="true" aria-label={t('products.loading')}>
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="flex flex-col">
          <Skeleton className="aspect-[5/6] w-full rounded-2xl" />
          <Skeleton className="mt-4 h-3 w-20" />
          <Skeleton className="mt-2 h-5 w-3/4" />
          <Skeleton className="mt-2 h-3.5 w-full" />
          <Skeleton className="mt-1.5 h-3.5 w-2/3" />
        </li>
      ))}
    </ul>
  )
}

// Product page while the catalogue loads: picture on the left, text on the right
export function ProductDetailSkeleton() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto max-w-[96rem] px-4 pb-20 pt-6 sm:px-8 lg:px-16 lg:pt-8" aria-busy="true" aria-label={t('products.loading')}>
      <Skeleton className="h-4 w-56" />
      <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-2 lg:gap-16">
        <Skeleton className="aspect-square w-full rounded-3xl" />
        <div className="lg:py-4">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-10 w-4/5" />
          <Skeleton className="mt-4 h-5 w-3/5" />
          <Skeleton className="mt-10 h-4 w-16" />
          <div className="mt-3 flex gap-3">
            {[0, 1, 2, 3, 4].map((index) => (
              <Skeleton key={index} className="size-10 rounded-full" />
            ))}
          </div>
          <Skeleton className="mt-8 h-4 w-16" />
          <div className="mt-3 flex gap-2">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-10 w-20 rounded-full" />
            ))}
          </div>
          <Skeleton className="mt-10 h-40 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

// Order rows while the order history loads
export function OrderListSkeleton({ count = 4 }) {
  const { t } = useTranslation()
  return (
    <ul className="mt-6 flex flex-col gap-4" aria-busy="true" aria-label={t('accountOrders.loading')}>
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="flex items-center gap-6 rounded-2xl border border-slate-200 px-6 py-5">
          <span className="flex-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-2 h-3.5 w-36" />
          </span>
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-5 w-16" />
        </li>
      ))}
    </ul>
  )
}
