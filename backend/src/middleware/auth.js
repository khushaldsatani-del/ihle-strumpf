import { createHash } from 'node:crypto'
import { query } from '../config/db.js'
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

// Brake on password guessing: a few failed logins per key (account + client address), then a pause.
// Counted in the database (login_failures, migration 006), so all server instances and processes behind the load
// balancer share one count; on a database without that table yet, each process counts in memory as before.
const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES = 8
const WINDOW = `${WINDOW_MS / 1000} seconds`

// Fixed-length key, also for a megabyte-long "customer number", and nothing readable stored
const hashKey = (key) => createHash('sha256').update(key).digest('hex')

// ---- in memory (fallback until migration 006 has run) ----
const failures = new Map()

// Every failed login with a new customer number adds an entry; without a limit, a flood of made-up numbers
// would fill the memory. Entries are kept oldest first (a renewed one moves to the end), so removing from the
// front drops expired entries and, above the limit, the oldest ones, without scanning the whole map.
const MAX_ENTRIES = 10_000
function prune() {
  const now = Date.now()
  for (const [key, entry] of failures) {
    if (failures.size <= MAX_ENTRIES && now - entry.first <= WINDOW_MS) break
    failures.delete(key)
  }
}

const memoryLimiter = {
  blocked(key) {
    const entry = failures.get(key)
    if (!entry || Date.now() - entry.first > WINDOW_MS) return false
    return entry.count >= MAX_FAILURES
  },
  fail(key) {
    const entry = failures.get(key)
    if (!entry || Date.now() - entry.first > WINDOW_MS) {
      failures.delete(key)
      failures.set(key, { first: Date.now(), count: 1 })
      prune()
    } else entry.count += 1
  },
  reset(key) {
    failures.delete(key)
  },
}

// ---- in the database ----
const databaseLimiter = {
  async blocked(key) {
    const { rows } = await query(`SELECT count FROM login_failures WHERE key = $1 AND first_at > now() - $2::interval`, [key, WINDOW])
    return (rows[0]?.count ?? 0) >= MAX_FAILURES
  },
  async fail(key) {
    // a key whose window has passed starts again at 1
    await query(
      `INSERT INTO login_failures (key, first_at, count) VALUES ($1, now(), 1)
       ON CONFLICT (key) DO UPDATE SET
         count = CASE WHEN login_failures.first_at <= now() - $2::interval THEN 1 ELSE login_failures.count + 1 END,
         first_at = CASE WHEN login_failures.first_at <= now() - $2::interval THEN now() ELSE login_failures.first_at END`,
      [key, WINDOW],
    )
    // now and then, drop expired keys so made-up numbers don't pile up
    if (Math.random() < 0.02) await query(`DELETE FROM login_failures WHERE first_at <= now() - $1::interval`, [WINDOW])
  },
  async reset(key) {
    await query('DELETE FROM login_failures WHERE key = $1', [key])
  },
}

// Uses the database table, and memory while it doesn't exist (42P01) – checked again on every call,
// so the shared count takes over as soon as the migration has run
async function limit(method, key) {
  try {
    return await databaseLimiter[method](hashKey(key))
  } catch (error) {
    if (error.code !== '42P01') throw error
    return memoryLimiter[method](key)
  }
}

export const loginLimiter = {
  blocked: (key) => limit('blocked', key),
  fail: (key) => limit('fail', key),
  reset: (key) => limit('reset', key),
}
