import pg from 'pg'

// One shared pool. DATABASE_URL comes from .env locally and from the Vercel project settings online.
// Neon's pooled connection string already handles many short-lived serverless connections.
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set (see backend/.env.example)')

// NUMERIC columns (prices) come back as numbers instead of strings
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (value) => Number.parseFloat(value))

// Neon's link carries sslmode=require; TLS with full certificate checks is set below instead,
// which also avoids pg's warning about how it will read sslmode in its next major version
const url = new URL(process.env.DATABASE_URL)
url.searchParams.delete('sslmode')

export const pool = new pg.Pool({
  connectionString: url.toString(),
  max: 5,
  ssl: { rejectUnauthorized: true },
})

export const query = (text, params) => pool.query(text, params)

// Runs fn inside one transaction: everything is saved, or nothing is
export async function transaction(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
