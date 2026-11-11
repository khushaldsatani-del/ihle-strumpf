// Product categories and their product groups, as shown in the "All products" menu.
// Source: Stammdaten.xlsx (sheet "Artikelkategorie"). navCode is the code used by the ERP (Dynamics NAV);
// code is the URL-safe version used in links, e.g. /products?category=PROTHETIC&group=101-US.
// Names are i18n keys (categories.<code> and groups.<code> in the translation files).
//
// This fixed list is the shop's own knowledge (colours, URL codes, translated names). Which categories and groups the
// menus show comes from the backend (buildCategories): only those with articles, as Ihle asked. Codes not listed here
// show NAV's German description, or the code when NAV has none. Without the backend's list the fixed one is used as before.

const group = (code, navCode) => ({ code, navCode, nameKey: `groups.${code}` })

export const CATEGORIES = [
  {
    code: 'PROTHETIC',
    navCode: 'PROTHETIC',
    nameKey: 'categories.PROTHETIC',
    color: '#F3997B', // style guide salmon (Orthesen fabric)
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
    color: '#57A3B1', // style guide turquoise
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
  { code: 'UNDERWEAR', navCode: 'UNTERWAE', nameKey: 'categories.UNDERWEAR', color: '#B64558', groups: [] },
  { code: 'ILO', navCode: 'ALLTAG', nameKey: 'categories.ILO', color: '#FBBC3D', groups: [] },
]

// Dot colour of a category the shop doesn't know yet
const NEW_CATEGORY_COLOR = '#9D9D9C'

// URL-safe code for a NAV code the shop doesn't know: "401 KLAS" → "401-KLAS". Every code in a list must be
// unique, also when NAV has e.g. a category "ILO" (the shop's own code for ALLTAG) or two codes that differ only
// in spaces: such a code gets a number ("ILO-2"). taken = the codes already in use.
function urlCode(navCode, taken) {
  const base = navCode.trim().replace(/\s+/g, '-')
  let code = base
  for (let n = 2; taken.has(code); n += 1) code = `${base}-${n}`
  taken.add(code)
  return code
}

/**
 * The categories and groups to show, from the backend's list ([{ code, name, groups: [{ code, name }] }], NAV codes,
 * only those with articles). Known categories come first in their usual order and keep their colour and translated
 * names; known groups keep their order too. New ones follow with NAV's name. No list (older backend): the fixed one.
 */
export function buildCategories(navCategories) {
  if (!Array.isArray(navCategories) || navCategories.length === 0) return CATEGORIES
  const byNav = new Map(navCategories.map((category) => [category.code, category]))
  const groupsOf = (known, navGroups) => {
    const listed = new Set(navGroups.map((group) => group.code))
    const kept = (known?.groups ?? []).filter((group) => listed.has(group.navCode))
    // the codes of all known groups are reserved, so an old link never opens a different group
    const taken = new Set((known?.groups ?? []).map((group) => group.code))
    const added = navGroups
      .filter((group) => !kept.some((knownGroup) => knownGroup.navCode === group.code))
      .map((group) => ({ code: urlCode(group.code, taken), navCode: group.code, name: group.name }))
    return [...kept, ...added]
  }
  const takenCategories = new Set(CATEGORIES.map((category) => category.code))
  const known = CATEGORIES.filter((category) => byNav.has(category.navCode)).map((category) => ({
    ...category,
    groups: groupsOf(category, byNav.get(category.navCode).groups),
  }))
  const added = navCategories
    .filter((category) => !CATEGORIES.some((knownCategory) => knownCategory.navCode === category.code))
    .map((category) => ({
      code: urlCode(category.code, takenCategories),
      navCode: category.code,
      name: category.name,
      color: NEW_CATEGORY_COLOR,
      groups: groupsOf(null, category.groups),
    }))
  return [...known, ...added]
}

// Shown name of a category or group: the translation for known ones, NAV's name for new ones
export const nameOf = (t, entry) => (entry.nameKey ? t(entry.nameKey) : entry.name)

// Category and product group of a product from its NAV codes (ItemCategorie, ProductGroup)
export const categoryByNav = (navCode, categories = CATEGORIES) => categories.find((category) => category.navCode === navCode)
export const groupByNav = (category, navCode) => category?.groups.find((group) => group.navCode === navCode)

// Link to the product list: all products, one category, or one group of a category
export function categoryPath(categoryCode, groupCode) {
  if (!categoryCode) return '/products'
  const params = new URLSearchParams({ category: categoryCode })
  if (groupCode) params.set('group', groupCode)
  return `/products?${params}`
}

export const findCategory = (code, categories = CATEGORIES) => categories.find((category) => category.code === code)
