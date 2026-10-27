// Builds the order file NAV imports ("Import Bestellungen"), element for element like the samples
// (e.g. 1300003946.xml). The admin panel downloads it from GET /api/admin/orders/:orderNo/xml.

const round2 = (value) => Math.round(value * 100) / 100

// Every sample order carries a discount of exactly 1 % of the line total, and totalNet = line total + 1 %.
// Copied until Ihle confirms what the discount means.
export const ORDER_DISCOUNT_RATE = 0.01

export function orderTotals(items, shippingCost = 0) {
  const lineSum = round2(items.reduce((sum, item) => sum + item.amount * item.unitPrice, 0))
  const discount = -round2(lineSum * ORDER_DISCOUNT_RATE)
  return { lineSum, discount, shipping: shippingCost, totalNet: round2(lineSum - discount) }
}

// Characters XML 1.0 doesn't allow at all (control characters other than tab and line breaks, U+FFFE/U+FFFF);
// they can only come from pasted customer input and are dropped, otherwise NAV couldn't read the file
// oxlint-disable-next-line no-control-regex -- matching control characters is the point here
const FORBIDDEN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/u

// NAV writes non-ASCII characters as &#xE4; etc., so we do the same. Characters are read by code point, so an
// emoji becomes one valid reference (&#x1F600;) instead of two invalid half-references.
const escapeXml = (value) => {
  let out = ''
  for (const char of String(value ?? '')) {
    const code = char.codePointAt(0)
    // lone surrogate halves (from text cut in the middle of an emoji) are not characters either
    if (FORBIDDEN.test(char) || (code >= 0xd800 && code <= 0xdfff)) continue
    if (char === '&') out += '&amp;'
    else if (char === '<') out += '&lt;'
    else if (char === '>') out += '&gt;'
    else if (char === '"') out += '&quot;'
    else if (code >= 0x80) out += `&#x${code.toString(16).toUpperCase()};`
    else out += char
  }
  return out
}

// Empty values are written as <tag/>, like NAV does
const tag = (name, value, indent) => {
  const text = escapeXml(value)
  return text === '' ? `${indent}<${name}/>` : `${indent}<${name}>${text}</${name}>`
}

const pad = (number) => String(number).padStart(2, '0')

// NAV expects German local time as "08.10.2026 07:43", wherever the server runs
function navDate(value) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('de-DE', {
      timeZone: 'Europe/Berlin',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date(value))
      .map((part) => [part.type, part.value]),
  )
  return `${parts.day}.${parts.month}.${parts.year} ${pad(parts.hour)}:${parts.minute}`
}

// NAV numbers have no trailing zeros: 4.70 → "4.7"
const navNumber = (value) => String(round2(value))

function address(name, value) {
  const i = '      '
  const fullName = [value.firstName, value.lastName].filter(Boolean).join(' ')
  return [
    `    <${name}>`,
    tag('firstName', value.firstName, i),
    tag('lastName', value.lastName, i),
    tag('name', fullName, i),
    tag('company', value.company, i),
    tag('street', value.street, i),
    tag('zip', value.postcode, i),
    tag('city', value.city, i),
    tag('country', value.country, i),
    `    </${name}>`,
  ].join('\n')
}

// order: { orderNo, createdAt, receiptNo, billing, shippingAddress, paymentCode, shippingCost, items }
// customer: { number, email, salesperson, vatId }
export function buildOrderXml(order, customer) {
  const totals = orderTotals(order.items, order.shippingCost)
  const billing = order.billing
  return [
    '<?xml version="1.0"?>',
    '<order>',
    tag('orderNo', order.orderNo, '  '),
    tag('orderDate', navDate(order.createdAt), '  '),
    tag('payment', order.paymentCode, '  '),
    tag('totalNet', navNumber(totals.totalNet), '  '),
    tag('shippingCost', navNumber(totals.shipping), '  '),
    tag('discount', navNumber(totals.discount), '  '),
    tag('salesperson', customer.salesperson, '  '),
    tag('receiptNo', order.receiptNo, '  '),
    '  <customer>',
    // The old shop's internal customer id; empty until Ihle says NAV needs a value here
    tag('id', '', '    '),
    tag('number', customer.number, '    '),
    tag('vatId', customer.vatId, '    '),
    tag('firstName', billing.firstName, '    '),
    tag('lastName', billing.lastName, '    '),
    tag('email', customer.email, '    '),
    tag('phone', billing.phone, '    '),
    tag('fax', '', '    '),
    '  </customer>',
    '  <addresses>',
    address('billingAddress', billing),
    address('shippingAddress', order.shippingAddress || billing),
    '  </addresses>',
    '  <items>',
    ...order.items.flatMap((item) => [
      '    <item>',
      tag('sku', item.sku, '      '),
      tag('amount', item.amount, '      '),
      tag('unitPrice', navNumber(item.unitPrice), '      '),
      tag('commission', item.commission, '      '),
      '    </item>',
    ]),
    '  </items>',
    '</order>',
    '',
  ].join('\n')
}
