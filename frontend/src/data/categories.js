// Product categories and their product groups, as shown in the "All products" menu.
// Source: Stammdaten.xlsx (sheet "Artikelkategorie"). navCode is the code used by the ERP (Dynamics NAV);
// code is the URL-safe version used in links, e.g. /products?category=PROTHETIC&group=101-US.
// Names are i18n keys (categories.<code> and groups.<code> in the translation files).

const group = (code, navCode) => ({ code, navCode, nameKey: `groups.${code}` })

export const CATEGORIES = [
  {
    code: 'PROTHETIC',
    navCode: 'PROTHETIC',
    nameKey: 'categories.PROTHETIC',
    color: '#F28A30',
    groups: [
      group('101-US', '101 US'),
      group('102-US-PIN', '102 US PIN'),
      group('103-OS', '103 OS'),
      group('104-OS-PIN', '104 OS PIN'),
      group('105-ARM', '105 ARM'),
      group('106-MASS', '106 MASS'),
      group('107-LAM', '107 LAM'),
      group('108-GIPS', '108 GIPS'),
      group('109-ORTH', '109 ORTH'),
    ],
  },
  {
    code: 'DIABETES',
    navCode: 'DIABETES P',
    nameKey: 'categories.DIABETES',
    color: '#1E2F5F',
    groups: [
      group('201-KLAS', '201 KLAS'),
      group('202-KOMF', '202 KOMF'),
      group('203-STUETZ', '203 STÜTZ'),
      group('204-HALLUX', '204 HALLUX'),
      group('205-CHOPRT', '205 CHOPRT'),
    ],
  },
  // Not in Stammdaten.xlsx, so no product groups; their codes come from the full NAV export
  // (ALLTAG holds the ilo® everyday socks, to be confirmed by Ihle)
  { code: 'UNDERWEAR', navCode: 'UNTERWAE', nameKey: 'categories.UNDERWEAR', color: '#C0526E', groups: [] },
  { code: 'ILO', navCode: 'ALLTAG', nameKey: 'categories.ILO', color: '#7DBA8C', groups: [] },
]

// Category and product group of a product from its NAV codes (ItemCategorie, ProductGroup)
export const categoryByNav = (navCode) => CATEGORIES.find((category) => category.navCode === navCode)
export const groupByNav = (category, navCode) => category?.groups.find((group) => group.navCode === navCode)

// Link to the product list: all products, one category, or one group of a category
export function categoryPath(categoryCode, groupCode) {
  if (!categoryCode) return '/products'
  const params = new URLSearchParams({ category: categoryCode })
  if (groupCode) params.set('group', groupCode)
  return `/products?${params}`
}

export const findCategory = (code) => CATEGORIES.find((category) => category.code === code)
