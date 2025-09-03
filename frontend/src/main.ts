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
  
  // Check if we should navigate to a specific route (CodeIgniter integration)
  if (typeof window !== 'undefined' && (window as any).LockerConfig?.initialRoute) {
    const initialRoute = (window as any).LockerConfig.initialRoute
    console.log('[Locker4] Navigating to initial route:', initialRoute)
    router.push(initialRoute)
  }
} else {
  console.error('No mount point found for Vue app')
}