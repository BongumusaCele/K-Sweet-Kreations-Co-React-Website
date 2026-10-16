import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'http://localhost:5088',
        changeOrigin: false,
      },
      '/uploads': {
        target: process.env.API_PROXY_TARGET || 'http://localhost:5088',
        changeOrigin: false,
      },
    },
  },
})
