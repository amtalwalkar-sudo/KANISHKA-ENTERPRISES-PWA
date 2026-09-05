import assert from 'node:assert/strict';

export const TEST_DATA_ID = 'KFE-TEST-5Y-2026-2031';
export const TEST_PERIOD = Object.freeze({ start: '2026-04-01', end: '2031-03-31' });
export const TEST_BASELINE = Object.freeze({
  registration: 'MH01EM7360', acquisitionDate: '2026-04-09', acquisitionOdometer: 65000,
  workDaysPerWeek: 6, hoursPerWorkDay: 12, cityShare: 0.30, intercityShare: 0.70,
  cityKm: 200, intercityKm: 400, revenuePerHourPaise: 17500,
  cngPricePaisePerKg: 8200, cityKmPerKg: 20, highwayKmPerKg: 30,
  maintenancePaisePerKm: 200, annualCompliancePaise: 2500000,
  loanPrincipalPaise: 55000000, annualInterestPercent: 10, termMonths: 60, emiPaise: 1168587
});

const STORE_NAMES = [
  'state','rides','logs','settings','outbox','config','audit','idempotency','vehicles','drivers',
  'vehicle_driver_assignments','vehicle_odometer_readings','vehicle_disposal_records','vehicle_lifecycle_events',
  'work_sessions','work_days','odometer_allocations','operational_events','fuel_records','expense_records',
  'fixed_expenses','maintenance_items','maintenance_records','revenue_records','loans','loan_payments',
  'renewals_compliance','calculation_results','alerts'
];
const REQUIRED_STORES = ['vehicles','drivers','vehicle_driver_assignments','vehicle_odometer_readings','vehicle_lifecycle_events','work_sessions','work_days','fuel_records','expense_records','fixed_expenses','maintenance_items','maintenance_records','revenue_records','loans','loan_payments','renewals_compliance'];

