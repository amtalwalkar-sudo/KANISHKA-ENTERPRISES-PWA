<script setup>
import { ref } from 'vue'
import { useWorkCycleStore } from '../stores/workCycle'
import ShiftReconciliationModal from '../components/ShiftReconciliationModal.vue'

const store = useWorkCycleStore()
const showReconcileModal = ref(false)
const startOdoInput = ref('')

const handleStartShift = () => {
  if (!startOdoInput.value) return
  store.goOnline({ startOdometer: startOdoInput.value })
}
</script>

<template>
  <div class="dashboard-container">
    <header class="header">
      <h1>Kanishka Enterprises Driver</h1>
      <div class="status-badge" :class="{ online: store.isOnline }">
        {{ store.isOnline ? 'ONLINE' : 'OFFLINE' }}
      </div>
    </header>

    <main class="content">
      <!-- Offline State -->
      <div v-if="!store.isOnline" class="card">
        <h2>Start Shift</h2>
        <div class="field">
          <label for="startOdo">Current Odometer Reading (km)</label>
          <input
            id="startOdo"
            v-model.number="startOdoInput"
            type="number"
            placeholder="e.g. 10000"
          />
        </div>
        <button class="btn btn-primary" :disabled="!startOdoInput" @click="handleStartShift">
          🚀 Go Online
        </button>
      </div>

      <!-- Online State -->
      <div v-else class="card">
        <h2>Active Shift</h2>
        <p><strong>Start Meter:</strong> {{ store.onlineStartOdometer }} km</p>
        <p><strong>Shift Revenue:</strong> ₹{{ store.currentShiftIncrementalRevenue }}</p>
        
        <button class="btn btn-danger" @click="showReconcileModal = true">
          🏁 End Shift & Reconcile
        </button>
      </div>
    </main>

    <!-- Reconciliation Modal Component -->
    <ShiftReconciliationModal
      v-if="showReconcileModal"
      @close="showReconcileModal = false"
      @shift-closed="showReconcileModal = false"
    />
  </div>
</template>

<style scoped>
.dashboard-container { padding: 16px; max-width: 600px; margin: 0 auto; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.header h1 { font-size: 1.2rem; }
.status-badge { padding: 4px 12px; border-radius: 20px; font-weight: bold; background: #e2e8f0; color: #475569; }
.status-badge.online { background: #dcfce7; color: #166534; }
.card { background: #ffffff; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
.field { margin: 16px 0; display: flex; flex-direction: column; gap: 6px; }
.field input { padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; }
.btn { width: 100%; padding: 12px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 10px; }
.btn-primary { background: #2563eb; color: white; }
.btn-primary:disabled { background: #94a3b8; }
.btn-danger { background: #dc2626; color: white; }
</style>
