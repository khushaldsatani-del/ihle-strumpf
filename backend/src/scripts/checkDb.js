import { pool } from '../config/db.js'

// Checks that the database is reachable. Prints only the server version and region, never the connection string.
try {
  const { rows } = await pool.query("SELECT version() AS version, current_database() AS database, now() AS time")
  console.log('Database connection OK')
  console.log('  database:', rows[0].database)
  console.log('  server:  ', rows[0].version.split(',')[0])
  console.log('  time:    ', rows[0].time.toISOString())
} catch (error) {
  // pg error messages don't contain the password; the code tells what went wrong
  console.error('Database connection FAILED:', error.code || '', error.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
