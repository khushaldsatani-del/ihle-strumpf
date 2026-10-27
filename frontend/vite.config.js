import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: process.env.API_TARGET || 'http://localhost:5000', // API_TARGET: a second backend, e.g. for tests
        changeOrigin: true,
      },
    },
  },
})
