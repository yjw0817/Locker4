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
  base: '/assets/locker4/', // CodeIgniter asset path
  build: {
    outDir: '../../../html/SpoqPlus_Color_Admin_Except_Mobile_claude2/public/assets/locker4',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'css/[name][extname]'
          }
          return 'assets/[name][extname]'
        }
      }
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