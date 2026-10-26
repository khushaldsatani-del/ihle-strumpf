import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pool } from '../config/db.js'
import { applyImport, previewImport } from '../integrations/nav/import/applyImport.js'

// Imports a NAV file from the command line, the same way as the admin panel's upload:
//   npm run import -- <file.xml>            → preview only
//   npm run import -- <file.xml> --apply    → save
const file = process.argv[2]
const apply = process.argv.includes('--apply')

try {
  if (!file) throw new Error('usage: npm run import -- <file.xml> [--apply]')
  const xml = await readFile(file, 'utf8')
  const fileName = path.basename(file)
  const result = apply ? await applyImport(xml, { fileName, admin: 'command line' }) : await previewImport(xml)
  if (result.error) throw new Error(result.error)

  console.log(`${fileName}: ${result.type}, ${result.rowCount} entries`)
  console.log(`  new: ${result.diff.created.length}, changed: ${result.diff.updated.length}, unchanged: ${result.diff.unchanged.length}, errors: ${result.errors.length}`)
  for (const error of result.errors) console.log(`  error in entry ${error.row} (${error.value || '–'}): ${error.message}`)
  console.log(apply ? '  saved.' : '  preview only, nothing saved (add --apply to save)')
} catch (error) {
  console.error('Import failed:', error.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
