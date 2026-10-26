import { PRICE_GROUPS } from '../data/pricing.js'
import { round2 } from './format.js'

// Every sample order from NAV (1300003946/47/53) carries a discount of exactly 1 % of the line total,
// and totalNet = line total + that 1 %. We copy that until Ihle confirms what the discount is.
export const ORDER_DISCOUNT_RATE = 0.01

export function orderTotals(order) {
  const lineSum = round2(order.items.reduce((sum, item) => sum + item.amount * item.unitPrice, 0))
  const discount = -round2(lineSum * ORDER_DISCOUNT_RATE)
  return {
    lineSum,
    discount,
    shipping: order.shippingCost || 0,
    totalNet: round2(lineSum - discount),
    pieces: order.items.reduce((sum, item) => sum + item.amount, 0),
  }
}

// The price a customer pays for one variant: their price group decides between NAV's Price and Price2
export const priceFieldFor = (priceGroup) =>
  PRICE_GROUPS.find((group) => group.code === priceGroup)?.priceField || 'price'

export const priceFor = (variant, customer) => variant[priceFieldFor(customer?.priceGroup)]
