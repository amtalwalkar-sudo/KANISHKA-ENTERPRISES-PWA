<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import KfeFormShell from './KfeFormShell.vue';
import KfeFormField from './KfeFormField.vue';

const props = defineProps({ module: { type: String, required: true }, application: { type: Object, required: true } });
const emit = defineEmits(['open', 'back', 'save-request', 'reset-request']);
const activeAction = ref('');
const records = ref([]);
const loading = ref(false);
const error = ref('');
const savedMessage = ref('');

const definition = computed(() => props.module === 'Revenue'
  ? { eyebrow: 'Business Operations', title: 'Revenue', subtitle: 'Record and review authoritative business revenue.' }
  : { eyebrow: 'Business Operations', title: 'Expenses', subtitle: 'Record and review authoritative business expenses.' });

const formSpec = computed(() => props.module === 'Revenue'
  ? { title: 'Record revenue', subtitle: 'Business revenue is persisted through the application boundary.', fields: [
      { id: 'amount', label: 'Revenue amount', type: 'number', required: true, placeholder: '0.00' },
      { id: 'date', label: 'Business date', type: 'date', required: true },
    ] }
  : { title: 'Record expense', subtitle: 'Business expense is persisted through the application boundary.', fields: [
      { id: 'category', label: 'Category', required: true, placeholder: 'Fuel, toll, parking, other…' },
      { id: 'date', label: 'Business date', type: 'date', required: true },
      { id: 'amount', label: 'Amount', type: 'number', required: true, placeholder: '0.00' },
      { id: 'description', label: 'Description', optional: true, placeholder: 'Optional details' },
      { id: 'reference', label: 'Receipt / reference', optional: true, placeholder: 'Optional reference' },
    ] });

const money = value => value == null ? '—' : `₹${Number(value).toFixed(2)}`;
const recent = computed(() => records.value.slice(-12).reverse());
const total = computed(() => records.value.reduce((sum, row) => sum + (Number(row.amount) || 0), 0));

async function load() {
  loading.value = true; error.value = '';
  try {
    const model = await props.application.getTimeline('Long-term');
    const wanted = props.module === 'Revenue' ? 'Revenue' : 'Expense';
    records.value = (model?.events || []).filter(event => event.entityType === wanted || event.type === wanted);
  } catch (e) { error.value = String(e?.message || e); records.value = []; }
  finally { loading.value = false; }
}
function openRecordForm() { activeAction.value = props.module; savedMessage.value = ''; error.value = ''; }
function closeAction() { activeAction.value = ''; }
async function save(value) {
  error.value = ''; savedMessage.value = '';
  try {
    if (props.module === 'Revenue') {
      await props.application.recordRevenue({ amount_paise: Math.round(Number(value.amount) * 100), business_date: value.date, recorded_at: new Date().toISOString(), scope: 'BUSINESS' });
    } else {
      await props.application.recordExpense(value);
    }
    activeAction.value = '';
    savedMessage.value = `${props.module} record saved.`;
    await load();
  } catch (e) { error.value = String(e?.message || e); }
}
watch(() => props.module, () => { activeAction.value = ''; savedMessage.value = ''; void load(); });
onMounted(load);
</script>

