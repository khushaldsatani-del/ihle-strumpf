import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../utils/api.js'
import { DataContext, useAuth } from './contexts.js'

// Everything the admin pages show, loaded from the backend (GET /api/admin/data) after login.
// reload() fetches it again after an import or a status change.
const EMPTY = { products: [], customers: [], orders: [], imports: [], photoStats: { total: 0 } }

export default function DataProvider({ children }) {
  const { expire } = useAuth()
  const [data, setData] = useState(EMPTY)
  const [status, setStatus] = useState('loading')

  const load = useCallback(
    () =>
      api('/admin/data').then(
        (result) => ({ result }),
        (error) => ({ error }),
      ),
    [],
  )

  const apply = useCallback(
    ({ result, error }) => {
      if (result) {
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
    load().then((outcome) => active && apply(outcome))
    return () => {
      active = false
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

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
