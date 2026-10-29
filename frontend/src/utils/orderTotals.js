// The totals of an order, like the old shop's order overview (Ihle's wish):
//   Warenwert 92,68 € · Online-Rabatt −0,93 € · Gesamtsumme zzgl. Steuern 91,75 € · MwSt. (19 %) 17,43 € · inkl. Steuern 109,18 €
// The online discount is 1 % of the goods value on every order (as in all of NAV's sample orders).
export const ONLINE_DISCOUNT_RATE = 0.01
const STANDARD_VAT_RATE = 19

const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100

/**
 * lines: [{ amount, unitPrice, vatRate }] (net prices; vatRate in percent, 19 when unknown)
 * → { goods, discount (negative), net, vat: [{ rate, amount }] (one entry per rate), gross }
 */
export function orderTotals(lines) {
  const byRate = new Map()
  for (const { amount, unitPrice, vatRate } of lines) {
    const rate = vatRate ?? STANDARD_VAT_RATE
    byRate.set(rate, (byRate.get(rate) || 0) + amount * unitPrice)
  }
  const goods = round2([...byRate.values()].reduce((sum, value) => sum + value, 0))
  const discount = -round2(goods * ONLINE_DISCOUNT_RATE) || 0 // never "−0,00"
  const net = round2(goods + discount)
  // VAT on the net amount (after the discount) of each rate; with several rates the net amount is shared out in
  // proportion to their goods value. With one rate (every order so far) that is simply net × rate.
  const vat = [...byRate]
    .sort(([a], [b]) => b - a)
    .map(([rate, value]) => ({ rate, amount: round2((goods ? (net * value) / goods : 0) * (rate / 100)) }))
  const gross = round2(net + vat.reduce((sum, { amount }) => sum + amount, 0))
  return { goods, discount, net, vat, gross }
}
