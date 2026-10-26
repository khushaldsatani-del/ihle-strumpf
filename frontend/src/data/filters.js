import i18n from '../i18n/index.js'

// Filter helpers for the real catalogue. Colours, sizes and units come from the products themselves
// (NAV data); only what NAV doesn't provide is defined here: swatch colours and the fibre filter.

// Filters that can hold several values; each is a repeated URL parameter (?color=001&color=025)
export const MULTI_FILTERS = ['group', 'color', 'size', 'material', 'unit']

// Swatch colour per NAV colour code (the names come from the product data, e.g. "marine")
const HEX = {
  '001': '#111111',
  '002': '#1f2a4d',
  '003': '#8a8d91',
  '004': '#d8c3a5',
  '005': '#3d4045',
  '007': '#4a4d52',
  '008': '#6b4a32',
  '011': '#ffffff',
  '013': '#c0c3c7',
  '015': '#8b7d6b',
  '021': '#e8dcc5',
  '025': '#ece6da',
  '027': '#e6d6b0',
  '038': '#e9c84a',
  '039': '#3fb0b0',
  '040': '#b8322f',
  '041': '#2a4bb3',
  '042': '#4a8f5a',
  '043': '#8a5aa8',
  '044': '#e8a6b8',
  '052': '#cdb99c',
  '053': '#5a76a0',
  '058': '#55585c',
  '059': '#b5b8bb',
  102: '#4b4f8f',
  103: '#a8a294',
  139: '#a8dcc8',
  140: '#a3203a',
  142: '#8db33c',
  143: '#b9a2d6',
  144: '#e0457b',
  145: '#6d1f2c',
}
export const colorHex = (code) => HEX[code] || '#cccccc'

// Fibre filter: NAV's material text ("80% Baumwolle, 15% Nylon, 5% Elasthan") checked for each fibre.
// Names are i18n keys (filters.materials.<code>).
export const FIBRES = [
  { code: 'cotton', test: /baumwolle/i },
  { code: 'wool', test: /(?<!baum)wolle|merino|alpaka/i },
  { code: 'polyamide', test: /nylon|polyamid/i },
  { code: 'elastane', test: /elasthan|elastan/i },
  { code: 'silver', test: /versilbert|silber/i },
  { code: 'polyester', test: /polyester|coolmax/i },
  { code: 'lyocell', test: /lyocell/i },
]

export const fibresOf = (material) => FIBRES.filter(({ test }) => test.test(material || '')).map(({ code }) => code)

// Sizes as shown: NAV's hyphen as an en dash ("35-38" → "35–38")
export const sizeLabel = (size) => size.replace(/(\d)-(\d)/g, '$1–$2')

// Colour name in the active language, by NAV colour code (colors.<code> in the translation files).
// A code without a translation falls back to NAV's own German name ("marine"), capitalised.
// Call it while rendering, so the name follows a language switch.
export const colorLabel = (navName, code) => {
  if (i18n.exists(`colors.${code}`)) return i18n.t(`colors.${code}`)
  return navName ? navName.charAt(0).toUpperCase() + navName.slice(1) : code
}
