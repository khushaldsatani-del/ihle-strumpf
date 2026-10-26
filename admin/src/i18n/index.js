import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import de from './locales/de.json'
import en from './locales/en.json'

export const LANGUAGES = [
  { code: 'de', name: 'Deutsch' },
  { code: 'en', name: 'English' },
]

// Own key, so the admin language doesn't follow the shop's choice
const STORAGE_KEY = 'ihle_admin_language'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { de: { translation: de }, en: { translation: en } },
    fallbackLng: 'de',
    supportedLngs: LANGUAGES.map((language) => language.code),
    load: 'languageOnly',
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage'], caches: ['localStorage'], lookupLocalStorage: STORAGE_KEY },
  })

const syncHtmlLang = (language) => {
  document.documentElement.lang = language
}
syncHtmlLang(i18n.resolvedLanguage)
i18n.on('languageChanged', syncHtmlLang)

export default i18n
