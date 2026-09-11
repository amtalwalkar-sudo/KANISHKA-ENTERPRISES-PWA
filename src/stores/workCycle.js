import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getLastOdometer, saveCompletedShift } from '../utils/indexedDB'

export const useWorkCycleStore = defineStore('workCycle', () => {
  const isOnline = ref(localStorage.getItem('kfe_is_online') === 'true')
  const onlineStartOdometer = ref(Number(localStorage.getItem('kfe_start_odo')) || 0)
  const shiftStartTimestamp = ref(localStorage.getItem('kfe_shift_start_time') || null)
  const lastOdometer = ref(0)

  const MAX_SHIFT_KM = 1000
  const MAX_REVENUE_PER_ENTRY = 5000

  const loadLastOdometer = async () => {
    try {
      const odo = await getLastOdometer()
      lastOdometer.value = odo
      return odo
    } catch (err) {
      console.error('Failed to read last odometer:', err)
      throw err
    }
  }

  const startShift = (startOdo) => {
    const parsedStart = Number(startOdo)
    if (isNaN(parsedStart) || parsedStart <= 0) {
      alert('Please enter a valid positive Start Odometer reading.')
      return false
    }

    if (lastOdometer.value > 0 && parsedStart < lastOdometer.value) {
      if (!confirm(`Entered odometer (${parsedStart} km) is lower than last recorded reading (${lastOdometer.value} km). Continue?`)) {
        return false
      }
    }

    const now = new Date().toISOString()
    onlineStartOdometer.value = parsedStart
    shiftStartTimestamp.value = now
    isOnline.value = true

    localStorage.setItem('kfe_is_online', 'true')
    localStorage.setItem('kfe_start_odo', String(parsedStart))
    localStorage.setItem('kfe_shift_start_time', now)

    return true
  }

  const endShift = async (endOdo, revenue) => {
    const parsedEnd = Number(endOdo)
    const parsedRev = Number(revenue)

    if (isNaN(parsedEnd) || parsedEnd <= onlineStartOdometer.value) {
      alert('End Odometer must be strictly greater than Start Odometer.')
      return false
    }

    const dist = parsedEnd - onlineStartOdometer.value
    if (dist > MAX_SHIFT_KM) {
      alert(`Shift distance (${dist} km) exceeds maximum limit of ${MAX_SHIFT_KM} km per shift. Please check input.`)
      return false
    }

    if (isNaN(parsedRev) || parsedRev < 0 || parsedRev > MAX_REVENUE_PER_ENTRY) {
      alert('Please enter a valid revenue between ₹0 and ₹5,000.')
      return false
    }

    const now = new Date().toISOString()
    const shiftPayload = {
      startOdometer: onlineStartOdometer.value,
      endOdometer: parsedEnd,
      totalDistance: dist,
      revenue: parsedRev,
      shiftStartAt: shiftStartTimestamp.value || now,
      shiftEndAt: now,
      createdAt: now
    }

    try {
      await saveCompletedShift(shiftPayload)

      lastOdometer.value = parsedEnd
      isOnline.value = false
      onlineStartOdometer.value = 0
      shiftStartTimestamp.value = null

      localStorage.removeItem('kfe_is_online')
      localStorage.removeItem('kfe_start_odo')
      localStorage.removeItem('kfe_shift_start_time')

      return true
    } catch (err) {
      console.error('Persistence failed — shift state preserved:', err)
      alert('Failed to save shift log to storage. Your active shift remains open.')
      return false
    }
  }

  const forceOffline = () => {
    isOnline.value = false
    onlineStartOdometer.value = 0
    shiftStartTimestamp.value = null
    localStorage.removeItem('kfe_is_online')
    localStorage.removeItem('kfe_start_odo')
    localStorage.removeItem('kfe_shift_start_time')
  }

  return {
    isOnline,
    onlineStartOdometer,
    shiftStartTimestamp,
    lastOdometer,
    loadLastOdometer,
    startShift,
    endShift,
    forceOffline
  }
})
