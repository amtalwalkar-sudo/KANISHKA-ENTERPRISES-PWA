import { defineStore } from 'pinia'
import { ref } from 'vue'
import { recordFuelEntry } from '../application/work/fuel.js'
import { FuelRepository } from '../repositories/fuelRepository.js'

export const useFuelStore = defineStore('fuel', () => {
  const logs = ref([])
  const saving = ref(false)

  const refresh = async () => { logs.value = await FuelRepository.getAll() }

  const save = async data => {
    saving.value = true
    try {
      const result = await recordFuelEntry(data)
      if (result.ok) await refresh()
      return result
    } finally {
      saving.value = false
    }
  }

  return { logs, saving, refresh, save }
})
