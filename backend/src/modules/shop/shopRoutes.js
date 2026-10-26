import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { query, transaction } from '../../config/db.js'
import { loginLimiter, requireCustomer } from '../../middleware/auth.js'
import { CUSTOMER_COOKIE, cookieOptions, createToken } from '../../utils/session.js'

// Shop API. The catalogue is public and never contains prices; prices, the customer's addresses and
// ordering need a customer login (Ihle's rule: prices are never sent to guests).
const router = Router()

// Which NAV price a price group sees (confirmed by Ihle): VK01 → Price, VK02 → Price2
const PRICE_COLUMN = { VK01: 'price', VK02: 'price2' }
const priceColumn = (priceGroup) => PRICE_COLUMN[priceGroup] || 'price'

// Categories NAV blocks completely ("gesperrt" in Stammdaten.xlsx)
const BLOCKED_CATEGORIES = ['BUSINESS S']

// Shown in the shop: not blocked, at least one uploaded photo, and only SKUs that are sellable
// (not blocked, price above 0 – price 0 marks NAV-internal entries)
const VISIBLE_PRODUCTS = `
  SELECT p.article_no, p.name, p.description, p.category, p.product_group, p.material, p.unit,
         (SELECT json_agg(json_build_object('name', ph.name, 'v', floor(extract(epoch FROM ph.uploaded_at))::bigint) ORDER BY pic.n)
            FROM unnest(p.pictures) WITH ORDINALITY AS pic(file, n)
            JOIN photos ph ON ph.name = lower(regexp_replace(pic.file, '\\.(jpe?g|png|webp|tiff?)$', '', 'i'))) AS photos,
         (SELECT json_agg(json_build_object('sku', v.sku, 'color', v.color, 'colorName', v.color_name, 'size', v.size) ORDER BY v.sku)
            FROM variants v WHERE v.article_no = p.article_no AND NOT v.blocked AND v.price > 0) AS variants
    FROM products p
   WHERE NOT p.blocked AND NOT (p.category = ANY($1))`

const toProduct = (row) => ({
  id: row.article_no.replace(/\s+/g, ''),
  articleNo: row.article_no,
  name: row.name,
  description: row.description,
  category: row.category,
  group: row.product_group,
  material: row.material,
  unit: row.unit,
  photos: row.photos,
  variants: row.variants,
})

router.get('/products', async (req, res) => {
  const { rows } = await query(VISIBLE_PRODUCTS, [BLOCKED_CATEGORIES])
  // Short public caching: new imports and photos show up within a minute
  res.set('Cache-Control', 'public, max-age=60')
  res.json({ products: rows.filter((row) => row.photos && row.variants).map(toProduct) })
})

// ---------- customer login ----------

// NAV writes the company name into Firstname + Lastname (two lines)
const companyName = (billing) => [billing.firstName, billing.lastName].filter(Boolean).join(' ')

// Addresses as the shop shows them; delivery addresses get a stable id (their position in NAV's list)
const shopAddress = (address, id) => ({
  id,
  company: companyName(address),
  street: address.street,
  zip: address.postcode,
  city: address.city,
  country: address.country,
  phone: address.phone || '',
})

async function loadCustomer(number) {
  const { rows } = await query('SELECT * FROM customers WHERE number = $1', [number])
  return rows[0]
}

const toUser = (row) => ({
  customerNumber: row.number,
  company: companyName(row.billing),
  email: row.email,
  billingAddress: shopAddress(row.billing, 'billing'),
  shippingAddresses: row.shipping_addresses.map((address, index) => shopAddress(address, String(index))),
  payment: row.payment_code || row.payment_method,
  shippingAgent: row.shipping_agent || 'GLS',
})

