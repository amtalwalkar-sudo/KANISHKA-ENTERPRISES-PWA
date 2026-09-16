import { defineStore } from 'pinia'
import { ref } from 'vue'
import { WorkService } from '../application/work/workService.js'

export const useFuelStore = defineStore('fuel', () => {
  const logs = ref([])
  const saving = ref(false)

  const refresh = async () => { logs.value = await WorkService.getFuelLogs() }

  const save = async data => {
    saving.value = true
    try {
      const result = await WorkService.recordFuel(data)
      if (result.ok) await refresh()
      return result
    } finally {
      saving.value = false
    }
  }

  return { logs, saving, refresh, save }
})
