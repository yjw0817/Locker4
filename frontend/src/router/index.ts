import { createRouter, createWebHistory, createMemoryHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    redirect: '/locker-placement'
  },
  {
    path: '/locker-placement',
    name: 'LockerPlacement',
    component: () => import('@/pages/LockerPlacementFigma.vue')
  },
  {
    path: '/locker-assignment',
    name: 'LockerAssignment',
    component: () => import('@/pages/LockerAssignment.vue')
  },
  {
    path: '/locker-management',
    name: 'LockerManagement',
    component: () => import('@/pages/LockerManagement.vue')
  }
]

// Check if running inside CodeIgniter
const isCodeIgniter = typeof window !== 'undefined' && 
  (window as any).LockerConfig?.baseUrl && 
  window.location.pathname.includes('/locker/setting')

// Use memory history when running inside CodeIgniter to prevent URL changes
// Use normal web history when running standalone
const history = isCodeIgniter 
  ? createMemoryHistory()
  : createWebHistory(import.meta.env.BASE_URL)

console.log('[Locker4] Router mode:', isCodeIgniter ? 'memory' : 'web')

const router = createRouter({
  history,
  routes
})

export default router