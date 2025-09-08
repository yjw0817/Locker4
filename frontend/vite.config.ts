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
    outDir: '../../html/SpoqPlus_Color_Admin_Except_Mobile_claude2/public/assets/locker4',
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
    port: 5175,  // Frontend server port - updated to match PHP view
    strictPort: true,  // Use exact port 5175
    host: true,  // Listen on all network interfaces
    proxy: {
      '/api': {
        target: 'http://localhost/spoq-admin',  // CodeIgniter backend
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})