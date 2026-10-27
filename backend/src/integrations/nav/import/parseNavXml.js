import { XMLParser, XMLValidator } from 'fast-xml-parser'

// Reads NAV's two export files: nav_ShopItems.xml (products) and nav_ShopCustomers.xml (customers).
// The type is recognised by the root element. The format is fixed by Ihle's NAV export.
//
// A product's <Name> has 4–5 lines, e.g.
//   Diabetiker Socke klassisch              ← article name
//   Umhängerand, ohne Gummi, gekettelt      ← short description (optional; sometimes holds colour/size)
//   Größe: 35-38                            ← readable size ("11-12cm", "6cm"; the Size attribute is often empty)
//   Farbe: schwarz                          ← colour name (NAV sends only the code in the attributes)
//   (PAAR)                                  ← unit
//
// Since October 2026 each item may also carry <Translations>: per NAV language code (DEU, ENU, FRA, ESP, …)
// a <Description> (name, often with the colour: "ABS Sock Frottee, black") and a <Description2> (short text).
// German stays as read from <Name>: NAV cuts the German Description off at 30 characters.

// Elements that can repeat are always arrays, even when a file has only one
const ARRAYS = new Set([
  'ShopItem', 'Picture', 'ItemTextLine', 'SubItem', 'Attribute', 'Translation', 'Customer', 'PaymentCode', 'BillingAddress', 'ShippingAddress',
])

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  // Keep every value as text: SKUs have spaces, postcodes can start with 0
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  isArray: (name) => ARRAYS.has(name),
})

const SIZE_BY_CODE = { 12: '35-38', 13: '39-42', 14: '43-46', 15: '47-50' }
const text = (value) => (value === undefined || value === null || typeof value === 'object' ? '' : String(value).trim())

// "40 000 001 12" → article "40 000", colour "001", size code "12"
export function parseSku(sku) {
  const parts = text(sku).split(/\s+/)
  if (parts.length !== 4 || !/^\d+$/.test(parts[0] + parts[1] + parts[2])) return null
  return { article: `${parts[0]} ${parts[1]}`, color: parts[2], sizeCode: parts[3] }
}

function readName(raw) {
  const lines = text(raw)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const field = (label) => lines.find((line) => line.startsWith(`${label}:`))?.slice(label.length + 1).trim() || ''
  const unit = lines.find((line) => /^\(.+\)$/.test(line))?.slice(1, -1) || ''
  // Line 2 is a description only when it isn't one of the labelled lines
  const second = lines[1] && !/^(Größe:|Farbe:|\()/.test(lines[1]) ? lines[1] : ''
  return { title: lines[0] || '', second, size: field('Größe'), colorName: field('Farbe'), unit }
}

// Comparable form of a description part: "Länge 40 cm" and "Länge 40cm" are the same
const normalisePart = (part) => part.toLowerCase().replace(/\s+/g, '')

// The article description is what all its SKUs share in line 2, minus size/colour bits that differ per SKU
// ("natur, Größe 35-38" → nothing; "Umhängerand, ohne Gummi, gekettelt" → kept as it is)
function commonDescription(seconds) {
  const split = (line) => line.split(',').map((part) => part.trim()).filter(Boolean)
  const [first, ...rest] = seconds.filter(Boolean).map(split)
  if (!first) return ''
  const shared = first.filter((part) =>
    !/^größe\b/i.test(part) && rest.every((parts) => parts.some((other) => normalisePart(other) === normalisePart(part))),
  )
  return shared.join(', ')
}

// The most frequent value, e.g. the article name when a few SKUs spell it slightly differently
function mostCommon(values) {
  const counts = new Map()
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1))
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || ''
}

// NAV language codes → the shop's language codes. German is not taken from here (see above).
const NAV_LANGUAGES = { ENU: 'en', ENG: 'en', FRA: 'fr', ESP: 'es', ITA: 'it', NLD: 'nl', SVE: 'sv', RUS: 'ru', DAN: 'da', NOR: 'no', PLK: 'pl', CSY: 'cs' }
export const shopLanguage = (navCode) => {
  const code = text(navCode).toUpperCase()
  if (!code || code === 'DEU') return null
  return NAV_LANGUAGES[code] || code.toLowerCase()
}

// An article's name in one language from its SKUs' descriptions: the comma parts all of them share
// ("ABS Sock Frottee, black" + "ABS Sock Frottee, beige" → "ABS Sock Frottee"); if they share none, the most common one
function commonName(values) {
  const names = values.filter(Boolean)
  return commonDescription(names) || mostCommon(names)
}

// { en: { name, description }, fr: { … } } for one article; languages without a name are left out
function articleTranslations(byLanguage) {
  const result = {}
  for (const [language, { names, descriptions }] of byLanguage) {
    const name = commonName(names)
    if (name) result[language] = { name, description: commonDescription(descriptions) }
  }
  return result
}

