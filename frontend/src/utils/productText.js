import { useTranslation } from 'react-i18next'

// Article texts come from NAV. German (from <Name>) is the standard and is shown whenever NAV has no
// translation for the active language. NAV's <Translations> fill product.translations, e.g.
// { en: { name: 'Diabetic Sock classic', description: 'loop cuff, no elastic, linked toe' } }.

export const productName = (product, language) => product.translations?.[language]?.name || product.name

// The translated description when NAV has one, otherwise the German one
export const productDescription = (product, language) => product.translations?.[language]?.description || product.description

// A product detail from NAV (material, application, circumference, remark) in the active language; German when
// that language has none. Material falls back to the German short text (<ItemShortText>) as before.
export const productDetail = (product, language, key) =>
  product.translations?.[language]?.[key] ||
  product.translations?.de?.[key] ||
  (key === 'material' ? product.material : '') ||
  ''

// Name and description of an article in the shop's active language
export function useProductText() {
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage
  return {
    name: (product) => productName(product, language),
    description: (product) => productDescription(product, language),
    detail: (product, key) => productDetail(product, language, key),
  }
}

// Every text an article can be found by: German and translated names and descriptions, material, numbers
export const searchTextOf = (product) =>
  [
    product.name,
    product.description,
    product.material,
    product.articleNo,
    ...Object.values(product.translations || {}).flatMap((text) => [text.name, text.description]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('de')
