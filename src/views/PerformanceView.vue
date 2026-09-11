<script setup>
import { ref, computed, onMounted } from 'vue'
import { useWorkCycleStore } from '../stores/workCycle'
import { MileageAccountingService } from '../services/mileageAccountingService'
import { ODO_GAP_CATEGORIES } from '../repositories/odoGapRepository'

const store = useWorkCycleStore()
const shifts = ref([])
const gaps = ref([])
const mileage = ref({
  recordedShiftDistance: 0,
  interShiftDistance: 0,
  deadMiles: 0,
  personalTrips: 0,
  unclassifiedKm: 0,
  totalVehicleDistance: 0,
  gapCount: 0,
  unclassifiedGapCount: 0
})
const loading = ref(true)
const classifyingGapId = ref(null)

const loadPerformance = async () => {
  loading.value = true
  try {
    const [accounting, unclassifiedGaps] = await Promise.all([
      MileageAccountingService.getMileageAccounting(),
      MileageAccountingService.getUnclassifiedGaps()
    ])

    mileage.value = accounting
    gaps.value = unclassifiedGaps

    // Keep the existing shift log presentation sourced through the repository layer.
    const { ShiftRepository } = await import('../repositories/shiftRepository')
    const data = await ShiftRepository.getAll()
    shifts.value = (data || []).map(s => ({
      ...s,
      revenue: Number(s.revenue ?? s.totalRevenue ?? 0)
    })).sort((a, b) => new Date(b.shiftEndAt || b.createdAt || 0).getTime() - new Date(a.shiftEndAt || a.createdAt || 0).getTime())
  } catch (err) {
    console.error('Failed to load performance metrics:', err)
  } finally {
    loading.value = false
  }
}

const classifyGap = async (gapId, category) => {
  classifyingGapId.value = gapId
  try {
    await MileageAccountingService.classifyGap(gapId, category)
    await loadPerformance()
  } catch (err) {
    console.error('Failed to classify odometer gap:', err)
  } finally {
    classifyingGapId.value = null
  }
}

onMounted(() => {
  loadPerformance()
})

const totalRevenue = computed(() => {
  return shifts.value.reduce((acc, s) => acc + (Number(s.revenue) || 0), 0)
})

const totalShiftsCount = computed(() => shifts.value.length)
const deadMiles = computed(() => Number(mileage.value.deadMiles) || 0)
const personalTrips = computed(() => Number(mileage.value.personalTrips) || 0)
const unclassifiedKm = computed(() => Number(mileage.value.unclassifiedKm) || 0)
const totalVehicleDistance = computed(() => Number(mileage.value.totalVehicleDistance) || 0)
</script>

