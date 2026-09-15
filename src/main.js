import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { MutationRepository } from './repositories/mutationRepository.js'
import { useDayShiftTripStore } from './stores/dayShiftTrip.js'

const app = createApp(App)
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue Runtime Error:', err, info)
  document.body.innerHTML = `<div style="padding:20px;color:red;font-family:sans-serif;"><h2>Runtime Error Captured:</h2><pre style="background:#fee2e2;padding:12px;border-radius:6px;overflow:auto;">${err.stack || err}</pre></div>`
}

const pinia = createPinia()
app.use(pinia)
app.use(router)
app.mount('#app')

void MutationRepository.recoverStaleSyncing().catch(error => console.error('Offline mutation recovery failed during startup:', error))

const workStore = useDayShiftTripStore(pinia)
void workStore.initialize().catch(error => console.error('KFE Work lifecycle initialization failed:', error))
