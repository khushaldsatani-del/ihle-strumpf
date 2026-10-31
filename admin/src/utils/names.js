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

// NAV's descriptions of category and group codes, set by the DataProvider with every load of the admin data
let navNames = { categories: {}, groups: {} }
export const setNavNames = (names) => {
  navNames = { categories: names?.categories || {}, groups: names?.groups || {} }
}

// Names as the shop shows them: our translation for known codes, else NAV's description, else the code
export const categoryName = (navCode) =>
  navCode ? i18n.t(`categories.${codeKey(navCode)}`, { defaultValue: navNames.categories[navCode] || navCode }) : '–'

export const groupName = (code) =>
  code ? i18n.t(`groups.${codeKey(code)}`, { defaultValue: navNames.groups[code] || code }) : '–'
