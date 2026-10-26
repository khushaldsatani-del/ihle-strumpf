import { ADMIN_COOKIE, CUSTOMER_COOKIE, readToken } from '../utils/session.js'

export function requireAdmin(req, res, next) {
  const session = readToken(req.cookies?.[ADMIN_COOKIE])
  if (session?.role !== 'admin') return res.status(401).json({ error: 'notLoggedIn' })
  req.admin = session
  next()
}

// For shop routes that also work for guests: sets req.customer when a customer is logged in
export function optionalCustomer(req, res, next) {
  const session = readToken(req.cookies?.[CUSTOMER_COOKIE])
  if (session?.role === 'customer') req.customer = session
  next()
}

export function requireCustomer(req, res, next) {
  optionalCustomer(req, res, () => {
    if (!req.customer) return res.status(401).json({ error: 'notLoggedIn' })
    next()
  })
}

// Very small brake on password guessing: a few failed logins per key, then a pause.
// In-memory, so per server instance; good enough until the backend runs on Ihle's own server.
const failures = new Map()
const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES = 8

export const loginLimiter = {
  blocked(key) {
    const entry = failures.get(key)
    if (!entry || Date.now() - entry.first > WINDOW_MS) return false
    return entry.count >= MAX_FAILURES
  },
  fail(key) {
    const entry = failures.get(key)
    if (!entry || Date.now() - entry.first > WINDOW_MS) failures.set(key, { first: Date.now(), count: 1 })
    else entry.count += 1
  },
  reset(key) {
    failures.delete(key)
  },
}
