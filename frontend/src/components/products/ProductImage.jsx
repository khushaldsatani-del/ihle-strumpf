import { useTranslation } from 'react-i18next'
import { imageOf } from '../../context/CatalogContext.jsx'

/**
 * The picture of an article (of one colour, if given): its first photo, or the schematic sample picture of its
 * category while no photo is uploaded. label: also mark the sample as such (the parent must be `relative`).
 */
export default function ProductImage({ product, color, size = 'thumb', label = false, className = '', ...props }) {
  const { t } = useTranslation()
  const sample = product.photos.length === 0
  return (
    <>
      <img src={imageOf(product, color, size)} alt="" className={className} {...props} />
      {sample && label && (
        <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-1 text-[0.7rem] font-semibold text-body shadow-sm">
          {t('product.sampleImage')}
        </span>
      )}
    </>
  )
}
