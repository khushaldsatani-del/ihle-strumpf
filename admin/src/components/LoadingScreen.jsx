import { CheckCircle2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SCREEN_DELAY_MS } from '../utils/boot.js'

const formatSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)

// Full page while the panel starts: 0–100 % from the first server contact until all admin data has arrived.
// step: 'connect' (waiting for the server), 'wake' (it takes long: Render's free plan starts the sleeping
// backend), 'data' (downloading, with loaded/total bytes), 'done'.
// It fades in after a moment, so a fast start shows no flash; startedAt is when the start began, so the screen
// doesn't fade in a second time when the data download takes over from the session check.
export default function LoadingScreen({ percent, step, loaded = 0, total = 0, startedAt = Date.now() }) {
  const { t } = useTranslation()
  const [shown] = useState(() => Date.now() - startedAt >= SCREEN_DELAY_MS)
  const value = Math.round(percent)
  return (
    <main className={`${shown ? '' : 'loading-screen '}grid min-h-screen place-items-center bg-surface px-4 py-10`}>
      <div className="w-full max-w-sm text-center" role="status" aria-live="polite">
        <img src="/images/logo-black.png" alt="ihle®" className="mx-auto h-9 w-auto" />
        <div className="card mt-8 px-5 py-5 text-left shadow-[0_20px_50px_-30px_rgb(15_23_42/0.4)]">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 font-medium text-heading">
              {step === 'done' ? (
                <CheckCircle2 size={16} className="text-ok" aria-hidden="true" />
              ) : (
                <Loader2 size={16} className="animate-spin text-brand" aria-hidden="true" />
              )}
              {t(`boot.${step}`)}
            </span>
            <span className="font-heading font-bold text-heading tabular-nums">{value} %</span>
          </div>
          <div
            className="mt-3 h-2.5 overflow-hidden rounded-full bg-cream"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={value}
          >
            <div className="h-full rounded-full bg-brand transition-[width] duration-200 ease-out" style={{ width: `${value}%` }} />
          </div>
          {step === 'wake' && <p className="mt-3 text-xs text-muted">{t('boot.wakeText')}</p>}
          {step === 'data' && total > 0 && (
            <p className="mt-3 text-xs text-muted tabular-nums">
              {t('boot.size', { loaded: formatSize(Math.min(loaded, total)), total: formatSize(total) })}
            </p>
          )}
        </div>
        {/* Test phase: the backend runs on Render's free plan; remove this note once it moves to a paid plan */}
        <p className="mt-5 text-xs leading-relaxed text-muted">{t('boot.testHosting')}</p>
      </div>
    </main>
  )
}
