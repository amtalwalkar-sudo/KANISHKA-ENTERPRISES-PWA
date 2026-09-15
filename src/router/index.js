import { createRouter, createWebHistory } from 'vue-router'
import WorkModuleView from '../views/WorkModuleView.vue'
import AdminView from '../views/AdminView.vue'

const routes = [
  { path: '/', name: 'Work', component: WorkModuleView },
  { path: '/admin', name: 'Admin', component: AdminView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
