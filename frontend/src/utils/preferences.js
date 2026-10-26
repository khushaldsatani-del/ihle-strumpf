// Display preferences kept in this browser (localStorage). The product list reads them,
// and the account settings page lets the customer choose them in one place.
// localStorage can be unavailable (private mode, blocked site data): then the defaults apply.

const VIEW_KEY = 'ihle_product_view' // 'grid' or 'list'
const PAGE_SIZE_KEY = 'ihle_page_size' // products per page

export const VIEWS = ['grid', 'list']
export const PAGE_SIZES = [8, 12, 24, 48]
export const DEFAULT_PAGE_SIZE = 8

export function readStoredView() {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}

export function storeView(view) {
  try {
    localStorage.setItem(VIEW_KEY, view)
  } catch {
    // not remembered, nothing else to do
  }
}

export function readStoredPageSize() {
  try {
    const stored = Number(localStorage.getItem(PAGE_SIZE_KEY))
    return PAGE_SIZES.includes(stored) ? stored : DEFAULT_PAGE_SIZE
  } catch {
    return DEFAULT_PAGE_SIZE
  }
}

export function storePageSize(size) {
  try {
    localStorage.setItem(PAGE_SIZE_KEY, String(size))
  } catch {
    // not remembered, nothing else to do
  }
}
