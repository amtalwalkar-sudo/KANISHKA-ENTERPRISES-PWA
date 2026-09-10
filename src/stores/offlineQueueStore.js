import { defineStore } from 'pinia'

export const useOfflineQueueStore = defineStore('offlineQueue', {
  state: () => ({
    isOnline: navigator.onLine,
    syncing: false,
    queue: []
  }),
  actions: {
    setOnlineStatus(status) {
      this.isOnline = status
    },
    dequeueAction(id) {
      this.queue = this.queue.filter(a => a.id !== id)
    }
  }
})
