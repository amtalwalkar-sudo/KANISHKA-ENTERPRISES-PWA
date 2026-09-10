import { defineStore } from 'pinia'

export const useRecordsStore = defineStore('records', {
  state: () => ({
    records: []
  }),
  getters: {
    totalPaise: (state) => {
      return state.records.reduce((acc, curr) => acc + (Number(curr.amount_paise) || 0), 0)
    },
    revenueRecords: (state) => {
      return state.records.filter(r => r.record_type === 'REVENUE')
    },
    expenseRecords: (state) => {
      return state.records.filter(r => r.record_type === 'EXPENSE')
    }
  },
  actions: {
    setRecords(records) {
      this.records = records
    },
    addRecord(record) {
      this.records.unshift(record)
    },
    updateRecordStatus(entityId, status) {
      const target = this.records.find(r => r.entityId === entityId)
      if (target) {
        target.status = status
      }
    }
  }
})
