import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../utils/api.js'

// Prices are fetched once per login and shared by every product card on the page
let cache = { number: null, promise: null }

const RETRY_DELAYS = [1000, 3000] // quick retries for a short hiccup (e.g. the server restarting)
const RETRY_LATER = 10000 // after that, the page keeps trying in the background
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchPrices() {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await api('/shop/prices')
    } catch (error) {
      if (attempt >= RETRY_DELAYS.length) throw error
      await wait(RETRY_DELAYS[attempt])
    }
  }
}

function loadPrices(number) {
  if (cache.number !== number) {
    cache = {
      number,
      // a failed request is forgotten, so the next attempt asks again instead of showing "…" for good
      promise: fetchPrices().catch(() => {
        cache = { number: null, promise: null }
        return null
      }),
    }
  }
  return cache.promise
}

/**
 * Net prices of the logged-in customer: { prices: { sku: number }, currency } or null.
 * The backend sends them only with a customer login and picks Price or Price2 by the customer's price group;
 * guests never receive any price data.
 */
export default function usePrices() {
  const { user } = useAuth()
  const number = user?.customerNumber ?? null
  const [data, setData] = useState({ number: null, prices: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!number) return undefined
    let active = true
    let timer
    loadPrices(number).then((prices) => {
      if (!active) return
      setData({ number, prices })
      // Still no prices (server not reachable): the placeholders stay and the page tries again shortly
      if (!prices) timer = setTimeout(() => setAttempt((value) => value + 1), RETRY_LATER)
    })
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [number, attempt])

  return number && data.number === number ? data.prices : null
}

// Lowest price of a product for this customer ("ab 4,41 €" on the cards)
export const lowestPrice = (priceData, product) => {
  const prices = product.variants.map((variant) => priceData?.prices[variant.sku]).filter((price) => price !== undefined)
  return prices.length ? Math.min(...prices) : undefined
}
