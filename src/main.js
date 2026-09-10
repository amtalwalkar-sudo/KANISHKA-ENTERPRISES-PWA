import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import { pinia, useOfflineQueueStore } from './stores/index.js'
import { getPendingOfflineActions, removeOfflineAction } from './db/index.js'
import '@/assets/styles/tokens.css'

const app = createApp(App)

// 1. Register Pinia state engine & Vue Router
app.use(pinia)
app.use(router)

// 2. Initialize Offline Queue Store
const offlineQueueStore = useOfflineQueueStore()

// Handler to flush pending Dexie.js offline queue when network is restored
async function syncPendingOfflineActions() {
  if (!navigator.onLine) return

  offlineQueueStore.syncing = true
  try {
    const pendingActions = await getPendingOfflineActions()
    for (const action of pendingActions) {
      await removeOfflineAction(action.id)
      offlineQueueStore.dequeueAction(action.id)
    }
  } catch (err) {
    console.error('Failed to sync offline queue:', err)
  } finally {
    offlineQueueStore.syncing = false
  }
}

// 3. Set up online/offline network listeners
offlineQueueStore.setOnlineStatus(navigator.onLine)

window.addEventListener('online', () => {
  offlineQueueStore.setOnlineStatus(true)
  syncPendingOfflineActions()
})

window.addEventListener('offline', () => {
  offlineQueueStore.setOnlineStatus(false)
})

// 4. Mount Application
app.mount('#app')

// Trigger initial sync attempt if online on boot
if (navigator.onLine) {
  syncPendingOfflineActions()
}
