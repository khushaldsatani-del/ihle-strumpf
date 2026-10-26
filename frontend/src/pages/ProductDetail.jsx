import { useState } from 'react'
import { Check, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { LoadError, ProductDetailSkeleton } from '../components/common/Loading.jsx'
import Magnifier from '../components/products/Magnifier.jsx'
import OrderForm from '../components/products/OrderForm.jsx'
import ProductCard from '../components/products/ProductCard.jsx'
import { photosOf, useCatalog } from '../context/CatalogContext.jsx'
import { categoryPath, findCategory } from '../data/categories.js'
import { colorHex, colorLabel, sizeLabel } from '../data/filters.js'
import { photoUrl } from '../utils/api.js'

// Light colours get a dark checkmark
const isLight = (hex) => {
  const [r, g, b] = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16))
  return r * 0.299 + g * 0.587 + b * 0.114 > 170
}

/**
 * Product detail page (/products/:id): photos, name, description, colours, sizes and the product details.
 * Colours and sizes are the article's SKUs from NAV; the photos follow the chosen colour.
 * Logged-in customers also get the price of the chosen SKU and the order fields; guests see no prices.
 */
export default function ProductDetail() {
  const { t } = useTranslation()
  const { id } = useParams()
  const { status, byId, products, reload } = useCatalog()
  const product = byId.get(id)
  // Chosen picture, colour and size: remembered per product (reset when another product is opened)
  const [choice, setChoice] = useState({})
  const selected = choice.id === id ? choice : { id }
  const choose = (key, value) => setChoice({ ...selected, id, [key]: value, ...(key === 'color' ? { image: 0 } : {}) })

  if (!product) {
    if (status === 'loading') return <ProductDetailSkeleton />
    if (status === 'error') {
      return (
        <section className="px-4 py-24">
          <LoadError text={t('products.loadError')} onRetry={reload} />
        </section>
      )
    }
    return (
      <section className="flex min-h-[calc(100vh-var(--nav-height))] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-heading sm:text-5xl">{t('product.notFound')}</h1>
        <Link to="/products" className="font-semibold text-brand underline underline-offset-4">
          {t('product.backToProducts')}
        </Link>
      </section>
    )
  }

  const category = findCategory(product.category)
  const group = category?.groups.find(({ code }) => code === product.group)
  const color = product.colorCodes.includes(selected.color) ? selected.color : product.colorCodes[0]
  // Only the sizes that exist as a SKU in the chosen colour
  const sizes = product.variants.filter((variant) => variant.color === color).map((variant) => variant.size)
  const size = sizes.includes(selected.size) ? selected.size : sizes[0]
  const colorName = colorLabel(product.colors.find(({ code }) => code === color)?.navName, color)
  const gallery = photosOf(product, color)
  const shown = Math.min(selected.image ?? 0, gallery.length - 1)

  const details = [
    [t('products.sort.articleNo'), product.articleNo],
    [t('filters.category'), category && t(category.nameKey)],
    [t('filters.group'), group && t(group.nameKey)],
    [t('filters.material'), product.material],
    [t('filters.unit'), t(`filters.units.${product.unit}`, { defaultValue: product.unit })],
  ].filter(([, value]) => value)

  // Other products of the same category first, then the rest
  const related = [
    ...products.filter((item) => item.id !== product.id && item.category === product.category),
    ...products.filter((item) => item.id !== product.id && item.category !== product.category),
  ].slice(0, 4)

  return (
    <div className="mx-auto max-w-[96rem] px-4 pb-20 pt-6 sm:px-8 lg:px-16 lg:pt-8">
      {/* Breadcrumb */}
      <nav aria-label={t('product.breadcrumb')}>
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-body">
          <li>
            <Link to="/products" className="crumb">
              {t('categories.all')}
            </Link>
          </li>
          {category && (
            <li className="flex items-center gap-1.5">
              <ChevronRight size={14} aria-hidden="true" />
              <Link to={categoryPath(category.code)} className="crumb">
                {t(category.nameKey)}
              </Link>
            </li>
          )}
          <li className="flex items-center gap-1.5 font-semibold text-heading" aria-current="page">
            <ChevronRight size={14} aria-hidden="true" />
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-2 lg:gap-16">
        {/* Photos of the chosen colour: the large view with the magnifier, and the thumbnails */}
        <div className="lg:sticky lg:top-[calc(var(--nav-height)+1rem)] lg:self-start">
          {/* key: a fresh magnifier for every picture */}
          <Magnifier key={gallery[shown].name} src={photoUrl(gallery[shown], 'large')} alt={`${product.name}, ${colorName}`} />

          {gallery.length > 1 && (
            <div role="group" aria-label={t('product.images')} className="mt-3 flex flex-wrap gap-3 sm:mt-4">
              {gallery.map((photo, index) => (
                <button
                  key={photo.name}
                  type="button"
                  className="product-thumb w-20 sm:w-24"
                  aria-label={t('product.image', { number: index + 1 })}
                  aria-pressed={index === shown}
                  onClick={() => choose('image', index)}
                >
                  <img src={photoUrl(photo)} alt="" loading="lazy" className="size-full object-contain p-[12%]" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Information */}
        <div className="min-w-0 lg:py-4">
          <p className="text-sm font-medium tracking-wide text-body">{t('products.articleNo', { number: product.articleNo })}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-heading sm:text-4xl lg:text-5xl">{product.name}</h1>
          {product.description && <p className="mt-4 max-w-xl text-lg leading-relaxed text-body">{product.description}</p>}

          {/* Colours */}
          <fieldset className="mt-8">
            <legend className="text-sm font-bold text-heading">
              {t('filters.color')}
              <span className="ml-2 font-normal text-body">{colorName}</span>
            </legend>
            <div className="mt-3 flex flex-wrap gap-3">
              {product.colors.map(({ code, navName }) => {
                const name = colorLabel(navName, code)
                const hex = colorHex(code)
                return (
                  <label key={code} className="detail-swatch" title={name}>
                    <input type="radio" name="color" className="sr-only" checked={code === color} aria-label={name} onChange={() => choose('color', code)} />
                    <span style={{ backgroundColor: hex, color: isLight(hex) ? '#3b1f12' : '#fff' }}>
                      {code === color && <Check size={18} strokeWidth={3} aria-hidden="true" />}
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          {/* Sizes of the chosen colour */}
          <fieldset className="mt-7">
            <legend className="text-sm font-bold text-heading">{t('filters.size')}</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {sizes.map((value) => (
                <label key={value} className="filter-chip detail-chip">
                  <input type="radio" name="size" className="sr-only" checked={value === size} onChange={() => choose('size', value)} />
                  {sizeLabel(value)}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Details */}
          <h2 className="mt-10 text-lg font-bold text-heading">{t('product.details')}</h2>
          <dl className="detail-list mt-3">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          {/* After all product details: the order box with price, quantity, Kommission and "add to cart".
              For logged-in customers only (guests get nothing here). */}
          <div className="mt-8 empty:hidden">
            <OrderForm
              key={product.id}
              product={product}
              color={color}
              size={size}
              summary={[colorName, sizeLabel(size)].filter(Boolean).join(' · ')}
              large
            />
          </div>
        </div>
      </div>

      {/* More products */}
      {related.length > 0 && (
        <section className="mt-16 border-t border-slate-200 pt-10 lg:mt-24 lg:pt-14">
          <h2 className="text-2xl font-bold tracking-tight text-heading sm:text-3xl">{t('product.related')}</h2>
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4 lg:gap-x-8">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
