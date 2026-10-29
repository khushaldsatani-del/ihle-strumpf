import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { query, transaction } from '../../config/db.js'
import { loginLimiter, requireCustomer } from '../../middleware/auth.js'
import { checkPassword } from '../../utils/passwords.js'
import { CUSTOMER_COOKIE, cookieOptions, createToken } from '../../utils/session.js'
import { STANDARD_VAT_RATE, vatRate } from '../../utils/vat.js'

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
         -- via to_jsonb: also works on a database where migration 003 hasn't run yet (then no translations)
         to_jsonb(p) -> 'translations' AS translations,
         (SELECT json_agg(json_build_object('name', ph.name, 'v', floor(extract(epoch FROM ph.uploaded_at))::bigint) ORDER BY pic.n)
            FROM unnest(p.pictures) WITH ORDINALITY AS pic(file, n)
            JOIN photos ph ON ph.name = lower(regexp_replace(pic.file, '\\.(jpe?g|png|webp|tiff?)$', '', 'i'))) AS photos,
         (SELECT json_agg(json_build_object('sku', v.sku, 'color', v.color, 'colorName', v.color_name, 'size', v.size, 'vat', v.vat)
                          ORDER BY v.sku)
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
  // names and short texts in other languages from NAV, e.g. { en: { name, description } }; German is name/description
  translations: row.translations || {},
  photos: row.photos,
  // the VAT rate in percent instead of NAV's code, for the totals at checkout
  variants: row.variants?.map(({ vat, ...variant }) => ({ ...variant, vatRate: vatRate(vat) })) ?? null,
})

// Catalogue and prices only change with an import or a photo upload, but every visitor asks for them.
// The answers are kept in memory for half a minute and cleared at once by an import or upload on this server
// (clearShopCache, called by the admin routes), so a load of visitors costs one database read per 30 s.
const CACHE_TTL_MS = 30_000
const shopCache = new Map() // 'products:all' | 'products:photos' | 'prices:price' | 'prices:price2' → { at, body }
export const clearShopCache = () => shopCache.clear()

async function cached(key, load) {
  const hit = shopCache.get(key)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.body
  const body = JSON.stringify(await load())
  shopCache.set(key, { at: Date.now(), body })
  return body
}

// ?photos=optional: also articles without an uploaded photo (the shop shows a sample picture for them, as Ihle asked).
// Without it the answer is as before, so a shop version that can't show sample pictures keeps working.
router.get('/products', async (req, res) => {
  const withoutPhotos = req.query.photos === 'optional'
  const body = await cached(withoutPhotos ? 'products:all' : 'products:photos', async () => {
    const { rows } = await query(VISIBLE_PRODUCTS, [BLOCKED_CATEGORIES])
    return {
      products: rows
        .filter((row) => row.variants && (withoutPhotos || row.photos))
        .map((row) => toProduct({ ...row, photos: row.photos || [] })),
    }
  })
  // Short public caching (browsers and Vercel's edge): new imports and photos show up within a minute
  res.set('Cache-Control', 'public, max-age=60, s-maxage=60')
  res.type('json').send(body)
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
  // always a full password check, also for unknown numbers (same response time either way)
  const ok = await checkPassword(password, customer?.password_hash)
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
  // the same list for everyone in a price group, so it's cached per column (Price / Price2)
  const body = await cached(`prices:${column}`, async () => {
    const { rows } = await query(`SELECT sku, ${column} AS price FROM variants WHERE NOT blocked AND price > 0`)
    return { currency: 'EUR', prices: Object.fromEntries(rows.map((row) => [row.sku, Number(row.price)])) }
  })
  res.set('Cache-Control', 'private, no-store')
  res.type('json').send(body)
})

// ---------- order history ----------

