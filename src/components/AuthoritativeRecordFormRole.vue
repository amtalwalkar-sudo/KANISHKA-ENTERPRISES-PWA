<script setup>
import FormLayout from '@/layouts/FormLayout.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useForm } from '@/composables/useForm.js'
import { useToast } from '@/composables/useToast.js'
import { useRecordsStore } from '@/stores/records.js'
import { saveLocalRecord, enqueueOfflineAction } from '@/db/index.js'
import { toPaise } from '@/domain/math/index.js'

const toast = useToast()
const recordsStore = useRecordsStore()

const { form, busy, error, reset, submit } = useForm({
  record_type: 'REVENUE',
  amount: '',
  notes: '',
  date: new Date().toISOString().substring(0, 10)
})

async function handleFormSubmit() {
  await submit(async (formData) => {
    if (!formData.amount || Number(formData.amount) <= 0) {
      throw new Error('Please enter a valid amount greater than zero.')
    }

    const amountPaise = toPaise(Number(formData.amount))
    const record = {
      entityId: `rec-${Date.now()}`,
      record_type: formData.record_type,
      amount_paise: amountPaise,
      notes: formData.notes,
      date: formData.date,
      status: navigator.onLine ? 'SYNCED' : 'PENDING'
    }

    // Save to Dexie IndexedDB
    await saveLocalRecord(record)

    // Queue for server sync if offline
    if (!navigator.onLine) {
      await enqueueOfflineAction('CREATE', 'RECORD', record)
    }

    // Update Pinia state
    recordsStore.addRecord(record)

    toast.success(`Record saved ${navigator.onLine ? 'and synced' : 'locally (offline)'}`)
    reset()
  })
}

function handleCancel() {
  reset()
  toast.info('Form reset')
}
</script>

<template>
  <FormLayout
    title="Authoritative Record Form"
    subtitle="Submit entry with offline-first Dexie.js & Pinia synchronization"
    :loading="busy"
    @submit="handleFormSubmit"
    @cancel="handleCancel"
  >
    <div v-if="error" class="form-error-alert">
      {{ error }}
    </div>

    <div class="form-group">
      <label class="form-label">Record Type</label>
      <select v-model="form.record_type" class="type-select" :disabled="busy">
        <option value="REVENUE">Revenue</option>
        <option value="EXPENSE">Expense</option>
        <option value="FUEL">Fuel</option>
      </select>
    </div>

    <BaseInput
      v-model="form.amount"
      type="number"
      label="Amount (₹)"
      placeholder="0.00"
      required
      :disabled="busy"
    />

    <BaseInput
      v-model="form.date"
      type="date"
      label="Date"
      required
      :disabled="busy"
    />

    <BaseInput
      v-model="form.notes"
      type="text"
      label="Notes / Description"
      placeholder="Optional entry details..."
      :disabled="busy"
    />

    <template #actions>
      <BaseButton type="button" variant="secondary" :disabled="busy" @click="handleCancel">
        Clear
      </BaseButton>
      <BaseButton type="submit" variant="primary" :loading="busy">
        Save Record
      </BaseButton>
    </template>
  </FormLayout>
</template>

<style scoped>
.form-error-alert {
  padding: 0.5rem 0.75rem;
  background-color: #fef2f2;
  border: 1px solid #fca5a5;
  color: #dc2626;
  border-radius: var(--radius-md, 6px);
  font-size: var(--font-size-sm, 0.75rem);
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.form-label {
  font-size: var(--font-size-sm, 0.72rem);
  font-weight: 600;
  color: var(--text-main, #334155);
}
.type-select {
  padding: 0.45rem 0.6rem;
  border-radius: var(--radius-md, 6px);
  border: 1px solid var(--border-color, #cbd5e1);
  font-size: var(--font-size-sm, 0.78rem);
  background: var(--bg-surface, #fff);
  color: var(--text-main, #0f172a);
  outline: none;
}
.type-select:focus {
  border-color: var(--color-primary, #2563eb);
}
</style>
