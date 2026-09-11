<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDayShiftTripStore } from '../stores/dayShiftTrip.js'
import { saveFuelLog } from '../utils/indexedDB.js'

const store = useDayShiftTripStore()
const startOdoInput=ref(''); const endOdoInput=ref(''); const shiftRevenueInput=ref('')
const missedStart=ref(''); const missedEnd=ref('')
const showFuelForm=ref(false); const fuelOdometer=ref(''); const pricePerKg=ref(''); const amountPaid=ref('')
const MAX_CNG_KG=15
const calculatedKg=computed(()=>{const p=Number(pricePerKg.value),a=Number(amountPaid.value);return p>0&&a>0?(a/p).toFixed(2):'0.00'})
const load=async()=>{await store.initialize();if(store.shift?.startOdometer)startOdoInput.value=store.shift.startOdometer}
onMounted(load);onUnmounted(()=>{})
const handleStartDay=async()=>{if(await store.startDay())alert('Day started.')}
const handleEndDay=async()=>{if(await store.endDay())alert('Day ended.')}
const handleStartShift=async()=>{if(await store.startShift(startOdoInput.value))startOdoInput.value=''}
const handleEndShift=async()=>{if(!endOdoInput.value||shiftRevenueInput.value===''){alert('Enter End Odometer and Shift Revenue.');return}if(await store.endShift(endOdoInput.value,shiftRevenueInput.value)){endOdoInput.value='';shiftRevenueInput.value='';alert('Shift ended and saved.')}}
const handleStartTrip=async()=>{if(await store.startTrip())alert('Trip started.')}
const handleEndTrip=async()=>{if(await store.endTrip())alert('Trip completed.')}
const handleMissed=async()=>{if(await store.recordMissedTrip(missedStart.value,missedEnd.value)){missedStart.value='';missedEnd.value='';alert('Missed Trip recorded.')}}
const handleSaveFuel=async()=>{const odo=Number(fuelOdometer.value),amount=Number(amountPaid.value),kg=Number(calculatedKg.value);if(!odo||!amount){alert('Enter odometer and amount.');return}if(kg>MAX_CNG_KG){alert(`Calculated quantity exceeds ${MAX_CNG_KG} kg.`);return}try{await saveFuelLog({odometer:odo,pricePerKg:Number(pricePerKg.value)||0,amount,kg});showFuelForm.value=false;fuelOdometer.value='';pricePerKg.value='';amountPaid.value='';alert('CNG Fuel Log saved.')}catch(e){console.error(e);alert('Error saving CNG fuel log.')}}
</script>

