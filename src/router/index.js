import { createRouter, createWebHistory } from 'vue-router'
import WorkModuleView from '../views/WorkModuleView.vue'

const routes = [
  { path: '/', name: 'work', component: WorkModuleView },
  { path: '/performance', name: 'performance', component: () => import('../views/PerformanceView.vue') },
  { path: '/admin', name: 'admin', component: () => import('../views/AdminView.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
