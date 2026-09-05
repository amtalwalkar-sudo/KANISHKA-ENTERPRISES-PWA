<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import KfeStatePanel from './KfeStatePanel.vue';
import KfeFormShell from './KfeFormShell.vue';
import KfeFormField from './KfeFormField.vue';
import BackupRestorePanel from './BackupRestorePanel.vue';

const props = defineProps({ module: { type: String, required: true }, application: { type: Object, default: null } });
const emit = defineEmits(['open', 'back', 'save-request', 'reset-request']);
const activeAction = ref('');
const settingsOpen = ref(false);
const settingsTheme = ref('system');
const settingsBusy = ref(false);
const settingsMessage = ref('');
const settingsError = ref('');

const MODULES = {
  Driver: { eyebrow: 'Vehicle', title: 'Driver', subtitle: 'Driver attached to the current vehicle.', sections: [{ title: 'Driver', items: ['Driver details', 'Vehicle attachment'] }] },
  Fuel: { eyebrow: 'Vehicle Operations', title: 'Fuel', subtitle: 'Record fuel using the established KFE fuel model.', sections: [{ title: 'Fuel', items: ['Add fuel'] }] },
  Expenses: { eyebrow: 'Business Operations', title: 'Expenses', subtitle: 'One unified expense model for business expenses.', sections: [{ title: 'Expenses', items: ['Add expense'] }, { title: 'Quick entry', items: ['Toll', 'Parking'] }] },
  Revenue: { eyebrow: 'Business Operations', title: 'Revenue', subtitle: 'Fast manual end-of-day revenue entry.', sections: [{ title: 'Revenue', items: ['Enter today’s revenue'] }] },
  Loans: { eyebrow: 'Finance', title: 'Loans', subtitle: 'Current obligations, payments and financial history.', sections: [{ title: 'Loan status', items: ['EMI', 'Outstanding balance', 'Vehicle association'] }, { title: 'History & tools', items: ['Payment history', 'Amortization', 'Prepayment calculator'] }] },
  Compliance: { eyebrow: 'Vehicle Operations', title: 'Compliance', subtitle: 'Renewals, validity and historical records.', sections: [{ title: 'Renewals', items: ['Add renewal', 'Current validity', 'Renewal history'] }] },
  Dashboard: { eyebrow: 'Business', title: 'Dashboard', subtitle: 'Actual business performance — what actually happened.', sections: [{ title: 'Actuals', items: ['Revenue', 'Costs', 'Business profitability', 'Operating metrics'] }] },
  Profitability: { eyebrow: 'Business', title: 'Profitability', subtitle: 'Decision-oriented financial interpretation.', sections: [{ title: 'Views', items: ['Actual', 'Projected', 'Target', 'Break-even'] }] },
  Settings: { eyebrow: 'System', title: 'Settings', subtitle: 'KFE system and application preferences.', sections: [{ title: 'App', items: ['Theme'] }, { title: 'Data', items: ['Backup', 'Restore', 'Reset ERP Data'] }, { title: 'About', items: ['KFE 2.0', 'Version 2.0.0'] }] },
};

