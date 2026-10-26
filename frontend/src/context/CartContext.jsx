import { createContext, useContext, useMemo, useState } from 'react'
import { useAuth } from './AuthContext.jsx'

const CartContext = createContext({ items: [], count: 0, add: () => {}, update: () => {}, remove: () => {}, clear: () => {} })

// The cart lives in sessionStorage, like the login: it survives a reload and ends with the browser tab.
// AuthContext removes this key on logout.
export const CART_STORAGE_KEY = 'ihle_cart'

function readStoredCart() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(CART_STORAGE_KEY))
    // Lines without a SKU are from the earlier demo products and are dropped
    return Array.isArray(stored) ? stored.filter((item) => item.sku) : []
  } catch {
    return []
  }
}

function storeCart(items) {
  try {
    sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // not remembered, nothing else to do
  }
}

// One order line = SKU (article + colour + size) + Kommission. The same combination is added up.
const lineKey = ({ sku, commission }) => [sku, commission.trim().toLowerCase()].join('|')

function CartStore({ children }) {
  const [items, setItems] = useState(readStoredCart)

  const value = useMemo(() => {
    const save = (next) => {
      setItems(next)
      storeCart(next)
    }

    return {
      items,
      // number of positions in the cart (not the sum of the quantities): 5 of one product and 1 of another = 2
      count: items.length,
      // line: { sku, productId, commission, quantity }
      add: (line) => {
        const key = lineKey(line)
        const existing = items.find((item) => item.key === key)
        save(
          existing
            ? items.map((item) => (item.key === key ? { ...item, quantity: Math.min(item.quantity + line.quantity, 999) } : item))
            : [...items, { ...line, commission: line.commission.trim(), key }],
        )
      },
      update: (key, patch) => save(items.map((item) => (item.key === key ? { ...item, ...patch } : item))),
      remove: (key) => save(items.filter((item) => item.key !== key)),
      clear: () => save([]),
    }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// Cart of the logged-in customer. It starts fresh whenever the login changes (the key remounts the store).
export function CartProvider({ children }) {
  const { user } = useAuth()
  return <CartStore key={user?.customerNumber ?? 'guest'}>{children}</CartStore>
}

// oxlint-disable-next-line react/only-export-components
export const useCart = () => useContext(CartContext)
