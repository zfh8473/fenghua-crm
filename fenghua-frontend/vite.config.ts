import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3005,
    // Optional: Enable HTTPS for development (requires self-signed certificate)
    // Uncomment and configure if you want to test HTTPS locally
    // https: {
    //   key: fs.readFileSync('./certs/localhost-key.pem'),
    //   cert: fs.readFileSync('./certs/localhost.pem'),
    // },
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:3001',
        changeOrigin: true,
        secure: process.env.NODE_ENV === 'production', // Verify SSL certificate in production
        rewrite: (path) => path.replace(/^\/api/, ''), // Remove /api prefix since backend doesn't have it
      },
    },
  },
})

