// Unit tests: the order file for NAV.  Run: node --test tests/unit
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildOrderXml, orderTotals } from '../../backend/src/integrations/nav/export/orderXml.js'

const billing = { firstName: 'Webshop 12345 GmbH', lastName: '', company: '', street: 'Weg 1', postcode: '01234', city: 'Ort', country: 'DE' }
const order = (items) => ({ orderNo: '1300100099', createdAt: '2026-10-27T10:00:00Z', receiptNo: '', billing, paymentCode: 'purchaseorder', items })
const customer = { number: '69997', email: 'a@b.de', salesperson: '', vatId: '' }

// XML 1.0 allows tab, newline, carriage return and these ranges; everything else makes the file unreadable for NAV
const isValidXmlText = (xml) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/.test(xml) && !/&#x(D[89AB][0-9A-F]{2});/i.test(xml)

describe('orderTotals', () => {
  it('adds the 1 % like the sample orders', () => {
    assert.deepEqual(orderTotals([{ amount: 1, unitPrice: 4.41 }, { amount: 1, unitPrice: 8.07 }]), { lineSum: 12.48, discount: -0.12, shipping: 0, totalNet: 12.6 })
  })
  it('rounds to cents', () => {
    assert.equal(orderTotals([{ amount: 3, unitPrice: 0.1 }]).lineSum, 0.3)
  })
})

describe('buildOrderXml', () => {
  it('writes the full SKU, amount and price per line', () => {
    const xml = buildOrderXml(order([{ sku: '40 000 001 12', amount: 2, unitPrice: 4.41, commission: '' }]), customer)
    assert.match(xml, /<sku>40 000 001 12<\/sku>/)
    assert.match(xml, /<amount>2<\/amount>/)
    assert.match(xml, /<unitPrice>4.41<\/unitPrice>/)
    assert.match(xml, /<commission\/>/)
    assert.match(xml, /<zip>01234<\/zip>/)
  })

  it('escapes markup in customer input (no XML injection)', () => {
    const xml = buildOrderXml(order([{ sku: '40 000 001 12', amount: 1, unitPrice: 1, commission: '</commission><amount>999</amount><x>' }]), customer)
    assert.equal((xml.match(/<amount>/g) || []).length, 1)
    assert.match(xml, /&lt;\/commission&gt;/)
  })

  it('writes umlauts as character references like NAV', () => {
    const xml = buildOrderXml(order([{ sku: '40 000 001 12', amount: 1, unitPrice: 1, commission: 'Müller' }]), customer)
    assert.match(xml, /M&#xFC;ller/)
  })

  it('stays valid XML with emoji and control characters in a commission', () => {
    const xml = buildOrderXml(order([{ sku: '40 000 001 12', amount: 1, unitPrice: 1, commission: 'Frau 😀 Müller\u0001\u0008' }]), customer)
    assert.ok(isValidXmlText(xml), 'contains characters or references XML forbids')
  })
})
