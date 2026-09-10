import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/modules'
  },
  {
    path: '/modules',
    name: 'Modules',
    component: () => import('@/components/KfeModuleView.vue')
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('@/components/HistoricalEntriesView.vue')
  },
  {
    path: '/form',
    name: 'Form',
    component: () => import('@/components/AuthoritativeRecordFormRole.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
