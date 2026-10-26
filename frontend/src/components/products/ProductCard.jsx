import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { photoUrl } from '../../utils/api.js'
import OrderForm from './OrderForm.jsx'

// One product in a list. Picture and text link to its detail page; logged-in customers also get the price
// and the order fields (quantity, Kommission, add to cart) below it. Guests see no prices.
// layout: 'grid' (picture on top) or 'list' (one row).
export default function ProductCard({ product, layout = 'grid' }) {
  const { t } = useTranslation()
  const articleNo = t('products.articleNo', { number: product.articleNo })
  // Every product in the shop has at least one photo (the backend only lists those)
  const image = (
    <img
      src={photoUrl(product.photos[0])}
      alt=""
      width="480"
      height="480"
      loading="lazy"
      className={`size-full object-contain ${layout === 'list' ? 'p-[6%]' : 'p-[8%]'}`}
    />
  )

  if (layout === 'list') {
    return (
      <li className="product-card product-row">
        <Link to={`/products/${product.id}`} className="product-link flex min-w-0 flex-1 items-center gap-5 sm:gap-8">
          <div className="aspect-square w-12 shrink-0 overflow-hidden sm:w-16 lg:w-[4.5rem]">{image}</div>
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-body/70">{articleNo}</p>
            <h2 className="mt-0.5 text-base font-bold text-heading sm:text-xl">{product.name}</h2>
            {product.description && <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-body sm:text-base">{product.description}</p>}
          </div>
        </Link>
        <OrderForm product={product} />
      </li>
    )
  }

  return (
    <li className="product-card flex flex-col">
      <Link to={`/products/${product.id}`} className="product-link block">
        <div className="aspect-[5/6] overflow-hidden">{image}</div>
        <p className="mt-4 text-xs font-medium tracking-wide text-body/70">{articleNo}</p>
        <h2 className="mt-1 text-base font-bold text-heading sm:text-lg">{product.name}</h2>
        {product.description && <p className="mt-1.5 max-w-[18rem] text-sm leading-relaxed text-body">{product.description}</p>}
      </Link>
      {/* mt-auto: the order fields line up at the bottom of each row of cards */}
      <div className="mt-auto pt-4">
        <OrderForm product={product} />
      </div>
    </li>
  )
}
