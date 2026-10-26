import bcrypt from 'bcryptjs'
import { stdin as input, stdout as output } from 'node:process'
import { createInterface } from 'node:readline/promises'
import { pool } from '../config/db.js'

// Creates an admin login, or sets a new password for an existing one:
//   npm run admin:create
// The password is typed in your own terminal and only its bcrypt hash is stored.
const rl = createInterface({ input, output })

try {
  const username = (await rl.question('Username: ')).trim().toLowerCase()
  const name = (await rl.question('Display name: ')).trim() || username
  const password = await rl.question('Password (at least 10 characters): ')
  if (!/^[a-z0-9._-]{3,40}$/.test(username)) throw new Error('username: 3–40 characters, letters, digits, . _ -')
  if (password.length < 10) throw new Error('password is too short')

  await pool.query(
    `INSERT INTO admin_users (username, name, password_hash) VALUES ($1, $2, $3)
     ON CONFLICT (username) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash`,
    [username, name, await bcrypt.hash(password, 12)],
  )
  console.log(`Admin "${username}" saved.`)
} catch (error) {
  console.error('Not saved:', error.message)
  process.exitCode = 1
} finally {
  rl.close()
  await pool.end()
}
