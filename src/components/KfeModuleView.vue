<script setup>
import { computed } from 'vue';

const props = defineProps({ module: { type: String, required: true } });
defineEmits(['open']);

const MODULES = {
  Vehicle: { eyebrow: 'Vehicle', title: 'Vehicle', subtitle: 'Central business asset and lifecycle context.', sections: [{ title: 'Vehicle', items: ['Vehicle details', 'Lifecycle', 'Driver'] }, { title: 'History', items: ['Relevant timeline events'] }] },
  Driver: { eyebrow: 'Vehicle', title: 'Driver', subtitle: 'Driver attached to the current vehicle.', sections: [{ title: 'Driver', items: ['Driver details', 'Vehicle attachment'] }] },
  Fuel: { eyebrow: 'Money', title: 'Fuel', subtitle: 'Record fuel with the established KFE fuel model.', sections: [{ title: 'Fuel', items: ['Add fuel', 'Fuel history'] }] },
  Expenses: { eyebrow: 'Money', title: 'Expenses', subtitle: 'One unified expense model for business expenses.', sections: [{ title: 'Expenses', items: ['Add expense', 'Expense history'] }] },
  Revenue: { eyebrow: 'Money', title: 'Revenue', subtitle: 'Fast manual end-of-day revenue entry.', sections: [{ title: 'Revenue', items: ['Enter today’s revenue', 'Revenue history'] }] },
  Loans: { eyebrow: 'Money', title: 'Loans', subtitle: 'Current obligations, payments and financial history.', sections: [{ title: 'Loan', items: ['Loan status', 'Payment history', 'Amortization', 'Prepayment calculator'] }] },
  Maintenance: { eyebrow: 'Vehicle Operations', title: 'Maintenance', subtitle: 'Record vehicle work, cost and odometer context.', sections: [{ title: 'Maintenance', items: ['Add maintenance', 'Maintenance history', 'Category catalogue'] }] },
  Compliance: { eyebrow: 'Vehicle Operations', title: 'Compliance', subtitle: 'Renewals, validity and historical records.', sections: [{ title: 'Renewals', items: ['Add renewal', 'Current validity', 'Renewal history'] }] },
  Dashboard: { eyebrow: 'Business', title: 'Dashboard', subtitle: 'Actual business performance — what actually happened.', sections: [{ title: 'Actuals', items: ['Revenue', 'Costs', 'Business profitability', 'Operating metrics'] }] },
  Profitability: { eyebrow: 'Business', title: 'Profitability', subtitle: 'Decision-oriented financial interpretation.', sections: [{ title: 'Views', items: ['Actual', 'Projected', 'Target', 'Break-even'] }] },
  Settings: { eyebrow: 'System', title: 'Settings', subtitle: 'KFE system and application preferences.', sections: [{ title: 'System', items: ['Application settings'] }] },
};

const definition = computed(() => MODULES[props.module] ?? { eyebrow: 'KFE 2.0', title: props.module, subtitle: 'KFE module.', sections: [{ title: props.module, items: [] }] });
</script>

<template>
  <section class="kfe-module-view" :data-module="module" aria-labelledby="module-title">
    <div class="kfe-module-heading">
      <p class="kfe-eyebrow">{{ definition.eyebrow }}</p>
      <h1 id="module-title">{{ definition.title }}</h1>
      <p class="kfe-destination-subtitle">{{ definition.subtitle }}</p>
    </div>
    <div class="kfe-module-sections">
      <section v-for="section in definition.sections" :key="section.title" class="kfe-module-section">
        <h2>{{ section.title }}</h2>
        <div class="kfe-module-list">
          <button v-for="item in section.items" :key="item" type="button" @click="$emit('open', item)">
            <span>{{ item }}</span><span aria-hidden="true">›</span>
          </button>
        </div>
      </section>
    </div>
  </section>
</template>
