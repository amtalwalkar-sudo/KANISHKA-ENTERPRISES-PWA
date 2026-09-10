import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import { pinia, useOfflineQueueStore } from './stores/index.js'
import { processOfflineQueue } from './services/syncEngine.js'
import { useToast } from './composables/useToast.js'
import '@/assets/styles/tokens.css'

const app = createApp(App)
const toast = useToast()

app.config.errorHandler = (err, instance, info) => {
  console.error('Global Application Error:', err, info)
  toast.error(`Error: ${err.message || 'An unexpected error occurred.'}`)
}

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Rejection:', event.reason)
  toast.error(`Async Error: ${event.reason?.message || 'Operation failed background execution.'}`)
})

if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then((persistent) => {
    if (!persistent) {
      console.warn('Storage persistence not granted.')
    }
  })
}

app.use(pinia)
app.use(router)

const offlineQueueStore = useOfflineQueueStore()

offlineQueueStore.setOnlineStatus(navigator.onLine)

window.addEventListener('online', () => {
  offlineQueueStore.setOnlineStatus(true)
  processOfflineQueue()
})

window.addEventListener('offline', () => {
  offlineQueueStore.setOnlineStatus(false)
})

app.mount('#app')

if (navigator.onLine) {
  processOfflineQueue()
}
