// Formats an amount in the customer's currency for the active language, e.g. "4,41 €".
export default function formatPrice(amount, currency, language) {
  return new Intl.NumberFormat(language, { style: 'currency', currency }).format(amount)
}
