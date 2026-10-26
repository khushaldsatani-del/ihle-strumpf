import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../utils/api.js'
import { AuthContext } from './contexts.js'

// Admin login against the backend. The session lives in an httpOnly cookie that page scripts can't read,
// so on start the panel asks the backend who is logged in.
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    api('/admin/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false))
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

  const value = useMemo(() => ({ user, checking, login, logout, expire }), [user, checking, login, logout, expire])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
