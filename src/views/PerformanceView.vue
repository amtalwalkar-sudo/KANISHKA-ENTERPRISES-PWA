<script setup>
import { ref, computed, onMounted } from 'vue'
import { useWorkCycleStore } from '../stores/workCycle'
import { getAllCompletedShifts } from '../utils/indexedDB'

const store = useWorkCycleStore()
const shifts = ref([])
const loading = ref(true)

const loadShifts = async () => {
  loading.value = true
  try {
    const data = await getAllCompletedShifts()
    console.log('Loaded Raw Shifts from DB:', data)
    
    // Normalize shift records to guarantee revenue key exists
    shifts.value = (data || []).map(s => ({
      ...s,
      revenue: Number(s.revenue ?? s.totalRevenue ?? 0)
    })).sort((a, b) => (b.id || 0) - (a.id || 0))
  } catch (err) {
    console.error('Failed to load shifts:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadShifts()
})

const totalRevenue = computed(() => {
  return shifts.value.reduce((acc, s) => acc + (s.revenue || 0), 0)
})

const totalDistance = computed(() => {
  return shifts.value.reduce((acc, s) => acc + (Number(s.totalDistance) || 0), 0)
})

const totalShiftsCount = computed(() => shifts.value.length)
</script>

<template>
  <div style="padding: 12px; max-width: 600px; margin: 0 auto; box-sizing: border-box;">
    
    <header style="margin-bottom: 16px;">
      <h1 style="font-size: 1.25rem; font-weight: bold; color: #0f172a; margin: 0;">Performance Dashboard</h1>
      <p style="font-size: 0.8rem; color: #64748b; margin: 0;">Real-time shift metrics and revenue analytics</p>
    </header>

    <!-- CURRENT ACTIVE SHIFT STATUS -->
    <div style="background: white; border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 0.85rem; font-weight: bold; color: #334155;">Current Shift Metrics</span>
        <span 
          style="font-size: 0.75rem; font-weight: bold; padding: 2px 8px; border-radius: 12px;"
          :style="{
            background: store.isOnline ? '#dcfce7' : '#f1f5f9',
            color: store.isOnline ? '#15803d' : '#64748b'
          }"
        >
          {{ store.isOnline ? 'ONLINE' : 'OFFLINE' }}
        </span>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.8rem;">
        <div style="background: #f8fafc; padding: 8px; border-radius: 6px;">
          <span style="color: #64748b; display: block; font-size: 0.75rem;">Start Odometer</span>
          <strong style="color: #0f172a; font-size: 0.95rem;">
            {{ store.isOnline ? `${store.onlineStartOdometer} km` : '--' }}
          </strong>
        </div>
        <div style="background: #f8fafc; padding: 8px; border-radius: 6px;">
          <span style="color: #64748b; display: block; font-size: 0.75rem;">Shift Status</span>
          <strong style="color: #0f172a; font-size: 0.95rem;">
            {{ store.isOnline ? 'In Progress' : 'No Active Shift' }}
          </strong>
        </div>
      </div>
    </div>

    <!-- LIFETIME SUMMARY -->
    <div style="background: #1e293b; color: white; border-radius: 12px; padding: 16px; margin-bottom: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin: 0 0 12px 0;">
        Total Lifetime Performance
      </h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; text-align: center;">
        <div>
          <span style="font-size: 0.7rem; color: #cbd5e1; display: block;">Total Revenue</span>
          <strong style="font-size: 1.1rem; color: #4ade80;">₹{{ totalRevenue }}</strong>
        </div>
        <div>
          <span style="font-size: 0.7rem; color: #cbd5e1; display: block;">Total Distance</span>
          <strong style="font-size: 1.1rem; color: #38bdf8;">{{ totalDistance }} km</strong>
        </div>
        <div>
          <span style="font-size: 0.7rem; color: #cbd5e1; display: block;">Total Shifts</span>
          <strong style="font-size: 1.1rem; color: #facc15;">{{ totalShiftsCount }}</strong>
        </div>
      </div>
    </div>

    <!-- SHIFT LOGS LIST -->
    <div style="background: white; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h2 style="font-size: 0.95rem; font-weight: bold; color: #0f172a; margin: 0;">Completed Shift Logs</h2>
        <button 
          @click="loadShifts"
          style="padding: 4px 10px; background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
        >
          🔄 Refresh
        </button>
      </div>

      <div v-if="loading" style="text-align: center; color: #64748b; font-size: 0.85rem; padding: 16px 0;">
        Loading logs...
      </div>

      <div v-else-if="shifts.length === 0" style="text-align: center; color: #64748b; font-size: 0.85rem; padding: 16px 0;">
        No completed shifts found in IndexedDB.
      </div>

      <div v-else style="display: flex; flex-direction: column; gap: 8px;">
        <div 
          v-for="(shift, index) in shifts" 
          :key="shift.id || index"
          style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; background: #f8fafc; display: flex; justify-content: space-between; align-items: center;"
        >
          <div>
            <strong style="font-size: 0.85rem; color: #1e293b; display: block;">
              Shift #{{ shift.id || (shifts.length - index) }}
            </strong>
            <span style="font-size: 0.75rem; color: #64748b;">
              Distance: {{ shift.startOdometer }} km → {{ shift.endOdometer }} km ({{ shift.totalDistance }} km total)
            </span>
          </div>
          <div style="text-align: right;">
            <strong style="font-size: 0.95rem; color: #16a34a;">
              ₹{{ shift.revenue }}
            </strong>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
