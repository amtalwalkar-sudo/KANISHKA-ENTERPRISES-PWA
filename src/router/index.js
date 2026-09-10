import { createRouter, createWebHistory } from 'vue-router'
import AuthoritativeRecordFormRole from '@/components/AuthoritativeRecordFormRole.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: AuthoritativeRecordFormRole
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
