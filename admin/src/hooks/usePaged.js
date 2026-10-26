import { useState } from 'react'

// Client-side paging for the long lists (customers, orders, products).
// resetKey: when the search or filters change, jump back to page 1.
export default function usePaged(items, resetKey, pageSize = 20) {
  const [state, setState] = useState({ page: 1, key: resetKey })
  const page = state.key === resetKey ? state.page : 1
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const current = Math.min(page, pageCount)

  return {
    page: current,
    pageCount,
    total: items.length,
    items: items.slice((current - 1) * pageSize, current * pageSize),
    setPage: (next) => setState({ page: next, key: resetKey }),
  }
}
