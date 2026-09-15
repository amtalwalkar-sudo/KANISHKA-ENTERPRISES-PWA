<template>
  <main class="admin" aria-label="Admin">
    <header class="admin-header">
      <small>ADMIN</small>
      <h1>Administration</h1>
      <p>Source-data management for ERP records. KFE controls validation and calculated values.</p>
    </header>

    <section class="category" aria-labelledby="operations-title">
      <div class="category-heading"><small>OPERATIONS</small><h2 id="operations-title">Operations</h2></div>

      <section class="form-card" aria-labelledby="vehicle-title">
        <div class="section-heading"><div><small>VEHICLE</small><h3 id="vehicle-title">Vehicle</h3></div><span class="source-badge">Source data</span></div>
        <div class="form-grid">
          <label><span>Registration number</span><input type="text" name="vehicleRegistrationNumber" /></label>
          <label><span>Make</span><input type="text" name="vehicleMake" /></label>
          <label><span>Model</span><input type="text" name="vehicleModel" /></label>
          <label><span>Variant</span><input type="text" name="vehicleVariant" /></label>
          <label><span>Fuel type</span><input type="text" name="vehicleFuelType" /></label>
          <label><span>Acquisition date</span><input type="date" name="vehicleAcquisitionDate" /></label>
          <label><span>Acquisition cost / value</span><input type="number" name="vehicleAcquisitionCost" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Buy price</span><input type="number" name="vehicleBuyPrice" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Vehicle status</span><input type="text" name="vehicleStatus" /></label>
          <label><span>Status date</span><input type="date" name="vehicleStatusDate" /></label>
          <label><span>Sale date</span><input type="date" name="vehicleSaleDate" /></label>
          <label><span>Sell price</span><input type="number" name="vehicleSellPrice" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Expiry date where applicable</span><input type="date" name="vehicleExpiryDate" /></label>
          <label><span>Current odometer</span><input type="number" name="vehicleCurrentOdometer" min="0" inputmode="numeric" /></label>
          <label><span>Lifecycle event</span><input type="text" name="vehicleLifecycleEvent" /></label>
          <label><span>Lifecycle event date</span><input type="date" name="vehicleLifecycleEventDate" /></label>
          <label class="full-width"><span>Lifecycle event details / reference</span><textarea name="vehicleLifecycleEventDetails" rows="3"></textarea></label>
        </div>
      </section>

      <section class="form-card" aria-labelledby="driver-title">
        <div class="section-heading"><div><small>DRIVER</small><h3 id="driver-title">Driver</h3></div><span class="source-badge">Source data</span></div>
        <div class="form-grid">
          <label><span>Driver name</span><input type="text" name="driverName" /></label>
          <label><span>Driver identity details</span><input type="text" name="driverIdentity" /></label>
          <label><span>Contact number</span><input type="tel" name="driverContact" inputmode="tel" /></label>
          <label><span>Other contact information</span><input type="text" name="driverOtherContact" /></label>
          <label><span>Driver status</span><input type="text" name="driverStatus" /></label>
          <label><span>Vehicle assignment</span><input type="text" name="driverVehicleAssignment" /></label>
          <label><span>Assignment date</span><input type="date" name="driverAssignmentDate" /></label>
          <label><span>Assignment end date where applicable</span><input type="date" name="driverAssignmentEndDate" /></label>
        </div>
      </section>

      <section class="form-card" aria-labelledby="compliance-title">
        <div class="section-heading"><div><small>COMPLIANCE</small><h3 id="compliance-title">Compliance</h3></div><span class="source-badge">Source data</span></div>
        <div class="form-grid">
          <label class="full-width"><span>Compliance item name</span><input type="text" name="complianceItemName" placeholder="Enter compliance item name" /></label>
          <label><span>Valid from</span><input type="date" name="complianceValidFrom" /></label>
          <label><span>Expiry date</span><input type="date" name="complianceExpiryDate" /></label>
          <label><span>Amount</span><input type="number" name="complianceAmount" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Payment status</span><select name="compliancePaymentStatus"><option value="">Select</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option></select></label>
          <label><span>Payment date</span><input type="date" name="compliancePaymentDate" /></label>
          <label><span>Amount paid</span><input type="number" name="complianceAmountPaid" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Record date</span><input type="date" name="complianceRecordDate" /></label>
          <label><span>Status</span><select name="complianceStatus"><option value="">Select</option><option value="active">Active</option><option value="expired">Expired</option><option value="cancelled">Cancelled</option></select></label>
          <label><span>Reference / document number</span><input type="text" name="complianceReference" /></label>
          <label><span>Reminder information</span><input type="text" name="complianceReminder" placeholder="Optional reminder note" /></label>
        </div>
      </section>

      <section class="form-card" aria-labelledby="maintenance-title">
        <div class="section-heading"><div><small>MAINTENANCE</small><h3 id="maintenance-title">Maintenance</h3></div><span class="source-badge">Source data</span></div>
        <div class="form-grid">
          <label><span>Maintenance date</span><input type="date" name="maintenanceDate" /></label>
          <label><span>Odometer</span><input type="number" name="maintenanceOdometer" min="0" inputmode="numeric" /></label>
          <label><span>Maintenance type / category</span><input type="text" name="maintenanceType" /></label>
          <label><span>Amount</span><input type="number" name="maintenanceAmount" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Payment status</span><select name="maintenancePaymentStatus"><option value="">Select</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option></select></label>
          <label><span>Payment date</span><input type="date" name="maintenancePaymentDate" /></label>
          <label><span>Amount paid</span><input type="number" name="maintenanceAmountPaid" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Validity type</span><select name="maintenanceValidityType"><option value="">Select</option><option value="km">KM based</option><option value="duration">Duration based</option></select></label>
          <label><span>Validity value</span><input type="number" name="maintenanceValidityValue" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Next service KM</span><input type="number" name="nextServiceKm" min="0" inputmode="numeric" /></label>
          <label><span>Next service date</span><input type="date" name="nextServiceDate" /></label>
          <label><span>Catalog / parts / labour reference</span><input type="text" name="maintenanceCatalogReference" /></label>
          <label class="full-width"><span>Notes / reference</span><textarea name="maintenanceNotes" rows="3"></textarea></label>
        </div>
      </section>

      <section class="form-card" aria-labelledby="shift-title">
        <div class="section-heading"><div><small>SHIFT</small><h3 id="shift-title">Shift</h3></div><span class="source-badge">Source data</span></div>
        <div class="form-grid">
          <label><span>Shift date</span><input type="date" name="shiftDate" /></label>
          <label><span>Shift status</span><input type="text" name="shiftStatus" /></label>
          <label><span>Shift start</span><input type="datetime-local" name="shiftStart" /></label>
          <label><span>Shift end</span><input type="datetime-local" name="shiftEnd" /></label>
          <label><span>Opening odometer</span><input type="number" name="openingOdometer" min="0" inputmode="numeric" /></label>
          <label><span>Closing odometer</span><input type="number" name="closingOdometer" min="0" inputmode="numeric" /></label>
          <label><span>Personal KM</span><input type="number" name="personalKm" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Dead KM allocation / source</span><input type="text" name="deadKmSource" /></label>
          <label><span>Business toll</span><input type="number" name="businessToll" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Business parking</span><input type="number" name="businessParking" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Personal toll</span><input type="number" name="personalToll" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Personal parking</span><input type="number" name="personalParking" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Correction reason</span><input type="text" name="shiftCorrectionReason" /></label>
          <label><span>Correction reference</span><input type="text" name="shiftCorrectionReference" /></label>
        </div>
      </section>

      <section class="form-card" aria-labelledby="ride-title">
        <div class="section-heading"><div><small>RIDE / TRIP</small><h3 id="ride-title">Ride / Trip</h3></div><span class="source-badge">Source data</span></div>
        <div class="form-grid">
          <label><span>Shift reference</span><input type="text" name="tripShiftReference" /></label>
          <label><span>Operator</span><input type="text" name="tripOperator" /></label>
          <label><span>Trip type</span><input type="text" name="tripType" /></label>
          <label><span>Ride status</span><input type="text" name="tripStatus" /></label>
          <label><span>Ride start</span><input type="datetime-local" name="tripStart" /></label>
          <label><span>Ride end</span><input type="datetime-local" name="tripEnd" /></label>
          <label><span>Ride KM</span><input type="number" name="tripKm" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Ride revenue</span><input type="number" name="tripRevenue" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Cancellation status</span><input type="text" name="tripCancellationStatus" /></label>
          <label><span>Cancellation reason</span><input type="text" name="tripCancellationReason" /></label>
          <label><span>Cancellation revenue where applicable</span><input type="number" name="tripCancellationRevenue" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Pickup</span><input type="text" name="tripPickup" /></label>
          <label><span>Drop</span><input type="text" name="tripDrop" /></label>
          <label><span>Missed-trip / reconciliation status</span><input type="text" name="tripReconciliationStatus" /></label>
          <label><span>Correction reason</span><input type="text" name="tripCorrectionReason" /></label>
          <label><span>Correction reference</span><input type="text" name="tripCorrectionReference" /></label>
        </div>
      </section>

      <section class="form-card" aria-labelledby="fuel-title">
        <div class="section-heading"><div><small>FUEL / REFUELLING</small><h3 id="fuel-title">Fuel / Refuelling</h3></div><span class="source-badge">Source data</span></div>
        <div class="form-grid">
          <label><span>Fuel type</span><input type="text" name="fuelType" /></label>
          <label><span>Fuel odometer</span><input type="number" name="fuelOdometer" min="0" inputmode="numeric" /></label>
          <label><span>Price per kg</span><input type="number" name="fuelPricePerKg" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Amount</span><input type="number" name="fuelAmount" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Full / partial refuelling</span><select name="fuelFillType"><option value="">Select</option><option value="full">Full</option><option value="partial">Partial</option></select></label>
          <label><span>Fuel record date/time</span><input type="datetime-local" name="fuelRecordedAt" /></label>
          <label class="full-width"><span>Notes / reference</span><textarea name="fuelNotes" rows="3"></textarea></label>
        </div>
        <p class="calculated-note">Quantity, mileage and efficiency are calculated by KFE; GPS and timestamp are automatic where available.</p>
      </section>
    </section>

    <section class="category" aria-labelledby="finance-title">
      <div class="category-heading"><small>FINANCE</small><h2 id="finance-title">Finance</h2></div>

      <section class="form-card" aria-labelledby="loan-title">
        <div class="section-heading"><div><small>LOAN</small><h3 id="loan-title">Loan</h3></div><span class="source-badge">Source data</span></div>
        <h4>Loan setup</h4>
        <div class="form-grid">
          <label><span>Principal</span><input type="number" name="loanPrincipal" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Interest rate</span><input type="number" name="loanInterestRate" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Tenure</span><input type="number" name="loanTenure" min="0" inputmode="numeric" /></label>
          <label><span>Loan start date</span><input type="date" name="loanStartDate" /></label>
          <label><span>Loan status</span><input type="text" name="loanStatus" /></label>
          <label><span>Loan reference / details</span><input type="text" name="loanReference" /></label>
        </div>
        <p class="calculated-note">EMI is calculated automatically by KFE.</p>

        <h4>EMI / payment record</h4>
        <div class="form-grid">
          <label><span>EMI number</span><input type="number" name="emiNumber" min="1" inputmode="numeric" /></label>
          <label><span>Due date</span><input type="date" name="emiDueDate" /></label>
          <label><span>Scheduled EMI amount</span><input type="number" name="scheduledEmiAmount" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Actual payment date</span><input type="date" name="emiPaymentDate" /></label>
          <label><span>Actual amount paid</span><input type="number" name="emiAmountPaid" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Payment status</span><select name="emiPaymentStatus"><option value="">Select</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="partial">Partial</option><option value="overdue">Overdue</option></select></label>
        </div>

        <h4>Delayed payment</h4>
        <div class="form-grid">
          <label><span>Delay status</span><select name="loanDelayStatus"><option value="">Select</option><option value="none">None</option><option value="delayed">Delayed</option><option value="resolved">Resolved</option></select></label>
          <label><span>Delayed payment date</span><input type="date" name="loanDelayedPaymentDate" /></label>
          <label><span>Delayed amount</span><input type="number" name="loanDelayedAmount" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Charges / adjustment</span><input type="number" name="loanDelayAdjustment" min="0" step="0.01" inputmode="decimal" /></label>
          <label class="full-width"><span>Reference</span><input type="text" name="loanDelayReference" /></label>
        </div>

        <h4>Prepayment</h4>
        <div class="form-grid">
          <label><span>Prepayment date</span><input type="date" name="prepaymentDate" /></label>
          <label><span>Prepayment amount</span><input type="number" name="prepaymentAmount" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Outstanding principal before</span><input type="number" name="prepaymentPrincipalBefore" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Outstanding principal after</span><input type="number" name="prepaymentPrincipalAfter" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Prepayment status</span><select name="prepaymentStatus"><option value="">Select</option><option value="recorded">Recorded</option><option value="reversed">Reversed</option></select></label>
          <label><span>Reference</span><input type="text" name="prepaymentReference" /></label>
          <label class="full-width"><span>Prepayment effect / schedule record</span><textarea name="prepaymentEffect" rows="3"></textarea></label>
        </div>
      </section>

      <section class="form-card" aria-labelledby="recovery-title">
        <div class="section-heading"><div><small>PRE-ACTIVATION RECOVERY</small><h3 id="recovery-title">Pre-Activation Recovery</h3></div><span class="source-badge">Source data</span></div>
        <div class="form-grid">
          <label><span>Historical maintenance burden</span><input type="number" name="recoveryHistoricalMaintenance" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Unpaid / pre-activation EMI or loan burden</span><input type="number" name="recoveryLoanBurden" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Pre-activation repairs / maintenance</span><input type="number" name="recoveryRepairs" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Initial used-vehicle / setup / business costs</span><input type="number" name="recoverySetupCosts" min="0" step="0.01" inputmode="decimal" /></label>
          <label><span>Recovery applicability</span><select name="recoveryApplicability"><option value="">Select</option><option value="applicable">Applicable</option><option value="not_applicable">Not applicable</option></select></label>
          <label><span>Recovery start date</span><input type="date" name="recoveryStartDate" /></label>
          <label><span>Recovery period / reference</span><input type="text" name="recoveryPeriodReference" /></label>
        </div>
      </section>
    </section>

    <section class="category" aria-labelledby="target-title">
      <div class="category-heading"><small>TARGET &amp; BREAK-EVEN</small><h2 id="target-title">Target &amp; Break-even</h2></div>

      <section class="form-card" aria-labelledby="driver-target-title">
        <div class="section-heading"><div><small>DRIVER TARGET</small><h3 id="driver-target-title">Driver Target</h3></div><span class="source-badge">Source data</span></div>
        <div class="form-grid">
          <label><span>Driver</span><input type="text" name="targetDriver" /></label>
          <label><span>Target value</span><input type="number" name="targetValue" min="0" step="0.01" inputmode="decimal" /></label>
        </div>
        <p class="calculated-note">Break-even and target achievement are calculated by KFE from authoritative business rules and source records.</p>
      </section>
    </section>

    <section class="category" aria-labelledby="settings-title">
      <div class="category-heading"><small>SETTINGS</small><h2 id="settings-title">Settings</h2></div>
      <section class="settings-card" aria-label="Settings controls">
        <div class="setting-row"><strong>Backup &amp; Restore</strong><span>Local and cloud backup/restore controls</span></div>
        <div class="setting-row"><strong>Themes</strong><span>Theme selection</span></div>
        <div class="setting-row"><strong>Temporary Data Reset</strong><span>Testing-only control; remove before production freeze</span></div>
        <p class="calculated-note">Settings are controls/actions, not source-data forms.</p>
      </section>
    </section>
  </main>
