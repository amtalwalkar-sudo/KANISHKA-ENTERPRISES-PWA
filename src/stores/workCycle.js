import { defineStore } from 'pinia'
import { ref } from 'vue'
import { saveCompletedShift, getLastEndOdometer } from '../utils/indexedDB'

export const useWorkCycleStore = defineStore('workCycle', () => {
  const isOnline = ref(localStorage.getItem('shift_online') === 'true')
  const onlineStartOdometer = ref(Number(localStorage.getItem('shift_start_odometer')) || 0)
  const lastOdometer = ref(0)

  const MAX_SHIFT_KM = 1000
  const MAX_REVENUE_PER_ENTRY = 5000

  const loadLastOdometer = async () => {
    const lastOdo = await getLastEndOdometer()
    lastOdometer.value = lastOdo
    return lastOdo
  }

  const startShift = (odometer) => {
    const odoNum = Number(odometer)
    if (!odoNum || odoNum <= 0) {
      alert('Please enter a valid starting odometer reading.')
      return false
    }

    isOnline.value = true
    onlineStartOdometer.value = odoNum
    localStorage.setItem('shift_online', 'true')
    localStorage.setItem('shift_start_odometer', String(odoNum))
    return true
  }

  const endShift = async (endOdometer, revenue) => {
    const endOdoNum = Number(endOdometer)
    const revNum = Number(revenue) || 0

    if (!endOdoNum || endOdoNum <= onlineStartOdometer.value) {
      alert(`End odometer must be greater than starting odometer (${onlineStartOdometer.value} km).`)
      return false
    }

    const totalDistance = endOdoNum - onlineStartOdometer.value

    if (totalDistance > MAX_SHIFT_KM) {
      alert(`⚠️ DISTANCE GUARDRAIL EXCEEDED:\nShift distance (${totalDistance} km) exceeds maximum limit of ${MAX_SHIFT_KM} km per shift.`)
      return false
    }

    if (revNum > MAX_REVENUE_PER_ENTRY) {
      alert(`⚠️ REVENUE GUARDRAIL EXCEEDED:\nRevenue entry (₹${revNum}) exceeds maximum limit of ₹${MAX_REVENUE_PER_ENTRY}.`)
      return false
    }

    try {
      await saveCompletedShift({
        startOdometer: onlineStartOdometer.value,
        endOdometer: endOdoNum,
        totalDistance,
        revenue: revNum
      })

      forceOffline()
      await loadLastOdometer()
      return true
    } catch (err) {
      console.error('Error saving shift:', err)
      alert('Failed to save shift record.')
      return false
    }
  }

  const forceOffline = () => {
    isOnline.value = false
    onlineStartOdometer.value = 0
    localStorage.removeItem('shift_online')
    localStorage.removeItem('shift_start_odometer')
  }

  return {
    isOnline,
    onlineStartOdometer,
    lastOdometer,
    loadLastOdometer,
    startShift,
    endShift,
    forceOffline
  }
})
