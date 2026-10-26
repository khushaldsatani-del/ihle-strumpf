import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { Route, Routes } from 'react-router-dom'
import { PageLoader } from './components/common/Loading.jsx'
import PlaceholderPage from './components/common/PlaceholderPage.jsx'
import Home from './pages/Home.jsx'

// The home page is part of the first download; every other page is its own file that loads when it is
// first opened (the page loader shows meanwhile). Visitors who only look at the start page load far less.
const AboutUs = lazy(() => import('./pages/AboutUs.jsx'))
const AccountOrders = lazy(() => import('./pages/account/Orders.jsx'))
const Addresses = lazy(() => import('./pages/account/Addresses.jsx'))
const Cart = lazy(() => import('./pages/Cart.jsx'))
const Checkout = lazy(() => import('./pages/Checkout.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const Material = lazy(() => import('./pages/Material.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))
const ProductDetail = lazy(() => import('./pages/ProductDetail.jsx'))
const Products = lazy(() => import('./pages/Products.jsx'))
const Search = lazy(() => import('./pages/Search.jsx'))
const Services = lazy(() => import('./pages/Services.jsx'))
const Settings = lazy(() => import('./pages/account/Settings.jsx'))

// Pages linked from the footer that are not built yet: path -> i18n key of the title
const FOOTER_PAGES = {
  '/news': 'footer.news',
  '/catalog': 'footer.catalog',
  '/jobs': 'footer.jobs',
  '/newsletter': 'footer.newsletter',
  '/contact': 'footer.contact',
  '/imprint': 'footer.imprint',
  '/privacy': 'footer.privacy',
  '/terms': 'footer.terms',
}

function FooterPlaceholder({ titleKey }) {
  const { t } = useTranslation()
  return <PlaceholderPage title={t(titleKey)} />
}

// All page routes. /products also handles ?category=… (filters), /products/:id is one product, /search handles ?q=…
export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/material" element={<Material />} />
        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/search" element={<Search />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/account/addresses" element={<Addresses />} />
        <Route path="/account/orders" element={<AccountOrders />} />
        <Route path="/account/settings" element={<Settings />} />
        {Object.entries(FOOTER_PAGES).map(([path, titleKey]) => (
          <Route key={path} path={path} element={<FooterPlaceholder titleKey={titleKey} />} />
        ))}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
