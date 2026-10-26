import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../utils/api.js'

const AuthContext = createContext({ isLoggedIn: false, checking: true, user: null, login: async () => false, logout: () => {} })

const CART_STORAGE_KEY = 'ihle_cart' // same key as in CartContext.jsx; the cart ends with the login

/*
 * Customer login against the backend: customer number (from NAV) and the shop password.
 * The session is an httpOnly cookie that page scripts can't read, so on start the shop asks the backend
 * who is logged in. user = { customerNumber, company, email, billingAddress, shippingAddresses, payment, shippingAgent }.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let active = true
    api('/shop/me')
      .then((data) => active && setUser(data.user))
      .catch(() => active && setUser(null))
      .finally(() => active && setChecking(false))
    return () => {
      active = false
    }
  }, [])

  const value = useMemo(
    () => ({
      isLoggedIn: user !== null,
      checking,
      user,
      // Resolves to true when customer number and password are correct
      login: async (customerNumber, password) => {
        try {
          const data = await api('/shop/login', { method: 'POST', body: { customerNumber: String(customerNumber).trim(), password } })
          setUser(data.user)
          return true
        } catch {
          return false
        }
      },
      logout: async () => {
        try {
          await api('/shop/logout', { method: 'POST' })
        } finally {
          setUser(null)
          try {
            sessionStorage.removeItem(CART_STORAGE_KEY)
            // keys of the earlier front-end demo login
            sessionStorage.removeItem('ihle_demo_login')
            localStorage.removeItem('ihle_demo_login')
          } catch {
            // storage unavailable: nothing stored either
          }
        }
      },
    }),
    [user, checking],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export const useAuth = () => useContext(AuthContext)
