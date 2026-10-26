import app from './app.js'

// Local development server; the shop (5173) and the admin panel (5174) forward /api here
const PORT = Number(process.env.PORT) || 5000

app.listen(PORT, () => {
  console.log(`Ihle backend on http://localhost:${PORT}`)
})
