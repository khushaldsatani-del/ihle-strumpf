import { ImageOff } from 'lucide-react'
import { photoUrl } from '../utils/products.js'

// A product photo from the backend, or a placeholder when the article has no uploaded photo yet
export default function ProductThumb({ photo, size = 'size-12', large = false, alt = '' }) {
  if (!photo) {
    return (
      <span className={`${size} grid shrink-0 place-items-center rounded-lg bg-cream text-muted`}>
        <ImageOff size={18} aria-hidden="true" />
      </span>
    )
  }
  return (
    <img
      src={photoUrl(photo, large ? 'large' : 'thumb')}
      alt={alt}
      className={`${size} shrink-0 rounded-lg bg-white object-contain`}
      loading="lazy"
    />
  )
}
