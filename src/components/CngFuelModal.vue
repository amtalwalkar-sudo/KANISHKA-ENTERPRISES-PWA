<script setup>
import { ref, watch, onUnmounted } from 'vue'

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close', 'save'])

const odometer = ref('')
const amount = ref('')
const kg = ref('')

// Lock body scroll when modal opens
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
  } else {
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.width = ''
  }
}, { immediate: true })

onUnmounted(() => {
  document.body.style.overflow = ''
  document.body.style.position = ''
  document.body.style.width = ''
})

const handleSave = () => {
  if (!odometer.value || !amount.value) {
    alert('Please fill in Odometer and Amount')
    return
  }
  emit('save', {
    odometer: Number(odometer.value),
    amount: Number(amount.value),
    kg: kg.value ? Number(kg.value) : 0
  })
  odometer.value = ''
  amount.value = ''
  kg.value = ''
}
</script>

<template>
  <Teleport to="body">
    <div 
      v-if="isOpen" 
      style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; height: 100vh; height: 100dvh; background: rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 12px; box-sizing: border-box; touch-action: none;"
      @click.self="emit('close')"
      @touchmove.prevent
    >
      <div 
        style="background: white; border-radius: 12px; width: 100%; max-width: 450px; max-height: 80vh; max-height: 80dvh; display: flex; flex-direction: column; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); overflow: hidden; touch-action: auto;"
        @touchmove.stop
      >
        <!-- HEADER -->
        <div style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; flex-shrink: 0;">
          <h3 style="margin: 0; font-size: 1rem; font-weight: bold; color: #0f172a;">⛽ Add CNG Fuel Log</h3>
          <button @click="emit('close')" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #64748b; padding: 4px;">✕</button>
        </div>

        <!-- FORM CONTENT -->
        <div style="padding: 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; -webkit-overflow-scrolling: touch;">
          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Odometer Reading (km) *</label>
            <input 
              v-model="odometer" 
              type="number" 
              placeholder="e.g. 13800" 
              style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; box-sizing: border-box;"
            />
          </div>

          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 4px;">Amount Paid (₹) *</label>
            <input 
              v-model="amount" 
              type="number" 
              placeholder="e.g. 350" 
              style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; box-sizing: border-box;"
            />
          </div>

          <div>
            <label style="display: block; font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 4px;">CNG Quantity (kg) - Optional</label>
            <input 
              v-model="kg" 
              type="number" 
              step="0.01" 
              placeholder="e.g. 4.2" 
              style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; box-sizing: border-box;"
            />
          </div>
        </div>

        <!-- FOOTER -->
        <div style="padding: 12px 16px; border-top: 1px solid #e2e8f0; background: #f8fafc; display: flex; gap: 8px; flex-shrink: 0;">
          <button 
            @click="emit('close')" 
            style="flex: 1; padding: 10px; background: #e2e8f0; color: #334155; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;"
          >
            Cancel
          </button>
          <button 
            @click="handleSave" 
            style="flex: 1; padding: 10px; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;"
          >
            Save Fuel Log
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
