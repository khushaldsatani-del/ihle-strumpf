// Load and stress test for the backend. Only against a TEST backend with a test database (it places orders).
//   API_BASE=http://localhost:5001 CUSTOMER_NUMBER=… CUSTOMER_PASSWORD=… node tests/load/load.mjs [load|stress]
// load:   each scenario for a few seconds with 20 simultaneous users
// stress: raises the number of simultaneous users step by step until responses fail or get too slow
const BASE = process.env.API_BASE || 'http://localhost:5001'
const { CUSTOMER_NUMBER, CUSTOMER_PASSWORD } = process.env
const MODE = process.argv[2] || 'load'
if (/onrender|vercel/.test(BASE)) throw new Error('load tests must not run against the live site')

const percentile = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))] ?? 0

// Runs `request` with `users` parallel loops for `seconds`; returns throughput and latency
async function run(name, users, seconds, request) {
  const times = []
  let errors = 0
  const statuses = {}
  const end = Date.now() + seconds * 1000
  await Promise.all(
    Array.from({ length: users }, async (_, user) => {
      while (Date.now() < end) {
        const started = performance.now()
        try {
          const response = await request(user)
          await response.arrayBuffer()
          statuses[response.status] = (statuses[response.status] || 0) + 1
          if (response.status >= 500 || response.status === 429) errors += 1
        } catch {
          errors += 1
          statuses.network = (statuses.network || 0) + 1
        }
        times.push(performance.now() - started)
      }
    }),
  )
  times.sort((a, b) => a - b)
  const result = {
    scenario: name,
    users,
    requests: times.length,
    perSecond: Math.round(times.length / seconds),
    p50: Math.round(percentile(times, 50)),
    p95: Math.round(percentile(times, 95)),
    p99: Math.round(percentile(times, 99)),
    errors,
    statuses: JSON.stringify(statuses),
  }
  return result
}

const login = async () => {
  const response = await fetch(`${BASE}/api/shop/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ customerNumber: CUSTOMER_NUMBER, password: CUSTOMER_PASSWORD }),
  })
  return response.headers.get('set-cookie').split(';')[0]
}

const catalogue = await (await fetch(`${BASE}/api/shop/products?photos=optional`)).json()
const photos = catalogue.products.flatMap((product) => product.photos)
const skus = catalogue.products.flatMap((product) => product.variants.map((variant) => variant.sku))
const cookie = await login()
const { prices } = await (await fetch(`${BASE}/api/shop/prices`, { headers: { cookie } })).json()
const orderable = skus.filter((sku) => prices[sku] !== undefined)

let counter = 0
const scenarios = {
  catalogue: () => fetch(`${BASE}/api/shop/products?photos=optional`),
  photo: () => {
    const photo = photos[counter++ % photos.length]
    return fetch(`${BASE}/api/photos/thumb/${photo.name}.webp?v=${photo.v}`)
  },
  prices: () => fetch(`${BASE}/api/shop/prices`, { headers: { cookie } }),
  orderHistory: () => fetch(`${BASE}/api/shop/orders`, { headers: { cookie } }),
  placeOrder: () =>
    fetch(`${BASE}/api/shop/orders`, {
      method: 'POST',
      headers: { cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ items: [{ sku: orderable[counter++ % orderable.length], quantity: 1, commission: 'ZZLOAD' }], delivery: { type: 'billing' } }),
    }),
  // a different customer number per request, so the login brake doesn't kick in: measures bcrypt cost
  login: (user) =>
    fetch(`${BASE}/api/shop/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ customerNumber: CUSTOMER_NUMBER, password: CUSTOMER_PASSWORD, _user: user }),
    }),
}

const results = []
if (MODE === 'load') {
  for (const [name, request] of Object.entries(scenarios)) results.push(await run(name, name === 'login' ? 5 : 20, 5, request))
} else {
  // Stress: the catalogue (heaviest public read) and the photo route, doubling the users each step
  for (const name of (process.argv[3] || 'catalogue,photo,placeOrder').split(',')) {
    for (const users of [10, 25, 50, 100, 200, 400]) {
      const result = await run(name, users, 4, scenarios[name])
      results.push(result)
      if (result.errors > result.requests * 0.01 || result.p95 > 5000) break
    }
  }
}
console.table(results)
