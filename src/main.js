import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.config.errorHandler = (err, instance, info) => {
  console.error('Vue Runtime Error:', err, info)
  document.body.innerHTML = `<div style="padding:20px;color:red;font-family:sans-serif;">
    <h2>Runtime Error Captured:</h2>
    <pre style="background:#fee2e2;padding:12px;border-radius:6px;overflow:auto;">${err.stack || err}</pre>
  </div>`
}

app.use(createPinia())
app.use(router)
app.mount('#app')
