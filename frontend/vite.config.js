import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy keeps the browser same-origin against Laravel — no CORS surface,
// cookies/CSRF work exactly as they would same-domain in production.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/sanctum': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
})
