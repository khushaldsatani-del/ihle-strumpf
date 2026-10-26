import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { pool } from '../config/db.js'
import { savePhoto } from '../modules/photos/photoService.js'

// Uploads every photo in a folder, the same way as the admin panel's photo upload:
//   npm run photos:upload -- "D:/path/to/Ihle JPG"
// Existing photos with the same name are replaced. Four at a time keeps it quick without overloading anything.
const folder = process.argv[2]
const IMAGE = /\.(jpe?g|png|webp|tiff?)$/i

try {
  if (!folder) throw new Error('usage: npm run photos:upload -- <folder>')
  const files = (await readdir(folder)).filter((file) => IMAGE.test(file)).sort()
  console.log(`${files.length} photos in ${folder}`)

  let done = 0
  let bytes = 0
  const failed = []
  const queue = [...files]
  const worker = async () => {
    for (let file = queue.shift(); file; file = queue.shift()) {
      const result = await savePhoto(file, await readFile(path.join(folder, file)))
      if (result.error) failed.push(`${file}: ${result.error}`)
      else bytes += result.bytes
      done += 1
      if (done % 25 === 0 || done === files.length) console.log(`  ${done}/${files.length}`)
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()])

  console.log(`saved ${files.length - failed.length} photos (${(bytes / 1024 / 1024).toFixed(1)} MB as WebP)`)
  for (const line of failed) console.log('  not saved:', line)
} catch (error) {
  console.error('Photo upload failed:', error.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