const definition = computed(() => MODULES[props.module] ?? { eyebrow: 'KFE 2.0', title: props.module, subtitle: 'KFE module.', sections: [{ title: props.module, items: [] }] });
const ACTIONS = { Fuel: ['Add fuel'], Expenses: ['Add expense', 'Toll', 'Parking'], Revenue: ['Enter today’s revenue'], Loans: ['Prepayment calculator'], Compliance: ['Add renewal'] };
const formSpec = computed(() => {
  const action = activeAction.value;
  if (props.module === 'Revenue' && action === 'Enter today’s revenue') return { title: 'Enter today’s revenue', subtitle: 'Manual end-of-day revenue entry.', fields: [{ id: 'amount', label: 'Revenue amount', type: 'number', required: true, placeholder: '0.00' }, { id: 'date', label: 'Date', type: 'date', required: true }] };
  if (props.module === 'Fuel' && action === 'Add fuel') return { title: 'Add fuel', subtitle: 'Capture the authoritative fuel record.', fields: [{ id: 'date', label: 'Date', type: 'date', required: true }, { id: 'odometer', label: 'Odometer', type: 'number', required: true }, { id: 'amount', label: 'Amount', type: 'number', required: true, placeholder: '0.00' }] };
  if (props.module === 'Expenses') return { title: action === 'Add expense' ? 'Add expense' : `Add ${action.toLowerCase()}`, subtitle: 'Use the unified expense model.', fields: [{ id: 'category', label: 'Category', required: true, placeholder: 'Select category' }, { id: 'date', label: 'Date', type: 'date', required: true }, { id: 'amount', label: 'Amount', type: 'number', required: true, placeholder: '0.00' }, { id: 'description', label: 'Description', optional: true, placeholder: 'Optional details' }, { id: 'reference', label: 'Receipt / reference', optional: true, placeholder: 'Optional reference' }] };
  if (props.module === 'Compliance' && action === 'Add renewal') return { title: 'Add renewal', subtitle: 'Record a completed renewal.', fields: [{ id: 'type', label: 'Renewal type', required: true, placeholder: 'Select or enter type' }, { id: 'cost', label: 'Cost', type: 'number', required: true, placeholder: '0.00' }, { id: 'start', label: 'Validity start', type: 'date', required: true }, { id: 'end', label: 'Validity end', type: 'date', required: true }] };
  if (props.module === 'Loans' && action === 'Prepayment calculator') return { title: 'Prepayment calculator', subtitle: 'Zero prepayment charges. Financial calculation remains authoritative outside presentation.', fields: [{ id: 'amount', label: 'Prepayment amount', type: 'number', required: true, placeholder: '0.00' }, { id: 'date', label: 'Effective date', type: 'date', required: true }] };
  return null;
});

function applyTheme(theme) {
  const value = ['system', 'light', 'dark'].includes(theme) ? theme : 'system';
  settingsTheme.value = value;
  const root = document.documentElement;
  if (value === 'system') { delete root.dataset.kfeTheme; root.style.colorScheme = 'light dark'; }
  else { root.dataset.kfeTheme = value; root.style.colorScheme = value; }
}
async function loadSettings() { if (!props.application?.getSettings) return; try { applyTheme((await props.application.getSettings()).theme); } catch { applyTheme('system'); } }
function openApplicationSettings(event) { event?.preventDefault?.(); event?.stopPropagation?.(); settingsOpen.value = true; activeAction.value = ''; settingsMessage.value = ''; settingsError.value = ''; void loadSettings(); }
async function changeTheme(theme) { settingsMessage.value = ''; settingsError.value = ''; try { settingsBusy.value = true; await props.application.setTheme(theme); applyTheme(theme); settingsMessage.value = 'Theme saved.'; } catch (error) { settingsError.value = String(error?.message || error); } finally { settingsBusy.value = false; } }
async function resetErpData() { if (!window.confirm('Reset all KFE ERP data? This permanently removes all locally stored ERP data.')) return; settingsMessage.value = ''; settingsError.value = ''; try { settingsBusy.value = true; await props.application.resetAllData(); window.location.reload(); } catch (error) { settingsError.value = String(error?.message || error); settingsBusy.value = false; } }
function openAction(item) { if (props.module === 'Settings') { if (item === 'Theme') { openApplicationSettings(); return; } if (item === 'Backup') { settingsMessage.value = ''; settingsError.value = ''; return; } if (item === 'Restore') { settingsMessage.value = ''; settingsError.value = ''; return; } if (item === 'Reset ERP Data') { void resetErpData(); return; } return; } if ((ACTIONS[props.module] ?? []).includes(item)) { activeAction.value = item; return; } emit('open', item); }
function closeAction() { activeAction.value = ''; }
function closeSettings() { settingsOpen.value = false; settingsMessage.value = ''; settingsError.value = ''; }
function onSave(value) { emit('save-request', { module: props.module, action: activeAction.value, value }); }
watch(() => props.module, () => { activeAction.value = ''; settingsOpen.value = false; settingsMessage.value = ''; settingsError.value = ''; settingsBusy.value = false; });
onMounted(() => { if (props.module === 'Settings') { settingsOpen.value = true; void loadSettings(); } });
</script>

