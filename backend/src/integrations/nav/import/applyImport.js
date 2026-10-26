import { query, transaction } from '../../../config/db.js'
import { photoName } from '../../../modules/photos/photoService.js'
import { parseNavXml } from './parseNavXml.js'

// Import of a NAV file: preview (what would change) and apply (save it). Both start from the same file,
// so the admin's "confirm" sends the file again; nothing is kept between the two requests.
// Rules: SKUs and pictures in the file are added or updated, never deleted (a partial file loses nothing);
// an article is blocked only when all of its SKUs are blocked.

const variantKey = (variant) =>
  `${variant.sku}|${variant.price}|${variant.price2}|${variant.blocked}|${variant.size}|${variant.color}|${variant.colorName}`

async function loadProducts(articleNos) {
  const { rows } = await query(
    `SELECT p.article_no, p.name, p.description, p.category, p.product_group, p.blocked,
            coalesce(json_agg(json_build_object('sku', v.sku, 'color', v.color, 'size', v.size, 'price', v.price,
              'price2', v.price2, 'blocked', v.blocked, 'colorName', v.color_name)) FILTER (WHERE v.sku IS NOT NULL), '[]') AS variants
       FROM products p LEFT JOIN variants v ON v.article_no = p.article_no
      WHERE p.article_no = ANY($1)
      GROUP BY p.article_no`,
    [articleNos],
  )
  return new Map(rows.map((row) => [row.article_no, row]))
}

function productChanged(current, next) {
  if (
    current.name !== next.name ||
    current.description !== next.description ||
    current.category !== next.category ||
    current.product_group !== next.productGroup
  )
    return true
  const stored = new Map(current.variants.map((variant) => [variant.sku, variantKey({ ...variant, price: Number(variant.price), price2: Number(variant.price2) })]))
  return next.variants.some((variant) => stored.get(variant.sku) !== variantKey(variant))
}

async function loadCustomers(numbers) {
  const { rows } = await query(
    'SELECT number, email, price_group, payment_code, billing, shipping_addresses FROM customers WHERE number = ANY($1)',
    [numbers],
  )
  return new Map(rows.map((row) => [row.number, row]))
}

const customerKey = (customer) =>
  JSON.stringify([customer.email, customer.priceGroup, customer.paymentCode, customer.billing, customer.shippingAddresses])

const storedCustomerKey = (row) =>
  JSON.stringify([row.email, row.price_group, row.payment_code, row.billing, row.shipping_addresses])

// What the file would change, without saving anything
export async function previewImport(xml) {
  const parsed = parseNavXml(xml)
  if (!parsed.type) return { error: parsed.error }

  const diff = { created: [], updated: [], unchanged: [] }
  if (parsed.type === 'items') {
    const existing = await loadProducts(parsed.records.map((record) => record.articleNo))
    for (const record of parsed.records) {
      const current = existing.get(record.articleNo)
      if (!current) diff.created.push(record)
      else if (productChanged(current, record)) diff.updated.push(record)
      else diff.unchanged.push(record)
    }
  } else {
    const existing = await loadCustomers(parsed.records.map((record) => record.number))
    for (const record of parsed.records) {
      const current = existing.get(record.number)
      if (!current) diff.created.push(record)
      else if (storedCustomerKey(current) !== customerKey(record)) diff.updated.push(record)
      else diff.unchanged.push(record)
    }
  }
  // For products: how many of their listed pictures are already uploaded (only those articles show in the shop)
  if (parsed.type === 'items') {
    const stems = [...new Set(parsed.records.flatMap((record) => record.pictures.map(photoName)))]
    const { rows } = await query('SELECT name FROM photos WHERE name = ANY($1)', [stems])
    const uploaded = new Set(rows.map((row) => row.name))
    for (const record of parsed.records) record.photoCount = record.pictures.filter((file) => uploaded.has(photoName(file))).length
  }
  return { type: parsed.type, rowCount: parsed.rowCount, errors: parsed.errors, diff }
}