<template>
  <div style="padding: 12px; max-width: 600px; margin: 0 auto; box-sizing: border-box;">
    <header style="margin-bottom: 16px;">
      <h1 style="font-size: 1.25rem; font-weight: bold; color: #0f172a; margin: 0;">Performance Dashboard</h1>
      <p style="font-size: 0.8rem; color: #64748b; margin: 0;">Real-time shift metrics and mileage accounting</p>
    </header>

    <div style="background: white; border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 0.85rem; font-weight: bold; color: #334155;">Current Shift Metrics</span>
        <span
          style="font-size: 0.75rem; font-weight: bold; padding: 2px 8px; border-radius: 12px;"
          :style="{ background: store.isOnline ? '#dcfce7' : '#f1f5f9', color: store.isOnline ? '#15803d' : '#64748b' }"
        >
          {{ store.isOnline ? 'ONLINE' : 'OFFLINE' }}
        </span>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.8rem;">
        <div style="background: #f8fafc; padding: 8px; border-radius: 6px;">
          <span style="color: #64748b; display: block; font-size: 0.75rem;">Start Odometer</span>
          <strong style="color: #0f172a; font-size: 0.95rem;">{{ store.isOnline ? `${store.onlineStartOdometer} km` : '--' }}</strong>
        </div>
        <div style="background: #f8fafc; padding: 8px; border-radius: 6px;">
          <span style="color: #64748b; display: block; font-size: 0.75rem;">Shift Status</span>
          <strong style="color: #0f172a; font-size: 0.95rem;">{{ store.isOnline ? 'In Progress' : 'No Active Shift' }}</strong>
        </div>
      </div>
    </div>

    <div style="background: #1e293b; color: white; border-radius: 12px; padding: 16px; margin-bottom: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <h2 style="font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin: 0 0 12px 0;">Total Lifetime Performance</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; text-align: center;">
        <div>
          <span style="font-size: 0.7rem; color: #cbd5e1; display: block;">Total Revenue</span>
          <strong style="font-size: 1.1rem; color: #4ade80;">₹{{ totalRevenue }}</strong>
        </div>
        <div>
          <span style="font-size: 0.7rem; color: #cbd5e1; display: block;">Total Vehicle KM</span>
          <strong style="font-size: 1.1rem; color: #38bdf8;">{{ totalVehicleDistance }} km</strong>
        </div>
        <div>
          <span style="font-size: 0.7rem; color: #cbd5e1; display: block;">Total Shifts</span>
          <strong style="font-size: 1.1rem; color: #facc15;">{{ totalShiftsCount }}</strong>
        </div>
      </div>
    </div>

    <div style="background: white; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <h2 style="font-size: 0.95rem; font-weight: bold; color: #0f172a; margin: 0 0 12px 0;">Mileage Accounting</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <div style="background: #f8fafc; padding: 10px; border-radius: 8px;">
          <span style="display:block; color:#64748b; font-size:0.72rem;">Recorded Shift KM</span>
          <strong style="font-size:1rem; color:#0f172a;">{{ mileage.recordedShiftDistance }} km</strong>
        </div>
        <div style="background: #f8fafc; padding: 10px; border-radius: 8px;">
          <span style="display:block; color:#64748b; font-size:0.72rem;">Inter-shift KM</span>
          <strong style="font-size:1rem; color:#0f172a;">{{ mileage.interShiftDistance }} km</strong>
        </div>
        <div style="background: #f8fafc; padding: 10px; border-radius: 8px;">
          <span style="display:block; color:#64748b; font-size:0.72rem;">Dead Miles</span>
          <strong style="font-size:1rem; color:#2563eb;">{{ deadMiles }} km</strong>
        </div>
        <div style="background: #f8fafc; padding: 10px; border-radius: 8px;">
          <span style="display:block; color:#64748b; font-size:0.72rem;">Personal Trips</span>
          <strong style="font-size:1rem; color:#7c3aed;">{{ personalTrips }} km</strong>
        </div>
      </div>

      <div style="margin-top: 10px; padding: 10px; border-radius: 8px; background: #fff7ed; border: 1px solid #fed7aa;">
        <span style="display:block; color:#9a3412; font-size:0.72rem;">Unclassified KM</span>
        <strong style="font-size:1rem; color:#c2410c;">{{ unclassifiedKm }} km</strong>
      </div>
    </div>

    <div v-if="gaps.length > 0" style="background: white; border: 1px solid #fed7aa; border-radius: 12px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <h2 style="font-size: 0.95rem; font-weight: bold; color: #9a3412; margin: 0 0 4px 0;">Unclassified Odometer Gaps</h2>
      <p style="font-size: 0.75rem; color: #64748b; margin: 0 0 12px 0;">Choose what each inter-shift kilometre represents. This does not block shift submission.</p>

      <div v-for="gap in gaps" :key="gap.id" style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; background: #f8fafc; margin-bottom: 8px;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
          <div>
            <strong style="font-size:0.85rem; color:#1e293b; display:block;">{{ gap.previousOdometer }} km → {{ gap.newOdometer }} km</strong>
            <span style="font-size:0.75rem; color:#64748b;">{{ gap.gapDistance }} km unclassified</span>
          </div>
          <span style="font-size:0.68rem; color:#9a3412; font-weight:700;">REVIEW</span>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px;">
          <button
            type="button"
            @click="classifyGap(gap.id, ODO_GAP_CATEGORIES.DEAD_MILES)"
            :disabled="classifyingGapId === gap.id"
            style="padding:8px; border:1px solid #93c5fd; background:#eff6ff; color:#1d4ed8; border-radius:7px; font-size:0.75rem; font-weight:700;"
          >
            Dead Miles
          </button>
          <button
            type="button"
            @click="classifyGap(gap.id, ODO_GAP_CATEGORIES.PERSONAL_TRIPS)"
            :disabled="classifyingGapId === gap.id"
            style="padding:8px; border:1px solid #c4b5fd; background:#f5f3ff; color:#6d28d9; border-radius:7px; font-size:0.75rem; font-weight:700;"
          >
            Personal Trip
          </button>
        </div>
      </div>
    </div>

    <div style="background: white; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h2 style="font-size: 0.95rem; font-weight: bold; color: #0f172a; margin: 0;">Completed Shift Logs</h2>
        <button
          type="button"
          @click="loadPerformance"
          style="padding: 4px 10px; background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px;"
        >
          🔄 Refresh
        </button>
      </div>

      <div v-if="loading" style="text-align: center; color: #64748b; font-size: 0.85rem; padding: 16px 0;">Loading logs...</div>
      <div v-else-if="shifts.length === 0" style="text-align: center; color: #64748b; font-size: 0.85rem; padding: 16px 0;">No completed shifts found in IndexedDB.</div>

      <div v-else style="display: flex; flex-direction: column; gap: 8px;">
        <div
          v-for="(shift, index) in shifts"
          :key="shift.id || index"
          style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; background: #f8fafc; display: flex; justify-content: space-between; align-items: center;"
        >
          <div>
            <strong style="font-size: 0.85rem; color: #1e293b; display: block;">Shift #{{ shift.id || (shifts.length - index) }}</strong>
            <span style="font-size: 0.75rem; color: #64748b;">Distance: {{ shift.startOdometer }} km → {{ shift.endOdometer }} km ({{ shift.totalDistance }} km total)</span>
          </div>
          <div style="text-align: right;">
            <strong style="font-size: 0.95rem; color: #16a34a;">₹{{ shift.revenue }}</strong>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
