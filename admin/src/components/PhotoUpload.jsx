import { AlertTriangle, CheckCircle2, ImagePlus, Loader2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useData } from '../context/contexts.js'
import { api } from '../utils/api.js'
import { formatNumber } from '../utils/format.js'

// Product photos are matched to articles by file name (40000_001_01.jpg, as NAV lists them), so the admin
// just selects all new photos at once. They go to the backend in small batches: each request stays below
// Vercel's ~4.5 MB limit, and one bad file never stops the rest.
const BATCH_BYTES = 3.5 * 1024 * 1024
const BATCH_FILES = 10
const IMAGE = /\.(jpe?g|png|webp|tiff?)$/i

function batches(files) {
  const result = []
  let current = []
  let bytes = 0
  for (const file of files) {
    if (current.length && (bytes + file.size > BATCH_BYTES || current.length >= BATCH_FILES)) {
      result.push(current)
      current = []
      bytes = 0
    }
    current.push(file)
    bytes += file.size
  }
  if (current.length) result.push(current)
  return result
}

export default function PhotoUpload() {
  const { t } = useTranslation()
  const { photoStats, reload } = useData()
  const inputRef = useRef(null)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)

  const upload = async (fileList) => {
    const files = [...fileList].filter((file) => IMAGE.test(file.name))
    if (!files.length) return
    setResult(null)
    const failed = []
    let saved = 0
    setProgress({ done: 0, total: files.length })

    for (const batch of batches(files)) {
      const form = new FormData()
      batch.forEach((file) => form.append('files', file, file.name))
      try {
        const { results } = await api('/admin/photos', { method: 'POST', form })
        results.forEach((entry) => (entry.error ? failed.push(`${entry.name}: ${t(`photos.errors.${entry.error}`)}`) : (saved += 1)))
      } catch (error) {
        batch.forEach((file) => failed.push(`${file.name}: ${t(`photos.errors.${error.code}`, { defaultValue: t('photos.errors.serverError') })}`))
      }
      setProgress((current) => ({ ...current, done: current.done + batch.length }))
    }

    setProgress(null)
    setResult({ saved, failed })
    if (inputRef.current) inputRef.current.value = ''
    await reload()
  }

  return (
    <section className="card mt-4 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base">{t('photos.title')}</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted">{t('photos.text')}</p>
          <p className="mt-2 text-xs text-muted">{t('photos.stored', { count: photoStats?.total || 0, formatted: formatNumber(photoStats?.total || 0) })}</p>
        </div>
        <label className={`btn btn-primary shrink-0 ${progress ? 'pointer-events-none opacity-60' : ''}`}>
          {progress ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <ImagePlus size={16} aria-hidden="true" />}
          {progress ? t('photos.uploading', { done: progress.done, total: progress.total }) : t('photos.choose')}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/tiff"
            multiple
            className="sr-only"
            disabled={Boolean(progress)}
            onChange={(event) => upload(event.target.files)}
          />
        </label>
      </div>

      {progress && (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-cream" role="progressbar" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done}>
          <div className="h-full rounded-full bg-brand transition-[width]" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-2 text-sm">
          <p className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-ok" role="status">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            {t('photos.done', { count: result.saved })}
          </p>
          {result.failed.length > 0 && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-danger" role="alert">
              <p className="flex items-center gap-2 font-medium">
                <AlertTriangle size={18} aria-hidden="true" />
                {t('photos.failed', { count: result.failed.length })}
              </p>
              <ul className="mt-1.5 max-h-32 overflow-y-auto text-xs">
                {result.failed.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