router.post('/login', async (req, res) => {
  const number = String(req.body?.customerNumber || '').trim()
  const password = String(req.body?.password || '')
  const key = `customer:${number}:${req.ip}`
  if (loginLimiter.blocked(key)) return res.status(429).json({ error: 'tooManyAttempts' })

  const customer = number && (await loadCustomer(number))
  // Same answer for an unknown number, no shop access yet, or a wrong password
  const ok = customer?.password_hash && (await bcrypt.compare(password, customer.password_hash))
  if (!ok) {
    loginLimiter.fail(key)
    return res.status(401).json({ error: 'wrongCredentials' })
  }
  loginLimiter.reset(key)
  res.cookie(CUSTOMER_COOKIE, createToken({ role: 'customer', number: customer.number }), cookieOptions())
  res.json({ user: toUser(customer) })
})

router.post('/logout', (req, res) => {
  res.clearCookie(CUSTOMER_COOKIE, { ...cookieOptions(), maxAge: undefined })
  res.json({ ok: true })
})

router.get('/me', requireCustomer, async (req, res) => {
  const customer = await loadCustomer(req.customer.number)
  if (!customer?.password_hash) return res.status(401).json({ error: 'notLoggedIn' })
  res.json({ user: toUser(customer) })
})

// The customer changes their own shop password (account settings). The current password is required,
// and wrong attempts count towards the same lockout as the login.
router.post('/password', requireCustomer, async (req, res) => {
  const currentPassword = String(req.body?.currentPassword || '')
  const newPassword = String(req.body?.newPassword || '')
  const key = `customer:${req.customer.number}:${req.ip}`
  if (loginLimiter.blocked(key)) return res.status(429).json({ error: 'tooManyAttempts' })
  if (newPassword.length < 8 || newPassword.length > 200) return res.status(400).json({ error: 'passwordTooShort' })

  const customer = await loadCustomer(req.customer.number)
  if (!customer?.password_hash) return res.status(401).json({ error: 'notLoggedIn' })
  if (!(await bcrypt.compare(currentPassword, customer.password_hash))) {
    loginLimiter.fail(key)
    return res.status(400).json({ error: 'wrongPassword' })
  }
  if (await bcrypt.compare(newPassword, customer.password_hash)) return res.status(400).json({ error: 'samePassword' })

  loginLimiter.reset(key)
  await query('UPDATE customers SET password_hash = $2, updated_at = now() WHERE number = $1', [customer.number, await bcrypt.hash(newPassword, 12)])
  res.json({ ok: true })
})

// The logged-in customer's net price per SKU, from their price group
router.get('/prices', requireCustomer, async (req, res) => {
  const customer = await loadCustomer(req.customer.number)
  if (!customer) return res.status(401).json({ error: 'notLoggedIn' })
  const column = priceColumn(customer.price_group)
  const { rows } = await query(`SELECT sku, ${column} AS price FROM variants WHERE NOT blocked AND price > 0`)
  res.set('Cache-Control', 'private, no-store')
  res.json({ currency: 'EUR', prices: Object.fromEntries(rows.map((row) => [row.sku, Number(row.price)])) })
})

// ---------- order history ----------

// The logged-in customer's own orders, newest first, with each line's product name, colour and size.
// Names come from the database (not the shop catalogue), so lines of articles without a photo still show.
router.get('/orders', requireCustomer, async (req, res) => {
  const { rows } = await query(
    `SELECT o.order_no, o.created_at, o.receipt_no, o.billing, o.shipping_address, o.status,
            json_agg(json_build_object('sku', i.sku, 'amount', i.amount, 'unitPrice', i.unit_price, 'commission', i.commission,
              'productId', replace(v.article_no, ' ', ''), 'name', p.name, 'colorName', v.color_name, 'color', v.color, 'size', v.size)
              ORDER BY i.line_no) AS items
       FROM orders o
       JOIN order_items i ON i.order_no = o.order_no
       LEFT JOIN variants v ON v.sku = i.sku
       LEFT JOIN products p ON p.article_no = v.article_no
      WHERE o.customer_number = $1
      GROUP BY o.order_no
      ORDER BY o.created_at DESC
      LIMIT 200`,
    [req.customer.number],
  )
  res.set('Cache-Control', 'private, no-store')
  res.json({
    orders: rows.map((row) => {
      const items = row.items.map((item) => ({ ...item, unitPrice: Number(item.unitPrice) }))
      return {
        orderNo: row.order_no,
        date: row.created_at,
        receiptNo: row.receipt_no,
        // NULL shipping address = delivered to the billing address
        delivery: shopAddress(row.shipping_address || row.billing, row.shipping_address ? 'delivery' : 'billing'),
        status: row.status,
        items,
        total: Math.round(items.reduce((sum, item) => sum + item.amount * item.unitPrice, 0) * 100) / 100,
      }
    }),
  })
})