<template>
  <section v-if="module==='Settings'" class="kfe-module-view" data-module="Settings" aria-labelledby="settings-title">
    <div class="kfe-module-heading">
      <button class="kfe-secondary-action kfe-back-action" type="button" @click="emit('back')">‹ Admin</button>
      <p class="kfe-eyebrow">SYSTEM</p>
      <h1 id="settings-title">Settings</h1>
      <p class="kfe-destination-subtitle">KFE 2.0 operational settings and local data controls.</p>
    </div>
    <section class="kfe-module-section" aria-label="Theme settings"><h2>THEME</h2><article class="kfe-detail-card"><strong>Theme</strong><p>Day · Night · Dusk</p></article></section>
    <section class="kfe-module-section" aria-label="Backup and restore"><h2>DATA</h2><article class="kfe-detail-card"><strong>Backup</strong><p>Local backup and restore</p><strong>Restore</strong><p>Restore a local KFE snapshot</p><strong>Reset ERP Data</strong><p>Reset ERP data from the existing application boundary</p></article></section>
    <section class="kfe-module-section" aria-label="About KFE"><h2>ABOUT</h2><article class="kfe-detail-card"><strong>KFE 2.0</strong><p>Version 2.0.0</p></article></section>
  </section>

  <section v-else class="kfe-module-view" :data-module="module" :aria-labelledby="`${module}-title`">
    <template v-if="activeAction">
      <div class="kfe-module-heading"><button class="kfe-secondary-action kfe-back-action" type="button" @click="closeAction">‹ {{ definition.title }}</button><p class="kfe-eyebrow">{{ definition.eyebrow }}</p><h1>{{ formSpec.title }}</h1><p class="kfe-destination-subtitle">{{ formSpec.subtitle }}</p></div>
      <KfeFormShell :draft-key="`erp:${module}`" :title="formSpec.title" :subtitle="formSpec.subtitle" @save="save"><template #default="{ value }"><KfeFormField v-for="field in formSpec.fields" :key="field.id" v-bind="field" v-model="value[field.id]" /><p class="kfe-form-boundary-note">Business scope is fixed. Financial calculations remain in the domain/application layer.</p></template></KfeFormShell>
      <p v-if="error" class="kfe-error-note" role="alert">{{ error }}</p>
    </template>
    <template v-else>
      <div class="kfe-module-heading"><button class="kfe-secondary-action kfe-back-action" type="button" @click="emit('back')">‹ Admin</button><p class="kfe-eyebrow">{{ definition.eyebrow }}</p><h1 :id="`${module}-title`">{{ definition.title }}</h1><p class="kfe-destination-subtitle">{{ definition.subtitle }}</p></div>
      <section class="kfe-summary-grid" aria-label="Module summary"><article><span>Records</span><strong>{{ records.length }}</strong></article><article><span>Total</span><strong>{{ money(total) }}</strong></article></section>
      <button class="kfe-primary-action" type="button" @click="openRecordForm">{{ module === 'Revenue' ? 'Record Revenue' : 'Record Expense' }}</button>
      <p v-if="savedMessage" class="kfe-boundary-note" role="status">{{ savedMessage }}</p><p v-if="error" class="kfe-error-note" role="alert">{{ error }}</p>
      <section class="kfe-module-section"><div class="kfe-section-heading"><h2>RECENT RECORDS</h2><span v-if="loading">Loading…</span></div><div v-if="recent.length" class="kfe-record-list"><article v-for="row in recent" :key="row.id || `${row.occurredAt}-${row.amount}`" class="kfe-record-card"><div><strong>{{ row.description || (module === 'Revenue' ? 'Business revenue' : 'Business expense') }}</strong><span>{{ row.occurredAt ? new Date(row.occurredAt).toLocaleDateString() : '—' }}</span></div><strong>{{ money(row.amount) }}</strong></article></div><p v-else-if="!loading" class="kfe-boundary-note">No {{ module.toLowerCase() }} records have been entered yet.</p></section>
    </template>
  </section>
</template>

<style scoped>
.kfe-module-view{padding:16px 0 32px;display:grid;gap:16px}.kfe-module-heading{display:grid;gap:6px}.kfe-summary-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.kfe-summary-grid article,.kfe-detail-card{padding:16px;border:1px solid var(--kfe-ui-border);border-radius:15px;background:var(--kfe-ui-surface);display:grid;gap:6px}.kfe-summary-grid span,.kfe-record-card span,.kfe-detail-card p{font-size:.74rem;color:var(--kfe-muted-text)}.kfe-summary-grid strong{font-size:1.15rem}.kfe-section-heading{display:flex;justify-content:space-between;align-items:center}.kfe-section-heading h2{margin:0}.kfe-section-heading span{font-size:.72rem;color:var(--kfe-muted-text)}.kfe-record-list{display:grid;gap:8px}.kfe-record-card{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:13px 14px;border:1px solid var(--kfe-ui-border);border-radius:14px;background:var(--kfe-ui-surface)}.kfe-record-card div{display:grid;gap:4px;min-width:0}.kfe-record-card div strong{overflow:hidden;text-overflow:ellipsis}.kfe-record-card>strong{white-space:nowrap}@media(min-width:650px){.kfe-summary-grid{grid-template-columns:repeat(2,minmax(180px,260px))}}
</style>