</template>

<style scoped>
.admin { padding: 20px 16px 120px; max-width: 960px; margin: 0 auto; }
.admin-header { margin-bottom: 28px; }
.admin-header small, .category-heading small, .section-heading small { font-size: 11px; letter-spacing: 0.12em; font-weight: 700; }
.admin-header h1, .category-heading h2, .section-heading h3 { margin: 4px 0; }
.admin-header p { margin: 8px 0 0; opacity: 0.72; }
.category { margin-bottom: 32px; }
.category-heading { margin-bottom: 14px; }
.form-card, .settings-card { border: 1px solid rgba(127,127,127,0.25); border-radius: 18px; padding: 18px; margin-bottom: 16px; }
.section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
.source-badge { border: 1px solid rgba(127,127,127,0.3); border-radius: 999px; padding: 5px 9px; font-size: 11px; white-space: nowrap; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 14px; }
label { display: grid; gap: 6px; min-width: 0; }
label > span { font-size: 13px; font-weight: 600; }
input, select, textarea { width: 100%; box-sizing: border-box; border: 1px solid rgba(127,127,127,0.35); border-radius: 10px; padding: 10px 11px; font: inherit; background: transparent; }
textarea { resize: vertical; }
.full-width { grid-column: 1 / -1; }
h4 { margin: 22px 0 12px; }
.calculated-note { margin: 14px 0 0; font-size: 12px; opacity: 0.68; }
.setting-row { display: grid; gap: 3px; padding: 12px 0; border-bottom: 1px solid rgba(127,127,127,0.16); }
.setting-row:last-of-type { border-bottom: 0; }
.setting-row span { font-size: 13px; opacity: 0.7; }
@media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } .full-width { grid-column: auto; } }
</style>