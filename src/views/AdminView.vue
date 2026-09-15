<script setup>
import { ref } from 'vue'

const activeSection = ref(null)

const sections = [
  {
    key: 'operations',
    icon: '🛠️',
    title: 'Operations',
    description: 'Vehicle, driver, compliance, maintenance and Driver Cockpit records.',
    groups: [
      {
        title: 'Vehicle',
        items: ['Vehicle details', 'Registration number', 'Make / model / variant', 'Fuel type', 'Acquisition date', 'Acquisition cost/value', 'Buy price', 'Opening odometer', 'Vehicle status', 'Status date', 'Expiry date', 'Sell price', 'Sale date']
      },
      {
        title: 'Driver',
        items: ['Driver details', 'Driver identity/contact information', 'Driver status', 'Vehicle assignment']
      },
      {
        title: 'Compliance',
        items: ['Compliance item name', 'Validity dates', 'Amount']
      },
      {
        title: 'Maintenance',
        items: ['Maintenance date', 'Odometer', 'Maintenance type/category', 'Validity type', 'KM based', 'Duration based', 'Validity value', 'Amount', 'Catalog', 'Next service information', 'Next service KM', 'Next service date']
      },
      {
        title: 'Driver-collected Data',
        items: ['Shifts', 'Shift start', 'Shift end', 'Opening odometer', 'Closing odometer', 'Rides', 'Operator', 'Ride start/end', 'Ride KM', 'Ride revenue', 'Ride status/lifecycle', 'Cancelled rides', 'Cancellation reason', 'Cancellation revenue, where applicable', 'Personal KM', 'Dead KM allocation/source records', 'Fuel', 'Fuel odometer', 'Fuel amount', 'Fuel price/kg', 'Fuel type', 'Business toll', 'Business parking', 'Personal toll', 'Personal parking', 'Toll/parking business/personal treatment', 'Other Driver Cockpit records']
      }
    ]
  },
  {
    key: 'finance',
    icon: '💰',
    title: 'Finance',
    description: 'Loan setup, payments, delayed payments, adjustments and prepayments.',
    groups: [
      {
        title: 'Loan',
        items: ['Loan entry', 'Principal', 'Interest rate', 'Tenure', 'Loan start date', 'Loan status', 'EMI — automatic calculation']
      },
      {
        title: 'Loan Payments',
        items: ['EMI number', 'Due date', 'Scheduled EMI amount', 'Actual payment date', 'Actual amount paid', 'Payment status', 'Delayed payment amount/charges', 'Loan-related adjustments/records']
      },
      {
        title: 'Prepayments',
        items: ['Prepayment date', 'Prepayment amount', 'Outstanding principal before prepayment', 'Outstanding principal after prepayment', 'Effect on loan schedule', 'Prepayment status', 'Notes/reference']
      }
    ]
  },
  {
    key: 'target',
    icon: '🎯',
    title: 'Target & Break-even',
    description: 'Driver targets and ERP-controlled break-even inputs using authoritative records.',
    groups: [
      {
        title: 'Driver Target',
        items: ['Driver', 'Target value']
      },
      {
        title: 'Break-even Inputs',
        items: ['Maintenance cost rate', 'Fuel cost', 'Loan obligation', 'Compliance/renewal provision', 'Business toll', 'Business parking', 'Other applicable business costs']
      }
    ],
    note: 'No separate duplicate entry forms are created where an authoritative source record already exists.'
  },
  {
    key: 'settings',
    icon: '⚙️',
    title: 'Settings',
    description: 'Backup, restore, themes and controlled testing tools.',
    groups: [
      {
        title: 'Backup & Restore',
        items: ['Local backup', 'Local restore', 'Backup status', 'Last backup information', 'Cloud backup & restore', 'Automatic cloud backup settings', 'Last successful backup']
      },
      {
        title: 'Themes',
        items: ['Theme selection']
      },
      {
        title: 'Temporary',
        items: ['Data Reset — testing only']
      }
    ]
  }
]

const derived = [
  'Vehicle KM', 'Business KM', 'Dead KM', 'Mileage', 'Fuel efficiency',
  'Revenue/KM', 'Revenue/hour', 'Cost/KM', 'Profit', 'Break-even result',
  'Achievement', 'Pace', 'Projection', 'Provision totals'
]
</script>

