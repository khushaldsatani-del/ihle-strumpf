import { Boxes, FileUp, Loader2, LogOut, Menu, ReceiptText, RotateCw, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth, useData } from '../../context/contexts.js'
import { LANGUAGES } from '../../i18n/index.js'
import ErrorBoundary from '../ErrorBoundary.jsx'

const NAV = [
  { to: '/orders', key: 'orders', icon: ReceiptText },
  { to: '/customers', key: 'customers', icon: Users },
  { to: '/products', key: 'products', icon: Boxes },
  { to: '/import', key: 'import', icon: FileUp },
]

function Sidebar({ onNavigate }) {
  const { t } = useTranslation()
  const { orders } = useData()
  // Orders NAV has not collected yet
  const counts = { orders: orders.filter((order) => order.status === 'new').length }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 px-5">
        <img src="/images/logo-black.png" alt="ihle®" className="h-7 w-auto" />
        <span className="rounded-md bg-brand px-1.5 py-0.5 text-[0.6875rem] font-bold tracking-wider text-white uppercase">
          Admin
        </span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3" aria-label={t('nav.label')}>
        {NAV.map(({ to, key, icon: Icon }) => (
          <NavLink key={to} to={to} onClick={onNavigate} className="sidebar-link">
            <Icon size={18} aria-hidden="true" />
            <span className="flex-1">{t(`nav.${key}`)}</span>
            {counts[key] > 0 && (
              <span className="grid min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[0.6875rem] leading-5 font-bold text-white">
                {counts[key]}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default function AdminLayout() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const { status, reload } = useData()
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  // Every page starts at the top, like a normal page change
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-screen">
      <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">
        {t('nav.skip')}
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-white lg:block">
        <Sidebar />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/30"
            aria-label={t('common.close')}
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white shadow-2xl">
            <button
              type="button"
              className="absolute top-4 right-3 rounded-lg p-1.5 text-muted hover:bg-hover"
              onClick={() => setMenuOpen(false)}
              aria-label={t('common.close')}
            >
              <X size={20} aria-hidden="true" />
            </button>
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            className="-ml-1 rounded-lg p-2 text-heading hover:bg-hover lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label={t('nav.openMenu')}
          >
            <Menu size={20} aria-hidden="true" />
          </button>
          <div className="flex-1" />
          <div className="flex rounded-lg border border-line-strong p-0.5 text-xs font-semibold" role="group" aria-label={t('nav.language')}>
            {LANGUAGES.map((language) => (
              <button
                key={language.code}
                type="button"
                onClick={() => i18n.changeLanguage(language.code)}
                aria-pressed={i18n.resolvedLanguage === language.code}
                className={`rounded-md px-2 py-1 uppercase transition-colors ${
                  i18n.resolvedLanguage === language.code ? 'bg-brand text-white' : 'text-muted hover:text-heading'
                }`}
              >
                {language.code}
              </button>
            ))}
          </div>
          <div className="hidden items-center gap-2.5 sm:flex">
            <span className="grid size-8 place-items-center rounded-full bg-cream font-heading text-xs font-bold text-brand">
              {user.name.slice(0, 1)}
            </span>
            <span className="text-sm font-semibold text-heading">{user.name}</span>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={logout}>
            <LogOut size={15} aria-hidden="true" />
            <span className="hidden sm:inline">{t('nav.logout')}</span>
          </button>
        </header>

        <main id="content" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          {status === 'loading' && (
            <div className="grid min-h-[50vh] place-items-center text-sm text-muted" role="status">
              <span className="flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                {t('common.loading')}
              </span>
            </div>
          )}
          {status === 'error' && (
            <div className="card mx-auto max-w-md p-6 text-center" role="alert">
              <p className="font-heading font-bold text-heading">{t('common.loadError')}</p>
              <p className="mt-1 text-sm text-muted">{t('common.loadErrorText')}</p>
              <button type="button" className="btn btn-primary mt-4" onClick={reload}>
                <RotateCw size={16} aria-hidden="true" />
                {t('common.retry')}
              </button>
            </div>
          )}
          {status === 'ready' && (
            <ErrorBoundary resetKey={pathname}>
              <Outlet />
            </ErrorBoundary>
          )}
        </main>
      </div>
    </div>
  )
}
