import { defineStore } from 'pinia'

export const useOfflineQueueStore = defineStore('offlineQueue', {
  state: () => ({
    queue: [],
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    syncing: false
  }),
  getters: {
    pendingCount: (state) => state.queue.length,
    hasPending: (state) => state.queue.length > 0
  },
  actions: {
    enqueueAction(action) {
      this.queue.push({
        id: Date.now() + Math.random().toString(36).substring(2, 6),
        timestamp: new Date().toISOString(),
        ...action
      })
    },
    dequeueAction(id) {
      this.queue = this.queue.filter(item => item.id !== id)
    },
    clearQueue() {
      this.queue = []
    },
    setOnlineStatus(status) {
      this.isOnline = status
    }
  }
})
