import i18n from '../i18n/index.js'

const locale = () => (i18n.resolvedLanguage === 'en' ? 'en-GB' : 'de-DE')

export const formatMoney = (value) =>
  new Intl.NumberFormat(locale(), { style: 'currency', currency: 'EUR' }).format(value || 0)

export const formatNumber = (value) => new Intl.NumberFormat(locale()).format(value || 0)

export const formatDate = (iso) =>
  iso ? new Intl.DateTimeFormat(locale(), { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso)) : '–'

export const formatDateTime = (iso) =>
  iso
    ? new Intl.DateTimeFormat(locale(), {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso))
    : '–'

// Sizes are stored with a hyphen like in NAV ("35-38") and shown with an en dash
export const formatSize = (size) => (size || '').replace('-', '–')

export const round2 = (value) => Math.round(value * 100) / 100
