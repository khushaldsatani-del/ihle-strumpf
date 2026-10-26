import { AlertTriangle, CheckCircle2, FileCode2, Loader2, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import PhotoUpload from '../components/PhotoUpload.jsx'
import { Badge, EmptyState, PageHeader, TableWrap } from '../components/ui.jsx'
import { useData } from '../context/contexts.js'
import useUploadProgress from '../hooks/useUploadProgress.js'
import { formatDateTime, formatMoney } from '../utils/format.js'
import { categoryName } from '../utils/names.js'

const PREVIEW_ROWS = 50
const MAX_FILE_SIZE = 50 * 1024 * 1024

const recordKey = (type, record) => (type === 'items' ? record.articleNo : record.number)

function ProgressBar({ progress }) {
  const { t } = useTranslation()
  const percent = Math.round(progress.percent)
  return (
    <div className="card mt-4 px-5 py-4" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="flex items-center gap-2 font-medium text-heading">
          {progress.step === 'done' ? (
            <CheckCircle2 size={16} className="text-ok" aria-hidden="true" />
          ) : (
            <Loader2 size={16} className="animate-spin text-brand" aria-hidden="true" />
          )}
          {t(`import.progress.${progress.step}`)}
        </span>
        <span className="font-heading font-bold text-heading tabular-nums">{percent} %</span>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-cream" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <div className="h-full rounded-full bg-brand transition-[width] duration-200 ease-out" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

// Two steps against the backend: preview (nothing saved) and confirm (saved). The file stays in the page
// between them and is sent again on confirm, so the backend keeps nothing half-finished.
export default function Import() {
  const { t } = useTranslation()
  const { imports, reload } = useData()
  const inputRef = useRef(null)
  const { progress, send } = useUploadProgress()
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(null)
  const busy = Boolean(progress)

  const errorText = (code) => t(`import.errors.${code}`, { defaultValue: t('import.errors.serverError') })

  const readFile = async (selected) => {
    setError(null)
    setDone(null)
    setPreview(null)
    setFile(null)
    if (!selected) return
    if (!selected.name.toLowerCase().endsWith('.xml')) return setError(errorText('notXml'))
    if (selected.size > MAX_FILE_SIZE) return setError(errorText('tooLarge'))

    try {
      const result = await send('/admin/import/preview', selected, 'check')
      setFile(selected)
      setPreview({ fileName: selected.name, ...result })
    } catch (failure) {
      setError(errorText(failure.code))
    }
  }

  const onDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    readFile(event.dataTransfer.files[0])
  }

  const confirm = async () => {
    setError(null)
    try {
      const { run } = await send('/admin/import/confirm', file, 'save')
      setDone({ ...run, fileName: run.file_name })
      setPreview(null)
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      await reload()
    } catch (failure) {
      setError(errorText(failure.code))
    }
  }

  const cancel = () => {
    setPreview(null)
    setFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  // One row per record with what will happen to it, articles with photos first; errors are listed separately
  const rows = preview
    ? [
        ...preview.diff.created.map((record) => ({ record, change: 'created' })),
        ...preview.diff.updated.map((record) => ({ record, change: 'updated' })),
        ...preview.diff.unchanged.map((record) => ({ record, change: 'unchanged' })),
      ].sort((a, b) => Number(Boolean(b.record.photoCount)) - Number(Boolean(a.record.photoCount)))
    : []

  return (
    <>
      <PageHeader title={t('import.title')} description={t('import.subtitle')} />

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <label
            htmlFor="nav-file"
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`card flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed px-6 py-12 text-center transition-colors ${
              dragging ? 'border-brand bg-[rgb(30_47_95/0.04)]' : 'border-line-strong hover:border-brand/50'
            }`}
          >
            <span className="grid size-14 place-items-center rounded-2xl bg-cream text-brand">
              <Upload size={24} aria-hidden="true" />
            </span>
            <span className="font-heading text-lg font-bold text-heading">{t('import.dropTitle')}</span>
            <span className="max-w-md text-sm text-muted">{t('import.dropText')}</span>
            <span className="btn btn-primary mt-2">
              {busy && !preview && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {t(busy && !preview ? 'import.checking' : 'import.choose')}
            </span>
            <input
              ref={inputRef}
              id="nav-file"
              type="file"
              accept=".xml,application/xml,text/xml"
              className="sr-only"
              onChange={(event) => readFile(event.target.files[0])}
              disabled={busy}
            />
          </label>

          {/* While checking a new file; while saving, the bar sits in the preview next to the confirm button */}
          {progress && !preview && <ProgressBar progress={progress} />}

          {error && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-danger" role="alert">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}
          {done && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-ok" role="status">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              {t('import.done', { file: done.fileName })}{' '}
              {t('import.summary', { created: done.created, updated: done.updated, errors: done.errors })}
            </p>
          )}
        </section>

        <aside className="card p-5 text-sm">
          <h2 className="text-base">{t('import.howTitle')}</h2>
          <ul className="mt-3 space-y-3">
            {['items', 'customers', 'orders'].map((key) => (
              <li key={key} className="flex gap-3">
                <FileCode2 size={18} className="mt-0.5 shrink-0 text-brand" aria-hidden="true" />
                <span>
                  <span className="block font-mono text-xs font-semibold text-heading">{t(`import.files.${key}.name`)}</span>
                  <span className="text-muted">{t(`import.files.${key}.text`)}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 rounded-xl bg-cream px-3 py-2.5 text-xs leading-relaxed">{t('import.backendNote')}</p>
        </aside>
      </div>

      <PhotoUpload />

      {preview && (
        <section className="card mt-4 overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base">{t('import.previewTitle', { file: preview.fileName })}</h2>
              <p className="mt-1 text-sm text-muted">
                {t(`import.type.${preview.type}`)} · {t('import.rows', { count: preview.rowCount })}
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn btn-secondary" onClick={cancel}>
                <X size={16} aria-hidden="true" />
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={confirm}
                disabled={busy || (!preview.diff.created.length && !preview.diff.updated.length)}
              >
                {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <CheckCircle2 size={16} aria-hidden="true" />}
                {t('import.confirm')}
              </button>
            </div>
          </div>

          {progress && (
            <div className="border-b border-line px-5 pb-4 [&>.card]:mt-0 [&>.card]:border-0 [&>.card]:p-0">
              <ProgressBar progress={progress} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
            {[
              ['created', 'ok'],
              ['updated', 'brand'],
              ['unchanged', 'neutral'],
              ['errors', 'danger'],
            ].map(([key, tone]) => {
              const count = key === 'errors' ? preview.errors.length : preview.diff[key].length
              return (
                <div key={key} className="bg-white px-5 py-4">
                  <p className="text-xs font-medium text-muted">{t(`import.counts.${key}`)}</p>
                  <p className={`mt-1 font-heading text-2xl font-bold ${count && tone === 'danger' ? 'text-danger' : 'text-heading'}`}>
                    {count}
                  </p>
                </div>
              )
            })}
          </div>

          {preview.type === 'items' && (
            <p className="border-t border-line bg-cream px-5 py-3 text-sm text-heading">
              {t('import.photoSummary', {
                visible: preview.diff.created.concat(preview.diff.updated, preview.diff.unchanged).filter((record) => record.photoCount > 0).length,
                waiting: preview.diff.created.concat(preview.diff.updated, preview.diff.unchanged).filter((record) => !record.photoCount).length,
              })}
            </p>
          )}

          {preview.errors.length > 0 && (
            <ul className="space-y-1 border-t border-line bg-red-50 px-5 py-3 text-sm text-danger">
              {preview.errors.map((entry) => (
                <li key={`${entry.row}-${entry.value}`}>
                  {t('import.errorRow', { row: entry.row, value: entry.value || '–' })} {t(`import.errors.${entry.message}`)}
                </li>
              ))}
            </ul>
          )}

          {rows.length > 0 && (
            <TableWrap>
              <table className="table border-t border-line">
                <thead>
                  {preview.type === 'items' ? (
                    <tr>
                      <th>{t('import.change')}</th>
                      <th>{t('products.articleNo')}</th>
                      <th>{t('products.product')}</th>
                      <th>{t('products.category')}</th>
                      <th className="num">{t('products.variants')}</th>
                      <th className="num">{t('priceFields.price')}</th>
                      <th className="num">{t('priceFields.price2')}</th>
                      <th>{t('import.photos')}</th>
                    </tr>
                  ) : (
                    <tr>
                      <th>{t('import.change')}</th>
                      <th>{t('customers.number')}</th>
                      <th>{t('customers.company')}</th>
                      <th>{t('customers.priceGroup')}</th>
                      <th>{t('customers.payment')}</th>
                      <th className="num">{t('customers.addresses')}</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {rows.slice(0, PREVIEW_ROWS).map(({ record, change }) => (
                    <tr key={recordKey(preview.type, record)}>
                      <td>
                        <Badge tone={{ created: 'ok', updated: 'brand', unchanged: 'neutral' }[change]}>{t(`import.counts.${change}`)}</Badge>
                      </td>
                      {preview.type === 'items' ? (
                        <>
                          <td className="font-mono text-xs text-heading">{record.articleNo}</td>
                          <td className="min-w-56">
                            <span className="font-medium text-heading">{record.name}</span>
                            {record.blocked && (
                              <span className="ml-2">
                                <Badge tone="danger">{t('products.state.blocked')}</Badge>
                              </span>
                            )}
                          </td>
                          <td>{categoryName(record.category)}</td>
                          <td className="num">{record.variants.length}</td>
                          <td className="num">{formatMoney(Math.min(...record.variants.map((variant) => variant.price)))}</td>
                          <td className="num">{formatMoney(Math.min(...record.variants.map((variant) => variant.price2)))}</td>
                          <td className="whitespace-nowrap">
                            {record.photoCount ? (
                              <Badge tone="ok">{t('import.photosFound', { count: record.photoCount })}</Badge>
                            ) : (
                              <Badge tone="warn">{t('products.state.waiting')}</Badge>
                            )}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="font-semibold text-heading">{record.number}</td>
                          <td className="min-w-56">
                            {[record.billing.firstName, record.billing.lastName].filter(Boolean).join(' ')}
                            <span className="block text-xs text-muted">{record.billing.city}</span>
                          </td>
                          <td>
                            <Badge tone="brand">{record.priceGroup || '–'}</Badge>
                          </td>
                          <td>{t(`payment.${record.paymentCode}`, { defaultValue: record.paymentCode })}</td>
                          <td className="num">{1 + record.shippingAddresses.length}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
          {rows.length > PREVIEW_ROWS && (
            <p className="border-t border-line px-5 py-3 text-xs text-muted">{t('import.moreRows', { count: rows.length - PREVIEW_ROWS })}</p>
          )}
        </section>
      )}

      <section className="card mt-4 overflow-hidden">
        <h2 className="px-5 py-4 text-base">{t('import.history')}</h2>
        {imports.length ? (
          <TableWrap>
            <table className="table">
              <thead>
                <tr>
                  <th>{t('import.date')}</th>
                  <th>{t('import.file')}</th>
                  <th>{t('import.typeLabel')}</th>
                  <th className="num">{t('import.counts.created')}</th>
                  <th className="num">{t('import.counts.updated')}</th>
                  <th className="num">{t('import.counts.errors')}</th>
                </tr>
              </thead>
              <tbody>
                {imports.map((entry) => (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap text-muted">{formatDateTime(entry.date)}</td>
                    <td className="font-medium text-heading">{entry.fileName}</td>
                    <td>{t(`import.type.${entry.type}`)}</td>
                    <td className="num">{entry.created}</td>
                    <td className="num">{entry.updated}</td>
                    <td className={`num ${entry.errors ? 'font-semibold text-danger' : ''}`}>{entry.errors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <EmptyState title={t('import.noHistory')} text={t('import.noHistoryText')} />
        )}
      </section>
    </>
  )
}
