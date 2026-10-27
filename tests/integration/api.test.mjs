// Integration and security tests against a running backend with a TEST database (never production).
//   API_BASE=http://localhost:5001 ADMIN_USER=… ADMIN_PASSWORD=… CUSTOMER_NUMBER=… CUSTOMER_PASSWORD=… \
//   ITEMS_XML=path/to/nav_ShopItems.xml node --test tests/integration/api.test.mjs
// Places real orders in that database, so point it only at a test database.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { XMLValidator } from '../../backend/node_modules/fast-xml-parser/src/fxp.js'

const BASE = process.env.API_BASE || 'http://localhost:5001'
const { ADMIN_USER, ADMIN_PASSWORD, CUSTOMER_NUMBER, CUSTOMER_PASSWORD, ITEMS_XML } = process.env
if (/onrender|vercel/.test(BASE)) throw new Error('integration tests must not run against the live site')

async function call(path, { method = 'GET', body, cookie, headers = {}, form } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: { ...(body !== undefined ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}), ...headers },
    body: form || (body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body)),
  })
  const type = response.headers.get('content-type') || ''
  const data = type.includes('json') ? await response.json() : await response.text()
  return { status: response.status, headers: response.headers, data, cookie: response.headers.get('set-cookie')?.split(';')[0] }
}

const customerLogin = async () => (await call('/api/shop/login', { method: 'POST', body: { customerNumber: CUSTOMER_NUMBER, password: CUSTOMER_PASSWORD } })).cookie
const adminLogin = async () => (await call('/api/admin/login', { method: 'POST', body: { username: ADMIN_USER, password: ADMIN_PASSWORD } })).cookie

describe('shop catalogue', () => {
  it('lists only articles with photos for older shop versions, all sellable ones on request', async () => {
    const classic = await call('/api/shop/products')
    const all = await call('/api/shop/products?photos=optional')
    assert.equal(classic.status, 200)
    assert.ok(classic.data.products.every((product) => product.photos.length > 0))
    assert.ok(all.data.products.length > classic.data.products.length)
    assert.ok(all.data.products.every((product) => product.variants.length > 0 && Array.isArray(product.photos)))
  })

  it('carries NAV translations and never any price', async () => {
    const { data } = await call('/api/shop/products?photos=optional')
    const sock = data.products.find((product) => product.id === '40000')
    assert.equal(sock.translations.en.name, 'Diabetic Sock classic')
    assert.ok(!/price/i.test(JSON.stringify(data)), 'prices must never reach guests')
  })
})

describe('customer login and account', () => {
  it('rejects wrong passwords and unknown numbers the same way', async () => {
    const wrong = await call('/api/shop/login', { method: 'POST', body: { customerNumber: CUSTOMER_NUMBER, password: 'wrong-password' } })
    const unknown = await call('/api/shop/login', { method: 'POST', body: { customerNumber: 'ZZ-NOPE', password: 'x' } })
    assert.equal(wrong.status, 401)
    assert.deepEqual(wrong.data, unknown.data)
  })

  it('logs in with an httpOnly, SameSite cookie and shows prices only then', async () => {
    assert.equal((await call('/api/shop/prices')).status, 401)
    const login = await call('/api/shop/login', { method: 'POST', body: { customerNumber: CUSTOMER_NUMBER, password: CUSTOMER_PASSWORD } })
    assert.equal(login.status, 200)
    const raw = login.headers.get('set-cookie')
    assert.match(raw, /HttpOnly/i)
    assert.match(raw, /SameSite=Lax/i)
    const prices = await call('/api/shop/prices', { cookie: login.cookie })
    assert.equal(prices.status, 200)
    assert.ok(Object.keys(prices.data.prices).length > 100)
  })

  it('refuses a forged or altered session cookie', async () => {
    const cookie = await customerLogin()
    const [name, value] = cookie.split('=')
    const [payload] = value.split('.')
    const forged = Buffer.from(JSON.stringify({ role: 'customer', number: 'SOMEONE-ELSE', exp: Date.now() + 1e9 })).toString('base64url')
    assert.equal((await call('/api/shop/me', { cookie: `${name}=${forged}.${value.split('.')[1]}` })).status, 401)
    assert.equal((await call('/api/shop/me', { cookie: `${name}=${payload}.AAAA` })).status, 401)
    assert.equal((await call('/api/shop/me', { cookie: `${name}=garbage` })).status, 401)
  })

  it('a customer session never opens the admin API', async () => {
    const cookie = await customerLogin()
    assert.equal((await call('/api/admin/data', { cookie: cookie.replace('ihle_customer', 'ihle_admin') })).status, 401)
    assert.equal((await call('/api/admin/data', { cookie })).status, 401)
  })
})

