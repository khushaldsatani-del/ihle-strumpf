import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import useClickOutside from '../../hooks/useClickOutside.js'

/**
 * Search icon that expands into a field inside the navbar.
 * Enter goes to /search?q=…, Escape closes. alwaysOpen = full-width field (mobile menu).
 */
export default function SearchBar({ open = false, onOpenChange, alwaysOpen = false }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const formRef = useRef(null)
  const inputRef = useRef(null)
  const buttonRef = useRef(null)
  const expanded = alwaysOpen || open

  useClickOutside(formRef, () => onOpenChange?.(false), open && !alwaysOpen)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const close = () => {
    onOpenChange?.(false)
    buttonRef.current?.focus()
  }

  const onSubmit = (event) => {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) {
      inputRef.current?.focus()
      return
    }
    navigate(`/search?q=${encodeURIComponent(trimmed)}`)
    setQuery('')
    onOpenChange?.(false)
  }

  return (
    <form
      ref={formRef}
      role="search"
      className={`nav-search ${alwaysOpen ? 'nav-search--block' : ''}`}
      data-open={expanded || undefined}
      onSubmit={onSubmit}
    >
      {/* Collapsed: opens the field. Expanded: submits the search. */}
      <button
        ref={buttonRef}
        type={expanded ? 'submit' : 'button'}
        className="nav-btn"
        aria-label={t('nav.search')}
        aria-expanded={alwaysOpen ? undefined : open}
        onClick={expanded ? undefined : () => onOpenChange?.(true)}
      >
        <Search size={20} strokeWidth={1.75} aria-hidden="true" />
      </button>

      {expanded && (
        <>
          <input
            ref={inputRef}
            type="search"
            value={query}
            placeholder={t('nav.searchPlaceholder')}
            aria-label={t('nav.searchPlaceholder')}
            autoComplete="off"
            enterKeyHint="search"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && !alwaysOpen) close()
            }}
          />
          {!alwaysOpen && (
            <button type="button" className="nav-btn" aria-label={t('nav.closeSearch')} onClick={close}>
              <X size={18} strokeWidth={1.75} aria-hidden="true" />
            </button>
          )}
        </>
      )}
    </form>
  )
}
