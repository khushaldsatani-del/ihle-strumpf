import bcrypt from 'bcryptjs'
import { stdin as input, stdout as output } from 'node:process'
import { createInterface } from 'node:readline/promises'
import { pool } from '../config/db.js'

// Gives an imported NAV customer a shop password (e.g. test logins for the presentation):
//   npm run customer:password
// The customer must already exist (imported from nav_ShopCustomers.xml). Only a bcrypt hash is stored;
// a later customer import never touches it. An empty password removes the shop access again.
const rl = createInterface({ input, output })

try {
  const number = (await rl.question('Customer number: ')).trim()
  const { rows } = await pool.query('SELECT number, billing FROM customers WHERE number = $1', [number])
  if (!rows[0]) throw new Error(`no customer with number ${number} (import nav_ShopCustomers.xml first)`)
  console.log(`  ${[rows[0].billing.firstName, rows[0].billing.lastName].filter(Boolean).join(' ')}, ${rows[0].billing.city}`)

  const password = await rl.question('Shop password (at least 8 characters, empty = remove access): ')
  if (password && password.length < 8) throw new Error('password is too short')

  await pool.query('UPDATE customers SET password_hash = $2 WHERE number = $1', [number, password ? await bcrypt.hash(password, 12) : null])
  console.log(password ? `Shop access for ${number} saved.` : `Shop access for ${number} removed.`)
} catch (error) {
  console.error('Not saved:', error.message)
  process.exitCode = 1
} finally {
  rl.close()
  await pool.end()
}
