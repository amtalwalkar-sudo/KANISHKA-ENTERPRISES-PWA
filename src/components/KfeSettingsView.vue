<script setup>
import { onMounted, ref } from 'vue'

defineProps({ application: { type: Object, default: null } })

const theme = ref(localStorage.getItem('kfe-theme') || 'system')
const busy = ref(false)
const message = ref('')
const error = ref('')
const fileInput = ref(null)

function applyTheme(value) {
  theme.value = value
  localStorage.setItem('kfe-theme', value)
  document.documentElement.dataset.kfeTheme = value
}

function requestFile() { fileInput.value?.click() }

function openDatabaseNames() {
  return new Promise(resolve => {
    if (!indexedDB.databases) return resolve([])
    indexedDB.databases().then(list => resolve(list.map(x => x.name).filter(Boolean))).catch(() => resolve([]))
  })
}

function readStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function backup() {
  busy.value = true; message.value = ''; error.value = ''
  try {
    const databases = await openDatabaseNames()
    const payload = { format: 'KFE_BACKUP', version: 1, createdAt: new Date().toISOString(), databases: [] }
    for (const name of databases) {
      await new Promise((resolve, reject) => {
        const request = indexedDB.open(name)
        request.onsuccess = async () => {
          const db = request.result
          const stores = []
          try {
            for (const storeName of Array.from(db.objectStoreNames)) {
              const tx = db.transaction(storeName, 'readonly')
              stores.push({ name: storeName, records: await readStore(tx.objectStore(storeName)) })
            }
            payload.databases.push({ name, version: db.version, stores })
            db.close(); resolve()
          } catch (e) { db.close(); reject(e) }
        }
        request.onerror = () => reject(request.error)
      })
    }
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `kfe-backup-${new Date().toISOString().slice(0,10)}.json`; a.click()
    URL.revokeObjectURL(url)
    message.value = `Backup created: ${payload.databases.length} local database(s).`
  } catch (e) { error.value = `Backup failed: ${String(e?.message || e)}` }
  finally { busy.value = false }
}

async function restore(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  busy.value = true; message.value = ''; error.value = ''
  try {
    const payload = JSON.parse(await file.text())
    if (payload?.format !== 'KFE_BACKUP' || !Array.isArray(payload.databases)) throw new Error('This is not a valid KFE backup.')
    if (!confirm('Restore this backup? Existing records in matching stores will be replaced.')) return
    for (const savedDb of payload.databases) {
      await new Promise((resolve, reject) => {
        const request = indexedDB.open(savedDb.name, savedDb.version || 1)
        request.onupgradeneeded = () => {
          const db = request.result
          for (const store of savedDb.stores || []) if (!db.objectStoreNames.contains(store.name)) db.createObjectStore(store.name, { keyPath: 'id', autoIncrement: true })
        }
        request.onsuccess = async () => {
          const db = request.result
          try {
            for (const store of savedDb.stores || []) {
              if (!db.objectStoreNames.contains(store.name)) continue
              const tx = db.transaction(store.name, 'readwrite'); const os = tx.objectStore(store.name)
              os.clear()
              for (const record of store.records || []) os.put(record)
              await new Promise((r, j) => { tx.oncomplete = r; tx.onerror = () => j(tx.error) })
            }
            db.close(); resolve()
          } catch (e) { db.close(); reject(e) }
        }
        request.onerror = () => reject(request.error)
      })
    }
    message.value = 'Restore complete. Reloading KFE…'
    setTimeout(() => location.reload(), 700)
  } catch (e) { error.value = `Restore failed: ${String(e?.message || e)}` }
  finally { busy.value = false }
}

async function resetData() {
  if (!confirm('RESET ALL KFE DATA? This permanently removes local ERP records from this device.')) return
  if (!confirm('Final confirmation: erase all vehicle, work, fuel, expense, revenue, loan, maintenance and compliance data?')) return
  busy.value = true; error.value = ''
  try {
    const names = await openDatabaseNames()
    if (names.length) for (const name of names) await new Promise((resolve, reject) => { const r = indexedDB.deleteDatabase(name); r.onsuccess = r.onerror = r.onblocked = resolve })
    message.value = 'Local data reset. Reloading…'; setTimeout(() => location.reload(), 500)
  } catch (e) { error.value = `Reset failed: ${String(e?.message || e)}`; busy.value = false }
}

onMounted(() => applyTheme(theme.value))
</script>