<template>
<div style="padding:12px;max-width:600px;margin:0 auto;box-sizing:border-box">
  <header style="margin-bottom:16px"><h1 style="font-size:1.25rem;font-weight:bold;color:#0f172a;margin:0">Work Module</h1><p style="font-size:.8rem;color:#64748b;margin:0">Day, Shift & Trip controls</p></header>

  <section style="background:white;border:1px solid #cbd5e1;border-radius:12px;padding:16px;margin-bottom:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><strong>Day</strong><span :style="{color:store.isDayOnline?'#16a34a':'#64748b',fontWeight:'700'}">{{ store.isDayOnline ? 'ONLINE' : 'OFFLINE' }}</span></div>
    <div v-if="!store.isDayOnline"><button @click="handleStartDay" style="width:100%;padding:12px;background:#16a34a;color:white;border:0;border-radius:7px;font-weight:bold">▶ Start Day</button></div>
    <div v-else><div style="font-size:.8rem;color:#475569;margin-bottom:10px">Day started {{ store.day?.dayStartAt ? new Date(store.day.dayStartAt).toLocaleString() : '' }}</div><button @click="handleEndDay" :disabled="store.isShiftActive||store.isTripActive" style="width:100%;padding:11px;background:#dc2626;color:white;border:0;border-radius:7px;font-weight:bold">■ End Day</button></div>
  </section>

  <section style="background:white;border:1px solid #cbd5e1;border-radius:12px;padding:16px;margin-bottom:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><strong>Shift</strong><span :style="{color:store.isShiftActive?'#16a34a':'#64748b',fontWeight:'700'}">{{ store.isShiftActive ? 'ACTIVE' : 'OFF' }}</span></div>
    <div v-if="!store.isShiftActive">
      <label style="display:block;font-size:.8rem;font-weight:600;margin-bottom:4px">Start Odometer (km)</label><input v-model="startOdoInput" type="number" style="width:100%;padding:10px;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:6px;margin-bottom:10px" :disabled="!store.isDayOnline" />
      <button @click="handleStartShift" :disabled="!store.isDayOnline" style="width:100%;padding:12px;background:#16a34a;color:white;border:0;border-radius:7px;font-weight:bold">🚀 Start Shift</button>
    </div>
    <div v-else>
      <div style="background:#f1f5f9;padding:8px;border-radius:6px;font-size:.8rem;margin-bottom:10px">Start Odometer: <strong>{{ store.shift.startOdometer }} km</strong></div>
      <label style="display:block;font-size:.8rem;font-weight:600;margin-bottom:4px">End Odometer (km)</label><input v-model="endOdoInput" type="number" style="width:100%;padding:10px;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:6px;margin-bottom:10px" :disabled="store.isTripActive" />
      <label style="display:block;font-size:.8rem;font-weight:600;margin-bottom:4px">Shift Revenue (₹)</label><input v-model="shiftRevenueInput" type="number" style="width:100%;padding:10px;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:6px;margin-bottom:10px" :disabled="store.isTripActive" />
      <button @click="handleEndShift" :disabled="store.isTripActive" style="width:100%;padding:12px;background:#dc2626;color:white;border:0;border-radius:7px;font-weight:bold">🏁 End Shift & Save</button>
    </div>
  </section>

  <section v-if="store.isShiftActive" style="background:white;border:1px solid #cbd5e1;border-radius:12px;padding:16px;margin-bottom:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px"><strong>Trip</strong><span :style="{color:store.isTripActive?'#16a34a':'#64748b',fontWeight:'700'}">{{ store.isTripActive ? 'ACTIVE' : 'READY' }}</span></div>
    <div v-if="!store.isTripActive"><button @click="handleStartTrip" style="width:100%;padding:13px;background:#2563eb;color:white;border:0;border-radius:7px;font-weight:bold">▶ START TRIP</button></div>
    <div v-else><div style="background:#eff6ff;padding:10px;border-radius:7px;font-size:.8rem;margin-bottom:10px">Trip started {{ new Date(store.trip.tripStartAt).toLocaleTimeString() }}</div><button @click="handleEndTrip" style="width:100%;padding:13px;background:#dc2626;color:white;border:0;border-radius:7px;font-weight:bold">■ END TRIP</button></div>
    <details style="margin-top:14px"><summary style="font-size:.8rem;font-weight:700;cursor:pointer">Record Missed Trip</summary><div style="padding-top:10px"><label style="font-size:.75rem">Actual start</label><input v-model="missedStart" type="datetime-local" style="width:100%;padding:8px;box-sizing:border-box;margin:4px 0 8px"/><label style="font-size:.75rem">Actual end</label><input v-model="missedEnd" type="datetime-local" style="width:100%;padding:8px;box-sizing:border-box;margin:4px 0 8px"/><button @click="handleMissed" style="width:100%;padding:9px;background:#7c3aed;color:white;border:0;border-radius:6px;font-weight:bold">Save Missed Trip</button></div></details>
  </section>

  <section style="background:white;border:1px solid #cbd5e1;border-radius:12px;padding:16px"><button @click="showFuelForm=true" style="width:100%;padding:13px;background:#2563eb;color:white;border:0;border-radius:8px;font-weight:bold">⛽ Log CNG Refueling</button></section>
  <div v-if="showFuelForm" style="position:fixed;inset:0 0 60px;background:#f8fafc;z-index:10000;padding:16px;overflow:auto"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><strong>CNG Refueling</strong><button @click="showFuelForm=false">Back</button></div><input v-model="fuelOdometer" type="number" placeholder="Odometer" style="width:100%;padding:10px;box-sizing:border-box;margin-bottom:10px"/><input v-model="pricePerKg" type="number" step=".01" placeholder="Price per kg" style="width:100%;padding:10px;box-sizing:border-box;margin-bottom:10px"/><input v-model="amountPaid" type="number" placeholder="Amount paid" style="width:100%;padding:10px;box-sizing:border-box;margin-bottom:10px"/><div style="padding:10px;background:#f0fdf4;margin-bottom:10px">Calculated: <strong>{{ calculatedKg }} kg</strong></div><button @click="handleSaveFuel" style="width:100%;padding:12px;background:#16a34a;color:white;border:0;border-radius:7px;font-weight:bold">Save</button></div>
</div>
</template>
