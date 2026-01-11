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
      'smart-task-planner-production-3e23.up.railway.app'
    ],

    proxy: {
      '/api': {
        target: 'https://smart-task-planner-backend-production.up.railway.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
