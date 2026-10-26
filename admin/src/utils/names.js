import i18n from '../i18n/index.js'
import { codeKey } from '../data/categories.js'

// NAV puts the company name into Firstname + Lastname (two lines); together they are the display name
export const customerName = (customer) =>
  customer ? [customer.billing.firstName, customer.billing.lastName].filter(Boolean).join(' ') : '–'

export const addressLines = (address) => [
  [address.firstName, address.lastName].filter(Boolean).join(' '),
  address.street,
  `${address.postcode} ${address.city}`,
  address.country,
]

// Colour name as NAV writes it in the product name ("marine"), capitalised; the code when there is none
export const colorName = (variant) =>
  variant.colorName ? variant.colorName.charAt(0).toUpperCase() + variant.colorName.slice(1) : variant.color

export const categoryName = (navCode) =>
  navCode ? i18n.t(`categories.${codeKey(navCode)}`, { defaultValue: navCode }) : '–'

export const groupName = (code) => (code ? i18n.t(`groups.${codeKey(code)}`, { defaultValue: code }) : '–')
