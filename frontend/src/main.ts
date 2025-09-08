import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/globals.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Support both standalone and CodeIgniter integration
const mountPoint = document.getElementById('locker4-app') || document.getElementById('app')
if (mountPoint) {
  app.mount(`#${mountPoint.id}`)
  
  // Check for CodeIgniter integration
  if (typeof window !== 'undefined') {
    const appType = (window as any).LockerAppType
    const config = (window as any).LockerConfig
    
    console.log('[Locker4] App Type:', appType)
    console.log('[Locker4] Config:', config)
    
    // Navigate based on app type from PHP controller
    if (appType) {
      let targetRoute = '/'
      
      switch(appType) {
        case 'locker-placement':
          targetRoute = '/locker-placement'
          console.log('[Locker4] Loading placement module')
          break
        case 'locker-management':
          targetRoute = '/locker-management'
          console.log('[Locker4] Loading management module')
          break
        default:
          console.warn('[Locker4] Unknown app type:', appType)
          break
      }
      
      router.push(targetRoute)
    } else if (config?.initialRoute) {
      // Fallback to legacy initialRoute method
      console.log('[Locker4] Navigating to initial route:', config.initialRoute)
      router.push(config.initialRoute)
    }
  }
} else {
  console.error('No mount point found for Vue app')
}