// The logged-in customer's own orders, newest first, with each line's product name, colour and size.
// Names come from the database (not the shop catalogue), so lines of articles without a photo still show.
router.get('/orders', requireCustomer, async (req, res) => {
  const { rows } = await query(
    // the newest 200 orders first (index on customer_number), then only their lines: stays fast for customers
    // with years of orders, instead of assembling every order before keeping 200
    `SELECT o.order_no, o.created_at, o.receipt_no, o.billing, o.shipping_address, o.status, o.delivery_note,
            (SELECT json_agg(json_build_object('sku', i.sku, 'amount', i.amount, 'unitPrice', i.unit_price, 'commission', i.commission,
                      'vatRate', i.vat_rate,
                      'productId', replace(v.article_no, ' ', ''), 'name', p.name, 'colorName', v.color_name, 'color', v.color, 'size', v.size)
                      ORDER BY i.line_no)
               FROM order_items i
               LEFT JOIN variants v ON v.sku = i.sku
               LEFT JOIN products p ON p.article_no = v.article_no
              WHERE i.order_no = o.order_no) AS items
       FROM (SELECT * FROM orders WHERE customer_number = $1 ORDER BY created_at DESC LIMIT 200) o
      ORDER BY o.created_at DESC`,
    [req.customer.number],
  )
  res.set('Cache-Control', 'private, no-store')
  res.json({
    orders: rows.map((row) => {
      // vatRate is missing on orders from before migration 004; those had NAV's only rate, 19 %
      const items = row.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        vatRate: item.vatRate == null ? STANDARD_VAT_RATE : Number(item.vatRate),
      }))
      return {
        orderNo: row.order_no,
        date: row.created_at,
        receiptNo: row.receipt_no,
        // NULL shipping address = delivered to the billing address
        delivery: shopAddress(row.shipping_address || row.billing, row.shipping_address ? 'delivery' : 'billing'),
        deliveryNote: row.delivery_note,
        status: row.status,
        items,
        total: Math.round(items.reduce((sum, item) => sum + item.amount * item.unitPrice, 0) * 100) / 100,
      }
    }),
  })
})

// ---------- ordering ----------

const clean = (value, max) => String(value ?? '').trim().slice(0, max)

// Longest "Anmerkung zur Lieferung" (delivery note) a customer can write
export const DELIVERY_NOTE_MAX = 250

// Body: { items: [{ sku, quantity, commission }], delivery: { type: 'billing' | 'saved', id }, receiptNo, deliveryNote }
// Prices are taken from the database for the customer's price group, never from the browser.
// Deliveries go only to the billing address or one of the customer's delivery addresses from NAV (Ihle's wish:
// no addresses typed in at checkout); a note for the delivery goes into deliveryNote instead.
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
    `SELECT v.sku, v.${column} AS price, v.vat FROM variants v JOIN products p ON p.article_no = v.article_no
      WHERE v.sku = ANY($1) AND NOT v.blocked AND v.price > 0 AND NOT p.blocked`,
    [lines.map((line) => line.sku)],
  )
  const priceBySku = new Map(prices.map((row) => [row.sku, Number(row.price)]))
  const vatBySku = new Map(prices.map((row) => [row.sku, vatRate(row.vat)]))
  if (lines.some((line) => !priceBySku.has(line.sku))) return res.status(400).json({ error: 'unavailableItems' })

  const delivery = req.body?.delivery || {}
  let shippingAddress = null
  if (delivery.type === 'saved') {
    shippingAddress = customer.shipping_addresses[Number.parseInt(delivery.id, 10)] || null
    if (!shippingAddress) return res.status(400).json({ error: 'invalidAddress' })
  } else if (delivery.type !== undefined && delivery.type !== 'billing') {
    return res.status(400).json({ error: 'invalidAddress' })
  }

  const order = await transaction(async (client) => {
    const { rows } = await client.query("SELECT nextval('order_no_seq')::text AS order_no")
    const orderNo = rows[0].order_no
    await client.query(
      `INSERT INTO orders (order_no, customer_number, receipt_no, billing, shipping_address, payment_code, delivery_note)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        orderNo,
        customer.number,
        clean(req.body?.receiptNo, 35),
        customer.billing,
        shippingAddress,
        customer.payment_code,
        // only text counts; anything else a client might send (a list, an object) is no note
        typeof req.body?.deliveryNote === 'string' ? clean(req.body.deliveryNote, DELIVERY_NOTE_MAX) : '',
      ],
    )
    await client.query(
      `INSERT INTO order_items (order_no, line_no, sku, amount, unit_price, commission, vat_rate)
       SELECT $1, r.line_no, r.sku, r.amount, r.unit_price, r.commission, r.vat_rate
         FROM jsonb_to_recordset($2::jsonb) AS r(line_no integer, sku text, amount integer, unit_price numeric, commission text, vat_rate numeric)`,
      [
        orderNo,
        JSON.stringify(
          lines.map((line, index) => ({ ...line, line_no: index + 1, unit_price: priceBySku.get(line.sku), vat_rate: vatBySku.get(line.sku) })),
        ),
      ],
    )
    return { orderNo }
  })

  const lineSum = lines.reduce((sum, line) => sum + line.amount * priceBySku.get(line.sku), 0)
  res.status(201).json({ orderNo: order.orderNo, lines: lines.length, lineSum: Math.round(lineSum * 100) / 100 })
})

export default router
