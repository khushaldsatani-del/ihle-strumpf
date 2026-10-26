import { findCategory } from '../data/categories.js'

// An article's state in the shop:
//   blocked → blocked in NAV (every SKU, or the whole category)
//   waiting → imported, but none of its NAV pictures is uploaded yet, so the shop doesn't show it
//   visible → shown in the shop
export function productState(product) {
  if (product.blocked || findCategory(product.category)?.blocked) return 'blocked'
  if (!product.photos?.length) return 'waiting'
  return 'visible'
}

export const isBlocked = (product) => productState(product) === 'blocked'

// Photo URLs from the backend; ?v= changes when a photo is replaced, so old copies are never shown
export const photoUrl = (photo, size = 'thumb') => `/api/photos/${size}/${photo.name}.webp?v=${photo.v}`

const stem = (file) => file.replace(/\.(jpe?g|png|webp|tiff?)$/i, '').toLowerCase()

// Uploaded photo for a NAV picture file name, if there is one
export const photoFor = (product, file) => product.photos?.find((photo) => photo.name === stem(file))

// First uploaded photo of a colour (SKU colour code), falling back to the article's first photo
export const colorPhoto = (product, color) =>
  product.photos?.find((photo) => photo.name.split('_')[1] === color) || product.photos?.[0]

export function priceRange(product, field = 'price') {
  const prices = product.variants.map((variant) => variant[field])
  return { min: Math.min(...prices), max: Math.max(...prices) }
}
