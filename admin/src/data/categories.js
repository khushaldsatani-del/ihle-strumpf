// Categories by their NAV codes (ItemCategorie in nav_ShopItems.xml). PROTHETIC and DIABETES P come from
// Stammdaten.xlsx with their product groups; UNTERWAE and ALLTAG appear in the full export (ALLTAG holds the
// ilo® everyday socks, to be confirmed by Ihle). BUSINESS S is marked "gesperrt" in NAV and never shown.
// The shop uses the same codes (frontend/src/data/categories.js). Names are i18n keys.

export const CATEGORIES = [
  {
    navCode: 'PROTHETIC',
    color: '#F28A30',
    groups: ['101 US', '102 US PIN', '103 OS', '104 OS PIN', '105 ARM', '106 MASS', '107 LAM', '108 GIPS', '109 ORTH'],
  },
  {
    navCode: 'DIABETES P',
    color: '#1E2F5F',
    groups: ['201 KLAS', '202 KOMF', '203 STÜTZ', '204 HALLUX', '205 CHOPRT'],
  },
  { navCode: 'UNTERWAE', color: '#C0526E', groups: [] },
  { navCode: 'ALLTAG', color: '#7DBA8C', groups: [] },
  {
    navCode: 'BUSINESS S',
    color: '#9CA3AF',
    blocked: true,
    groups: ['301 KLAS', '302 KOMF', '303 SPORT', '304 POLSTR', '305 ANGORA'],
  },
]

export const findCategory = (navCode) => CATEGORIES.find((category) => category.navCode === navCode)

// i18n keys can't contain spaces or umlauts reliably, so codes are normalised ("203 STÜTZ" → "203_STUETZ")
export const codeKey = (code) => (code || '').replace(/Ü/g, 'UE').replace(/\s+/g, '_')