<template>
  <section class="admin-page" aria-label="Admin">
    <header class="admin-header">
      <small>ADMIN</small>
      <h1>Control &amp; Records</h1>
      <p>Entry, edit and delete area for KFE source records. ERP rules remain authoritative.</p>
    </header>

    <div class="section-grid">
      <button
        v-for="section in sections"
        :key="section.key"
        class="section-card"
        :class="{ selected: activeSection === section.key }"
        type="button"
        @click="activeSection = activeSection === section.key ? null : section.key"
      >
        <span class="section-icon">{{ section.icon }}</span>
        <span class="section-copy">
          <strong>{{ section.title }}</strong>
          <span>{{ section.description }}</span>
        </span>
        <span class="chevron">{{ activeSection === section.key ? '⌄' : '›' }}</span>
      </button>
    </div>

    <section v-if="activeSection" class="detail-panel" :aria-label="`${sections.find(s => s.key === activeSection)?.title} details`">
      <template v-for="section in sections.filter(s => s.key === activeSection)" :key="section.key">
        <div class="detail-heading">
          <span class="detail-icon">{{ section.icon }}</span>
          <div>
            <small>ADMIN AREA</small>
            <h2>{{ section.title }}</h2>
          </div>
        </div>

        <div class="group-list">
          <article v-for="group in section.groups" :key="group.title" class="record-group">
            <h3>{{ group.title }}</h3>
            <div class="field-list">
              <div v-for="item in group.items" :key="item" class="field-row">
                <span>{{ item }}</span>
                <span class="field-action">Manage ›</span>
              </div>
            </div>
          </article>
        </div>

        <p v-if="section.note" class="info-note">{{ section.note }}</p>
      </template>
    </section>

    <section class="derived-panel">
      <div>
        <small>ERP CALCULATIONS</small>
        <h2>Derived automatically</h2>
        <p>These are never separate Admin entry forms. They are reconstructed after source-record changes.</p>
      </div>
      <div class="derived-list">
        <span v-for="item in derived" :key="item">{{ item }}</span>
      </div>
    </section>

    <aside class="admin-safety">
      <span>🛡️</span>
      <div>
        <strong>ERP-controlled changes</strong>
        <p>Admin actions go through application and domain validation. Conflicts or consequential changes are flagged before saving; permitted overrides remain auditable.</p>
      </div>
    </aside>
  </section>
</template>

<style scoped>
.admin-page{min-height:100%;box-sizing:border-box;padding:20px 16px 28px;background:#f8fafc;color:#0f172a}.admin-header{margin-bottom:18px}.admin-header small,.detail-heading small,.derived-panel small{font-size:.68rem;font-weight:900;letter-spacing:.12em;color:#64748b}.admin-header h1{margin:3px 0 5px;font-size:1.45rem}.admin-header p{margin:0;color:#64748b;font-size:.82rem;line-height:1.4}.section-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.section-card{min-height:150px;text-align:left;border:1px solid #e2e8f0;border-radius:16px;background:#fff;padding:18px;display:flex;flex-direction:column;gap:12px;box-shadow:0 1px 3px rgba(15,23,42,.06);cursor:pointer;color:inherit}.section-card.selected{border-color:#94a3b8}.section-icon{font-size:1.7rem}.section-copy{display:flex;flex-direction:column;gap:6px;flex:1}.section-copy strong{font-size:1rem}.section-copy span{font-size:.76rem;line-height:1.35;color:#64748b}.chevron{font-size:1.45rem;color:#94a3b8;line-height:1;align-self:flex-end}.detail-panel,.derived-panel{margin-top:16px;border:1px solid #e2e8f0;border-radius:16px;background:#fff;padding:16px}.detail-heading{display:flex;align-items:center;gap:11px;padding-bottom:14px;border-bottom:1px solid #e2e8f0}.detail-icon{font-size:1.55rem}.detail-heading h2,.derived-panel h2{margin:3px 0 0;font-size:1.1rem}.group-list{display:flex;flex-direction:column;gap:14px;padding-top:14px}.record-group{border:1px solid #e2e8f0;border-radius:12px;overflow:hidden}.record-group h3{margin:0;padding:11px 12px;background:#f8fafc;font-size:.86rem}.field-list{display:flex;flex-direction:column}.field-row{display:flex;justify-content:space-between;gap:12px;padding:10px 12px;border-top:1px solid #f1f5f9;font-size:.78rem}.field-action{color:#64748b;white-space:nowrap}.info-note{margin:14px 0 0;padding:11px 12px;border-radius:10px;background:#f8fafc;color:#64748b;font-size:.72rem;line-height:1.4}.derived-panel{display:flex;flex-direction:column;gap:12px}.derived-panel p{margin:4px 0 0;color:#64748b;font-size:.72rem;line-height:1.4}.derived-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.derived-list span{padding:8px 9px;border-radius:8px;background:#f8fafc;color:#475569;font-size:.7rem}.admin-safety{display:flex;gap:11px;align-items:flex-start;margin-top:16px;padding:13px 14px;border:1px solid #cbd5e1;border-radius:12px;background:#fff}.admin-safety strong{font-size:.78rem}.admin-safety p{margin:3px 0 0;color:#64748b;font-size:.7rem;line-height:1.4}@media(max-width:640px){.section-card{min-height:140px;padding:15px}.admin-page{padding-left:12px;padding-right:12px}.derived-list{grid-template-columns:1fr}}
</style>
