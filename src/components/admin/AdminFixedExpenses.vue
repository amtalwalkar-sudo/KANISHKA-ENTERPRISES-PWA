<script setup>
import { ref } from 'vue'
import { rupeesToPaise, paiseToRupees } from '../../domain/math/index.js'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  application: { type: Object, required: true },
  money: { type: Function, required: true },
  reload: { type: Function, required: true }
})

const open = ref(false)
const editing = ref(null)
const busy = ref(false)
const error = ref('')
const form = ref({
  name: '',
  category: '',
  amount: '',
  effective_from: new Date().toISOString().slice(0, 10),
  status: 'ACTIVE'
})

function reset() {
  form.value = {
    name: '',
    category: '',
    amount: '',
    effective_from: new Date().toISOString().slice(0, 10),
    status: 'ACTIVE'
  }
  editing.value = null
  error.value = ''
}

function add() { reset(); open.value = true }

function edit(row) {
  editing.value = row
  error.value = ''
  const paise = Number(row.amount_paise ?? row.monthly_amount_paise ?? 0)
  form.value = {
    name: row.name || '',
    category: row.category || '',
    amount: paiseToRupees(paise).toFixed(2),
    effective_from: String(row.effective_from || '').slice(0, 10),
    status: row.status || 'ACTIVE'
  }
  open.value = true
}

function cancel() { open.value = false; reset() }

async function save() {
  busy.value = true
  error.value = ''
  try {
    const value = {
      name: form.value.name,
      category: form.value.category,
      amount_paise: rupeesToPaise(form.value.amount),
      effective_from: form.value.effective_from,
      status: form.value.status
    }
    if (editing.value) {
      await props.application.fixedExpenses.update(editing.value.id, value)
    } else {
      await props.application.fixedExpenses.create(value)
    }
    await props.reload()
    cancel()
  } catch (e) {
    error.value = String(e?.message || e)
  } finally {
    busy.value = false
  }
}

async function toggle(row) {
  try {
    if (row.status === 'ACTIVE') {
      await props.application.fixedExpenses.deactivate(row.id)
    } else {
      await props.application.fixedExpenses.activate(row.id)
    }
    await props.reload()
  } catch (e) {
    error.value = String(e?.message || e)
  }
}
</script>
