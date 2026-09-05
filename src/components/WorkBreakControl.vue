<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { application } from '../../js/app.js'

const model = ref(null)
const open = ref(false)
const minutes = ref('')
const busy = ref(false)
const error = ref('')
let timer

const shiftActive = computed(() => Boolean(model.value?.shift?.active))
const tripActive = computed(() => Boolean(model.value?.trip?.active))
const breakMinutes = computed(() => Number(model.value?.shift?.breakMinutes || 0))
const visible = computed(() => shiftActive.value && !tripActive.value)

async function load() {
  try { model.value = await application.getWorkScreenState() } catch (e) { error.value = String(e?.message || e) }
}
function openEditor() {
  error.value = ''
  minutes.value = String(breakMinutes.value)
  open.value = true
}
async function save() {
  const value = Number(minutes.value)
  if (!Number.isInteger(value) || value < 0) { error.value = 'Break minutes must be a non-negative whole number.'; return }
  busy.value = true
  error.value = ''
  try { await application.recordBreakMinutes({ minutes: value, actionMode: 'BUTTON' }); open.value = false; await load() }
  catch (e) { error.value = String(e?.message || e) }
  finally { busy.value = false }
}
function close() { if (!busy.value) open.value = false }

onMounted(() => { load(); timer = setInterval(load, 500) })
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <section v-if="visible" aria-label="Work break control">
    <button type="button" :disabled="busy" @click="openEditor">Break · {{ breakMinutes }} min</button>
    <div v-if="open" role="dialog" aria-modal="true" aria-label="Record break minutes">
      <label>Break minutes<input v-model="minutes" type="number" min="0" step="1" inputmode="numeric"></label>
      <button type="button" :disabled="busy" @click="save">Save break</button>
      <button type="button" :disabled="busy" @click="close">Cancel</button>
    </div>
    <p v-if="error" role="alert">{{ error }}</p>
  </section>
</template>
