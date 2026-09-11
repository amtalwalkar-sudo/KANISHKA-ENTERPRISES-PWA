<script setup>
import { ref, computed, onMounted } from 'vue'
import { useWorkCycleStore } from '../stores/workCycle'
import { saveFuelLog } from '../utils/indexedDB'

const store = useWorkCycleStore()

const startOdoInput = ref('')
const endOdoInput = ref('')
const shiftRevenueInput = ref('')

const showFuelForm = ref(false)
const fuelOdometer = ref('')
const pricePerKg = ref('')
const amountPaid = ref('')

const MAX_CNG_KG = 15.0

onMounted(async () => {
  const lastOdo = await store.loadLastOdometer()
  if (lastOdo > 0 && !store.isOnline) {
    startOdoInput.value = lastOdo
  }
})

const calculatedKg = computed(() => {
  const price = parseFloat(pricePerKg.value)
  const amount = parseFloat(amountPaid.value)
  if (price > 0 && amount > 0) {
    return (amount / price).toFixed(2)
  }
  return '0.00'
})

const handleStartShift = () => {
  if (store.startShift(startOdoInput.value)) {
    startOdoInput.value = ''
  }
}

const handleEndShift = async () => {
  const endVal = endOdoInput.value
  const revVal = shiftRevenueInput.value

  if (!endVal) {
    alert('Please enter an End Odometer reading.')
    return
  }

  if (revVal === '' || revVal === null || revVal === undefined) {
    alert('Please enter the Shift Revenue amount.')
    return
  }

  const success = await store.endShift(endVal, revVal)
  if (success) {
    endOdoInput.value = ''
    shiftRevenueInput.value = ''
    const nextOdo = await store.loadLastOdometer()
    if (nextOdo > 0) {
      startOdoInput.value = nextOdo
    }
    alert(`Shift ended! Revenue logged: ₹${revVal}`)
  }
}

const handleOpenFuelForm = () => {
  showFuelForm.value = true
}

const handleCloseFuelForm = () => {
  showFuelForm.value = false
  fuelOdometer.value = ''
  pricePerKg.value = ''
  amountPaid.value = ''
}

const handleSaveFuel = async () => {
  const odoNum = Number(fuelOdometer.value)
  const amountNum = Number(amountPaid.value)
  const kgNum = Number(calculatedKg.value)

  if (!odoNum || !amountNum) {
    alert('Please enter both Odometer reading and Amount Paid.')
    return
  }

  if (kgNum > MAX_CNG_KG) {
    alert(`⚠️ CNG REFUEL GUARDRAIL EXCEEDED:\nCalculated quantity (${kgNum} kg) exceeds maximum limit of ${MAX_CNG_KG} kg per refuel.`)
    return
  }

  try {
    await saveFuelLog({
      odometer: odoNum,
      pricePerKg: pricePerKg.value ? Number(pricePerKg.value) : 0,
      amount: amountNum,
      kg: kgNum
    })
    alert('CNG Fuel Log saved successfully!')
    handleCloseFuelForm()
  } catch (err) {
    console.error('Failed to save fuel log:', err)
    alert('Error saving CNG fuel log.')
  }
}
</script>