function parseItems(items) {
  const errors = []
  const articles = new Map()

  items.forEach((item, index) => {
    const sku = text(item.SKU)
    const parsed = parseSku(sku)
    if (!parsed) return errors.push({ row: index + 1, value: sku, message: 'invalidSku' })

    const sub = item.ShopItemType?.SubItem?.[0] || {}
    const attributes = sub.Attributes?.Attribute || []
    const attribute = (name) => text(attributes.find((entry) => entry.name === name)?.value)
    const price = Number.parseFloat(text(sub.Price))
    const price2 = Number.parseFloat(text(sub.Price2))
    if (Number.isNaN(price)) return errors.push({ row: index + 1, value: sku, message: 'missingPrice' })

    const name = readName(item.Name)
    if (!articles.has(parsed.article)) {
      articles.set(parsed.article, {
        articleNo: parsed.article,
        titles: [],
        seconds: [],
        category: text(item.ItemCategorie),
        productGroup: text(item.ProductGroup),
        material: (item.ItemShortText?.ItemTextLine || []).map((line) => text(line.value)).filter(Boolean).join(' · '),
        unit: attribute('UnitOfMeasure') || name.unit,
        pictures: [],
        variants: [],
        languages: new Map(),
      })
    }

    const article = articles.get(parsed.article)
    article.titles.push(name.title)
    article.seconds.push(name.second)
    for (const translation of item.Translations?.Translation || []) {
      const language = shopLanguage(translation.languageCode)
      if (!language) continue
      if (!article.languages.has(language)) article.languages.set(language, { names: [], descriptions: [] })
      article.languages.get(language).names.push(text(translation.Description))
      article.languages.get(language).descriptions.push(text(translation.Description2))
    }
    for (const picture of item.Pictures?.Picture || []) {
      const file = text(picture)
      if (file && !article.pictures.includes(file)) article.pictures.push(file)
    }
    article.variants.push({
      sku,
      color: attribute('Color') || parsed.color,
      colorName: name.colorName,
      size: name.size || attribute('Size') || SIZE_BY_CODE[parsed.sizeCode] || parsed.sizeCode,
      price,
      price2: Number.isNaN(price2) ? price : price2,
      vat: text(sub.VatPercent),
      blocked: text(item.Blocked) === '1',
    })
  })

  const records = [...articles.values()].map(({ titles, seconds, languages, ...article }) => ({
    ...article,
    name: mostCommon(titles),
    description: commonDescription(seconds),
    translations: articleTranslations(languages),
  }))
  return { records, errors, rowCount: items.length }
}

// NAV fills Firstname/Lastname with two company name lines; "." means the second line is empty
const cleanLine = (value) => (text(value) === '.' ? '' : text(value))

const parseAddress = (node) => ({
  company: text(node.Company),
  firstName: text(node.Firstname),
  lastName: cleanLine(node.Lastname),
  street: text(node.Street),
  postcode: text(node.Postcode),
  city: text(node.City),
  country: text(node.Country),
  phone: text(node.Phone),
})

function parseCustomers(customers) {
  const errors = []
  const records = []

  customers.forEach((node, index) => {
    const number = text(node.Number)
    const billingNodes = node.BillingAddresses?.BillingAddress || []
    const billing = billingNodes.find((address) => text(address.Default) === '1') || billingNodes[0]
    if (!number) return errors.push({ row: index + 1, value: '', message: 'missingNumber' })
    if (!billing) return errors.push({ row: index + 1, value: number, message: 'missingBilling' })

    records.push({
      number,
      email: text(node.Email),
      // The full export writes <Pricegroup>, the first sample <PriceGroup>
      priceGroup: text(node.Pricegroup ?? node.PriceGroup),
      group: text(node.Group),
      paymentCode: text(node.PaymentCodes?.PaymentCode?.[0]),
      paymentMethod: text(node.PaymentMethodCode),
      shippingAgent: text(node.ShippingAgentCode),
      billing: parseAddress(billing),
      shippingAddresses: (node.ShippingAddresses?.ShippingAddress || []).map(parseAddress),
    })
  })

  return { records, errors, rowCount: customers.length }
}

export function parseNavXml(xml) {
  // The parser is lenient and would read a cut-off file (e.g. an interrupted upload) as far as it goes,
  // so the file is checked to be complete, well-formed XML first (about 0.3 s for NAV's full export)
  if (typeof xml !== 'string' || XMLValidator.validate(xml) !== true) return { type: null, error: 'invalidXml' }
  let doc
  try {
    doc = parser.parse(xml)
  } catch {
    return { type: null, error: 'invalidXml' }
  }
  if (doc?.ShopItems !== undefined) return { type: 'items', ...parseItems(doc.ShopItems?.ShopItem || []) }
  if (doc?.Customers !== undefined) return { type: 'customers', ...parseCustomers(doc.Customers?.Customer || []) }
  return { type: null, error: 'unknownFile' }
}
