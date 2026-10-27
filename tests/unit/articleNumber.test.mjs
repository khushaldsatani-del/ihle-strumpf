// Unit tests: full article numbers and the shop search.  Run: node --test tests/unit
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { digitsOf, findByNumber, findSku, looksLikeNumber } from '../../frontend/src/utils/articleNumber.js'
import { productDescription, productName } from '../../frontend/src/utils/productText.js'
import { searchProducts } from '../../frontend/src/utils/searchProducts.js'

const variant = (sku) => ({ sku, color: sku.split(' ')[2], size: '35-38' })
const products = [
  {
    id: '40000', articleNo: '40 000', name: 'Diabetiker Socke klassisch', description: 'Umhängerand', material: '80% Baumwolle',
    translations: { en: { name: 'Diabetic Sock classic', description: 'loop cuff' } },
    variants: ['40 000 001 12', '40 000 001 13', '40 000 002 12'].map(variant),
  },
  { id: '40002', articleNo: '40 002', name: 'Diabetiker Silbersocke', description: '', material: 'Silber', translations: {}, variants: ['40 002 001 12', '40 002 053 12'].map(variant) },
  { id: '21002', articleNo: '21 002', name: 'Baumwoll-Trikotschlauch', description: '', material: '', translations: {}, variants: ['21 002 001 12'].map(variant) },
]

describe('digitsOf / looksLikeNumber', () => {
  it('compares numbers by digits only', () => {
    assert.equal(digitsOf('40 000 001 12'), '4000000112')
    assert.equal(digitsOf('40-000.001/12'), '4000000112')
    assert.equal(digitsOf(null), '')
  })
  it('tells numbers from words', () => {
    assert.ok(looksLikeNumber('40 000 001 12'))
    assert.ok(looksLikeNumber('4000000112'))
    assert.ok(!looksLikeNumber('Socke 40'))
    assert.ok(!looksLikeNumber('4'))
    assert.ok(!looksLikeNumber(''))
  })
})

describe('findByNumber', () => {
  it('finds the exact SKU from the full number, with or without spaces', () => {
    for (const typed of ['40 000 001 12', '4000000112', ' 40000 001 12 ']) {
      const found = findByNumber(typed, products)
      assert.equal(found?.variant?.sku, '40 000 001 12', typed)
      assert.equal(found.color, '001')
    }
  })
  it('finds article and colour from article + colour', () => {
    const found = findByNumber('40 000 002', products)
    assert.equal(found.product.id, '40000')
    assert.equal(found.color, '002')
    assert.equal(found.variant, undefined)
  })
  it('finds the article from the article number', () => {
    const found = findByNumber('40 002', products)
    assert.equal(found.product.id, '40002')
    assert.equal(found.color, undefined)
  })
  it('returns nothing for numbers that fit several articles, none, or are words', () => {
    assert.equal(findByNumber('40 0', products), null)
    assert.equal(findByNumber('99 999 001 12', products), null)
    assert.equal(findByNumber('Socke', products), null)
    assert.equal(findByNumber('', products), null)
  })
  it('findSku needs colour and size', () => {
    assert.equal(findSku('40 000 001', products), null)
    assert.equal(findSku('40 000 001 13', products)?.variant.sku, '40 000 001 13')
  })
})

describe('searchProducts', () => {
  it('lists every article a number start fits', () => {
    assert.deepEqual(searchProducts(products, '40 0').map((p) => p.id), ['40000', '40002'])
    assert.deepEqual(searchProducts(products, '21').map((p) => p.id), ['21002'])
  })
  it('finds words in German and translated texts, case-insensitive, in any order', () => {
    assert.deepEqual(searchProducts(products, 'socke').map((p) => p.id), ['40000', '40002'])
    assert.deepEqual(searchProducts(products, 'CLASSIC diabetic').map((p) => p.id), ['40000'])
    assert.deepEqual(searchProducts(products, 'silber').map((p) => p.id), ['40002'])
  })
  it('returns nothing for empty or unknown searches, and survives odd input', () => {
    assert.deepEqual(searchProducts(products, '   '), [])
    assert.deepEqual(searchProducts(products, 'xyz'), [])
    assert.deepEqual(searchProducts(products, '.*(['), [])
    assert.deepEqual(searchProducts(products, undefined), [])
  })
})

describe('product texts per language', () => {
  it('uses NAV translations and falls back to German', () => {
    assert.equal(productName(products[0], 'en'), 'Diabetic Sock classic')
    assert.equal(productName(products[0], 'it'), 'Diabetiker Socke klassisch')
    assert.equal(productDescription(products[0], 'en'), 'loop cuff')
    assert.equal(productName(products[1], 'en'), 'Diabetiker Silbersocke')
    assert.equal(productName({ name: 'X' }, 'en'), 'X')
  })
})
