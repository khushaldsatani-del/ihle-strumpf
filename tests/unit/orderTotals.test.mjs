// Unit tests: order totals (Ihle's order overview), VAT codes and the article number display.  Run: node --test tests/unit
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { STANDARD_VAT_RATE, vatRate } from '../../backend/src/utils/vat.js'
import { digitsOf, findSku, showNumber } from '../../frontend/src/utils/articleNumber.js'
import { orderTotals } from '../../frontend/src/utils/orderTotals.js'

describe('orderTotals', () => {
  it('matches the old shop overview Ihle sent, to the cent', () => {
    // 20 × 4,41 € (black) + 1 × 4,48 € (navy): Warenwert 92,68 · Rabatt −0,93 · netto 91,75 · MwSt. 17,43 · brutto 109,18
    const totals = orderTotals([
      { amount: 20, unitPrice: 4.41, vatRate: 19 },
      { amount: 1, unitPrice: 4.48, vatRate: 19 },
    ])
    assert.deepEqual(totals, { goods: 92.68, discount: -0.93, net: 91.75, vat: [{ rate: 19, amount: 17.43 }], gross: 109.18 })
  })

  it('subtracts the discount (net is below the goods value) and adds VAT on the net amount', () => {
    const { goods, discount, net, vat, gross } = orderTotals([{ amount: 3, unitPrice: 4.23, vatRate: 19 }])
    assert.equal(goods, 12.69)
    assert.equal(discount, -0.13)
    assert.equal(net, 12.56)
    assert.equal(vat[0].amount, Math.round(12.56 * 19) / 100)
    assert.equal(gross, Math.round((net + vat[0].amount) * 100) / 100)
  })

  it('counts lines without a rate (orders before migration 004) as 19 %', () => {
    assert.deepEqual(orderTotals([{ amount: 1, unitPrice: 10 }]).vat, [{ rate: 19, amount: 1.88 }])
  })

  it('shows one VAT line per rate, highest first, and adds up exactly', () => {
    const totals = orderTotals([
      { amount: 1, unitPrice: 10, vatRate: 7 },
      { amount: 1, unitPrice: 10, vatRate: 19 },
    ])
    assert.deepEqual(
      totals.vat.map(({ rate }) => rate),
      [19, 7],
    )
    const sum = Math.round((totals.net + totals.vat[0].amount + totals.vat[1].amount) * 100) / 100
    assert.equal(totals.gross, sum)
  })

  it('an empty order is all zeros, never "−0,00"', () => {
    const totals = orderTotals([])
    assert.ok(Object.is(totals.discount, 0))
    assert.equal(totals.gross, 0)
    assert.deepEqual(totals.vat, [])
  })
})

describe('vatRate (NAV VAT codes)', () => {
  it('reads the rate from the code, with 19 % for empty or unknown codes', () => {
    assert.equal(vatRate('VAT19'), 19)
    assert.equal(vatRate('VAT7'), 7)
    assert.equal(vatRate('VAT 7,5'), 7.5)
    assert.equal(vatRate(''), STANDARD_VAT_RATE)
    assert.equal(vatRate(null), 19)
    assert.equal(vatRate('FREI'), 19)
  })
})

describe('showNumber (article number display)', () => {
  it('separates the groups with figure spaces, so "001 12" never looks like "00112"', () => {
    assert.equal(showNumber('40 000 001 12'), '40 000 001 12')
    assert.equal(showNumber('40 000'), '40 000')
    assert.equal(showNumber(undefined), '')
  })

  it('a displayed number copied back into the search still finds the article', () => {
    const products = [{ id: '40000', articleNo: '40 000', variants: [{ sku: '40 000 001 12', color: '001', size: '35-38' }] }]
    assert.equal(digitsOf(showNumber('40 000 001 12')), '4000000112')
    assert.equal(findSku(showNumber('40 000 001 12'), products)?.variant.sku, '40 000 001 12')
  })
})
