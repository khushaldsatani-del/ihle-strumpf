// Ihle's full article numbers, as customers know them: "40 000 001 12" = article 40 000, colour 001, size code 12.
// Customers type them with or without spaces ("4000000112", "40000-001-12"), so only the digits are compared.

// "40 000 001 12" → "4000000112"; anything that is not a digit is ignored
export const digitsOf = (value) => String(value ?? '').replace(/\D/g, '')

// For display: the groups separated by a figure space (as wide as a digit) instead of a normal space. The shop's font
// draws "1" so narrow that "001 12" looked like "00112" (Ihle's feedback). Searching and copying still work: every
// comparison above uses only the digits.
export const showNumber = (value) => String(value ?? '').replace(/ /g, ' ')

// True when the input looks like (the start of) an article number rather than a word: digits and separators only
export const looksLikeNumber = (value) => /^[\d\s./-]+$/.test(String(value ?? '').trim()) && digitsOf(value).length >= 2

/**
 * Finds the article (and, as far as the number goes, the colour and SKU) for a typed article number.
 * Returns null unless exactly one article fits:
 *   full number "40 000 001 12"  → { product, variant, color }  (that SKU)
 *   article + colour "40 000 001" → { product, color }           (that colour, size still to choose)
 *   article "40 000"              → { product }
 * A number that is only the start of several articles ("40 0") returns null; the search lists them instead.
 */
export function findByNumber(query, products) {
  const digits = digitsOf(query)
  if (!looksLikeNumber(query) || digits.length < 5) return null

  const hits = []
  for (const product of products) {
    const variants = product.variants.filter((variant) => digitsOf(variant.sku).startsWith(digits))
    if (variants.length) hits.push({ product, variants })
  }
  if (hits.length !== 1) return null

  const [{ product, variants }] = hits
  const exact = variants.find((variant) => digitsOf(variant.sku) === digits)
  if (exact) return { product, variant: exact, color: exact.color }
  const colors = new Set(variants.map((variant) => variant.color))
  // the typed digits already fix the colour when every matching SKU has the same one
  return colors.size === 1 && digits.length > digitsOf(product.articleNo).length ? { product, color: [...colors][0] } : { product }
}

// The exact SKU for a full number, or null (the quick order needs colour and size)
export function findSku(query, products) {
  const found = findByNumber(query, products)
  return found?.variant ? found : null
}
