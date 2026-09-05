<script setup>
import { onMounted, ref } from 'vue';
const props=defineProps({application:{type:Object,required:true}});
const status=ref({status:'LOADING',lastSuccessfulBackupAt:null,recordCount:0,sizeBytes:0});
const passphrase=ref('');
const busy=ref(false);
const message=ref('');
const error=ref('');
const restoreInput=ref(null);
function formatDate(value){if(!value)return 'Not available';try{return new Date(value).toLocaleString();}catch{return value;}}
function formatSize(bytes){const value=Number(bytes||0);if(value<1024)return `${value} B`;if(value<1024*1024)return `${(value/1024).toFixed(1)} KB`;return `${(value/1024/1024).toFixed(1)} MB`;}
async function load(){try{status.value=await props.application.getBackupStatus();}catch(e){error.value=String(e?.message||e);}}
async function refreshLocal(){busy.value=true;message.value='';error.value='';try{await props.application.refreshLocalBackup('manual-local');await load();message.value='Local recovery copy is current.';}catch(e){error.value=String(e?.message||e);}finally{busy.value=false;}}
async function exportPortable(){message.value='';error.value='';if(passphrase.value.length<8){error.value='Use a passphrase of at least 8 characters for a portable backup.';return;}busy.value=true;try{const blob=await props.application.exportPortableBackupFile(passphrase.value);const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`kfe-2.0-${new Date().toISOString().replace(/[:.]/g,'-')}.kfe`;document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);message.value='Portable KFE backup created.';}catch(e){error.value=String(e?.message||e);}finally{busy.value=false;}}
function openRestorePicker(){message.value='';error.value='';restoreInput.value?.click();}
async function restoreSelectedFile(event){const file=event.target.files?.[0];event.target.value='';if(!file)return;if(passphrase.value.length<8){error.value='Enter the portable backup passphrase before restoring.';return;}if(!window.confirm('Restore this KFE backup? Current ERP data will first be protected by a safety backup, then replaced by the selected backup.'))return;busy.value=true;message.value='';error.value='';try{await props.application.restorePortableBackupText(await file.text(),passphrase.value);message.value='Restore completed. Reloading KFE…';window.setTimeout(()=>window.location.reload(),250);}catch(e){error.value=String(e?.message||e);}finally{busy.value=false;}}
onMounted(load);
</script>
<template>
<section class="kfe-backup-panel" aria-labelledby="backup-title">
  <div class="kfe-module-section"><h2 id="backup-title">LOCAL RECOVERY</h2><div class="kfe-detail-card"><strong>{{status.status==='CURRENT'?'Protected on this phone':'Protection initializing'}}</strong><p>Complete KFE data is maintained in the device recovery copy. It is updated after successful ERP changes.</p><p>Last protected: {{formatDate(status.lastSuccessfulBackupAt)}} · {{status.recordCount}} records · {{formatSize(status.sizeBytes)}}</p><button class="kfe-primary-action" type="button" :disabled="busy" @click="refreshLocal">Refresh local protection</button></div></div>
  <div class="kfe-module-section"><h2>PHONE MIGRATION</h2><p class="kfe-boundary-note">Portable backups contain the complete KFE dataset and are encrypted for transfer to another phone.</p><label class="kfe-form-label" for="kfe-backup-passphrase">Portable backup passphrase</label><input id="kfe-backup-passphrase" v-model="passphrase" type="password" minlength="8" autocomplete="new-password" placeholder="At least 8 characters"><div class="kfe-module-list"><button type="button" :disabled="busy" @click="exportPortable">Create portable backup</button><button type="button" :disabled="busy" @click="openRestorePicker">Restore portable backup</button></div><input ref="restoreInput" class="kfe-visually-hidden" type="file" accept=".kfe,application/vnd.kfe.backup+json,application/json" @change="restoreSelectedFile"></div>
  <div class="kfe-module-section"><h2>CLOUD PROVIDER</h2><div class="kfe-detail-card"><strong>Provider-independent boundary ready</strong><p>No cloud provider is selected or connected in this implementation layer. A provider adapter can be added later without changing the KFE backup format or local recovery engine.</p></div></div>
  <p v-if="message" class="kfe-boundary-note" role="status">{{message}}</p><p v-if="error" class="kfe-error-note" role="alert">{{error}}</p>
</section>
</template>
<style scoped>
.kfe-backup-panel{display:grid;gap:16px}.kfe-detail-card{padding:14px;border:1px solid var(--kfe-ui-border);border-radius:14px;background:var(--kfe-ui-surface);display:grid;gap:8px}.kfe-detail-card p{margin:0;line-height:1.45}.kfe-backup-panel input{min-height:48px;border:1px solid var(--kfe-ui-border);border-radius:10px;background:var(--kfe-ui-surface);color:var(--kfe-ui-text);padding:10px}.kfe-module-list button:disabled{opacity:.55}
</style>
