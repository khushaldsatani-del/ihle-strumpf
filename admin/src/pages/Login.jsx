import { Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/contexts.js'

export default function Login() {
  const { t } = useTranslation()
  const { user, checking, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  if (checking) return null
  if (user) return <Navigate to="/" replace />

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    const failure = await login(username, password)
    setBusy(false)
    if (!failure) navigate(location.state?.from || '/', { replace: true })
    else setError(failure)
  }

  return (
    <main className="grid min-h-screen place-items-center bg-surface px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/images/logo-black.png" alt="ihle®" className="h-9 w-auto" />
          <h1 className="mt-6 text-2xl tracking-tight">{t('login.title')}</h1>
          <p className="mt-1.5 text-sm text-muted">{t('login.subtitle')}</p>
        </div>

        <form onSubmit={submit} className="card space-y-4 p-6 shadow-[0_20px_50px_-30px_rgb(15_23_42/0.4)]" noValidate>
          <div>
            <label htmlFor="username" className="field-label">
              {t('login.username')}
            </label>
            <input
              id="username"
              className="field"
              autoComplete="username"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value)
                setError(null)
              }}
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="field-label">
              {t('login.password')}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="field pr-10"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setError(null)
                }}
                required
              />
              <button
                type="button"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-muted hover:text-heading"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={t(showPassword ? 'login.hidePassword' : 'login.showPassword')}
              >
                {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
              </button>
            </div>
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger" role="alert">
              {t(`login.errors.${error}`, { defaultValue: t('login.errors.serverError') })}
            </p>
          )}
          <button type="submit" className="btn btn-primary w-full" disabled={busy || !username || !password}>
            <LockKeyhole size={16} aria-hidden="true" />
            {t('login.submit')}
          </button>
        </form>
        <p className="mt-6 text-center text-xs text-muted">{t('login.note')}</p>
      </div>
    </main>
  )
}
