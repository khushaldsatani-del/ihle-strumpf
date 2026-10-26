import { useId, useState } from 'react'
import { ChevronRight, CircleAlert, CircleCheck, Eye, EyeOff, Globe, KeyRound, LayoutGrid, List, Lock, LogOut, SlidersHorizontal, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { PageLoader } from '../../components/common/Loading.jsx'
import RollText from '../../components/common/RollText.jsx'
import { Flag } from '../../components/layout/LanguageDrawer.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { LANGUAGES, setLanguage } from '../../i18n/index.js'
import { api } from '../../utils/api.js'
import { PAGE_SIZES, readStoredPageSize, readStoredView, storePageSize, storeView } from '../../utils/preferences.js'

const PHONE = '+49 37369 84690'
const MIN_PASSWORD = 8

// White card with an icon heading, used for every section of the page
function Card({ icon: Icon, title, intro, children, className = '' }) {
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className={`rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 ${className}`}>
      <h2 id={titleId} className="flex items-center gap-2.5 text-lg font-bold text-heading sm:text-xl">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#faf3ec] text-[#8a5a3c]">
          <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
        </span>
        {title}
      </h2>
      {intro && <p className="mt-3 text-sm leading-relaxed text-body">{intro}</p>}
      {children}
    </section>
  )
}

