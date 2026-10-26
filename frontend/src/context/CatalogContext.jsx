import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { categoryByNav, groupByNav } from '../data/categories.js'
import { fibresOf } from '../data/filters.js'
import { api } from '../utils/api.js'

const CatalogContext = createContext({ status: 'loading', products: [], bySku: new Map(), byId: new Map(), reload: () => {} })

const RETRIES = 4

// Shop form of a product from the backend (/api/shop/products, never with prices).
// colors: one entry per colour in NAV's order, with NAV's German name (shown via colorLabel, in the active language);
// sizes: in SKU order (the size code sorts them correctly).
function toProduct(raw) {
  const category = categoryByNav(raw.category)
  const colors = []
  const sizes = []
  for (const variant of raw.variants) {
    if (!colors.some((color) => color.code === variant.color)) {
      colors.push({ code: variant.color, navName: variant.colorName })
    }
    if (!sizes.includes(variant.size)) sizes.push(variant.size)
  }
  return {
    ...raw,
    category: category?.code ?? null,
    group: groupByNav(category, raw.group)?.code ?? null,
    materials: fibresOf(raw.material),
    colors,
    colorCodes: colors.map((color) => color.code),
    sizes,
  }
}

/**
 * The shop's catalogue: every article that is visible in the shop (imported, not blocked, with a photo).
 * Loaded once per visit; filters, sorting and paging happen in the browser (a few hundred articles at most).
 * status: loading → ready | error. reload() tries again after an error (the visitor's "retry" button).
 */
export function CatalogProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', products: [] })
  const [attempt, setAttempt] = useState(0)

  // If the backend is briefly unreachable (e.g. restarting), try again a few times before giving up,
  // so the shop doesn't stay empty until the visitor reloads the page
  useEffect(() => {
    let active = true
    let timer = 0
    const load = (retry) =>
      api('/shop/products').then(
        (data) => active && setState({ status: 'ready', products: data.products.map(toProduct) }),
        () => {
          if (!active) return
          if (retry < RETRIES) timer = setTimeout(() => load(retry + 1), 1500 * (retry + 1))
          else setState({ status: 'error', products: [] })
        },
      )
    load(0)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [attempt])

  const reload = useCallback(() => {
    setState({ status: 'loading', products: [] })
    setAttempt((count) => count + 1)
  }, [])

  const value = useMemo(() => {
    const bySku = new Map()
    const byId = new Map()
    for (const product of state.products) {
      byId.set(product.id, product)
      for (const variant of product.variants) bySku.set(variant.sku, { product, variant })
    }
    return { ...state, bySku, byId, reload }
  }, [state, reload])

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export const useCatalog = () => useContext(CatalogContext)

// oxlint-disable-next-line react/only-export-components
export const variantOf = (product, color, size) =>
  product.variants.find((variant) => variant.color === color && variant.size === size) ||
  product.variants.find((variant) => variant.color === color) ||
  product.variants[0]

// Photos of one colour (NAV names them <article>_<colour>_<nn>), or all photos when that colour has none
// oxlint-disable-next-line react/only-export-components
export const photosOf = (product, color) => {
  const own = product.photos.filter((photo) => photo.name.split('_')[1] === color)
  return own.length ? own : product.photos
}
