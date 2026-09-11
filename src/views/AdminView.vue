<script setup>
import { ref } from 'vue'
import { openDB } from '../utils/indexedDB'

const statusMessage = ref('')

const handleClearData = async () => {
  if (!confirm('Are you sure you want to clear all shift and refuel logs? This cannot be undone.')) {
    return
  }

  try {
    const db = await openDB()
    const tx = db.transaction(['shifts', 'fuel_logs'], 'readwrite')
    tx.objectStore('shifts').clear()
    tx.objectStore('fuel_logs').clear()

    localStorage.removeItem('shift_online')
    localStorage.removeItem('shift_start_odometer')

    statusMessage.value = 'All local database records cleared successfully!'
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  } catch (err) {
    console.error('Clear failed:', err)
    statusMessage.value = 'Failed to clear data.'
  }
}
</script>

<template>
  <div style="padding: 16px; max-width: 600px; margin: 0 auto;">
    <header style="margin-bottom: 16px;">
      <h1 style="font-size: 1.25rem; font-weight: bold; color: #0f172a; margin: 0;">Admin Settings</h1>
      <p style="font-size: 0.8rem; color: #64748b; margin: 0;">Storage Maintenance & System Diagnostics</p>
    </header>

    <div style="background: white; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px;">
      <h2 style="font-size: 0.95rem; font-weight: bold; color: #1e293b; margin-0 0 8px 0;">Data Maintenance</h2>
      <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 12px;">Reset IndexedDB object stores and LocalStorage variables for clean field testing.</p>

      <button 
        @click="handleClearData"
        style="width: 100%; padding: 12px; background: #dc2626; color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 0.9rem; cursor: pointer;"
      >
        🗑️ Clear All Local Test Data
      </button>

      <div v-if="statusMessage" style="margin-top: 12px; font-size: 0.8rem; color: #16a34a; font-weight: 600; text-align: center;">
        {{ statusMessage }}
      </div>
    </div>
  </div>
</template>
