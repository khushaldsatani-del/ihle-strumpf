import bcrypt from 'bcryptjs'

// bcrypt hash of a random value nobody knows, with the same cost (12) as real passwords.
// A login for an unknown customer number is checked against it, so it takes as long as a real one and
// the response time doesn't reveal which customer numbers or admin names exist.
const UNKNOWN_USER_HASH = '$2b$12$JOwQmEOg.KFNQAUFDTOL5ulBJ1unkVZKF6KMotIjGBZC1U4doPxcO'

// True only when there is a stored hash and the password matches it
export async function checkPassword(password, hash) {
  const matches = await bcrypt.compare(String(password ?? ''), hash || UNKNOWN_USER_HASH)
  return Boolean(hash) && matches
}
