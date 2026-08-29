<script setup>
import { computed, ref } from 'vue';
import KfeStatePanel from './KfeStatePanel.vue';
import KfeFormShell from './KfeFormShell.vue';
import KfeFormField from './KfeFormField.vue';

const props = defineProps({ module: { type: String, required: true } });
const emit = defineEmits(['open', 'back', 'save-request']);
const activeAction = ref('');

const MODULES = {
  Driver: { eyebrow: 'Vehicle', title: 'Driver', subtitle: 'Driver attached to the current vehicle.', sections: [{ title: 'Driver', items: ['Driver details', 'Vehicle attachment'] }] },
  Fuel: { eyebrow: 'Money', title: 'Fuel', subtitle: 'Record fuel using the established KFE fuel model.', sections: [{ title: 'Fuel', items: ['Add fuel', 'Fuel history'] }] },
  Expenses: { eyebrow: 'Money', title: 'Expenses', subtitle: 'One unified expense model for business expenses.', sections: [{ title: 'Expenses', items: ['Add expense', 'Expense history'] }, { title: 'Quick entry', items: ['Toll', 'Parking'] }] },
  Revenue: { eyebrow: 'Money', title: 'Revenue', subtitle: 'Fast manual end-of-day revenue entry.', sections: [{ title: 'Revenue', items: ['Enter today’s revenue', 'Revenue history'] }] },
  Loans: { eyebrow: 'Money', title: 'Loans', subtitle: 'Current obligations, payments and financial history.', sections: [{ title: 'Loan', items: ['Loan status', 'Payment history', 'Amortization', 'Prepayment calculator'] }] },
  Compliance: { eyebrow: 'Vehicle Operations', title: 'Compliance', subtitle: 'Renewals, validity and historical records.', sections: [{ title: 'Renewals', items: ['Add renewal', 'Current validity', 'Renewal history'] }] },
  Dashboard: { eyebrow: 'Business', title: 'Dashboard', subtitle: 'Actual business performance — what actually happened.', sections: [{ title: 'Actuals', items: ['Revenue', 'Costs', 'Business profitability', 'Operating metrics'] }] },
  Profitability: { eyebrow: 'Business', title: 'Profitability', subtitle: 'Decision-oriented financial interpretation.', sections: [{ title: 'Views', items: ['Actual', 'Projected', 'Target', 'Break-even'] }] },
  Settings: { eyebrow: 'System', title: 'Settings', subtitle: 'KFE system and application preferences.', sections: [{ title: 'System', items: ['Application settings'] }] },
};

const definition = computed(() => MODULES[props.module] ?? { eyebrow: 'KFE 2.0', title: props.module, subtitle: 'KFE module.', sections: [{ title: props.module, items: [] }] });

const ACTIONS = {
  Fuel: ['Add fuel'],
  Expenses: ['Add expense', 'Toll', 'Parking'],
  Revenue: ['Enter today’s revenue'],
  Loans: ['Prepayment calculator'],
  Compliance: ['Add renewal'],
};

const formSpec = computed(() => {
  const action = activeAction.value;
  if (props.module === 'Revenue' && action === 'Enter today’s revenue') return { title: 'Enter today’s revenue', subtitle: 'Manual end-of-day revenue entry.', fields: [{ id: 'amount', label: 'Revenue amount', type: 'number', required: true, placeholder: '0.00' }, { id: 'date', label: 'Date', type: 'date', required: true }] };
  if (props.module === 'Fuel' && action === 'Add fuel') return { title: 'Add fuel', subtitle: 'Capture the authoritative fuel record.', fields: [{ id: 'date', label: 'Date', type: 'date', required: true }, { id: 'odometer', label: 'Odometer', type: 'number', required: true }, { id: 'amount', label: 'Amount', type: 'number', required: true, placeholder: '0.00' }] };
  if (props.module === 'Expenses') return { title: action === 'Add expense' ? 'Add expense' : `Add ${action.toLowerCase()}`, subtitle: 'Use the unified expense model.', fields: [{ id: 'category', label: 'Category', required: true, placeholder: 'Select category' }, { id: 'date', label: 'Date', type: 'date', required: true }, { id: 'amount', label: 'Amount', type: 'number', required: true, placeholder: '0.00' }, { id: 'description', label: 'Description', optional: true, placeholder: 'Optional details' }, { id: 'reference', label: 'Receipt / reference', optional: true, placeholder: 'Optional reference' }] };
  if (props.module === 'Compliance' && action === 'Add renewal') return { title: 'Add renewal', subtitle: 'Record a completed renewal.', fields: [{ id: 'type', label: 'Renewal type', required: true, placeholder: 'Select or enter type' }, { id: 'cost', label: 'Cost', type: 'number', required: true, placeholder: '0.00' }, { id: 'start', label: 'Validity start', type: 'date', required: true }, { id: 'end', label: 'Validity end', type: 'date', required: true }] };
  if (props.module === 'Loans' && action === 'Prepayment calculator') return { title: 'Prepayment calculator', subtitle: 'Zero prepayment charges. Financial calculation remains authoritative outside presentation.', fields: [{ id: 'amount', label: 'Prepayment amount', type: 'number', required: true, placeholder: '0.00' }, { id: 'date', label: 'Effective date', type: 'date', required: true }] };
  return null;
});

function openAction(item) {
  if ((ACTIONS[props.module] ?? []).includes(item)) {
    activeAction.value = item;
    return;
  }
  emit('open', item);
}

function closeAction() { activeAction.value = ''; }
function onSave(value) { emit('save-request', { module: props.module, action: activeAction.value, value }); }
</script>

<template>
  <section class="kfe-module-view" :data-module="module" aria-labelledby="module-title">
    <div v-if="!activeAction" class="kfe-module-heading">
      <button class="kfe-secondary-action kfe-back-action" type="button" @click="emit('back')">‹ More</button>
      <p class="kfe-eyebrow">{{ definition.eyebrow }}</p>
      <h1 id="module-title">{{ definition.title }}</h1>
      <p class="kfe-destination-subtitle">{{ definition.subtitle }}</p>
    </div>

    <div v-if="activeAction && formSpec" class="kfe-action-heading">
      <button class="kfe-secondary-action kfe-back-action" type="button" @click="closeAction">‹ {{ definition.title }}</button>
    </div>

    <KfeStatePanel v-if="!activeAction" state="normal" title="Ready" message="Module shell is ready for authoritative application-layer wiring." />

    <KfeFormShell v-if="formSpec" :draft-key="`${module}:${activeAction}`" :title="formSpec.title" :subtitle="formSpec.subtitle" @save="onSave">
      <template #default="{ value }">
        <KfeFormField v-for="field in formSpec.fields" :key="field.id" v-bind="field" v-model="value[field.id]" />
        <p class="kfe-form-boundary-note">Save submits to the application boundary. This presentation layer does not create business records or calculate financial results.</p>
      </template>
    </KfeFormShell>

    <div v-if="!activeAction" class="kfe-module-sections">
      <section v-for="section in definition.sections" :key="section.title" class="kfe-module-section">
        <h2>{{ section.title }}</h2>
        <div class="kfe-module-list">
          <button v-for="item in section.items" :key="item" type="button" @click="openAction(item)">
            <span>{{ item }}</span><span aria-hidden="true">›</span>
          </button>
        </div>
      </section>
    </div>
  </section>
</template>
