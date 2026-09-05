<script setup>
import {onMounted, ref} from 'vue';
import BackupRestorePanel from './BackupRestorePanel.vue';

const props=defineProps({application:{type:Object,required:true}});
const emit=defineEmits(['back']);
const backupStatus=ref(null);
const error=ref('');

async function load(){try{backupStatus.value=await props.application.getBackupStatus();}catch(e){error.value=String(e?.message||e);}}
onMounted(load);
</script>
<template>
<section class="kfe-settings" aria-labelledby="settings-title">
  <header class="kfe-settings__header">
    <button type="button" class="kfe-secondary-action" @click="emit('back')">‹ Admin</button>
    <p class="kfe-eyebrow">SYSTEM</p>
    <h1 id="settings-title">Settings</h1>
    <p class="kfe-destination-subtitle">Implemented system controls. New settings are added here only when the underlying capability exists.</p>
  </header>
  <p v-if="error" class="kfe-error-note" role="alert">{{error}}</p>
  <section class="kfe-settings-section" aria-labelledby="backup-setting-title">
    <div class="kfe-settings-heading"><div><p class="kfe-eyebrow">DATA PROTECTION</p><h2 id="backup-setting-title">Backup &amp; Restore</h2></div><span class="kfe-settings-status">{{backupStatus?.status==='CURRENT'?'Protected':'Initializing'}}</span></div>
    <BackupRestorePanel :application="application" />
  </section>
</section>
</template>
<style scoped>
.kfe-settings{padding:16px;display:grid;gap:16px;padding-bottom:96px}.kfe-settings__header{display:grid;gap:6px}.kfe-settings-section{padding:16px;border:1px solid var(--kfe-ui-border);border-radius:16px;background:var(--kfe-ui-surface);display:grid;gap:14px}.kfe-settings-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.kfe-settings-heading h2{margin:0}.kfe-settings-status{font-size:.78rem;font-weight:700;border:1px solid var(--kfe-ui-border);border-radius:999px;padding:6px 9px;white-space:nowrap}
</style>
