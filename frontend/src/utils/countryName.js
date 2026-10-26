import i18n from '../i18n/index.js'

// NAV sends ISO country codes ("DE"); shown as the country name in the page language.
// Anything that is not a code (e.g. a country typed in at checkout) is shown as it is.
export default function countryName(code, language = i18n.resolvedLanguage) {
  try {
    return new Intl.DisplayNames([language], { type: 'region' }).of(code) || code
  } catch {
    return code
  }
}