async function saveProducts(client, records) {
  const products = records.map((record) => ({
    article_no: record.articleNo,
    name: record.name,
    description: record.description,
    category: record.category,
    product_group: record.productGroup,
    material: record.material,
    unit: record.unit,
    pictures: record.pictures,
  }))
  await client.query(
    `INSERT INTO products (article_no, name, description, category, product_group, material, unit, pictures, source, updated_at)
     SELECT r.article_no, r.name, r.description, r.category, r.product_group, r.material, r.unit,
            ARRAY(SELECT jsonb_array_elements_text(r.pictures)), 'import', now()
       FROM jsonb_to_recordset($1::jsonb) AS r(article_no text, name text, description text, category text,
            product_group text, material text, unit text, pictures jsonb)
     ON CONFLICT (article_no) DO UPDATE SET
       name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category,
       product_group = EXCLUDED.product_group, material = EXCLUDED.material, unit = EXCLUDED.unit,
       pictures = products.pictures || ARRAY(SELECT p FROM unnest(EXCLUDED.pictures) AS p WHERE p <> ALL (products.pictures)),
       source = 'import', updated_at = now()`,
    [JSON.stringify(products)],
  )

  const variants = records.flatMap((record) => record.variants.map((variant) => ({ ...variant, article_no: record.articleNo })))
  await client.query(
    `INSERT INTO variants (sku, article_no, color, color_name, size, price, price2, vat, blocked, updated_at)
     SELECT r.sku, r.article_no, r.color, coalesce(r."colorName", ''), r.size, r.price, r.price2, r.vat, r.blocked, now()
       FROM jsonb_to_recordset($1::jsonb) AS r(sku text, article_no text, color text, "colorName" text, size text,
            price numeric, price2 numeric, vat text, blocked boolean)
     ON CONFLICT (sku) DO UPDATE SET
       article_no = EXCLUDED.article_no, color = EXCLUDED.color, color_name = EXCLUDED.color_name,
       size = EXCLUDED.size, price = EXCLUDED.price,
       price2 = EXCLUDED.price2, vat = EXCLUDED.vat, blocked = EXCLUDED.blocked, updated_at = now()`,
    [JSON.stringify(variants)],
  )

  await client.query(
    `UPDATE products p SET blocked = sub.all_blocked
       FROM (SELECT article_no, bool_and(blocked) AS all_blocked FROM variants WHERE article_no = ANY($1) GROUP BY article_no) sub
      WHERE p.article_no = sub.article_no`,
    [records.map((record) => record.articleNo)],
  )
}

async function saveCustomers(client, records) {
  const customers = records.map((record) => ({
    number: record.number,
    email: record.email,
    price_group: record.priceGroup,
    customer_group: record.group,
    payment_code: record.paymentCode,
    payment_method: record.paymentMethod,
    shipping_agent: record.shippingAgent,
    billing: record.billing,
    shipping_addresses: record.shippingAddresses,
  }))
  // The shop password is never touched by an import
  await client.query(
    `INSERT INTO customers (number, email, price_group, customer_group, payment_code, payment_method, shipping_agent,
                            billing, shipping_addresses, source, updated_at)
     SELECT r.number, r.email, r.price_group, r.customer_group, r.payment_code, r.payment_method, r.shipping_agent,
            r.billing, r.shipping_addresses, 'import', now()
       FROM jsonb_to_recordset($1::jsonb) AS r(number text, email text, price_group text, customer_group text,
            payment_code text, payment_method text, shipping_agent text, billing jsonb, shipping_addresses jsonb)
     ON CONFLICT (number) DO UPDATE SET
       email = EXCLUDED.email, price_group = EXCLUDED.price_group, customer_group = EXCLUDED.customer_group,
       payment_code = EXCLUDED.payment_code, payment_method = EXCLUDED.payment_method,
       shipping_agent = EXCLUDED.shipping_agent, billing = EXCLUDED.billing,
       shipping_addresses = EXCLUDED.shipping_addresses, source = 'import', updated_at = now()`,
    [JSON.stringify(customers)],
  )
}

// Saves the file's new and changed records in one transaction and logs the run
export async function applyImport(xml, { fileName, admin }) {
  const preview = await previewImport(xml)
  if (preview.error) return preview

  const changed = [...preview.diff.created, ...preview.diff.updated]
  const run = await transaction(async (client) => {
    if (changed.length) {
      if (preview.type === 'items') await saveProducts(client, changed)
      else await saveCustomers(client, changed)
    }
    const { rows } = await client.query(
      `INSERT INTO import_runs (file_name, type, created, updated, unchanged, errors, admin)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [fileName, preview.type, preview.diff.created.length, preview.diff.updated.length, preview.diff.unchanged.length, preview.errors.length, admin],
    )
    return rows[0]
  })
  return { ...preview, run }
}
