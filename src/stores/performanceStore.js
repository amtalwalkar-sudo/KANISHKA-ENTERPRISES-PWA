import { defineStore } from 'pinia'
import { ref } from 'vue'
import { FuelAnalyticsService } from '../services/fuelAnalyticsService'

export const usePerformanceStore = defineStore('performance', () => {
  const metrics = ref({
    totalDistance: 0,
    totalRevenue: 0,
    totalFuelQty: 0,
    totalFuelCost: 0,
    netRevenue: 0,
    efficiencyKmPerUnit: 0,
    fuelCostPerKm: 0,
    netProfitPerKm: 0,
    shiftCount: 0,
    fuelLogCount: 0
  })

  const isLoading = ref(false)
  const error = ref(null)

  const refreshMetrics = async () => {
    isLoading.value = true
    error.value = null

    try {
      metrics.value = await FuelAnalyticsService.getPerformanceMetrics()
    } catch (err) {
      console.error('Failed to process performance metrics:', err)
      error.value = 'Failed to process performance metrics.'
    } finally {
      isLoading.value = false
    }
  }

  return {
    metrics,
    isLoading,
    error,
    refreshMetrics
  }
})
