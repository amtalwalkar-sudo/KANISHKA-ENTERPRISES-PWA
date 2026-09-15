<template>
  <main class="admin" aria-label="Admin">
    <header class="admin-header">
      <small>ADMIN</small>
      <h1>Operations</h1>
      <p>Source-data management for ERP records. Calculated values remain controlled by KFE.</p>
    </header>

    <section class="form-card" aria-labelledby="maintenance-title">
      <div class="section-heading">
        <div>
          <small>MAINTENANCE</small>
          <h2 id="maintenance-title">Maintenance record</h2>
        </div>
        <span class="source-badge">Source data</span>
      </div>

      <div class="form-grid">
        <label><span>Maintenance date</span><input type="date" name="maintenanceDate" /></label>
        <label><span>Odometer</span><input type="number" name="maintenanceOdometer" min="0" inputmode="numeric" /></label>
        <label><span>Maintenance type / category</span><input type="text" name="maintenanceType" /></label>
        <label><span>Amount</span><input type="number" name="maintenanceAmount" min="0" step="0.01" inputmode="decimal" /></label>
        <label>
          <span>Payment status</span>
          <select name="maintenancePaymentStatus"><option value="">Select</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option></select>
        </label>
        <label><span>Payment date</span><input type="date" name="maintenancePaymentDate" /></label>
        <label><span>Amount paid</span><input type="number" name="maintenanceAmountPaid" min="0" step="0.01" inputmode="decimal" /></label>
        <label>
          <span>Validity type</span>
          <select name="maintenanceValidityType"><option value="">Select</option><option value="km">KM based</option><option value="duration">Duration based</option></select>
        </label>
        <label><span>Validity value</span><input type="number" name="maintenanceValidityValue" min="0" step="0.01" inputmode="decimal" /></label>
        <label><span>Next service KM</span><input type="number" name="nextServiceKm" min="0" inputmode="numeric" /></label>
        <label><span>Next service date</span><input type="date" name="nextServiceDate" /></label>
        <label><span>Catalog / parts / labour reference</span><input type="text" name="maintenanceCatalogReference" /></label>
        <label class="full-width"><span>Notes / reference</span><textarea name="maintenanceNotes" rows="3"></textarea></label>
      </div>
    </section>

    <section class="form-card" aria-labelledby="compliance-title">
      <div class="section-heading">
        <div>
          <small>COMPLIANCE</small>
          <h2 id="compliance-title">Compliance record</h2>
        </div>
        <span class="source-badge">Source data</span>
      </div>

      <div class="form-grid">
        <label class="full-width"><span>Compliance item name</span><input type="text" name="complianceItemName" placeholder="Enter compliance item name" /></label>
        <label><span>Valid from</span><input type="date" name="complianceValidFrom" /></label>
        <label><span>Expiry date</span><input type="date" name="complianceExpiryDate" /></label>
        <label><span>Amount</span><input type="number" name="complianceAmount" min="0" step="0.01" inputmode="decimal" /></label>
        <label>
          <span>Payment status</span>
          <select name="compliancePaymentStatus"><option value="">Select</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option></select>
        </label>
        <label><span>Payment date</span><input type="date" name="compliancePaymentDate" /></label>
        <label><span>Amount paid</span><input type="number" name="complianceAmountPaid" min="0" step="0.01" inputmode="decimal" /></label>
        <label><span>Record date</span><input type="date" name="complianceRecordDate" /></label>
        <label>
          <span>Status</span>
          <select name="complianceStatus"><option value="">Select</option><option value="active">Active</option><option value="expired">Expired</option><option value="cancelled">Cancelled</option></select>
        </label>
        <label><span>Reference / document number</span><input type="text" name="complianceReference" /></label>
        <label><span>Reminder information</span><input type="text" name="complianceReminder" placeholder="Optional reminder note" /></label>
      </div>
    </section>
  </main>
</template>

<style scoped>
.admin { padding: 20px 16px 120px; max-width: 960px; margin: 0 auto; }
.admin-header { margin-bottom: 20px; }
.admin-header small, .section-heading small { font-size: 11px; letter-spacing: 0.12em; font-weight: 700; }
.admin-header h1, .section-heading h2 { margin: 4px 0; }
.admin-header p { margin: 8px 0 0; opacity: 0.72; }
.form-card { border: 1px solid rgba(127,127,127,0.25); border-radius: 18px; padding: 18px; margin-bottom: 16px; }
.section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
.source-badge { border: 1px solid rgba(127,127,127,0.3); border-radius: 999px; padding: 5px 9px; font-size: 11px; white-space: nowrap; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 14px; }
label { display: grid; gap: 6px; min-width: 0; }
label > span { font-size: 13px; font-weight: 600; }
input, select, textarea { width: 100%; box-sizing: border-box; border: 1px solid rgba(127,127,127,0.35); border-radius: 10px; padding: 10px 11px; font: inherit; background: transparent; }
textarea { resize: vertical; }
.full-width { grid-column: 1 / -1; }
@media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } .full-width { grid-column: auto; } }
</style>
