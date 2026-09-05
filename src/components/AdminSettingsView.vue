<script setup>
import {onMounted, ref, watch, nextTick} from 'vue';
import BackupRestorePanel from './BackupRestorePanel.vue';

const props=defineProps({application:{type:Object,required:true},initialSection:{type:String,default:'backup'}});
const emit=defineEmits(['back']);
const backupStatus=ref(null);
const error=ref('');
const resetBusy=ref(false);
const resetError=ref('');

async function load(){try{backupStatus.value=await props.application.getBackupStatus();}catch(e){error.value=String(e?.message||e);}}
async function resetData(){
  if(resetBusy.value)return;
  if(!globalThis.confirm('Data Reset permanently removes the local KFE business dataset and local backup/recovery data. Continue?'))return;
  resetBusy.value=true;resetError.value='';
  try{await props.application.resetAllData();globalThis.location.reload();}
  catch(e){resetError.value=String(e?.message||e);resetBusy.value=false;}
}
function focusSection(){nextTick(()=>{document.getElementById(`settings-${props.initialSection}`)?.scrollIntoView({block:'start'});});}
onMounted(()=>{load();focusSection();});
watch(()=>props.initialSection,focusSection);
</script>
<template>
<section class="kfe-settings" aria-labelledby="settings-title">
  <header class="kfe-settings__header">
    <button type="button" class="kfe-secondary-action" @click="emit('back')">‹ Admin</button>
    <p class="kfe-eyebrow">SYSTEM</p>
    <h1 id="settings-title">Settings</h1>
    <p class="kfe-destination-subtitle">Concrete system controls. New controls are added only when the underlying capability exists.</p>
  </header>
  <p v-if="error" class="kfe-error-note" role="alert">{{error}}</p>
  <section id="settings-backup" class="kfe-settings-section" aria-labelledby="backup-setting-title">
    <div class="kfe-settings-heading"><div><p class="kfe-eyebrow">DATA PROTECTION</p><h2 id="backup-setting-title">Backup &amp; Restore</h2></div><span class="kfe-settings-status">{{backupStatus?.status==='CURRENT'?'Protected':'Initializing'}}</span></div>
    <BackupRestorePanel :application="application" />
  </section>
  <section id="settings-reset" class="kfe-settings-section kfe-settings-section--danger" aria-labelledby="reset-setting-title">
    <div class="kfe-settings-heading"><div><p class="kfe-eyebrow">LOCAL DATA</p><h2 id="reset-setting-title">Data Reset</h2></div></div>
    <p class="kfe-boundary-note">Permanently clears the local KFE business dataset and local recovery/backup storage on this device. This action cannot be undone.</p>
    <p v-if="resetError" class="kfe-error-note" role="alert">{{resetError}}</p>
    <button type="button" class="kfe-danger-action" :disabled="resetBusy" @click="resetData">{{resetBusy?'Resetting…':'Reset all local KFE data'}}</button>
  </section>
</section>
</template>
<style scoped>
.kfe-settings{padding:16px;display:grid;gap:16px;padding-bottom:96px}.kfe-settings__header{display:grid;gap:6px}.kfe-settings-section{padding:16px;border:1px solid var(--kfe-ui-border);border-radius:16px;background:var(--kfe-ui-surface);display:grid;gap:14px;scroll-margin-top:16px}.kfe-settings-section--danger{border-style:solid}.kfe-settings-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.kfe-settings-heading h2{margin:0}.kfe-settings-status{font-size:.78rem;font-weight:700;border:1px solid var(--kfe-ui-border);border-radius:999px;padding:6px 9px;white-space:nowrap}.kfe-danger-action{min-height:50px;border:1px solid var(--kfe-ui-border);border-radius:12px;background:var(--kfe-ui-surface);color:var(--kfe-ui-text);padding:12px;font-weight:800}.kfe-danger-action:disabled{opacity:.55}
</style>
