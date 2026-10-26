import bcrypt from 'bcryptjs'
import { Router } from 'express'
import multer from 'multer'
import { gunzipSync } from 'node:zlib'
import { query } from '../../config/db.js'
import { applyImport, previewImport } from '../../integrations/nav/import/applyImport.js'
import { buildOrderXml } from '../../integrations/nav/export/orderXml.js'
import { loginLimiter, requireAdmin } from '../../middleware/auth.js'
import { savePhoto } from '../photos/photoService.js'
import { ADMIN_COOKIE, cookieOptions, createToken } from '../../utils/session.js'

// Admin API (phase 1, Ihle's brief): log in, check imported articles, customers and orders,
// upload NAV files, download order XML. Every route except login needs an admin session.
const router = Router()

// Vercel accepts request bodies up to ~4.5 MB, so the admin panel gzips XML files before sending
// (a NAV export shrinks to about a tenth) and sends photos in small batches
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024, files: 1 } })
const photoUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024, files: 20 } })
const MAX_XML_BYTES = 100 * 1024 * 1024

router.post('/login', async (req, res) => {
  const username = String(req.body?.username || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  const key = `admin:${username}:${req.ip}`
  if (loginLimiter.blocked(key)) return res.status(429).json({ error: 'tooManyAttempts' })

  const { rows } = await query('SELECT username, name, password_hash FROM admin_users WHERE username = $1', [username])
  const ok = rows[0] && (await bcrypt.compare(password, rows[0].password_hash))
  if (!ok) {
    loginLimiter.fail(key)
    return res.status(401).json({ error: 'wrongCredentials' })
  }
  loginLimiter.reset(key)
  const user = { role: 'admin', username: rows[0].username, name: rows[0].name }
  res.cookie(ADMIN_COOKIE, createToken(user), cookieOptions())
  res.json({ user })
})

router.post('/logout', (req, res) => {
  res.clearCookie(ADMIN_COOKIE, { ...cookieOptions(), maxAge: undefined })
  res.json({ ok: true })
})

router.use(requireAdmin)

router.get('/me', (req, res) => {
  res.json({ user: { username: req.admin.username, name: req.admin.name } })
})

// Everything the admin pages show, in one request. Fine for the test phase (hundreds of articles and
// customers); when the order history grows, orders move to their own paged endpoint.
router.get('/data', async (req, res) => {
  const [products, customers, orders, imports, photoStats] = await Promise.all([
    // photos: the article's NAV pictures that are uploaded, in NAV's order, with a version for cache-busting
    query(
      `SELECT p.*,
              coalesce(json_agg(json_build_object('sku', v.sku, 'color', v.color, 'colorName', v.color_name, 'size', v.size,
                'price', v.price, 'price2', v.price2, 'vat', v.vat, 'blocked', v.blocked) ORDER BY v.sku)
                FILTER (WHERE v.sku IS NOT NULL), '[]') AS variants,
              (SELECT coalesce(json_agg(json_build_object('name', ph.name, 'v', floor(extract(epoch FROM ph.uploaded_at))::bigint)
                        ORDER BY pic.n), '[]')
                 FROM unnest(p.pictures) WITH ORDINALITY AS pic(file, n)
                 JOIN photos ph ON ph.name = lower(regexp_replace(pic.file, '\\.(jpe?g|png|webp|tiff?)$', '', 'i'))) AS photos
         FROM products p LEFT JOIN variants v ON v.article_no = p.article_no
        GROUP BY p.article_no ORDER BY p.article_no`,
    ),
    query('SELECT * FROM customers ORDER BY number'),
    query(
      `SELECT o.*, json_agg(json_build_object('sku', i.sku, 'amount', i.amount, 'unitPrice', i.unit_price,
              'commission', i.commission) ORDER BY i.line_no) AS items
         FROM orders o JOIN order_items i ON i.order_no = o.order_no
        GROUP BY o.order_no ORDER BY o.created_at DESC`,
    ),
    query('SELECT * FROM import_runs ORDER BY created_at DESC LIMIT 50'),
    query(`SELECT count(*)::int AS total, max(uploaded_at) AS last FROM photos`),
  ])

  res.json({
    products: products.rows.map((row) => ({
      articleNo: row.article_no,
      name: row.name,
      description: row.description,
      category: row.category,
      productGroup: row.product_group,
      material: row.material,
      unit: row.unit,
      pictures: row.pictures,
      photos: row.photos,
      variants: row.variants.map((variant) => ({ ...variant, price: Number(variant.price), price2: Number(variant.price2) })),
      blocked: row.blocked,
      source: row.source,
      updatedAt: row.updated_at,
    })),
    customers: customers.rows.map((row) => ({
      number: row.number,
      email: row.email,
      priceGroup: row.price_group,
      group: row.customer_group,
      paymentCode: row.payment_code,
      paymentMethod: row.payment_method,
      shippingAgent: row.shipping_agent,
      salesperson: row.salesperson,
      vatId: row.vat_id,
      billing: row.billing,
      shippingAddresses: row.shipping_addresses,
      hasLogin: Boolean(row.password_hash),
      source: row.source,
      updatedAt: row.updated_at,
    })),
    orders: orders.rows.map((row) => ({
      orderNo: row.order_no,
      date: row.created_at,
      customerNumber: row.customer_number,
      receiptNo: row.receipt_no,
      billing: row.billing,
      shippingAddress: row.shipping_address,
      shippingCost: Number(row.shipping_cost),
      items: row.items.map((item) => ({ ...item, unitPrice: Number(item.unitPrice) })),
      status: row.status,
    })),
    imports: imports.rows.map((row) => ({
      id: row.id,
      date: row.created_at,
      fileName: row.file_name,
      type: row.type,
      created: row.created,
      updated: row.updated,
      unchanged: row.unchanged,
      errors: row.errors,
    })),
    photoStats: photoStats.rows[0],
  })
})

// The uploaded XML as text; gzip-compressed uploads (starting with 1f 8b) are unpacked, with a size cap
function readUpload(req) {
  if (!req.file) return null
  const buffer = req.file.buffer
  const gzipped = buffer[0] === 0x1f && buffer[1] === 0x8b
  return (gzipped ? gunzipSync(buffer, { maxOutputLength: MAX_XML_BYTES }) : buffer).toString('utf8')
}

// The original file name, without the .gz the admin panel adds when it compresses
const uploadName = (req) => req.file.originalname.replace(/\.gz$/i, '')

router.post('/import/preview', upload.single('file'), async (req, res) => {
  const xml = readUpload(req)
  if (!xml) return res.status(400).json({ error: 'noFile' })
  const result = await previewImport(xml)
  if (result.error) return res.status(400).json({ error: result.error })
  res.json(result)
})

router.post('/import/confirm', upload.single('file'), async (req, res) => {
  const xml = readUpload(req)
  if (!xml) return res.status(400).json({ error: 'noFile' })
  const result = await applyImport(xml, { fileName: uploadName(req), admin: req.admin.username })
  if (result.error) return res.status(400).json({ error: result.error })
  res.json({ run: result.run })
})

// Product photos, a few per request; each is resized and stored. Returns one result per file.
router.post('/photos', photoUpload.array('files', 20), async (req, res) => {
  const files = req.files || []
  if (!files.length) return res.status(400).json({ error: 'noFile' })
  const results = []
  for (const file of files) results.push(await savePhoto(file.originalname, file.buffer))
  res.json({ results })
})

async function loadOrder(orderNo) {
  const { rows } = await query(
    `SELECT o.*, c.email, c.salesperson, c.vat_id,
            json_agg(json_build_object('sku', i.sku, 'amount', i.amount, 'unitPrice', i.unit_price, 'commission', i.commission)
                     ORDER BY i.line_no) AS items
       FROM orders o JOIN customers c ON c.number = o.customer_number JOIN order_items i ON i.order_no = o.order_no
      WHERE o.order_no = $1 GROUP BY o.order_no, c.number`,
    [orderNo],
  )
  return rows[0]
}

// The order as NAV's XML file, for the manual import while the shop runs on Vercel (no SFTP there)
router.get('/orders/:orderNo/xml', async (req, res) => {
  const row = await loadOrder(req.params.orderNo)
  if (!row) return res.status(404).json({ error: 'notFound' })
  const xml = buildOrderXml(
    {
      orderNo: row.order_no,
      createdAt: row.created_at,
      receiptNo: row.receipt_no,
      billing: row.billing,
      shippingAddress: row.shipping_address,
      paymentCode: row.payment_code,
      shippingCost: Number(row.shipping_cost),
      items: row.items.map((item) => ({ ...item, unitPrice: Number(item.unitPrice) })),
    },
    { number: row.customer_number, email: row.email, salesperson: row.salesperson, vatId: row.vat_id },
  )
  res.type('application/xml').attachment(`${row.order_no}.xml`).send(xml)
})

router.post('/orders/:orderNo/exported', async (req, res) => {
  const { rowCount } = await query(
    "UPDATE orders SET status = 'exported', exported_at = now() WHERE order_no = $1 AND status = 'new'",
    [req.params.orderNo],
  )
  res.json({ ok: true, changed: rowCount })
})

export default router
