import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { DayShiftTripRepository } from '../repositories/dayShiftTripRepository.js'
import { GpsSnapshotRepository } from '../repositories/gpsSnapshotRepository.js'
import { LocationService } from '../services/locationService.js'
import { ShiftValidator } from '../services/shiftValidator.js'

const locationWithin = async (ms = 1200) => Promise.race([LocationService.captureLocation(), new Promise(resolve => setTimeout(() => resolve(null), ms))])

export const useDayShiftTripStore = defineStore('dayShiftTrip', () => {
  const day = ref(null); const shift = ref(null); const trip = ref(null); const initialized = ref(false)
  const isDayOnline = computed(() => day.value?.status === 'ACTIVE')
  const isShiftActive = computed(() => shift.value?.status === 'ACTIVE')
  const isTripActive = computed(() => trip.value?.status === 'ACTIVE')
  const headerShiftStatus = computed(() => isShiftActive.value ? 'ON' : 'OFF')
  const headerTripStatus = computed(() => isTripActive.value ? 'ON' : 'OFF')

  const refresh = async () => { const active = await DayShiftTripRepository.getActive(); day.value=active.day;shift.value=active.shift;trip.value=active.trip;initialized.value=true; if(trip.value) LocationService.startActiveTripSnapshots(async location => { await GpsSnapshotRepository.create({entityType:'TRIP',entityId:trip.value?.id,event:'PERIODIC',location,periodic:true}) }) }
  const tag = async (entityType, entityId, event) => { const location = await locationWithin(); if(location) void GpsSnapshotRepository.create({entityType,entityId,event,location,periodic:false}); return location }

  const startDay = async () => { if(isDayOnline.value) return false; const created=await DayShiftTripRepository.createDay({}); day.value=created; void tag('DAY',created.id,'DAY_START'); return true }
  const endDay = async () => { if(!isDayOnline.value) return false; if(isTripActive.value || isShiftActive.value){alert('End the active Trip and Shift before ending the Day.');return false} void tag('DAY',day.value.id,'DAY_END'); await DayShiftTripRepository.endDay(day.value.id); await refresh(); return true }

  const startShift = async (startOdo) => { if(!isDayOnline.value){alert('Start the Day before starting a Shift.');return false} if(isShiftActive.value){alert('A Shift is already active.');return false} const n=Number(startOdo);if(!Number.isFinite(n)||n<=0){alert('Please enter a valid positive Start Odometer reading.');return false} const created=await DayShiftTripRepository.createShift({dayId:day.value.id,startOdometer:n});shift.value=created;void tag('SHIFT',created.id,'SHIFT_START');return true }
  const endShift = async (endOdo,revenue) => { if(!isShiftActive.value)return false;if(isTripActive.value){alert('End the active Trip before ending the Shift.');return false}const validation=ShiftValidator.validateSubmission({startOdometer:shift.value.startOdometer,endOdometer:endOdo,revenue});if(!validation.valid){alert(validation.errors[0]);return false}void tag('SHIFT',shift.value.id,'SHIFT_END');await DayShiftTripRepository.endShift({id:shift.value.id,endOdometer:validation.values.endOdometer,revenue:validation.values.revenue});await refresh();return true }

  const startTrip = async () => { if(!isShiftActive.value){alert('Start a Shift before starting a Trip.');return false} if(isTripActive.value){alert('A Trip is already active.');return false} const location=await locationWithin();const created=await DayShiftTripRepository.createTrip({dayId:day.value.id,shiftId:shift.value.id,tripStartLocation:location});trip.value=created;if(location)void GpsSnapshotRepository.create({entityType:'TRIP',entityId:created.id,event:'TRIP_START',location});LocationService.startActiveTripSnapshots(async l=>{await GpsSnapshotRepository.create({entityType:'TRIP',entityId:created.id,event:'PERIODIC',location:l,periodic:true})});return true }
  const endTrip = async () => { if(!isTripActive.value)return false;const activeId=trip.value.id;const location=await locationWithin();LocationService.stopActiveTripSnapshots();await DayShiftTripRepository.endTrip({id:activeId,tripEndLocation:location});if(location)void GpsSnapshotRepository.create({entityType:'TRIP',entityId:activeId,event:'TRIP_END',location});await refresh();return true }

  const recordMissedTrip = async (startAt,endAt) => { if(!isShiftActive.value){alert('Start a Shift before recording a missed Trip.');return false} if(isTripActive.value){alert('End the active Trip first.');return false}const start=new Date(startAt);const end=new Date(endAt);if(Number.isNaN(start.getTime())||Number.isNaN(end.getTime())||end<=start){alert('Enter valid Trip start and end times.');return false}const location=await locationWithin();const created=await DayShiftTripRepository.createTrip({dayId:day.value.id,shiftId:shift.value.id,tripStartAt:start.toISOString(),tripStartLocation:location});await DayShiftTripRepository.endTrip({id:created.id,tripEndLocation:null});await refresh();return true }

  const initialize = async () => { if(initialized.value)return; await refresh() }
  return {day,shift,trip,initialized,isDayOnline,isShiftActive,isTripActive,headerShiftStatus,headerTripStatus,initialize,refresh,startDay,endDay,startShift,endShift,startTrip,endTrip,recordMissedTrip}
})
