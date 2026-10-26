import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from '../config/db.js'

// Applies the SQL files in database/migrations in name order, each once, each in its own transaction.
// Applied files are recorded in schema_migrations, so running this again only applies new files.
const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../database/migrations')

try {
  await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())')
  const { rows } = await pool.query('SELECT name FROM schema_migrations')
  const applied = new Set(rows.map((row) => row.name))
  const files = (await readdir(dir)).filter((file) => file.endsWith('.sql')).sort()

  let count = 0
  for (const file of files) {
    if (applied.has(file)) continue
    const sql = await readFile(path.join(dir, file), 'utf8')
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query(sql)
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file])
      await client.query('COMMIT')
      console.log('applied', file)
      count += 1
    } catch (error) {
      await client.query('ROLLBACK')
      throw new Error(`${file}: ${error.message}`)
    } finally {
      client.release()
    }
  }
  console.log(count ? `${count} migration(s) applied` : 'database is up to date')
} catch (error) {
  console.error('Migration failed:', error.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
