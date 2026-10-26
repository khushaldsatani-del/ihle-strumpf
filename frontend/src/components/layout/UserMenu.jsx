import { LogIn, LogOut, MapPin, Package, Settings, User, UserCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext.jsx'
import DropdownMenu from './DropdownMenu.jsx'

// User icon with a dropdown: the login link for guests, or the account links when logged in
// (then the icon changes to a person with a tick).
export default function UserMenu({ open, onOpenChange }) {
  const { t } = useTranslation()
  const { isLoggedIn, user, logout } = useAuth()

  const items = isLoggedIn
    ? [
        { key: 'orders', label: t('nav.myOrders'), to: '/account/orders', icon: Package },
        { key: 'addresses', label: t('nav.addresses'), to: '/account/addresses', icon: MapPin },
        { key: 'settings', label: t('nav.settings'), to: '/account/settings', icon: Settings },
        { key: 'logout', label: t('nav.logout'), onSelect: logout, icon: LogOut },
      ]
    : [{ key: 'login', label: t('nav.login'), to: '/login', icon: LogIn }]

  const header = isLoggedIn ? (
    <p className="px-3.5 pb-2 pt-2 text-xs font-semibold tracking-wide text-(--nav-fg-muted)">{user.company}</p>
  ) : null

  return (
    <DropdownMenu
      open={open}
      onOpenChange={onOpenChange}
      items={items}
      header={header}
      label={t('nav.account')}
      renderTrigger={(triggerProps) => (
        // Logged in: a "person with a tick" icon instead of the plain person
        <button
          type="button"
          className="nav-btn"
          aria-label={isLoggedIn ? t('nav.accountOf', { name: user.company }) : t('nav.account')}
          {...triggerProps}
        >
          {isLoggedIn ? (
            <UserCheck size={21} strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <User size={20} strokeWidth={1.75} aria-hidden="true" />
          )}
        </button>
      )}
    />
  )
}
