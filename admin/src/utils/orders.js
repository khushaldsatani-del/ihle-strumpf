import { PRICE_GROUPS } from '../data/pricing.js'
import { round2 } from './format.js'

// The 1 % online discount every order gets (as in all of NAV's sample orders)
export const ORDER_DISCOUNT_RATE = 0.01
const STANDARD_VAT_RATE = 19

// An order's totals as the customer sees them in the shop (Ihle's wish, like the old shop's order overview):
//   lineSum (Warenwert) − 1 % discount = totalNet (zzgl. MwSt.), + VAT per rate = gross (inkl. MwSt.).
// Same calculation as the shop's utils/orderTotals.js. The order XML for NAV keeps the samples' totalNet
// (line total + 1 %) until Ihle says which one NAV expects.
export function orderTotals(order) {
  const byRate = new Map()
  for (const item of order.items) {
    const rate = item.vatRate ?? STANDARD_VAT_RATE
    byRate.set(rate, (byRate.get(rate) || 0) + item.amount * item.unitPrice)
  }
  const lineSum = round2([...byRate.values()].reduce((sum, value) => sum + value, 0))
  const discount = -round2(lineSum * ORDER_DISCOUNT_RATE) || 0
  const totalNet = round2(lineSum + discount)
  const vat = [...byRate]
    .sort(([a], [b]) => b - a)
    .map(([rate, value]) => ({ rate, amount: round2((lineSum ? (totalNet * value) / lineSum : 0) * (rate / 100)) }))
  return {
    lineSum,
    discount,
    totalNet,
    vat,
    gross: round2(totalNet + vat.reduce((sum, { amount }) => sum + amount, 0)),
    shipping: order.shippingCost || 0,
    pieces: order.items.reduce((sum, item) => sum + item.amount, 0),
  }
}

// The price a customer pays for one variant: their price group decides between NAV's Price and Price2
export const priceFieldFor = (priceGroup) =>
  PRICE_GROUPS.find((group) => group.code === priceGroup)?.priceField || 'price'

export const priceFor = (variant, customer) => variant[priceFieldFor(customer?.priceGroup)]
