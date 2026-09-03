<script setup>
import { computed, ref } from 'vue';
import KfeStatePanel from './KfeStatePanel.vue';
import { projectTimeline } from '../../js/ui/timeline.js';

const props=defineProps({horizon:{type:String,default:'Day'},events:{type:Array,default:()=>[]}});
const locationFilter=ref('ALL');
const locationMenuOpen=ref(false);

function timeLabel(value){if(!value)return 'Time unavailable';const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}):'Time unavailable';}
function dateLabel(value){if(!value)return '';const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleDateString([], {day:'numeric',month:'short',year:'numeric'}):'Date unavailable';}
function locationKey(value){return String(value||'').trim().toLowerCase();}
function isMumbaiArea(value){const key=locationKey(value);return key==='mumbai'||key==='navi mumbai'||key.includes('mumbai');}
function isOutsideMumbai(value){return Boolean(value)&&!isMumbaiArea(value);}
function iconFor(event){const type=String(event.type||'').toLowerCase();if(type.includes('fuel'))return '⛽';if(type.includes('maintenance'))return '🔧';if(type.includes('expense'))return '💳';if(type.includes('revenue'))return '💰';if(type.includes('loan'))return '🏦';if(type.includes('compliance')||type.includes('renew'))return '📄';if(type.includes('personal'))return '👤';if(type.includes('trip'))return '🚗';if(type.includes('shift')||type.includes('work'))return type.includes('end')?'🔴':'🟢';return '•';}
function eventLabel(event){const type=String(event.type||'Other');const lower=type.toLowerCase();if(lower==='start shift'||lower==='work session')return 'Work Session';if(lower.includes('start')&&lower.includes('shift'))return 'Work Started';if(lower.includes('end')&&lower.includes('shift'))return 'Work Ended';if(lower.includes('business trip'))return 'Business Trip';if(lower.includes('personal trip'))return 'Personal Trip';return type;}
function displayScope(event){return event.scope==='PERSONAL'?'Personal':event.scope==='BUSINESS'?'Business':'';}
function selectLocation(value){locationFilter.value=value;locationMenuOpen.value=false;}
const projectedEvents=computed(()=>projectTimeline(props.events));
const locations=computed(()=>Array.from(new Set(projectedEvents.value.map(e=>String(e.locationName||'').trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b)));
const outsideLocations=computed(()=>locations.value.filter(isOutsideMumbai));
const filteredEvents=computed(()=>projectedEvents.value.filter(event=>{const loc=event.locationName||'';if(locationFilter.value==='ALL')return true;if(locationFilter.value==='MUMBAI')return isMumbaiArea(loc);if(locationFilter.value==='OUTSIDE')return isOutsideMumbai(loc);return loc===locationFilter.value;}));
const displayEvents=computed(()=>{let previousOdometerEvent=null;return filteredEvents.value.map((event,index)=>{let distanceKm=null;if(event.odometer!==null&&event.odometer!==undefined&&previousOdometerEvent){const delta=Number(event.odometer)-Number(previousOdometerEvent.odometer);if(Number.isFinite(delta)&&delta>=0)distanceKm=delta;}if(event.odometer!==null&&event.odometer!==undefined)previousOdometerEvent=event;return {...event,distanceKm,hasConnector:index<filteredEvents.value.length-1};});});
const filterLabel=computed(()=>locationFilter.value==='ALL'?'All Locations':locationFilter.value==='MUMBAI'?'Mumbai Area':locationFilter.value==='OUTSIDE'?'Outside Mumbai':locationFilter.value);
</script>

<template>
 <div class="kfe-timeline-view" :data-horizon="horizon">
  <div class="kfe-timeline-toolbar">
   <div><span class="kfe-timeline-toolbar-label">Location</span><strong>Journey history</strong></div>
   <div class="kfe-location-filter">
    <button type="button" class="kfe-location-trigger" :aria-expanded="locationMenuOpen" @click="locationMenuOpen=!locationMenuOpen">
     <span aria-hidden="true">📍</span><span>{{filterLabel}}</span><span class="kfe-location-chevron" aria-hidden="true">⌄</span>
    </button>
    <div v-if="locationMenuOpen" class="kfe-location-menu" role="menu">
     <div class="kfe-location-menu-section">ALL</div>
     <button type="button" :class="{'is-selected':locationFilter==='ALL'}" @click="selectLocation('ALL')">All Locations</button>
     <div class="kfe-location-menu-section">JOURNEY AREA</div>
     <button type="button" :class="{'is-selected':locationFilter==='MUMBAI'}" @click="selectLocation('MUMBAI')">📍 Mumbai Area</button>
     <button type="button" :class="{'is-selected':locationFilter==='OUTSIDE'}" @click="selectLocation('OUTSIDE')">🧭 Outside Mumbai</button>
     <template v-if="outsideLocations.length">
      <div class="kfe-location-menu-section">OUTSIDE-MUMBAI LOCATIONS</div>
      <button v-for="location in outsideLocations" :key="location" type="button" :class="{'is-selected':locationFilter===location}" @click="selectLocation(location)">📍 {{location}}</button>
     </template>
    </div>
   </div>
  </div>

  <div v-if="displayEvents.length" class="kfe-journey-timeline">
   <div v-for="(event,index) in displayEvents" :key="event.id || `${event.type}:${event.occurredAt}:${index}`" class="kfe-journey-item">
    <div class="kfe-journey-rail" aria-hidden="true"><span class="kfe-journey-dot">{{iconFor(event)}}</span><span v-if="index<displayEvents.length-1" class="kfe-journey-line"></span></div>
    <div class="kfe-journey-content">
     <div v-if="horizon!=='Day'" class="kfe-journey-date">{{dateLabel(event.occurredAt)}}</div>
     <div class="kfe-journey-time">{{timeLabel(event.occurredAt)}}</div>
     <article class="kfe-journey-card">
      <div class="kfe-journey-card-heading">
       <div><strong>{{eventLabel(event)}}</strong><span v-if="displayScope(event)" class="kfe-scope-badge">{{displayScope(event)}}</span></div>
      </div>
      <div v-if="event.locationName" class="kfe-journey-location"><span aria-hidden="true">📍</span><span>{{event.locationName}}</span><span v-if="event.gpsAvailable" class="kfe-gps-badge">GPS</span></div>
      <p v-if="event.description" class="kfe-journey-description">{{event.description}}</p>
      <div v-if="event.amount!==null" class="kfe-journey-value">₹ {{Number(event.amount).toFixed(2)}}</div>
     </article>
     <div v-if="event.distanceKm!==null" class="kfe-journey-distance" aria-label="Distance since previous recorded odometer event"><span class="kfe-distance-arrow">↓</span><strong>{{event.distanceKm.toLocaleString()}} km</strong><span>journey distance</span></div>
    </div>
   </div>
  </div>
  <KfeStatePanel v-else state="empty" :title="`No ${horizon.toLowerCase()} events`" :message="locationFilter==='ALL'?'Authoritative KFE events will appear here when available.':'No events match this location filter.'" />
 </div>
</template>
