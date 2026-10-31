import cluster from 'node:cluster'
import { availableParallelism } from 'node:os'
import { startDraining } from './utils/lifecycle.js'

// The backend server, locally (the shop on 5173 and the admin panel on 5174 forward /api here) and on Render.
//
// Load balancing happens on two levels, both without shared memory (sessions are signed cookies, photos and the
// login lockout live in the database):
// • between instances: Render's load balancer spreads requests over all running instances (render.yaml: scaling)
// • inside one instance: WEB_CONCURRENCY processes (default 1) share the port; Node's cluster hands out the
//   connections in turn, so a multi-core instance uses all its cores
const PORT = Number(process.env.PORT) || 5000
const WORKERS = Math.max(1, Math.min(Number(process.env.WEB_CONCURRENCY) || 1, availableParallelism()))
// On shutdown: first keep answering for a moment while the health check already says 503, so the load balancer
// moves traffic away before the port closes; then wait for running requests, at most until the timeout
// (Render stops waiting after 30 s). Locally there is no load balancer, so restarts (npm run dev) don't wait.
const DRAIN_DELAY_MS = Number(process.env.SHUTDOWN_DRAIN_MS ?? (process.env.NODE_ENV === 'production' ? 3000 : 0))
const SHUTDOWN_TIMEOUT_MS = 20_000

if (WORKERS > 1 && cluster.isPrimary) startPrimary()
else await startServer()

// Starts the worker processes and replaces any that crash. Each one gets an equal share of the database
// connections, so all of them together stay within DB_POOL_MAX.
function startPrimary() {
  const poolPerWorker = String(Math.max(2, Math.floor((Number(process.env.DB_POOL_MAX) || 5 * WORKERS) / WORKERS)))
  let stopping = false
  const fork = () => cluster.fork({ DB_POOL_MAX: poolPerWorker })
  for (let i = 0; i < WORKERS; i += 1) fork()
  console.log(`Ihle backend on http://localhost:${PORT} with ${WORKERS} processes`)

  cluster.on('exit', (worker, code) => {
    if (stopping) {
      if (Object.keys(cluster.workers).length === 0) process.exit(0)
      return
    }
    // a crashed process is replaced after a moment (not at once, so a crash right at start can't loop fast)
    console.error(`backend process ${worker.process.pid} stopped (${code}), starting a new one`)
    setTimeout(fork, 1000)
  })

  const stop = () => {
    if (stopping) return
    stopping = true
    for (const worker of Object.values(cluster.workers)) worker.send('shutdown')
    setTimeout(() => process.exit(0), DRAIN_DELAY_MS + SHUTDOWN_TIMEOUT_MS + 2000).unref()
  }
  process.on('SIGTERM', stop)
  process.on('SIGINT', stop)
}

async function startServer() {
  const [{ default: app }, { pool }] = await Promise.all([import('./app.js'), import('./config/db.js')])
  const server = app.listen(PORT, () => {
    if (cluster.isPrimary) console.log(`Ihle backend on http://localhost:${PORT}`)
  })
  // Keep idle connections from a load balancer or proxy open longer than they do (they reuse connections for up
  // to about a minute); otherwise Node could close one just as the proxy sends the next request on it
  server.keepAliveTimeout = 65_000
  server.headersTimeout = 66_000

  let stopping = false
  const shutdown = () => {
    if (stopping) return
    stopping = true
    startDraining()
    setTimeout(() => {
      // no new connections; running requests finish (idle keep-alive connections are closed by close())
      server.close(async () => {
        await pool.end().catch(() => {})
        process.exit(0)
      })
      setTimeout(() => {
        server.closeAllConnections()
        process.exit(0)
      }, SHUTDOWN_TIMEOUT_MS).unref()
    }, DRAIN_DELAY_MS)
  }
  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
  process.on('message', (message) => message === 'shutdown' && shutdown())
}
