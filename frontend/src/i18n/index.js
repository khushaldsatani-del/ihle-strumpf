import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import de from './locales/de.json'

// Languages offered in the language switcher. Each one needs a file in ./locales and an entry in LOADERS.
export const LANGUAGES = [
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' },
  { code: 'es', name: 'Español' },
  { code: 'nl', name: 'Nederlands' },
]

// German is part of the main download; every other language is its own small file, fetched when chosen
const LOADERS = {
  en: () => import('./locales/en.json'),
  fr: () => import('./locales/fr.json'),
  it: () => import('./locales/it.json'),
  es: () => import('./locales/es.json'),
  nl: () => import('./locales/nl.json'),
}

const STORAGE_KEY = 'ihle_language'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { de: { translation: de } },
    fallbackLng: 'de',
    supportedLngs: LANGUAGES.map((language) => language.code),
    load: 'languageOnly',
    interpolation: { escapeValue: false },
    // German is the default; a choice made in the switcher is remembered in localStorage
    detection: { order: ['localStorage'], caches: ['localStorage'], lookupLocalStorage: STORAGE_KEY },
  })

// Fetches a language file once. If it fails (offline), the site simply stays in the current language.
async function loadLanguage(code) {
  if (i18n.hasResourceBundle(code, 'translation') || !LOADERS[code]) return
  const file = await LOADERS[code]()
  i18n.addResourceBundle(code, 'translation', file.default)
}

// Switches the whole site to another language (and remembers it for the next visit)
export async function setLanguage(code) {
  try {
    await loadLanguage(code)
    await i18n.changeLanguage(code)
  } catch {
    // Language file could not be loaded: keep the current language
  }
}

// Resolves once the remembered language is ready, so the first render is already in the right language
export const i18nReady = (async () => {
  // i18n.language is the remembered choice; resolvedLanguage would still say "de" because only German is loaded yet
  const code = (i18n.language || 'de').split('-')[0]
  if (!LOADERS[code]) return
  try {
    await loadLanguage(code)
    await i18n.changeLanguage(code)
  } catch {
    await i18n.changeLanguage('de')
  }
})()

// Keep <html lang="…"> in sync with the active language
const syncHtmlLang = (language) => {
  document.documentElement.lang = language
}
syncHtmlLang(i18n.resolvedLanguage)
i18n.on('languageChanged', syncHtmlLang)

export default i18n
