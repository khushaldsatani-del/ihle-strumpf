import compression from 'compression'
import cookieParser from 'cookie-parser'
import express from 'express'
import adminRoutes from './modules/admin/adminRoutes.js'
import photoRoutes from './modules/photos/photoRoutes.js'
import shopRoutes from './modules/shop/shopRoutes.js'

// The Express app, started by server.js (locally and on Render)
const app = express()

app.disable('x-powered-by')
// Behind Render's proxy: trust exactly that one hop (https flag, client address for the login limiter).
// Shop and admin reach the backend through Vercel's /api rewrite, so the address seen here is Vercel's;
// the limiter keys include the customer number, so lockouts still work per account.
app.set('trust proxy', 1)
// JSON answers (e.g. the 3,800 customers for the admin panel) shrink to a fraction; photos are already compressed
app.use(compression({ filter: (req, res) => !req.path.startsWith('/api/photos') && compression.filter(req, res) }))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

app.get('/api/health', (req, res) => res.json({ ok: true }))
app.use('/api/photos', photoRoutes)
app.use('/api/shop', shopRoutes)
app.use('/api/admin', adminRoutes)

app.use('/api', (req, res) => res.status(404).json({ error: 'notFound' }))

// Express 5 passes errors from async routes here; details stay in the server log, never in the response
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error)
  if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'tooLarge' })
  if (error.code === 'LIMIT_FILE_COUNT') return res.status(413).json({ error: 'tooManyFiles' })
  if (error.code === 'ERR_BUFFER_TOO_LARGE' || error.code === 'Z_DATA_ERROR') return res.status(400).json({ error: 'invalidXml' })
  console.error(error)
  res.status(500).json({ error: 'serverError' })
})

export default app
