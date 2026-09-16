import { createRouter, createWebHistory } from 'vue-router'
import WorkModuleView from '../views/WorkModuleView.vue'
import PerformanceView from '../views/PerformanceView.vue'
import AdminView from '../views/AdminView.vue'
import RideCaptureView from '../views/RideCaptureView.vue'

const routes = [
  { path: '/', name: 'Work', component: WorkModuleView },
  { path: '/performance', name: 'Performance', component: PerformanceView },
  { path: '/admin', name: 'Admin', component: AdminView },
  { path: '/ride-capture', name: 'Ride Capture', component: RideCaptureView },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
