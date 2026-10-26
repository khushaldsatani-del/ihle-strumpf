import { Router } from 'express'
import { loadPhoto } from './photoService.js'

// Public photo URLs for the shop and the admin panel: /api/photos/thumb/40000_001_01.webp?v=…
// The ?v= value changes when a photo is replaced, so browsers and Vercel's CDN may cache each version for long.
const router = Router()

router.get('/:size/:file', async (req, res) => {
  const { size } = req.params
  if (size !== 'thumb' && size !== 'large') return res.status(404).end()
  const photo = await loadPhoto(req.params.file, size)
  // a missing photo may be uploaded soon, so "not found" is only cached briefly
  if (!photo) return res.set('Cache-Control', 'public, max-age=60').status(404).end()
  // Browsers and CDNs (Vercel's edge in front of the shop) keep a versioned photo for a year; without ?v= for an hour.
  // CDN-Cache-Control is the rule for shared caches only, so the edge never has to ask the backend again.
  const cache = req.query.v ? 'public, max-age=31536000, s-maxage=31536000, immutable' : 'public, max-age=3600, s-maxage=3600'
  res.set({ 'Cache-Control': cache, 'CDN-Cache-Control': cache })
  res.type('image/webp').send(photo.data)
})

export default router
