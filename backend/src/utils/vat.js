// German standard rate; every NAV article so far has the VAT code VAT19
export const STANDARD_VAT_RATE = 19

// NAV's VAT code of an article → its rate in percent: "VAT19" → 19, "VAT7" → 7; empty or unknown → 19
export function vatRate(code) {
  const match = /\d+(?:[.,]\d+)?/.exec(String(code ?? ''))
  return match ? Number(match[0].replace(',', '.')) : STANDARD_VAT_RATE
}