// ---------- ordering ----------

const clean = (value, max) => String(value ?? '').trim().slice(0, max)

// A new delivery address typed in at checkout, in NAV's address shape
function newAddress(input) {
  const address = {
    company: clean(input?.company, 100),
    street: clean(input?.street, 100),
    postcode: clean(input?.zip, 20),
    city: clean(input?.city, 60),
    country: clean(input?.country, 40),
  }
  if (!address.company || !address.street || !address.postcode || !address.city || !address.country) return null
  return { ...address, firstName: address.company, lastName: '', phone: '' }
}

// Body: { items: [{ sku, quantity, commission }], delivery: { type: 'billing' | 'saved' | 'new', id, address }, receiptNo }
// Prices are taken from the database for the customer's price group, never from the browser.
router.post('/orders', requireCustomer, async (req, res) => {
  const customer = await loadCustomer(req.customer.number)
  if (!customer?.password_hash) return res.status(401).json({ error: 'notLoggedIn' })

  const items = Array.isArray(req.body?.items) ? req.body.items.slice(0, 200) : []
  const lines = items.map((item) => ({
    sku: clean(item?.sku, 40),
    amount: Math.min(Math.max(Number.parseInt(item?.quantity, 10) || 0, 0), 999),
    commission: clean(item?.commission, 30),
  }))
  if (!lines.length || lines.some((line) => !line.sku || line.amount < 1)) return res.status(400).json({ error: 'invalidItems' })

  const column = priceColumn(customer.price_group)
  const { rows: prices } = await query(
    `SELECT v.sku, v.${column} AS price FROM variants v JOIN products p ON p.article_no = v.article_no
      WHERE v.sku = ANY($1) AND NOT v.blocked AND v.price > 0 AND NOT p.blocked`,
    [lines.map((line) => line.sku)],
  )
  const priceBySku = new Map(prices.map((row) => [row.sku, Number(row.price)]))
  if (lines.some((line) => !priceBySku.has(line.sku))) return res.status(400).json({ error: 'unavailableItems' })

  const delivery = req.body?.delivery || {}
  let shippingAddress = null
  if (delivery.type === 'saved') {
    shippingAddress = customer.shipping_addresses[Number.parseInt(delivery.id, 10)] || null
    if (!shippingAddress) return res.status(400).json({ error: 'invalidAddress' })
  } else if (delivery.type === 'new') {
    shippingAddress = newAddress(delivery.address)
    if (!shippingAddress) return res.status(400).json({ error: 'invalidAddress' })
  }

  const order = await transaction(async (client) => {
    const { rows } = await client.query("SELECT nextval('order_no_seq')::text AS order_no")
    const orderNo = rows[0].order_no
    await client.query(
      `INSERT INTO orders (order_no, customer_number, receipt_no, billing, shipping_address, payment_code)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [orderNo, customer.number, clean(req.body?.receiptNo, 35), customer.billing, shippingAddress, customer.payment_code],
    )
    await client.query(
      `INSERT INTO order_items (order_no, line_no, sku, amount, unit_price, commission)
       SELECT $1, r.line_no, r.sku, r.amount, r.unit_price, r.commission
         FROM jsonb_to_recordset($2::jsonb) AS r(line_no integer, sku text, amount integer, unit_price numeric, commission text)`,
      [orderNo, JSON.stringify(lines.map((line, index) => ({ ...line, line_no: index + 1, unit_price: priceBySku.get(line.sku) })))],
    )
    return { orderNo }
  })

  const lineSum = lines.reduce((sum, line) => sum + line.amount * priceBySku.get(line.sku), 0)
  res.status(201).json({ orderNo: order.orderNo, lines: lines.length, lineSum: Math.round(lineSum * 100) / 100 })
})

export default router
