<script setup>
import { onMounted, ref } from 'vue'
import { application } from '../../js/app.js'

const theme=ref('day'),busy=ref(false),message=ref(''),error=ref(''),fileInput=ref(null)

async function applyTheme(v){
  try{
    await application.setTheme(v)
    theme.value=v
    document.documentElement.dataset.kfeTheme=v
  }catch(e){error.value=String(e?.message||e)}
}
function requestFile(){fileInput.value?.click()}

async function loadTheme(){
  try{const settings=await application.getSettings();theme.value=settings.theme;document.documentElement.dataset.kfeTheme=settings.theme}
  catch(e){error.value=String(e?.message||e)}
}

async function backup(){
  busy.value=true;message.value='';error.value=''
  try{
    const payload=await application.exportBackup()
    const blob=new Blob([JSON.stringify(payload)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a')
    a.href=url;a.download=`kfe-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url)
    message.value='Backup created.'
  }catch(e){error.value=`Backup failed: ${String(e?.message||e)}`}finally{busy.value=false}
}

async function restore(ev){
  const file=ev.target.files?.[0];ev.target.value='';if(!file)return
  busy.value=true;message.value='';error.value=''
  try{
    const payload=JSON.parse(await file.text())
    if(!payload||typeof payload!=='object')throw Error('This is not a valid KFE backup.')
    if(!confirm('Restore this backup? Existing local ERP data will be replaced.'))return
    await application.restoreBackup(payload)
    message.value='Restore complete. Reloading KFE…'
    setTimeout(()=>location.reload(),700)
  }catch(e){error.value=`Restore failed: ${String(e?.message||e)}`}finally{busy.value=false}
}

async function resetData(){
  if(!confirm('RESET ALL KFE DATA? This permanently removes local ERP records from this device.'))return
  if(!confirm('Final confirmation: erase all local ERP data?'))return
  busy.value=true;message.value='';error.value=''
  try{await application.resetAllData();message.value='Local data reset. Reloading…';setTimeout(()=>location.reload(),500)}
  catch(e){error.value=`Reset failed: ${String(e?.message||e)}`;busy.value=false}
}

onMounted(loadTheme)
</script>
<template><section class="kfe-settings-page"><header class="kfe-page-head"><span class="kfe-eyebrow">Control centre</span><h1>Settings</h1><p>Driver visibility, data protection and recovery.</p></header><div v-if="error" class="kfe-alert is-error">{{error}}</div><div v-if="message" class="kfe-alert is-ok">✓ {{message}}</div><section class="kfe-settings-card"><span class="kfe-card-kicker">Appearance</span><h2>Theme</h2><p>Choose the cockpit theme for the conditions you drive in.</p><div class="kfe-theme-picker"><button v-for="item in [['day','Day','☀'],['night','Night','☾'],['dusk','Driver','◒']]" :key="item[0]" type="button" :class="{active:theme===item[0]}" @click="applyTheme(item[0])"><span>{{item[2]}}</span><b>{{item[1]}}</b></button></div></section><section class="kfe-settings-card"><span class="kfe-card-kicker">Data safety</span><h2>Backup & restore</h2><p>Export the complete local ERP dataset to a portable JSON backup, or restore it later.</p><div class="kfe-settings-actions"><button class="kfe-action-primary" :disabled="busy" @click="backup">Export full backup</button><button class="kfe-action-secondary" :disabled="busy" @click="requestFile">Restore backup</button><input ref="fileInput" hidden type="file" accept="application/json,.json" @change="restore"></div></section><section class="kfe-settings-card danger"><span class="kfe-card-kicker">Danger zone</span><h2>Reset local ERP data</h2><p>Use only when intentionally starting a clean dataset or removing test data.</p><button class="kfe-action-danger" :disabled="busy" @click="resetData">Reset all local data</button></section><section class="kfe-settings-card"><span class="kfe-card-kicker">KFE 2.0 rules</span><div class="kfe-settings-list"><span>Offline-first local operation</span><span>Business vs personal usage separation</span><span>KM-based maintenance allocation</span><span>Loan principal / interest tracking</span><span>Driver-first 48px+ touch targets</span></div></section></section></template>
<style scoped>.kfe-settings-page{display:grid;gap:16px;padding:18px 16px 110px;max-width:760px;margin:auto}.kfe-page-head h1{margin:2px 0 4px;font-size:2rem}.kfe-page-head p,.kfe-settings-card p{margin:0;color:var(--kfe-muted-text);line-height:1.45}.kfe-settings-card{background:var(--kfe-ui-surface);border:1px solid var(--kfe-ui-border);border-radius:22px;padding:18px;box-shadow:var(--kfe-shadow);display:grid;gap:12px}.kfe-settings-card h2{margin:0;font-size:1.15rem}.kfe-card-kicker{font-size:.7rem;text-transform:uppercase;letter-spacing:.09em;font-weight:900;color:var(--kfe-accent)}.kfe-theme-picker{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.kfe-theme-picker button{min-height:64px;border:1px solid var(--kfe-ui-border);border-radius:15px;background:var(--kfe-ui-bg);color:var(--kfe-ui-text);display:grid;place-items:center;gap:2px}.kfe-theme-picker button.active{border:2px solid var(--kfe-accent);background:var(--kfe-accent-soft)}.kfe-theme-picker span{font-size:1.2rem}.kfe-theme-picker b{font-size:.8rem}.kfe-settings-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}.kfe-settings-actions button,.kfe-action-danger{min-height:52px;border-radius:14px;padding:0 14px;font-weight:900}.kfe-action-primary{border:0;background:var(--kfe-accent);color:#fff}.kfe-action-secondary{border:1px solid var(--kfe-ui-border);background:var(--kfe-ui-bg);color:var(--kfe-ui-text)}.kfe-action-danger{border:1px solid var(--kfe-danger);background:transparent;color:var(--kfe-danger)}.danger{border-color:color-mix(in srgb,var(--kfe-danger) 45%,var(--kfe-ui-border))}.kfe-alert{padding:12px 14px;border-radius:14px;font-weight:700}.is-error{background:color-mix(in srgb,var(--kfe-danger) 14%,var(--kfe-ui-surface));color:var(--kfe-danger)}.is-ok{background:color-mix(in srgb,var(--kfe-success) 14%,var(--kfe-ui-surface));color:var(--kfe-success)}.kfe-settings-list{display:grid;gap:8px}.kfe-settings-list span{padding:11px 12px;background:var(--kfe-ui-bg);border-radius:12px;font-size:.86rem}@media(max-width:480px){.kfe-settings-actions{grid-template-columns:1fr}}</style>