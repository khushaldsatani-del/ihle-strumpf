import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import OrderForm from './OrderForm.jsx'
import ProductImage from './ProductImage.jsx'
import { showNumber } from '../../utils/articleNumber.js'
import { useProductText } from '../../utils/productText.js'

// One product in a list. Picture and text link to its detail page; logged-in customers also get the price
// and the order fields (quantity, Kommission, add to cart) below it. Guests see no prices.
// layout: 'grid' (picture on top) or 'list' (one row).
// colors: the colours chosen in the colour filter. Then the card shows the article in the first of them it comes
// in (photo, price/order fields), and the link opens the product page in that colour.
export default function ProductCard({ product, layout = 'grid', colors = [] }) {
  const { t } = useTranslation()
  const text = useProductText()
  const name = text.name(product)
  const description = text.description(product)
  const articleNo = t('products.articleNo', { number: showNumber(product.articleNo) })
  const color = colors.length ? product.colorCodes.find((code) => colors.includes(code)) : undefined
  const to = color ? `/products/${product.id}?color=${encodeURIComponent(color)}` : `/products/${product.id}`
  // First photo, or the category's sample picture while the article has no photo yet
  const image = (
    <ProductImage
      product={product}
      color={color}
      label={layout !== 'list'}
      width="480"
      height="480"
      loading="lazy"
      className={`size-full object-contain ${layout === 'list' ? 'p-[6%]' : 'p-[8%]'}`}
    />
  )

  if (layout === 'list') {
    return (
      <li className="product-card product-row">
        <Link to={to} className="product-link flex min-w-0 flex-1 items-center gap-5 sm:gap-8">
          <div className="aspect-square w-12 shrink-0 overflow-hidden sm:w-16 lg:w-[4.5rem]">{image}</div>
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-body/70">{articleNo}</p>
            <h2 className="mt-0.5 text-base font-bold text-heading sm:text-xl">{name}</h2>
            {description && <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-body sm:text-base">{description}</p>}
          </div>
        </Link>
        <OrderForm product={product} color={color} />
      </li>
    )
  }

  return (
    <li className="product-card flex flex-col">
      <Link to={to} className="product-link block">
        <div className="relative aspect-[5/6] overflow-hidden">{image}</div>
        <p className="mt-4 text-xs font-medium tracking-wide text-body/70">{articleNo}</p>
        <h2 className="mt-1 text-base font-bold text-heading sm:text-lg">{name}</h2>
        {description && <p className="mt-1.5 max-w-[18rem] text-sm leading-relaxed text-body">{description}</p>}
      </Link>
      {/* mt-auto: the order fields line up at the bottom of each row of cards */}
      <div className="mt-auto pt-4">
        <OrderForm product={product} color={color} />
      </div>
    </li>
  )
}