<template>
  <section class="kfe-settings-page">
    <header class="kfe-page-head"><div><span class="kfe-eyebrow">Control centre</span><h1>Settings</h1><p>Device, appearance, data protection and recovery.</p></div></header>
    <div v-if="error" class="kfe-alert is-error">{{ error }}</div>
    <div v-if="message" class="kfe-alert is-ok">✓ {{ message }}</div>

    <section class="kfe-settings-card"><div><span class="kfe-card-kicker">Appearance</span><h2>Day / night mode</h2><p>Choose the cockpit theme. System follows your phone setting.</p></div><div class="kfe-theme-picker"><button v-for="item in [['system','System','◐'],['light','Day','☀'],['dark','Night','☾']]" :key="item[0]" type="button" :class="{active:theme===item[0]}" @click="applyTheme(item[0]"><span>{{ item[2] }}</span><b>{{ item[1] }}</b></button></div></section>

    <section class="kfe-settings-card"><span class="kfe-card-kicker">Data safety</span><h2>Backup & restore</h2><p>Export the complete local IndexedDB dataset to a portable JSON backup, or restore one later.</p><div class="kfe-settings-actions"><button class="kfe-action-primary" :disabled="busy" @click="backup">Export full backup</button><button class="kfe-action-secondary" :disabled="busy" @click="requestFile">Restore backup</button><input ref="fileInput" hidden type="file" accept="application/json,.json" @change="restore"></div></section>

    <section class="kfe-settings-card danger"><span class="kfe-card-kicker">Danger zone</span><h2>Reset local ERP data</h2><p>Use only when intentionally starting a clean dataset or removing test data from this device.</p><button class="kfe-action-danger" :disabled="busy" @click="resetData">Reset all local data</button></section>

    <section class="kfe-settings-card"><span class="kfe-card-kicker">KFE 2.0</span><h2>Operational design</h2><div class="kfe-settings-list"><span>Offline-first local operation</span><span>Business vs personal usage separation</span><span>KM-based maintenance allocation</span><span>Loan principal / interest tracking</span><span>Driver-first 48px+ touch targets</span></div></section>
  </section>
</template>

<style scoped>
.kfe-settings-page{display:grid;gap:16px;padding:18px 16px 110px;max-width:760px;margin:auto}.kfe-page-head h1{margin:2px 0 4px;font-size:2rem}.kfe-page-head p,.kfe-settings-card p{margin:0;color:var(--kfe-muted-text);line-height:1.45}.kfe-settings-card{background:var(--kfe-ui-surface);border:1px solid var(--kfe-ui-border);border-radius:22px;padding:18px;box-shadow:var(--kfe-shadow);display:grid;gap:12px}.kfe-settings-card h2{margin:0;font-size:1.15rem}.kfe-card-kicker{font-size:.7rem;text-transform:uppercase;letter-spacing:.09em;font-weight:900;color:var(--kfe-accent)}.kfe-theme-picker{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.kfe-theme-picker button{min-height:64px;border:1px solid var(--kfe-ui-border);border-radius:15px;background:var(--kfe-ui-bg);color:var(--kfe-ui-text);display:grid;place-items:center;gap:2px;font:inherit}.kfe-theme-picker button.active{border:2px solid var(--kfe-accent);background:var(--kfe-accent-soft)}.kfe-theme-picker span{font-size:1.2rem}.kfe-theme-picker b{font-size:.8rem}.kfe-settings-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}.kfe-settings-actions button,.kfe-action-danger{min-height:52px;border-radius:14px;padding:0 14px;font-weight:900;font:inherit}.kfe-action-primary{border:0;background:var(--kfe-accent);color:#fff}.kfe-action-secondary{border:1px solid var(--kfe-ui-border);background:var(--kfe-ui-bg);color:var(--kfe-ui-text)}.kfe-action-danger{border:1px solid #ef4444;background:transparent;color:#ef4444}.danger{border-color:#ef444466}.kfe-alert{padding:12px 14px;border-radius:14px;font-weight:700}.is-error{background:#fee2e2;color:#b91c1c}.is-ok{background:#dcfce7;color:#166534}.kfe-settings-list{display:grid;gap:8px}.kfe-settings-list span{padding:11px 12px;background:var(--kfe-ui-bg);border-radius:12px;font-size:.86rem}@media(max-width:480px){.kfe-settings-actions{grid-template-columns:1fr}.kfe-theme-picker button{min-height:58px}}
</style>