// Row of buttons where exactly one is chosen (language, view, products per page)
function Choice({ label, options, value, onChange, columns = 'grid-cols-2' }) {
  return (
    <fieldset className="mt-6 first-of-type:mt-5">
      <legend className="text-sm font-bold text-heading">{label}</legend>
      <div className={`mt-2.5 grid gap-2 ${columns}`}>
        {options.map((option) => {
          const active = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              lang={option.lang}
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={`flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-center text-sm font-semibold leading-tight transition-colors ${
                active
                  ? 'border-[#3b1f12] bg-[#3b1f12] text-white'
                  : 'border-slate-900/15 bg-white text-heading hover:border-slate-900/35 hover:bg-[#faf8f4]'
              }`}
            >
              {option.icon}
              {/* long labels (e.g. "Vista de cuadrícula" on phones) wrap instead of being cut off */}
              <span className="min-w-0 break-words">{option.label}</span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

// Password input with the show/hide eye of the login page
function PasswordField({ id, label, value, onChange, autoComplete, describedBy, invalid }) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  return (
    <>
      <label htmlFor={id} className="auth-label mt-5">
        {label}
      </label>
      <div className="auth-field">
        <Lock size={18} strokeWidth={1.75} aria-hidden="true" />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          value={value}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="auth-eye"
          aria-label={t(visible ? 'login.hidePassword' : 'login.showPassword')}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff size={18} strokeWidth={1.75} aria-hidden="true" /> : <Eye size={18} strokeWidth={1.75} aria-hidden="true" />}
        </button>
      </div>
    </>
  )
}

const EMPTY_FORM = { current: '', next: '', confirm: '' }

// Change password: current password, new one twice. Checked here first, then by the backend.
function PasswordForm() {
  const { t } = useTranslation()
  const id = useId()
  const [form, setForm] = useState(EMPTY_FORM)
  const [status, setStatus] = useState('idle') // 'idle' | 'saving' | 'saved' | error code
  const field = (name) => (value) => {
    setForm((current) => ({ ...current, [name]: value }))
    if (status !== 'saving') setStatus('idle')
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    if (status === 'saving') return
    if (form.next.length < MIN_PASSWORD) return setStatus('passwordTooShort')
    if (form.next !== form.confirm) return setStatus('mismatch')

    setStatus('saving')
    try {
      await api('/shop/password', { method: 'POST', body: { currentPassword: form.current, newPassword: form.next } })
      setForm(EMPTY_FORM)
      setStatus('saved')
    } catch (error) {
      const known = ['wrongPassword', 'passwordTooShort', 'samePassword', 'tooManyAttempts', 'offline', 'notLoggedIn']
      setStatus(known.includes(error.code) ? error.code : 'generic')
    }
  }

  const failed = !['idle', 'saving', 'saved'].includes(status)

  return (
    <form onSubmit={onSubmit} noValidate className="mt-1">
      <PasswordField
        id={`${id}-current`}
        label={t('settings.password.current')}
        value={form.current}
        onChange={field('current')}
        autoComplete="current-password"
        invalid={status === 'wrongPassword'}
        describedBy={failed ? `${id}-message` : undefined}
      />
      <PasswordField
        id={`${id}-next`}
        label={t('settings.password.new')}
        value={form.next}
        onChange={field('next')}
        autoComplete="new-password"
        invalid={status === 'passwordTooShort' || status === 'samePassword'}
        describedBy={`${id}-rules${failed ? ` ${id}-message` : ''}`}
      />
      <p id={`${id}-rules`} className="mt-2 text-sm text-body">
        {t('settings.password.rules', { count: MIN_PASSWORD })}
      </p>
      <PasswordField
        id={`${id}-confirm`}
        label={t('settings.password.confirm')}
        value={form.confirm}
        onChange={field('confirm')}
        autoComplete="new-password"
        invalid={status === 'mismatch'}
        describedBy={failed ? `${id}-message` : undefined}
      />

      {/* Result message (announced to screen readers) */}
      <div aria-live="polite">
        {failed && (
          <p id={`${id}-message`} className="mt-5 flex items-start gap-2.5 rounded-xl bg-[#fdf0ee] p-3.5 text-sm font-medium text-[#a3261a]">
            <CircleAlert size={18} strokeWidth={1.75} aria-hidden="true" className="mt-px shrink-0" />
            {t(`settings.password.errors.${status}`, { count: MIN_PASSWORD })}
          </p>
        )}
        {status === 'saved' && (
          <p className="mt-5 flex items-start gap-2.5 rounded-xl bg-[#eef6ef] p-3.5 text-sm font-medium text-[#24613a]">
            <CircleCheck size={18} strokeWidth={1.75} aria-hidden="true" className="mt-px shrink-0" />
            {t('settings.password.saved')}
          </p>
        )}
      </div>

      <button type="submit" className="auth-btn mt-6 w-full sm:w-auto sm:px-8" disabled={status === 'saving'}>
        <RollText>{t(status === 'saving' ? 'settings.password.saving' : 'settings.password.save')}</RollText>
      </button>
    </form>
  )
}

/**
 * Account settings (/account/settings): the customer's account data from NAV (read-only, like the addresses),
 * changing the shop password, and the website settings of this browser (language, product view, products per page).
 */
export default function Settings() {
  const { t, i18n } = useTranslation()
  const { isLoggedIn, checking, user, logout } = useAuth()
  const navigate = useNavigate()
  const [view, setView] = useState(readStoredView)
  const [pageSize, setPageSize] = useState(readStoredPageSize)

  if (checking) return <PageLoader />
  if (!isLoggedIn) return <Navigate to="/login" replace state={{ from: '/account/settings' }} />

  const paymentKey = `checkout.paymentMethods.${user.payment}`
  const details = [
    [t('settings.company'), user.company],
    [t('settings.username'), user.customerNumber],
    [t('settings.email'), user.email || t('settings.noEmail')],
    [t('checkout.payment'), i18n.exists(paymentKey) ? t(paymentKey) : user.payment || '–'],
    [t('checkout.shipping'), user.shippingAgent],
  ]

  const onLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-8 lg:pt-8">
      <nav aria-label={t('product.breadcrumb')}>
        <ol className="flex flex-wrap items-center gap-x-1.5 text-sm text-body">
          <li>{t('nav.account')}</li>
          <li className="flex items-center gap-1.5 font-semibold text-heading" aria-current="page">
            <ChevronRight size={14} aria-hidden="true" />
            {t('nav.settings')}
          </li>
        </ol>
      </nav>

      <div className="mt-6 lg:mt-8">
        <h1 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl">{t('settings.title')}</h1>
      </div>

      <div className="mt-10 grid items-start gap-5 lg:grid-cols-2 lg:gap-6">
        <div className="grid gap-5 lg:gap-6">
          {/* Account data from NAV */}
          <Card icon={UserRound} title={t('settings.account')}>
            <dl className="mt-4 divide-y divide-slate-200 border-y border-slate-200">
              {details.map(([term, value]) => (
                <div key={term} className="grid gap-0.5 py-3 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4">
                  <dt className="text-sm text-body">{term}</dt>
                  <dd className="break-words text-[0.9375rem] font-semibold text-heading">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm leading-relaxed text-body">
              {t('settings.changeNote')}{' '}
              <a href={`tel:${PHONE.replaceAll(' ', '')}`} className="whitespace-nowrap font-semibold text-heading underline underline-offset-2">
                {PHONE}
              </a>
            </p>
            <Link to="/account/addresses" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-heading underline underline-offset-4">
              {t('settings.toAddresses')}
              <ChevronRight size={14} aria-hidden="true" />
            </Link>
          </Card>

          {/* Website settings of this browser */}
          <Card icon={SlidersHorizontal} title={t('settings.site.title')} intro={t('settings.site.intro')}>
            <Choice
              label={
                <span className="flex items-center gap-1.5">
                  <Globe size={15} strokeWidth={1.75} aria-hidden="true" />
                  {t('nav.language')}
                </span>
              }
              // three per row only where the card is wide enough for "Nederlands" with its flag
              columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3"
              value={i18n.resolvedLanguage}
              onChange={setLanguage}
              options={LANGUAGES.map(({ code, name }) => ({
                value: code,
                label: name,
                lang: code,
                icon: <Flag code={code} className="h-3.5 w-5 rounded-[3px]" />,
              }))}
            />
            <Choice
              label={t('settings.site.view')}
              value={view}
              onChange={(next) => {
                setView(next)
                storeView(next)
              }}
              options={[
                { value: 'grid', label: t('products.view.grid'), icon: <LayoutGrid size={16} strokeWidth={1.75} aria-hidden="true" /> },
                { value: 'list', label: t('products.view.list'), icon: <List size={16} strokeWidth={1.75} aria-hidden="true" /> },
              ]}
            />
            <Choice
              label={t('settings.site.pageSize')}
              columns="grid-cols-4"
              value={pageSize}
              onChange={(next) => {
                setPageSize(next)
                storePageSize(next)
              }}
              options={PAGE_SIZES.map((size) => ({ value: size, label: String(size) }))}
            />
          </Card>
        </div>

        <div className="grid gap-5 lg:gap-6">
          <Card icon={KeyRound} title={t('settings.password.title')} intro={t('settings.password.intro')}>
            <PasswordForm />
          </Card>

          <Card icon={LogOut} title={t('settings.logout.title')} intro={t('settings.logout.text')}>
            <button
              type="button"
              onClick={onLogout}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-900/20 px-5 text-sm font-semibold text-heading transition-colors hover:border-slate-900/40 hover:bg-[#faf8f4]"
            >
              <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />
              {t('nav.logout')}
            </button>
          </Card>
        </div>
      </div>
    </div>
  )
}
