import { useId, useState } from 'react'
import { CircleAlert, CircleCheck, Eye, EyeOff, Hash, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import RollText from '../components/common/RollText.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const PHONE = '+49 37369 84690'

/**
 * Login for registered customers: customer number and password.
 * Temporary: the check happens in the front end (see AuthContext.jsx); the real login will use the backend.
 */
export default function Login() {
  const { t } = useTranslation()
  const id = useId()
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn, user, login, logout } = useAuth()
  const [customerNumber, setCustomerNumber] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [failed, setFailed] = useState(false)

  const onSubmit = async (event) => {
    event.preventDefault()
    if (await login(customerNumber, password)) {
      // back to the page the customer came from, otherwise to the products
      navigate(location.state?.from ?? '/products', { replace: true })
    } else {
      setFailed(true)
    }
  }

  return (
    <div className="mx-auto grid max-w-[96rem] items-stretch gap-8 px-4 pb-20 pt-6 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-16 lg:pt-10">
      <div className="mx-auto flex w-full max-w-md flex-col justify-center py-4 lg:py-12">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a5a3c]">{t('login.eyebrow')}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-heading sm:text-4xl">{t('login.title')}</h1>

        {isLoggedIn ? (
          // Already logged in
          <div className="mt-8">
            <p className="flex items-start gap-3 rounded-2xl bg-[#f1f6ef] p-4 text-sm leading-relaxed text-heading">
              <CircleCheck size={20} strokeWidth={1.75} aria-hidden="true" className="mt-0.5 shrink-0 text-[#3f7a4f]" />
              <span>
                {t('login.loggedInAs')}{' '}
                <strong>
                  {user.company} ({t('login.customerNumber')} {user.customerNumber})
                </strong>
              </span>
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/products" className="auth-btn">
                <RollText>{t('login.toProducts')}</RollText>
              </Link>
              <button type="button" className="auth-btn auth-btn--ghost" onClick={logout}>
                <RollText>{t('nav.logout')}</RollText>
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-3 text-base leading-relaxed text-body">{t('login.intro')}</p>

            <form className="mt-8" onSubmit={onSubmit}>
              <label htmlFor={`${id}-number`} className="auth-label">
                {t('login.customerNumber')} <span aria-hidden="true">*</span>
              </label>
              <div className="auth-field">
                <Hash size={18} strokeWidth={1.75} aria-hidden="true" />
                <input
                  id={`${id}-number`}
                  type="text"
                  inputMode="numeric"
                  autoComplete="username"
                  required
                  value={customerNumber}
                  aria-invalid={failed || undefined}
                  aria-describedby={failed ? `${id}-error` : undefined}
                  onChange={(event) => {
                    setCustomerNumber(event.target.value)
                    setFailed(false)
                  }}
                />
              </div>

              <label htmlFor={`${id}-password`} className="auth-label mt-5">
                {t('login.password')} <span aria-hidden="true">*</span>
              </label>
              <div className="auth-field">
                <Lock size={18} strokeWidth={1.75} aria-hidden="true" />
                <input
                  id={`${id}-password`}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  aria-invalid={failed || undefined}
                  aria-describedby={`${id}-hint${failed ? ` ${id}-error` : ''}`}
                  onChange={(event) => {
                    setPassword(event.target.value)
                    setFailed(false)
                  }}
                />
                <button
                  type="button"
                  className="auth-eye"
                  aria-label={t(showPassword ? 'login.hidePassword' : 'login.showPassword')}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOff size={18} strokeWidth={1.75} aria-hidden="true" /> : <Eye size={18} strokeWidth={1.75} aria-hidden="true" />}
                </button>
              </div>
              <p id={`${id}-hint`} className="mt-2 text-sm leading-relaxed text-body">
                {t('login.passwordHint')}{' '}
                <a href={`tel:${PHONE.replaceAll(' ', '')}`} className="whitespace-nowrap font-semibold text-heading underline underline-offset-2">
                  {PHONE}
                </a>
              </p>

              {/* Error message (announced to screen readers) */}
              <div aria-live="polite">
                {failed && (
                  <p id={`${id}-error`} className="mt-5 flex items-start gap-2.5 rounded-xl bg-[#fdf0ee] p-3.5 text-sm font-medium text-[#a3261a]">
                    <CircleAlert size={18} strokeWidth={1.75} aria-hidden="true" className="mt-px shrink-0" />
                    {t('login.error')}
                  </p>
                )}
              </div>

              <button type="submit" className="auth-btn mt-7 w-full">
                <RollText>{t('nav.login')}</RollText>
              </button>
              <p className="mt-3 text-xs text-body">* {t('login.required')}</p>
            </form>
          </>
        )}
      </div>

      {/* Picture next to the form (desktop only) */}
      <div className="relative hidden min-h-[36rem] overflow-hidden rounded-[2rem] bg-[#f1e9e2] lg:block">
        <img src="/images/colors/banner.webp" alt="" className="absolute inset-0 size-full object-cover object-right" />
      </div>
    </div>
  )
}
