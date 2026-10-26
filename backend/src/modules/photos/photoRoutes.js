import { Router } from 'express'
import { loadPhoto } from './photoService.js'

// Public photo URLs for the shop and the admin panel: /api/photos/thumb/40000_001_01.webp?v=…
// The ?v= value changes when a photo is replaced, so browsers and Vercel's CDN may cache each version for long.
const router = Router()

router.get('/:size/:file', async (req, res) => {
  const { size } = req.params
  if (size !== 'thumb' && size !== 'large') return res.status(404).end()
  const photo = await loadPhoto(req.params.file, size)
  if (!photo) return res.status(404).end()
  res.set('Cache-Control', req.query.v ? 'public, max-age=31536000, immutable' : 'public, max-age=3600')
  res.type('image/webp').send(photo.data)
})

export default router
