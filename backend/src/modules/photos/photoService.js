import sharp from 'sharp'
import { query } from '../../config/db.js'

// Product photos. NAV lists them by file name (<Picture>40000_001_01.jpg</Picture>); whatever is uploaded
// under that name belongs to the article. Each upload is stored as two WebP copies (list and product page),
// so the originals (often several MB) never have to be sent to visitors.

// "40000_001_01.JPG" → "40000_001_01": the key that links a NAV picture name to an uploaded photo
export const photoName = (file) =>
  String(file)
    .trim()
    .replace(/^.*[\\/]/, '')
    .replace(/\.(jpe?g|png|webp|tiff?)$/i, '')
    .toLowerCase()

const VALID_NAME = /^[a-z0-9][a-z0-9_.-]{0,99}$/

export async function savePhoto(fileName, buffer) {
  const name = photoName(fileName)
  if (!VALID_NAME.test(name)) return { name, error: 'invalidName' }

  let image
  try {
    // rotate() applies the camera orientation; limitInputPixels guards against decompression bombs
    image = sharp(buffer, { limitInputPixels: 60_000_000 }).rotate()
    const meta = await image.metadata()
    if (!meta.width || !meta.height) return { name, error: 'notAnImage' }
  } catch {
    return { name, error: 'notAnImage' }
  }

  const [thumb, large] = await Promise.all([
    image.clone().resize({ width: 480, height: 480, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toBuffer({ resolveWithObject: true }),
    image.clone().resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true }),
  ])

  await query(
    `INSERT INTO photos (name, thumb, large, width, height, uploaded_at) VALUES ($1, $2, $3, $4, $5, now())
     ON CONFLICT (name) DO UPDATE SET thumb = EXCLUDED.thumb, large = EXCLUDED.large, width = EXCLUDED.width,
       height = EXCLUDED.height, uploaded_at = now()`,
    [name, thumb.data, large.data, large.info.width, large.info.height],
  )
  return { name, bytes: thumb.data.length + large.data.length }
}

export async function loadPhoto(name, size) {
  const column = size === 'large' ? 'large' : 'thumb'
  const { rows } = await query(`SELECT ${column} AS data, uploaded_at FROM photos WHERE name = $1`, [photoName(name)])
  return rows[0] || null
}
