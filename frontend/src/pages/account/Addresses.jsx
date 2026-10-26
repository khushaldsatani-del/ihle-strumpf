import { Building2, ChevronRight, MapPin, Phone, Truck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageLoader } from '../../components/common/Loading.jsx'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import countryName from '../../utils/countryName.js'

const PHONE = '+49 37369 84690'

function AddressCard({ address, title, icon: Icon, highlight = false }) {
  const { i18n } = useTranslation()
  return (
    <li
      className={`flex flex-col rounded-2xl border p-5 sm:p-6 ${
        highlight ? 'border-transparent bg-[#faf8f4]' : 'border-slate-200 bg-white'
      }`}
    >
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#8a5a3c]">
        <Icon size={15} strokeWidth={2} aria-hidden="true" />
        {title}
      </p>
      <address className="mt-3 text-[0.9375rem] not-italic leading-relaxed text-body">
        <span className="block font-semibold text-heading">{address.company}</span>
        <span className="block">{address.street}</span>
        <span className="block">
          {address.zip} {address.city}
        </span>
        <span className="block">{countryName(address.country, i18n.resolvedLanguage)}</span>
      </address>
      {address.phone && (
        <p className="mt-3 flex items-center gap-2 text-sm text-body">
          <Phone size={14} strokeWidth={1.75} aria-hidden="true" />
          {address.phone}
        </p>
      )}
    </li>
  )
}

/**
 * The logged-in customer's addresses (/account/addresses): the billing address and every delivery address,
 * as NAV has them. Read-only on purpose: NAV owns these addresses and every customer import overwrites them,
 * so changes go through Ihle (phone) and then arrive with the next import.
 */
export default function Addresses() {
  const { t } = useTranslation()
  const { isLoggedIn, checking, user } = useAuth()

  if (checking) return <PageLoader />
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: '/account/addresses' }} />

  const deliveries = user.shippingAddresses

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-8 lg:pt-8">
      <nav aria-label={t('product.breadcrumb')}>
        <ol className="flex flex-wrap items-center gap-x-1.5 text-sm text-body">
          <li>{t('nav.account')}</li>
          <li className="flex items-center gap-1.5 font-semibold text-heading" aria-current="page">
            <ChevronRight size={14} aria-hidden="true" />
            {t('nav.addresses')}
          </li>
        </ol>
      </nav>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4 lg:mt-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl">{t('addresses.title')}</h1>
        </div>
        <Link to="/products" className="text-sm font-semibold text-body underline underline-offset-4 hover:text-heading">
          {t('login.toProducts')}
        </Link>
      </div>

      {/* Billing address */}
      <section className="mt-10" aria-labelledby="billing-title">
        <h2 id="billing-title" className="sr-only">
          {t('addresses.billing')}
        </h2>
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AddressCard address={user.billingAddress} title={t('addresses.billing')} icon={Building2} highlight />
        </ul>
      </section>

      {/* Delivery addresses */}
      <section className="mt-12" aria-labelledby="delivery-title">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-3">
          <h2 id="delivery-title" className="text-xl font-bold text-heading sm:text-2xl">
            {t('addresses.deliveries')}
          </h2>
          <p className="text-sm text-body">{t('addresses.deliveryCount', { count: deliveries.length })}</p>
        </div>

        {deliveries.length ? (
          <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {deliveries.map((address, index) => (
              <AddressCard
                key={address.id}
                address={address}
                title={t('addresses.delivery', { number: index + 1 })}
                icon={Truck}
              />
            ))}
          </ul>
        ) : (
          <p className="mt-6 flex items-start gap-3 rounded-2xl bg-[#faf8f4] p-5 text-body">
            <MapPin size={18} strokeWidth={1.75} className="mt-0.5 shrink-0" aria-hidden="true" />
            {t('addresses.noDeliveries')}
          </p>
        )}
      </section>

      {/* Why the addresses can't be edited here */}
      <p className="mt-12 max-w-2xl rounded-2xl border border-slate-200 p-5 text-sm leading-relaxed text-body">
        {t('addresses.changeNote')}{' '}
        <a href={`tel:${PHONE.replaceAll(' ', '')}`} className="whitespace-nowrap font-semibold text-heading underline underline-offset-2">
          {PHONE}
        </a>
      </p>
    </div>
  )
}