<template>
  <section class="kfe-module-view" :data-module="module" aria-labelledby="module-title">
    <template v-if="settingsOpen">
      <div class="kfe-module-heading">
        <button class="kfe-secondary-action kfe-back-action" type="button" @click="emit('back')">‹ Admin</button>
        <p class="kfe-eyebrow">System</p>
        <h1 id="application-settings-title">Settings</h1>
        <p class="kfe-destination-subtitle">KFE application preferences, recovery and migration tools.</p>
      </div>
      <section class="kfe-module-section"><h2>APP</h2><div class="kfe-settings-options" role="group" aria-label="Theme selection"><button v-for="theme in ['system', 'light', 'dark']" :key="theme" type="button" :class="{'is-active': settingsTheme === theme}" :disabled="settingsBusy" @click="changeTheme(theme)"><span>{{theme === 'system' ? 'System' : theme === 'light' ? 'Light' : 'Dark'}}</span><span aria-hidden="true">{{settingsTheme === theme ? '✓' : ''}}</span></button></div></section>
      <section class="kfe-module-section"><h2>BACKUP &amp; RESTORE</h2><BackupRestorePanel :application="props.application" /></section>
      <section class="kfe-module-section"><h2>DATA ADMINISTRATION</h2><div class="kfe-module-list"><button type="button" :disabled="settingsBusy" @click="resetErpData"><span>Reset ERP Data</span><span aria-hidden="true">›</span></button></div></section>
      <section class="kfe-module-section"><h2>ABOUT</h2><div class="kfe-module-list"><div class="kfe-detail-card"><strong>KFE 2.0</strong><p>Single-vehicle ERP foundation with clean application, domain and persistence boundaries.</p></div><div class="kfe-detail-card"><strong>Version 2.0.0</strong><p>Current application release.</p></div></div></section>
      <p v-if="settingsMessage" class="kfe-boundary-note" role="status">{{settingsMessage}}</p><p v-if="settingsError" class="kfe-error-note" role="alert">{{settingsError}}</p>
    </template>
    <template v-else>
      <div v-if="!activeAction" class="kfe-module-heading"><button class="kfe-secondary-action kfe-back-action" type="button" @click="emit('back')">‹ Admin</button><p class="kfe-eyebrow">{{ definition.eyebrow }}</p><h1 id="module-title">{{ definition.title }}</h1><p class="kfe-destination-subtitle">{{ definition.subtitle }}</p></div>
      <div v-if="activeAction" class="kfe-action-heading"><button class="kfe-secondary-action kfe-back-action" type="button" @click="closeAction">‹ {{ definition.title }}</button></div>
      <KfeStatePanel v-if="!activeAction" state="normal" title="Ready" message="Module shell is ready for authoritative application-layer wiring." />
      <KfeFormShell v-if="formSpec" :draft-key="`${module}:${activeAction}`" :title="formSpec.title" :subtitle="formSpec.subtitle" @save="onSave"><template #default="{ value }"><KfeFormField v-for="field in formSpec.fields" :key="field.id" v-bind="field" v-model="value[field.id]" /><p class="kfe-form-boundary-note">Save submits to the application boundary. This presentation layer does not create business records or calculate financial results.</p></template></KfeFormShell>
      <div v-if="!activeAction" class="kfe-module-sections"><section v-for="section in definition.sections" :key="section.title" class="kfe-module-section"><h2>{{ section.title }}</h2><div class="kfe-module-list"><button v-for="item in section.items" :key="item" type="button" @click="openAction(item)"><span>{{ item }}</span><span aria-hidden="true">›</span></button></div></section></div>
    </template>
  </section>
</template>

<style scoped>
.kfe-settings-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.kfe-settings-options button{min-height:48px;border:1px solid var(--kfe-ui-border);border-radius:12px;background:var(--kfe-ui-surface);color:var(--kfe-ui-text);padding:10px;font-weight:700}.kfe-settings-options button.is-active{outline:2px solid var(--kfe-ui-accent);outline-offset:1px}.kfe-settings-options button:disabled,.kfe-module-list button:disabled{opacity:.55}.kfe-detail-card{padding:14px;border:1px solid var(--kfe-ui-border);border-radius:14px;background:var(--kfe-ui-surface);display:grid;gap:6px}
</style>