<template>
  <div style="padding: 12px; max-width: 600px; margin: 0 auto; box-sizing: border-box;">
    <header style="margin-bottom: 16px;">
      <h1 style="font-size: 1.25rem; font-weight: bold; color: #0f172a; margin: 0;">Work Module</h1>
      <p style="font-size: 0.8rem; color: #64748b; margin: 0;">Shift & CNG Operational Controls</p>
    </header>

    <div style="background: white; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <h2 style="font-size: 1rem; font-weight: bold; color: #1e293b; margin: 0 0 12px 0;">
        Shift Status: 
        <span :style="{ color: store.isOnline ? '#16a34a' : '#dc2626' }">
          {{ store.isOnline ? 'ONLINE' : 'OFFLINE' }}
        </span>
      </h2>

      <!-- OFFLINE STATE -->
      <div v-if="!store.isOnline" style="display: flex; flex-direction: column; gap: 10px;">
        <div>
          <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #334155; margin-bottom: 4px;">Start Odometer (km)</label>
          <input 
            v-model="startOdoInput" 
            type="number" 
            placeholder="e.g. 5" 
            style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; box-sizing: border-box;"
          />
          <span v-if="store.lastOdometer > 0" style="font-size: 0.75rem; color: #16a34a; font-weight: 500;">
            Auto-filled from last shift end: {{ store.lastOdometer }} km
          </span>
        </div>
        <button 
          @click="handleStartShift" 
          style="width: 100%; padding: 12px; background: #16a34a; color: white; border: none; border-radius: 6px; font-weight: bold; font-size: 0.95rem; cursor: pointer;"
        >
          🚀 Start Shift
        </button>
      </div>

      <!-- ONLINE STATE -->
      <div v-else style="display: flex; flex-direction: column; gap: 10px;">
        <div style="font-size: 0.85rem; color: #475569; background: #f1f5f9; padding: 8px 12px; border-radius: 6px;">
          Active Start Meter: <strong>{{ store.onlineStartOdometer }} km</strong>
        </div>

        <div>
          <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #334155; margin-bottom: 4px;">End Odometer (km) *</label>
          <input 
            v-model="endOdoInput" 
            type="number" 
            placeholder="e.g. 10" 
            style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; box-sizing: border-box;"
          />
        </div>

        <div>
          <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #334155; margin-bottom: 4px;">Shift Revenue (₹) * [Max ₹5,000]</label>
          <input 
            v-model="shiftRevenueInput" 
            type="number" 
            placeholder="e.g. 500" 
            style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; box-sizing: border-box;"
          />
        </div>

        <button 
          @click="handleEndShift" 
          style="width: 100%; padding: 12px; background: #dc2626; color: white; border: none; border-radius: 6px; font-weight: bold; font-size: 0.95rem; cursor: pointer;"
        >
          🏁 End Shift & Save
        </button>
      </div>
    </div>

    <!-- CNG LOG BUTTON -->
    <div style="background: white; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <button 
        @click="handleOpenFuelForm"
        style="width: 100%; padding: 14px; background: #2563eb; color: white; border: none; border-radius: 8px; font-size: 0.95rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;"
      >
        ⛽ Log CNG Refueling (Max 15 kg)
      </button>
    </div>

    <!-- CNG OVERLAY -->
    <div 
      v-if="showFuelForm" 
      style="position: fixed; top: 0; left: 0; right: 0; bottom: 65px; background: #f8fafc; z-index: 100; display: flex; flex-direction: column; box-sizing: border-box;"
    >
      <div style="padding: 12px 16px; background: white; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
        <div>
          <h2 style="margin: 0; font-size: 0.95rem; font-weight: bold; color: #0f172a;">CNG Refueling Entry</h2>
          <span style="font-size: 0.7rem; color: #16a34a; font-weight: 600;">● Dynamic Limit Enforced (15 kg)</span>
        </div>
        <button 
          @click="handleCloseFuelForm"
          style="padding: 6px 12px; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer;"
        >
          ← Back to Work
        </button>
      </div>

      <div style="flex: 1; padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; -webkit-overflow-scrolling: touch;">
        <div>
          <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #334155; margin-bottom: 4px;">Odometer (km) *</label>
          <input 
            v-model="fuelOdometer" 
            type="number" 
            placeholder="Enter current odometer" 
            style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; box-sizing: border-box;"
          />
        </div>

        <div>
          <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #334155; margin-bottom: 4px;">Price per kg (₹)</label>
          <input 
            v-model="pricePerKg" 
            type="number" 
            step="0.01" 
            placeholder="e.g. 85.50" 
            style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; box-sizing: border-box;"
          />
        </div>

        <div>
          <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #334155; margin-bottom: 4px;">Amount Paid (₹) *</label>
          <input 
            v-model="amountPaid" 
            type="number" 
            placeholder="e.g. 500" 
            style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; box-sizing: border-box;"
          />
        </div>

        <div 
          :style="{
            background: Number(calculatedKg) > 15 ? '#fff1f2' : '#f0fdf4',
            borderColor: Number(calculatedKg) > 15 ? '#fecdd3' : '#bbf7d0'
          }"
          style="border: 1px solid; border-radius: 8px; padding: 10px; display: flex; justify-content: space-between; align-items: center;"
        >
          <span style="font-size: 0.8rem; font-weight: 600;" :style="{ color: Number(calculatedKg) > 15 ? '#9f1239' : '#166534' }">
            Calculated Quantity:
          </span>
          <strong style="font-size: 1rem;" :style="{ color: Number(calculatedKg) > 15 ? '#dc2626' : '#15803d' }">
            {{ calculatedKg }} kg {{ Number(calculatedKg) > 15 ? '(EXCEEDS MAX 15 KG)' : '' }}
          </strong>
        </div>

        <button 
          @click="handleSaveFuel"
          style="width: 100%; padding: 12px; background: #16a34a; color: white; border: none; border-radius: 8px; font-size: 0.95rem; font-weight: bold; cursor: pointer; margin-top: 8px;"
        >
          Save to Confirm
        </button>
      </div>
    </div>
  </div>
</template>
