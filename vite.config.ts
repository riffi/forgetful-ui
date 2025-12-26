import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import pkg from './package.json'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8020',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8020',
        changeOrigin: true,
      },
      '/oauth': {
        target: 'http://localhost:8020',
        changeOrigin: true,
      },
      '/authorize': {
        target: 'http://localhost:8020',
        changeOrigin: true,
      },
      '/consent': {
        target: 'http://localhost:8020',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:8020',
        changeOrigin: true,
      },
      '/token': {
        target: 'http://localhost:8020',
        changeOrigin: true,
      },
      '/register': {
        target: 'http://localhost:8020',
        changeOrigin: true,
      },
      '/.well-known': {
        target: 'http://localhost:8020',
        changeOrigin: true,
      },
    },
  },
})
