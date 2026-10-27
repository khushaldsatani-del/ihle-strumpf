import { digitsOf, looksLikeNumber } from './articleNumber.js'
import { searchTextOf } from './productText.js'

/**
 * Articles matching a search: a number matches articles whose article number or any full SKU starts with it
 * ("40 0" → all 40 0xx articles; "40 000 001" → article 40 000); words must all appear in the article's texts
 * (German or translated name and description, material), in any order.
 */
export function searchProducts(products, query) {
  const trimmed = String(query ?? '').trim()
  if (!trimmed) return []

  if (looksLikeNumber(trimmed)) {
    const digits = digitsOf(trimmed)
    return products.filter(
      (product) => digitsOf(product.articleNo).startsWith(digits) || product.variants.some((variant) => digitsOf(variant.sku).startsWith(digits)),
    )
  }

  const words = trimmed.toLocaleLowerCase('de').split(/\s+/)
  return products.filter((product) => {
    const text = searchTextOf(product)
    return words.every((word) => text.includes(word))
  })
}
