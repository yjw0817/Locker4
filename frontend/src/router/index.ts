import { createRouter, createWebHistory } from 'vue-router'
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
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router