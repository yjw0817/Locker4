import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5174,  // Frontend server port - fixed to avoid conflicts
    strictPort: true,  // Use exact port 5174
    host: 'localhost',  // Listen on localhost only
    proxy: {
      '/api': {
        target: 'http://localhost:3333',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  }
})