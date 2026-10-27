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

// Photos served recently, kept in memory (least recently used out first) so that opening a product with many
// photos doesn't cost one database read per photo every time. Bounded by PHOTO_CACHE_MB (default 64 MB).
const CACHE_LIMIT = (Number(process.env.PHOTO_CACHE_MB) || 64) * 1024 * 1024
const UNVERSIONED_TTL_MS = 60_000 // a request without ?v= may get a copy at most a minute old
const cache = new Map() // "thumb/40000_001_01" → { data, version, at }
const pending = new Map() // reads in progress: simultaneous requests for one photo share a single query
let cacheBytes = 0

function remember(key, entry) {
  forget(key)
  if (entry.data.length > CACHE_LIMIT / 8) return
  cache.set(key, entry)
  cacheBytes += entry.data.length
  for (const [oldest, old] of cache) {
    if (cacheBytes <= CACHE_LIMIT) break
    cache.delete(oldest)
    cacheBytes -= old.data.length
  }
}

function forget(key) {
  const old = cache.get(key)
  if (!old) return
  cache.delete(key)
  cacheBytes -= old.data.length
}

export const photoCacheStats = () => ({ entries: cache.size, bytes: cacheBytes, limit: CACHE_LIMIT })

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
  forget(`thumb/${name}`)
  forget(`large/${name}`)
  return { name, bytes: thumb.data.length + large.data.length }
}

// version: the ?v= of the URL (upload time in seconds). A cached copy is used only for the same version,
// so a replaced photo is read fresh even on a server that cached the old one.
export async function loadPhoto(name, size, version) {
  const column = size === 'large' ? 'large' : 'thumb'
  const key = `${column}/${photoName(name)}`
  const cached = cache.get(key)
  if (cached && (version ? String(cached.version) === String(version) : Date.now() - cached.at < UNVERSIONED_TTL_MS)) {
    // move to the end: most recently used
    cache.delete(key)
    cache.set(key, cached)
    return cached
  }

  if (!pending.has(key)) {
    pending.set(
      key,
      query(`SELECT ${column} AS data, floor(extract(epoch FROM uploaded_at))::bigint AS version FROM photos WHERE name = $1`, [photoName(name)])
        .then(({ rows }) => {
          const entry = rows[0] ? { data: rows[0].data, version: rows[0].version, at: Date.now() } : null
          if (entry) remember(key, entry)
          return entry
        })
        .finally(() => pending.delete(key)),
    )
  }
  return pending.get(key)
}
