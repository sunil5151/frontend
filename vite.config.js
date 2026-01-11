import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // safer than "::" and works everywhere
    port: 3000,
    strictPort: false,

    allowedHosts: [
      'frontend-production-e864.up.railway.app'
    ],

    proxy: {
      '/api': {
        target: 'https://backend-production-21d4.up.railway.app/',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