describe('orders', () => {
  it('prices every line on the server, whatever the browser sends', async () => {
    const cookie = await customerLogin()
    const { data: priceData } = await call('/api/shop/prices', { cookie })
    const sku = '40 000 001 12'
    const order = await call('/api/shop/orders', {
      method: 'POST',
      cookie,
      body: { items: [{ sku, quantity: 2, commission: 'ZZTEST', unitPrice: 0.01, price: 0 }], delivery: { type: 'billing' } },
    })
    assert.equal(order.status, 201)
    assert.equal(order.data.lineSum, Math.round(priceData.prices[sku] * 2 * 100) / 100)
    const history = await call('/api/shop/orders', { cookie })
    assert.ok(history.data.orders.some((entry) => entry.orderNo === order.data.orderNo))
  })

  it('rejects empty, negative, unknown and blocked lines', async () => {
    const cookie = await customerLogin()
    const post = (items) => call('/api/shop/orders', { method: 'POST', cookie, body: { items, delivery: { type: 'billing' } } })
    assert.equal((await post([])).status, 400)
    assert.equal((await post([{ sku: '40 000 001 12', quantity: 0 }])).status, 400)
    assert.equal((await post([{ sku: '40 000 001 12', quantity: -5 }])).status, 400)
    assert.equal((await post([{ sku: 'NOPE', quantity: 1 }])).status, 400)
    assert.equal((await post([{ sku: "40 000 001 12' OR '1'='1", quantity: 1 }])).status, 400)
    assert.equal((await call('/api/shop/orders', { method: 'POST', body: { items: [{ sku: '40 000 001 12', quantity: 1 }] } })).status, 401)
  })

  it('caps the quantity per line at 999', async () => {
    const cookie = await customerLogin()
    const { data: priceData } = await call('/api/shop/prices', { cookie })
    const order = await call('/api/shop/orders', { method: 'POST', cookie, body: { items: [{ sku: '40 000 001 12', quantity: 100000 }], delivery: { type: 'billing' } } })
    assert.equal(order.status, 201)
    assert.equal(order.data.lineSum, Math.round(priceData.prices['40 000 001 12'] * 999 * 100) / 100)
  })

  it('produces a valid order XML for NAV even with emoji and markup in customer input', async () => {
    const cookie = await customerLogin()
    const order = await call('/api/shop/orders', {
      method: 'POST',
      cookie,
      body: {
        items: [{ sku: '40 000 001 12', quantity: 1, commission: 'Frau 😀 <b>Müller</b>\u0001' }],
        delivery: { type: 'new', address: { company: 'ZZTEST & Söhne <GmbH>', street: 'Weg 1', zip: '01234', city: 'Ort', country: 'DE' } },
      },
    })
    assert.equal(order.status, 201)
    const xml = await call(`/api/admin/orders/${order.data.orderNo}/xml`, { cookie: await adminLogin() })
    assert.equal(xml.status, 200)
    assert.equal(XMLValidator.validate(xml.data), true, 'NAV must be able to read the file')
    assert.match(xml.data, /&#x1F600;/)
    assert.doesNotMatch(xml.data, /<b>/)
  })
})

describe('admin', () => {
  it('needs an admin login for everything but login', async () => {
    for (const path of ['/api/admin/data', '/api/admin/orders/1300100001/xml']) assert.equal((await call(path)).status, 401, path)
    assert.equal((await call('/api/admin/import/preview', { method: 'POST' })).status, 401)
    assert.equal((await call('/api/admin/photos', { method: 'POST' })).status, 401)
  })

  it('sends translations with the products', async () => {
    const { status, data } = await call('/api/admin/data', { cookie: await adminLogin() })
    assert.equal(status, 200)
    assert.equal(data.products.find((product) => product.articleNo === '40 000').translations.en.name, 'Diabetic Sock classic')
  })

  it('previews the new NAV file without changing anything, and refuses a cut-off file', { skip: !ITEMS_XML }, async () => {
    const cookie = await adminLogin()
    const xml = readFileSync(ITEMS_XML)
    const send = (buffer) => {
      const form = new FormData()
      form.append('file', new Blob([buffer], { type: 'text/xml' }), 'nav_ShopItems.xml')
      return call('/api/admin/import/preview', { method: 'POST', cookie, form })
    }
    const preview = await send(xml)
    assert.equal(preview.status, 200)
    assert.equal(preview.data.type, 'items')
    assert.equal(preview.data.rowCount, 2846)
    const cut = await send(xml.subarray(0, Math.floor(xml.length / 2)))
    assert.equal(cut.status, 400)
    assert.equal(cut.data.error, 'invalidXml')
  })
})

describe('security basics', () => {
  it('does not reveal the framework or allow other sites to call the API', async () => {
    const response = await call('/api/health', { headers: { origin: 'https://evil.example' } })
    assert.equal(response.headers.get('x-powered-by'), null)
    assert.equal(response.headers.get('access-control-allow-origin'), null)
  })

  it('photos: no path traversal, odd names are simply not found', async () => {
    for (const name of ['..%2F..%2Fetc%2Fpasswd', '%2e%2e%5cwin.ini', "x'%20OR%201=1--", 'a'.repeat(300)]) {
      const response = await call(`/api/photos/thumb/${name}`)
      assert.equal(response.status, 404, name)
    }
    assert.equal((await call('/api/photos/original/40000_001_01.webp')).status, 404)
  })

  it('SQL-like input in the login is just a wrong login', async () => {
    const response = await call('/api/shop/login', { method: 'POST', body: { customerNumber: "' OR 1=1 --", password: "' OR '1'='1" } })
    assert.equal(response.status, 401)
  })

  it('refuses oversized and malformed JSON', async () => {
    const big = await call('/api/shop/login', { method: 'POST', body: JSON.stringify({ customerNumber: 'x', password: 'y'.repeat(2 * 1024 * 1024) }) })
    assert.equal(big.status, 413)
    const broken = await call('/api/shop/login', { method: 'POST', body: '{"customerNumber": ' })
    assert.equal(broken.status, 400)
    assert.equal(typeof broken.data === 'object' ? broken.data.error : 'html', broken.data.error, 'errors are JSON, never a stack trace')
    assert.doesNotMatch(JSON.stringify(broken.data), /at .*\.js:\d+/)
  })

  it('locks a customer number after repeated wrong passwords', async () => {
    const body = { customerNumber: `ZZLOCK${Date.now()}`, password: 'wrong' }
    const statuses = []
    for (let i = 0; i < 10; i += 1) statuses.push((await call('/api/shop/login', { method: 'POST', body })).status)
    assert.equal(statuses.at(-1), 429)
  })
})
