import { XMLParser, XMLValidator } from 'fast-xml-parser'

// Reads NAV's export files: nav_ShopItems.xml (products), nav_ShopCustomers.xml (customers) and the two code lists
// nav_ShopItemCategories.xml and nav_ShopProductGroup.xml (code + German description of each category and product group).
// The type is recognised by the root element. The format is fixed by Ihle's NAV export.
//
// A product's <Name> has 4–5 lines, e.g.
//   Diabetiker Socke klassisch              ← article name
//   Umhängerand, ohne Gummi, gekettelt      ← short description (optional; sometimes holds colour/size)
//   Größe: 35-38                            ← readable size ("11-12cm", "6cm"; the Size attribute is often empty)
//   Farbe: schwarz                          ← colour name (NAV sends only the code in the attributes)
//   (PAAR)                                  ← unit
//
// Since October 2026 each item may also carry <Translations>: per NAV language code (DEU, ENU, FRA, ESP, ITA,
// RUS, CSY, SVE, …) a <Description> (name, often with the colour: "ABS Sock Frottee, black") and a <Description2>
// (short text). German name and short text stay as read from <Name>: NAV cuts the German Description off at 30
// characters. Since November 2026 a translation can also hold four product details: <Material>, <Application>
// (what it is used for), <Circumference> ("Umfang: bis 40 cm") and <Remark>. These are kept for every language,
// German included (translations.de), and the shop shows German wherever a language has none.

// Elements that can repeat are always arrays, even when a file has only one
const ARRAYS = new Set([
  'ShopItem', 'Picture', 'ItemTextLine', 'SubItem', 'Attribute', 'Translation', 'Customer', 'PaymentCode', 'BillingAddress', 'ShippingAddress',
])

const CODE_LIST_ENTRIES = new Set(['ShopItemCategories.ItemCategory', 'ShopProductGroup.ProductGroup'])

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  // Keep every value as text: SKUs have spaces, postcodes can start with 0
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  // <ProductGroup> is a text field in a ShopItem but a repeating entry in nav_ShopProductGroup.xml, so the code lists go by path
  isArray: (name, path) => ARRAYS.has(name) || CODE_LIST_ENTRIES.has(path),
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

// NAV language codes → the shop's language codes
const NAV_LANGUAGES = { DEU: 'de', ENU: 'en', ENG: 'en', FRA: 'fr', ESP: 'es', ITA: 'it', NLD: 'nl', SVE: 'sv', RUS: 'ru', DAN: 'da', NOR: 'no', PLK: 'pl', CSY: 'cs' }
// German ("de") only brings the product details; its name and short text are read from <Name> (see above)
export const shopLanguage = (navCode) => {
  const code = text(navCode).toUpperCase()
  if (!code) return null
  return NAV_LANGUAGES[code] || code.toLowerCase()
}

// An article's name in one language from its SKUs' descriptions: the comma parts all of them share
// ("ABS Sock Frottee, black" + "ABS Sock Frottee, beige" → "ABS Sock Frottee"); if they share none, the most common one
function commonName(values) {
  const names = values.filter(Boolean)
  return commonDescription(names) || mostCommon(names)
}

// The four product details a translation can carry (NAV element → key in translations)
const DETAILS = { Material: 'material', Application: 'application', Circumference: 'circumference', Remark: 'remark' }

// A detail that is really a translation: not empty, not just a number (NAV sometimes has "45" in a text field) and,
// for other languages, not simply the German text copied over (then the shop shows German anyway)
const usableDetail = (value, german) => Boolean(value) && !/^[\d\s.,%]+$/.test(value) && value !== german

// { de: { material, … }, en: { name, description, material, application, circumference, remark }, fr: { … } }
// for one article. German has only the details (its name and short text come from <Name>). Languages with
// nothing usable are left out; empty fields are not stored.
function articleTranslations(byLanguage) {
  const result = {}
  const germanDetails = {}
  for (const [field, key] of Object.entries(DETAILS)) {
    const value = mostCommon(byLanguage.get('de')?.details[field] || [])
    if (usableDetail(value)) germanDetails[key] = value
  }
  if (Object.keys(germanDetails).length) result.de = germanDetails

  for (const [language, { names, descriptions, details }] of byLanguage) {
    if (language === 'de') continue
    const entry = {}
    const name = commonName(names)
    if (name) {
      entry.name = name
      entry.description = commonDescription(descriptions)
    }
    for (const [field, key] of Object.entries(DETAILS)) {
      const value = mostCommon(details[field] || [])
      if (usableDetail(value, germanDetails[key])) entry[key] = value
    }
    if (Object.keys(entry).length) result[language] = entry
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
      if (!article.languages.has(language)) article.languages.set(language, { names: [], descriptions: [], details: {} })
      const entry = article.languages.get(language)
      if (language !== 'de') {
        entry.names.push(text(translation.Description))
        entry.descriptions.push(text(translation.Description2))
      }
      for (const field of Object.keys(DETAILS)) {
        const value = text(translation[field])
        if (value) (entry.details[field] ||= []).push(value)
      }
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

// A code list: one record per code with its description (may be empty; the shop then shows the code).
// A completely empty entry (NAV's export starts with one) is skipped silently; an entry that has something but no
// readable code (e.g. only a description, or markup inside the code) is listed as an error. A code listed twice
// keeps its last entry.
function parseCodes(entries, codeField, descriptionField) {
  const codes = new Map()
  const errors = []
  entries.forEach((entry, index) => {
    const code = text(entry?.[codeField])
    const description = text(entry?.[descriptionField])
    if (code) return codes.set(code, { code, description })
    const raw = entry?.[codeField]
    if (description || (raw !== undefined && typeof raw === 'object')) errors.push({ row: index + 1, value: description, message: 'missingCode' })
  })
  return { records: [...codes.values()], errors, rowCount: entries.length }
}

// Root elements of a parsed file, without the <?xml …?> declaration
const rootsOf = (doc) => Object.keys(doc || {}).filter((key) => !key.startsWith('?'))

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
  // XML has exactly one root; the validator lets a second one through (e.g. two files pasted together)
  if (rootsOf(doc).length !== 1) return { type: null, error: 'invalidXml' }
  if (doc?.ShopItems !== undefined) return { type: 'items', ...parseItems(doc.ShopItems?.ShopItem || []) }
  if (doc?.Customers !== undefined) return { type: 'customers', ...parseCustomers(doc.Customers?.Customer || []) }
  if (doc?.ShopItemCategories !== undefined) {
    const entries = doc.ShopItemCategories?.ItemCategory || []
    return { type: 'categories', ...parseCodes(entries, 'ItemCategoryCode', 'ItemCategoryDescription') }
  }
  if (doc?.ShopProductGroup !== undefined) {
    const entries = doc.ShopProductGroup?.ProductGroup || []
    return { type: 'groups', ...parseCodes(entries, 'ProductGroupCode', 'ProductGroupDescription') }
  }
  return { type: null, error: 'unknownFile' }
}
