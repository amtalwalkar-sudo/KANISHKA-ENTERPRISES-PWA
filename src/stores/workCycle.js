import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ShiftRepository } from '../repositories/shiftRepository'
import { ShiftValidator } from '../services/shiftValidator'
import { OdometerAuditService } from '../services/odometerAuditService'

export const useWorkCycleStore = defineStore('workCycle', () => {
  const isOnline = ref(localStorage.getItem('kfe_is_online') === 'true')
  const onlineStartOdometer = ref(Number(localStorage.getItem('kfe_start_odo')) || 0)
  const shiftStartTimestamp = ref(localStorage.getItem('kfe_shift_start_time') || null)
  const lastOdometer = ref(0)

  const loadLastOdometer = async () => {
    try {
      const odo = await ShiftRepository.getLatestOdometer()
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
    const validation = ShiftValidator.validateSubmission({
      startOdometer: onlineStartOdometer.value,
      endOdometer: endOdo,
      revenue
    })

    if (!validation.valid) {
      alert(validation.errors[0])
      return false
    }

    const { startOdometer, endOdometer, totalDistance, revenue: validatedRevenue } = validation.values
    const previousOdometer = lastOdometer.value

    const now = new Date().toISOString()
    const shiftPayload = {
      startOdometer,
      endOdometer,
      totalDistance,
      revenue: validatedRevenue,
      shiftStartAt: shiftStartTimestamp.value || now,
      shiftEndAt: now,
      createdAt: now
    }

    try {
      await ShiftRepository.create(shiftPayload)

      // Audit is deliberately non-blocking: a logging failure must never
      // invalidate an otherwise successful shift persistence operation.
      void OdometerAuditService.auditShiftBoundary(previousOdometer, startOdometer)

      lastOdometer.value = endOdometer
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