const uuid = seed => {
  const hex = Array.from({length: 32}, (_, i) => ((seed * 31 + i * 17) % 16).toString(16)).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-8${hex.slice(17,20)}-${hex.slice(20)}`;
};
const iso = date => `${date}T12:00:00.000Z`;
const record = (id, data, date='2026-04-01') => ({
  ...data, id, user_id: null, created_at: iso(date), updated_at: iso(date), synced: false, is_deleted: false,
  test_data_id: TEST_DATA_ID
});
const dateAdd = (date, days) => { const d = new Date(`${date}T00:00:00Z`); d.setUTCDate(d.getUTCDate()+days); return d.toISOString().slice(0,10); };
const dateDiff = (a,b) => Math.round((Date.parse(`${b}T00:00:00Z`)-Date.parse(`${a}T00:00:00Z`))/86400000);
const monthStart = (year, month) => `${year}-${String(month).padStart(2,'0')}-01`;

function isWorkingDay(date) {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day !== 0;
}

function operatingKind(workIndex) {
  // Deterministic 6-day week pattern: 4 intercity + 2 city.
  return workIndex % 6 < 4 ? 'INTERCITY' : 'CITY';
}

function nextFullTankDistance(kind) {
  // Synthetic fixture uses each operating day as a controlled full-tank observation.
  // No production tank-capacity assumption is introduced.
  return kind === 'INTERCITY' ? TEST_BASELINE.intercityKm : TEST_BASELINE.cityKm;
}

export function amortizationSchedule() {
  let balance = TEST_BASELINE.loanPrincipalPaise;
  const monthlyRate = TEST_BASELINE.annualInterestPercent / 100 / 12;
  const rows = [];
  for (let month=1; month<=TEST_BASELINE.termMonths && balance>0; month++) {
    const interest = Math.round(balance * monthlyRate);
    const payment = Math.min(TEST_BASELINE.emiPaise, balance + interest);
    const principal = Math.min(balance, Math.max(0, payment - interest));
    balance -= principal;
    rows.push({month, payment_paise: payment, interest_paise: interest, principal_paise: principal, ending_balance_paise: balance});
  }
  return rows;
}

export function generateFiveYearFixture() {
  const stores = Object.fromEntries(STORE_NAMES.map(name => [name, []]));
  let seed = 1;
  const id = prefix => uuid(seed++).replace(/^(.{8})/, `${prefix.slice(0,4).padEnd(4,'0')}`);
  const vehicleId = id('veh');
  const driverId = id('drv');

  stores.vehicles.push(record(vehicleId, {
    registration_number: TEST_BASELINE.registration, make: 'Synthetic', model: 'KFE Test Vehicle', variant: '', fuel_type: 'CNG',
    acquisition_date: TEST_BASELINE.acquisitionDate, acquisition_type: 'USED', acquisition_odometer: TEST_BASELINE.acquisitionOdometer,
    acquisition_cost_paise: 0, current_odometer: TEST_BASELINE.acquisitionOdometer, lifecycle_status: 'ACTIVE',
    retirement_date: null, retirement_odometer: null, retirement_reason: null, sale_date: null, sale_odometer: null,
    sale_amount_paise: null, sale_reference: null, sale_notes: null, transfer_date: null, transfer_odometer: null,
    transfer_amount_paise: null, transfer_reference: null
  }, TEST_BASELINE.acquisitionDate));
  stores.drivers.push(record(driverId, {name:'Synthetic Test Driver', mobile:'', licence_number:'KFE-TEST-DRIVER-001', licence_expiry:'2031-03-31', status:'ACTIVE', added_date:TEST_BASELINE.acquisitionDate, deactivation_date:null, deactivation_reason:null}));
  stores.vehicle_driver_assignments.push(record(id('asg'), {vehicle_id:vehicleId, driver_id:driverId, start_date:TEST_BASELINE.acquisitionDate, end_date:null, status:'ACTIVE', reason:'5-year synthetic validation fixture'}, TEST_BASELINE.acquisitionDate));
  stores.vehicle_odometer_readings.push(record(id('odo'), {vehicle_id:vehicleId, odometer:TEST_BASELINE.acquisitionOdometer, source:'ACQUISITION', source_precedence:10, recorded_at:iso(TEST_BASELINE.acquisitionDate), reason:'Acquisition baseline'}, TEST_BASELINE.acquisitionDate));
  stores.vehicle_lifecycle_events.push(record(id('life'), {vehicle_id:vehicleId, event_type:'ACQUISITION', effective_date:TEST_BASELINE.acquisitionDate, odometer:TEST_BASELINE.acquisitionOdometer, amount_paise:0, reason:'Synthetic fixture baseline'}, TEST_BASELINE.acquisitionDate));

  const loanId = id('loan');
  stores.loans.push(record(loanId, {vehicle_id:vehicleId, principal_paise:TEST_BASELINE.loanPrincipalPaise, annual_rate_percent:10, term_months:60, emi_paise:TEST_BASELINE.emiPaise, start_date:TEST_BASELINE.acquisitionDate, status:'ACTIVE', test_fixture:true}, TEST_BASELINE.acquisitionDate));
  const schedule = amortizationSchedule();
  for (let i=0; i<schedule.length; i++) {
    const month = i + 1;
    const d = new Date(`${TEST_BASELINE.acquisitionDate}T00:00:00Z`); d.setUTCMonth(d.getUTCMonth()+i);
    const date = d.toISOString().slice(0,10);
    stores.loan_payments.push(record(id('pay'), {loan_id:loanId, vehicle_id:vehicleId, date, occurredAt:iso(date), amount_paise:schedule[i].payment_paise, payment_paise:schedule[i].payment_paise, principal_paise:schedule[i].principal_paise, interest_paise:schedule[i].interest_paise, ending_balance_paise:schedule[i].ending_balance_paise, scope:'BUSINESS'}, date));
  }

  stores.fixed_expenses.push(record(id('fix'), {name:'Compliance annualized baseline', category:'COMPLIANCE', amount_paise:TEST_BASELINE.annualCompliancePaise, frequency:'ANNUAL', start_date:TEST_BASELINE.acquisitionDate, end_date:null, vehicle_id:vehicleId, active:true}, TEST_BASELINE.acquisitionDate));
  stores.maintenance_items.push(record(id('mi'), {vehicle_id:vehicleId, category:'GENERAL_MAINTENANCE', description:'Synthetic maintenance burn baseline', expected_km_life:1000, expected_time_life_days:null, expected_cost_paise:200000, baseline_odometer:TEST_BASELINE.acquisitionOdometer, baseline_date:TEST_BASELINE.acquisitionDate, alert_days:30}, TEST_BASELINE.acquisitionDate));

  let date = TEST_BASELINE.acquisitionDate;
  let workIndex = 0;
  let odometer = TEST_BASELINE.acquisitionOdometer;
  let workingDays = 0;
  let lastDate = null;
  while (date <= TEST_PERIOD.end) {
    if (date >= TEST_BASELINE.acquisitionDate && isWorkingDay(date)) {
      const kind = operatingKind(workIndex);
      const km = nextFullTankDistance(kind);
      const startOdo = odometer;
      const endOdo = startOdo + km;
      const startAt = `${date}T06:00:00.000Z`;
      const endAt = `${date}T18:00:00.000Z`;
      const workId = id('work');
      stores.work_days.push(record(id('wday'), {vehicle_id:vehicleId, driver_id:driverId, business_date:date, date, status:'COMPLETED', working:true, scope:'BUSINESS'}, date));
      stores.work_sessions.push(record(workId, {vehicle_id:vehicleId, driver_id:driverId, business_date:date, date, start_at:startAt, end_at:endAt, started_at:startAt, ended_at:endAt, start_odometer:startOdo, end_odometer:endOdo, business_km:km, personal_km:0, scope:'BUSINESS', operation_kind:kind, hours:12}, date));
      stores.odometer_allocations.push(record(id('alloc'), {vehicle_id:vehicleId, work_session_id:workId, start_odometer:startOdo, end_odometer:endOdo, business_km:km, personal_km:0, scope:'BUSINESS'}, date));

      const rideCount = kind === 'INTERCITY' ? 10 : 10;
      const kmPerRide = km / rideCount;
      for (let r=0; r<rideCount; r++) {
        const minutes = Math.round((12*60)/rideCount);
        const rideStart = new Date(`${date}T06:00:00.000Z`); rideStart.setUTCMinutes(rideStart.getUTCMinutes()+r*minutes);
        const rideEnd = new Date(rideStart); rideEnd.setUTCMinutes(rideEnd.getUTCMinutes()+minutes);
        const rideStartAt = rideStart.toISOString(); const rideEndAt = rideEnd.toISOString();
        stores.rides.push(record(id('ride'), {vehicle_id:vehicleId, driver_id:driverId, work_session_id:workId, started_at:rideStartAt, ended_at:rideEndAt, business_km:kmPerRide, scope:'BUSINESS', operation_kind:kind, status:'COMPLETED'}, date));
      }
      const revenuePaise = TEST_BASELINE.revenuePerHourPaise * 12;
      stores.revenue_records.push(record(id('rev'), {vehicle_id:vehicleId, work_session_id:workId, business_date:date, date, occurredAt:endAt, amount_paise:revenuePaise, scope:'BUSINESS', description:'Synthetic daily ride revenue'}, date));

      const mileage = kind === 'INTERCITY' ? TEST_BASELINE.highwayKmPerKg : TEST_BASELINE.cityKmPerKg;
      const kg = km / mileage;
      stores.fuel_records.push(record(id('fuel'), {vehicle_id:vehicleId, date, occurredAt:endAt, odometer:endOdo, litres:kg, quantity_kg:kg, amount_paise:Math.round(kg*TEST_BASELINE.cngPricePaisePerKg), is_full_tank:true, scope:'BUSINESS', refuel_method:'TANK_FULL_TO_TANK_FULL', baseline_distance_km:km, mileage_km_per_kg:mileage}, date));
      stores.vehicle_odometer_readings.push(record(id('odo'), {vehicle_id:vehicleId, odometer:endOdo, source:'WORK_SESSION', source_precedence:40, recorded_at:endAt, reason:'Synthetic work-session endpoint'}, date));
      stores.vehicle_odometer_readings.push(record(id('odo'), {vehicle_id:vehicleId, odometer:endOdo, source:'FUEL', source_precedence:30, recorded_at:endAt, reason:'Synthetic full-tank refuel'}, date));

      workingDays++;
      odometer = endOdo;
      lastDate = date;
      workIndex++;
    }
    date = dateAdd(date,1);
  }

  // Monthly maintenance invoices are generated from actual business KM at the frozen test burn rate.
  const byMonth = new Map();
  for (const session of stores.work_sessions) {
    const key = session.business_date.slice(0,7);
    byMonth.set(key, (byMonth.get(key)||0) + Number(session.business_km));
  }
  for (const [month, km] of byMonth) {
    const d = `${month}-28`;
    stores.maintenance_records.push(record(id('maint'), {vehicle_id:vehicleId, date:d, occurredAt:iso(d), odometer:odometer, category:'SERVICE_REPAIR', description:'Synthetic maintenance invoice', amount_paise:Math.round(km*TEST_BASELINE.maintenancePaisePerKm), scope:'BUSINESS', allocated_km:km, allocation_rate_paise_per_km:TEST_BASELINE.maintenancePaisePerKm}, d));
  }

  // Compliance events preserve the component inputs while annualized spend remains ₹25,000.
  for (let year=2026; year<=2030; year++) {
    const insuranceDate = `${year}-04-09`;
    if (insuranceDate >= TEST_PERIOD.start && insuranceDate <= TEST_PERIOD.end) stores.renewals_compliance.push(record(id('renew'), {vehicle_id:vehicleId, date:insuranceDate, occurredAt:iso(insuranceDate), category:'INSURANCE', description:'Insurance renewal', amount_paise:1550000, valid_from:insuranceDate, valid_to:`${year+1}-04-08`, scope:'BUSINESS'}, insuranceDate));
    const pucDate = `${year}-10-09`;
    if (pucDate >= TEST_PERIOD.start && pucDate <= TEST_PERIOD.end) stores.renewals_compliance.push(record(id('renew'), {vehicle_id:vehicleId, date:pucDate, occurredAt:iso(pucDate), category:'PUC', description:'PUC renewal', amount_paise:10000, valid_from:pucDate, valid_to:`${year+1}-10-08`, scope:'BUSINESS'}, pucDate));
    const permitDate = `${year}-04-09`;
    if (year % 2 === 0 && permitDate >= TEST_PERIOD.start && permitDate <= TEST_PERIOD.end) stores.renewals_compliance.push(record(id('renew'), {vehicle_id:vehicleId, date:permitDate, occurredAt:iso(permitDate), category:'PERMIT', description:'Permit renewal (two-year validity)', amount_paise:1500000, valid_from:permitDate, valid_to:`${year+2}-04-08`, scope:'BUSINESS'}, permitDate));
    const otherDate = `${year}-12-09`;
    if (otherDate >= TEST_PERIOD.start && otherDate <= TEST_PERIOD.end) stores.renewals_compliance.push(record(id('renew'), {vehicle_id:vehicleId, date:otherDate, occurredAt:iso(otherDate), category:'OTHER_COMPLIANCE', description:'Other compliance allowance', amount_paise:190000, valid_from:otherDate, valid_to:`${year+1}-12-08`, scope:'BUSINESS'}, otherDate));
  }

  // Other business expenses are intentionally zero unless a future fixture revision explicitly adds them.
  stores.expense_records.push(record(id('exp'), {vehicle_id:vehicleId, date:TEST_BASELINE.acquisitionDate, occurredAt:iso(TEST_BASELINE.acquisitionDate), category:'TEST_FIXTURE_MARKER', description:'Synthetic test dataset marker; not a production expense', amount_paise:0, scope:'BUSINESS'}, TEST_BASELINE.acquisitionDate));

  stores.calculation_results.push(record(id('calc'), {calculation_type:'TEST_FIXTURE_SUMMARY', test_data_id:TEST_DATA_ID, period_start:TEST_PERIOD.start, period_end:TEST_PERIOD.end, working_days:workingDays, ending_odometer:odometer, last_working_date:lastDate, revenue_rate_paise_per_hour:TEST_BASELINE.revenuePerHourPaise, maintenance_rate_paise_per_km:TEST_BASELINE.maintenancePaisePerKm, cng_price_paise_per_kg:TEST_BASELINE.cngPricePaisePerKg, cng_city_km_per_kg:TEST_BASELINE.cityKmPerKg, cng_highway_km_per_kg:TEST_BASELINE.highwayKmPerKg, loan_emi_paise:TEST_BASELINE.emiPaise}, TEST_PERIOD.end));

  const expected = summarize(stores);
  return {schemaVersion:1, dbName:'kfe', dbVersion:9, testDataId:TEST_DATA_ID, period:TEST_PERIOD, stores, expected};
}

export function summarize(fixture) {
  const active = rows => rows.filter(r=>!r.is_deleted);
  const work = active(fixture.work_sessions);
  const revenue = active(fixture.revenue_records).reduce((s,r)=>s+Number(r.amount_paise||0),0);
  const fuel = active(fixture.fuel_records).reduce((s,r)=>s+Number(r.amount_paise||0),0);
  const maintenance = active(fixture.maintenance_records).reduce((s,r)=>s+Number(r.amount_paise||0),0);
  const loan = active(fixture.loan_payments).reduce((s,r)=>s+Number(r.amount_paise||0),0);
  const km = work.reduce((s,r)=>s+Number(r.business_km||0),0);
  assert.ok(work.length > 1000, 'Five-year fixture should contain substantial work-session volume');
  assert.ok(fixture.fuel_records.length === work.length, 'Each synthetic working day has a full-tank fuel observation');
  return Object.freeze({workingDays:work.length,businessKm:km,revenuePaise:revenue,fuelPaise:fuel,maintenancePaise:maintenance,loanPaymentPaise:loan,endingOdometer:65000+km});
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const fixture = generateFiveYearFixture();
  console.log(JSON.stringify({testDataId:fixture.testDataId, period:fixture.period, expected:fixture.expected}, null, 2));
}
