import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api-lumen': {
        target: 'https://aiker-agent-lumen-scout.vercel.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-lumen/, ''),
      },
      '/api-stripe': {
        target: 'https://aiker-agent-stripe-settle.vercel.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-stripe/, ''),
      },
      '/api-orbit': {
        target: 'https://aiker-agent-orbit.vercel.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-orbit/, ''),
      },
    },
  },
})
