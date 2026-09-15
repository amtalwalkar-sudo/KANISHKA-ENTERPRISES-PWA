/**
 * KFE Admin form definitions.
 *
 * These definitions describe source-input forms only. They intentionally do not
 * calculate derived ERP values. The application/domain layer remains the
 * authoritative validation and persistence path.
 */

const text = (key, label, options = {}) => ({ key, label, type: 'text', ...options });
const number = (key, label, options = {}) => ({ key, label, type: 'number', ...options });
const date = (key, label, options = {}) => ({ key, label, type: 'date', ...options });
const select = (key, label, options, extra = {}) => ({ key, label, type: 'select', options, ...extra });
const checkbox = (key, label, options = {}) => ({ key, label, type: 'checkbox', ...options });
const textarea = (key, label, options = {}) => ({ key, label, type: 'textarea', ...options });

export const ADMIN_FORM_DEFINITIONS = {
  vehicle: {
    title: 'Vehicle',
    category: 'operations',
    fields: [
      text('registrationNumber', 'Registration number', { required: true }),
      text('make', 'Make', { required: true }),
      text('model', 'Model', { required: true }),
      text('variant', 'Variant'),
      date('acquiredOn', 'Acquired on', { required: true }),
      number('openingOdometerKm', 'Opening odometer (km)', { required: true, min: 0 }),
      select('fuelType', 'Fuel type', ['CNG', 'Petrol', 'Diesel', 'Electric', 'Hybrid'], { required: true }),
      number('tankCapacity', 'Tank / battery capacity'),
      checkbox('active', 'Active', { defaultValue: true }),
      textarea('notes', 'Notes')
    ]
  },
  driver: {
    title: 'Driver',
    category: 'operations',
    fields: [
      text('name', 'Full name', { required: true }),
      text('phone', 'Phone number'),
      text('licenseNumber', 'Driving licence number'),
      date('licenseExpiry', 'Licence expiry'),
      date('joinedOn', 'Joined on'),
      select('status', 'Status', ['Active', 'Inactive', 'Suspended'], { required: true }),
      textarea('notes', 'Notes')
    ]
  },
  compliance: {
    title: 'Compliance',
    category: 'operations',
    fields: [
      select('vehicleId', 'Vehicle', [], { required: true }),
      select('complianceType', 'Compliance type', ['Insurance', 'PUC', 'Permit', 'Fitness', 'Tax', 'Other'], { required: true }),
      text('referenceNumber', 'Reference number'),
      date('validFrom', 'Valid from', { required: true }),
      date('validUntil', 'Valid until', { required: true }),
      number('cost', 'Cost', { min: 0 }),
      textarea('notes', 'Notes')
    ]
  },
  maintenance: {
    title: 'Maintenance',
    category: 'operations',
    fields: [
      select('vehicleId', 'Vehicle', [], { required: true }),
      date('performedOn', 'Performed on', { required: true }),
      select('maintenanceType', 'Maintenance type', ['Service', 'Repair', 'Tyres', 'Battery', 'Other'], { required: true }),
      number('odometerKm', 'Odometer (km)', { min: 0 }),
      number('cost', 'Cost', { required: true, min: 0 }),
      text('vendor', 'Vendor'),
      textarea('description', 'Description'),
      textarea('notes', 'Notes')
    ]
  },
  driverCollectedData: {
    title: 'Driver-collected Data',
    category: 'operations',
    fields: [
      select('driverId', 'Driver', [], { required: true }),
      select('vehicleId', 'Vehicle', [], { required: true }),
      date('recordedOn', 'Recorded on', { required: true }),
      number('startOdometerKm', 'Start odometer (km)', { min: 0 }),
      number('endOdometerKm', 'End odometer (km)', { min: 0 }),
      number('cashCollected', 'Cash collected', { min: 0 }),
      number('otherCollectedAmount', 'Other collected amount', { min: 0 }),
      textarea('notes', 'Notes')
    ]
  },
  loan: {
    title: 'Loan',
    category: 'finance',
    fields: [
      text('lender', 'Lender', { required: true }),
      text('accountReference', 'Account reference'),
      number('principal', 'Principal', { required: true, min: 0 }),
      number('annualInterestRate', 'Annual interest rate (%)', { required: true, min: 0 }),
      number('tenureMonths', 'Tenure (months)', { required: true, min: 1 }),
      date('startDate', 'Start date', { required: true }),
      number('emiAmount', 'EMI amount', { min: 0 }),
      select('status', 'Status', ['Active', 'Closed', 'Settled'], { required: true }),
      textarea('notes', 'Notes')
    ]
  },
  loanPayment: {
    title: 'Loan Payment',
    category: 'finance',
    fields: [
      select('loanId', 'Loan', [], { required: true }),
      date('paidOn', 'Paid on', { required: true }),
      number('amount', 'Amount', { required: true, min: 0 }),
      number('principalComponent', 'Principal component', { min: 0 }),
      number('interestComponent', 'Interest component', { min: 0 }),
      number('charges', 'Charges', { min: 0 }),
      select('status', 'Status', ['Paid', 'Partial', 'Delayed', 'Reversed'], { required: true }),
      textarea('notes', 'Notes')
    ]
  },
  prepayment: {
    title: 'Prepayment',
    category: 'finance',
    fields: [
      select('loanId', 'Loan', [], { required: true }),
      date('paidOn', 'Paid on', { required: true }),
      number('amount', 'Amount', { required: true, min: 0 }),
      number('charges', 'Charges', { min: 0 }),
      textarea('reason', 'Reason'),
      textarea('notes', 'Notes')
    ]
  },
  driverTarget: {
    title: 'Driver Target',
    category: 'targetBreakEven',
    fields: [
      select('driverId', 'Driver', [], { required: true }),
      date('effectiveFrom', 'Effective from', { required: true }),
      date('effectiveUntil', 'Effective until'),
      number('targetRevenue', 'Target revenue', { min: 0 }),
      number('targetHours', 'Target hours', { min: 0 }),
      number('targetKm', 'Target kilometres', { min: 0 }),
      checkbox('active', 'Active', { defaultValue: true }),
      textarea('notes', 'Notes')
    ]
  },
  breakEvenInputs: {
    title: 'Break-even Inputs',
    category: 'targetBreakEven',
    fields: [
      date('effectiveFrom', 'Effective from', { required: true }),
      number('fixedCosts', 'Fixed costs', { required: true, min: 0 }),
      number('variableCostPerKm', 'Variable cost per km', { min: 0 }),
      number('variableCostPerHour', 'Variable cost per hour', { min: 0 }),
      number('expectedRevenuePerKm', 'Expected revenue per km', { min: 0 }),
      number('expectedRevenuePerHour', 'Expected revenue per hour', { min: 0 }),
      textarea('notes', 'Notes')
    ]
  },
  backupRestore: {
    title: 'Backup & Restore',
    category: 'settings',
    fields: [
      select('operation', 'Operation', ['Create backup', 'Restore backup', 'Verify backup'], { required: true }),
      text('backupReference', 'Backup reference'),
      checkbox('includeAttachments', 'Include attachments', { defaultValue: true }),
      checkbox('verifyIntegrity', 'Verify integrity', { defaultValue: true }),
      textarea('notes', 'Notes')
    ]
  },
  themes: {
    title: 'Themes',
    category: 'settings',
    fields: [
      select('theme', 'Theme', ['System', 'Light', 'Dark'], { required: true }),
      checkbox('highContrast', 'High contrast'),
      checkbox('reducedMotion', 'Reduced motion')
    ]
  },
  dataReset: {
    title: 'Temporary / Data Reset',
    category: 'settings',
    fields: [
      select('scope', 'Reset scope', ['Synthetic test data only', 'All local data'], { required: true }),
      text('confirmation', 'Type RESET to confirm', { required: true }),
      textarea('reason', 'Reason', { required: true })
    ]
  }
};

export const ADMIN_FORM_KEYS = Object.keys(ADMIN_FORM_DEFINITIONS);

export function getAdminFormDefinition(formKey) {
  return ADMIN_FORM_DEFINITIONS[formKey] ?? null;
}
