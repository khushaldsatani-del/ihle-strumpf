import { createHmac, timingSafeEqual } from 'node:crypto'

// Stateless login sessions: the cookie holds who is logged in plus an expiry, signed with SESSION_SECRET.
// Nothing is stored on the server, which suits Vercel's short-lived functions.
// Admins and shop customers use separate cookies, so one login never grants the other.
const SECRET = process.env.SESSION_SECRET
if (!SECRET || SECRET.length < 32) throw new Error('SESSION_SECRET is missing or too short (see backend/.env.example)')

export const ADMIN_COOKIE = 'ihle_admin'
export const CUSTOMER_COOKIE = 'ihle_customer'
const MAX_AGE_MS = 12 * 60 * 60 * 1000

const sign = (payload) => createHmac('sha256', SECRET).update(payload).digest('base64url')

export function createToken(data) {
  const payload = Buffer.from(JSON.stringify({ ...data, exp: Date.now() + MAX_AGE_MS })).toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function readToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null
  const [payload, signature] = token.split('.')
  const expected = Buffer.from(sign(payload))
  const given = Buffer.from(signature || '')
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString())
    return data.exp > Date.now() ? data : null
  } catch {
    return null
  }
}

// httpOnly: page scripts can't read it; secure on the live site; Lax keeps it on normal navigation only
export const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api',
  maxAge: MAX_AGE_MS,
})
