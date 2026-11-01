import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../utils/api.js'
import { DONE_HOLD_MS, SCREEN_DELAY_MS, WAKE_HINT_MS } from '../utils/boot.js'
import { AuthContext } from './contexts.js'

// Admin login against the backend. The session lives in an httpOnly cookie that page scripts can't read,
// so on start the panel asks the backend who is logged in.
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  // Start screen progress until the server answers. How long the server needs can't be measured (after a quiet
  // spell Render's free plan first starts the sleeping backend, up to about a minute), so the bar eases towards
  // 60 % meanwhile; logged in, the data download continues from there (DataProvider), otherwise it ends at 100 %.
  const [boot, setBoot] = useState(() => ({ percent: 0, step: 'connect', startedAt: Date.now() }))

  useEffect(() => {
    const started = Date.now()
    const elapsed = () => Date.now() - started
    const timer = setInterval(() => {
      const ms = elapsed()
      setBoot({ percent: 60 * (1 - Math.exp(-ms / 20_000)), step: ms > WAKE_HINT_MS ? 'wake' : 'connect', startedAt: started })
    }, 100)
    let hold
    api('/admin/me')
      .then(
        (data) => data.user,
        () => null,
      )
      .then((found) => {
        clearInterval(timer)
        setUser(found)
        // logged in: the data download takes over the bar. Not logged in: the start is complete; if the screen
        // was already showing, 100 % stays visible for a moment before the login form
        if (found || elapsed() < SCREEN_DELAY_MS) return setChecking(false)
        setBoot({ percent: 100, step: 'done', startedAt: started })
        hold = setTimeout(() => setChecking(false), DONE_HOLD_MS)
      })
    return () => {
      clearInterval(timer)
      clearTimeout(hold)
    }
  }, [])

  // Returns null on success, or the backend's error code
  const login = useCallback(async (username, password) => {
    try {
      const data = await api('/admin/login', { method: 'POST', body: { username, password } })
      setUser(data.user)
      return null
    } catch (error) {
      return error.code || 'serverError'
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api('/admin/logout', { method: 'POST' })
    } finally {
      setUser(null)
    }
  }, [])

  // Called when the backend answers 401 (session expired)
  const expire = useCallback(() => setUser(null), [])

  const value = useMemo(
    () => ({ user, checking, boot, login, logout, expire }),
    [user, checking, boot, login, logout, expire],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
