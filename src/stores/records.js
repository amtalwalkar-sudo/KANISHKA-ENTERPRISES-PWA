import { defineStore } from 'pinia'
import { calculateTotalAmount } from '@/domain/math/index.js'

export const useRecordsStore = defineStore('records', {
  state: () => ({
    records: [],
    activeRecord: null,
    loading: false,
    error: null
  }),
  getters: {
    totalPaise: (state) => calculateTotalAmount(state.records, 'amount_paise'),
    revenueRecords: (state) => state.records.filter(r => (r.type || r.record_type) === 'REVENUE'),
    expenseRecords: (state) => state.records.filter(r => (r.type || r.record_type) === 'EXPENSE'),
    fuelRecords: (state) => state.records.filter(r => (r.type || r.record_type) === 'FUEL')
  },
  actions: {
    setRecords(items) {
      this.records = Array.isArray(items) ? items : []
    },
    addRecord(record) {
      this.records.unshift(record)
    },
    updateRecord(id, updatedFields) {
      const idx = this.records.findIndex(r => (r.id || r.entityId) === id)
      if (idx !== -1) {
        this.records[idx] = { ...this.records[idx], ...updatedFields }
      }
    },
    setActiveRecord(record) {
      this.activeRecord = record
    }
  }
})
