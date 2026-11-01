import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import LoadingScreen from '../components/LoadingScreen.jsx'
import { api, apiWithProgress } from '../utils/api.js'
import { DONE_HOLD_MS, SCREEN_DELAY_MS } from '../utils/boot.js'
import { setNavNames } from '../utils/names.js'
import { DataContext, useAuth } from './contexts.js'

// Everything the admin pages show, loaded from the backend (GET /api/admin/data) after login.
// reload() fetches it again after an import or a status change (quietly; the start screen is only for the first load).
const EMPTY = { products: [], customers: [], orders: [], imports: [], photoStats: { total: 0 } }

export default function DataProvider({ children }) {
  const { expire, boot } = useAuth()
  const [data, setData] = useState(EMPTY)
  const [status, setStatus] = useState('loading')
  // The first load continues the start screen where the session check left it (or starts at 0 after the login
  // form). Until the first byte arrives the server is still querying (eased, a quarter of the rest), then the bar
  // follows the bytes received up to 100 %.
  const start = useRef(boot.step === 'done' ? { percent: 0, at: Date.now() } : { percent: boot.percent, at: boot.startedAt })
  const [progress, setProgress] = useState({ percent: start.current.percent, step: 'data', loaded: 0, total: 0 })

  const load = useCallback(
    (onProgress) =>
      (onProgress ? apiWithProgress('/admin/data', onProgress) : api('/admin/data')).then(
        (result) => ({ result }),
        (error) => ({ error }),
      ),
    [],
  )

  const apply = useCallback(
    ({ result, error }) => {
      if (result) {
        setNavNames(result.navNames)
        setData(result)
        setStatus('ready')
      } else if (error.status === 401) expire()
      else setStatus('error')
    },
    [expire],
  )

  const reload = useCallback(async () => apply(await load()), [load, apply])

  // First load after login; ignored if the panel was left before the answer came
  useEffect(() => {
    let active = true
    let hold
    const from = start.current.percent
    const span = 100 - from
    const opened = Date.now()
    let received = false
    const waiting = setInterval(() => {
      const ms = Date.now() - opened
      if (!received) setProgress((current) => ({ ...current, percent: from + span * 0.25 * (1 - Math.exp(-ms / 3000)) }))
    }, 100)
    load((loaded, total) => {
      if (!active) return
      received = true
      // without a size (a proxy dropped the header) the bar stays where it is until the answer is complete
      setProgress((current) => ({
        step: 'data',
        loaded,
        total,
        percent: total ? from + span * (0.25 + 0.75 * Math.min(loaded / total, 1) * 0.999) : current.percent,
      }))
    }).then((outcome) => {
      clearInterval(waiting)
      if (!active) return
      // a shown screen holds 100 % for a moment; a fast start (screen not faded in yet) goes straight on
      if (!outcome.result || Date.now() - start.current.at < SCREEN_DELAY_MS) return apply(outcome)
      setProgress((current) => ({ ...current, percent: 100, step: 'done' }))
      hold = setTimeout(() => active && apply(outcome), DONE_HOLD_MS)
    })
    return () => {
      active = false
      clearInterval(waiting)
      clearTimeout(hold)
    }
  }, [load, apply])

  const markExported = useCallback(
    async (orderNo) => {
      await api(`/admin/orders/${encodeURIComponent(orderNo)}/exported`, { method: 'POST' })
      await reload()
    },
    [reload],
  )

  const value = useMemo(() => {
    const customersByNumber = new Map(data.customers.map((customer) => [customer.number, customer]))
    const variantsBySku = new Map()
    data.products.forEach((product) =>
      product.variants.forEach((variant) => variantsBySku.set(variant.sku, { product, variant })),
    )
    return { ...data, status, customersByNumber, variantsBySku, reload, markExported }
  }, [data, status, reload, markExported])

  if (status === 'loading') return <LoadingScreen {...progress} startedAt={start.current.at} />
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
