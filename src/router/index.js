import { createRouter, createWebHistory } from 'vue-router'
import WorkModuleView from '../views/WorkModuleView.vue'
import PerformanceView from '../views/PerformanceView.vue'

const routes = [
  { path: '/', name: 'Work', component: WorkModuleView },
  { path: '/performance', name: 'Performance', component: PerformanceView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
