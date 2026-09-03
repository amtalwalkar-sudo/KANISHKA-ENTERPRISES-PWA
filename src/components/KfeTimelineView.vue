<script setup>
import { computed, ref } from 'vue';
import KfeStatePanel from './KfeStatePanel.vue';
import { projectTimeline, buildTimelineJourneyModel, summarizeOutstationJourneys, summarizeTimelineActivity } from '../../js/ui/timeline.js';
import '../styles/timeline-horizons.css';

const props=defineProps({horizon:{type:String,default:'Day'},events:{type:Array,default:()=>[]}});
const locationFilter=ref('ALL');
const locationMenuOpen=ref(false);
const longTermMode=ref('ALL');
function timeLabel(value){if(!value)return 'Time unavailable';const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}):'Time unavailable';}
function dateLabel(value){if(!value)return '';const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleDateString([], {day:'numeric',month:'short',year:'numeric'}):'Date unavailable';}
function monthLabel(value){if(!value)return 'Unknown period';const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleDateString([], {month:'long',year:'numeric'}):'Unknown period';}
function dayKey(value){const d=new Date(value);return Number.isFinite(d.getTime())?`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`:'unknown';}
function monthKey(value){const d=new Date(value);return Number.isFinite(d.getTime())?`${d.getFullYear()}-${d.getMonth()}`:'unknown';}
function locationKey(value){return String(value||'').trim().toLowerCase();}
function isMumbaiArea(value){const key=locationKey(value);return key==='mumbai'||key==='navi mumbai'||key.includes('mumbai');}
function isOutsideMumbai(value){return Boolean(value)&&!isMumbaiArea(value);}
function isTrip(event){return String(event.type||'').toLowerCase().includes('trip');}
function iconFor(event){const type=String(event.type||'').toLowerCase();if(type.includes('fuel'))return '⛽';if(type.includes('maintenance'))return '🔧';if(type.includes('expense'))return '💳';if(type.includes('revenue'))return '💰';if(type.includes('loan'))return '🏦';if(type.includes('compliance')||type.includes('renew'))return '📄';if(type.includes('personal'))return '👤';if(type.includes('trip'))return '🚗';if(type.includes('shift')||type.includes('work'))return type.includes('end')?'🔴':'🟢';return '•';}
function eventLabel(event){const type=String(event.type||'Other');const lower=type.toLowerCase();if(lower==='start shift'||lower==='work session')return 'Work Session';if(lower.includes('start')&&lower.includes('shift'))return 'Work Started';if(lower.includes('end')&&lower.includes('shift'))return 'Work Ended';if(lower.includes('business trip'))return 'Business Trip';if(lower.includes('personal trip'))return 'Personal Trip';return type;}
function displayScope(event){return event.scope==='PERSONAL'?'Personal':event.scope==='BUSINESS'?'Business':'';}
function selectLocation(value){locationFilter.value=value;locationMenuOpen.value=false;}
function selectLongTermMode(value){longTermMode.value=value;}
const projectedEvents=computed(()=>projectTimeline(props.events));
const journeyModel=computed(()=>buildTimelineJourneyModel(projectedEvents.value));
const outstationSummary=computed(()=>summarizeOutstationJourneys(projectedEvents.value));
const activitySummary=computed(()=>summarizeTimelineActivity(projectedEvents.value));
const locations=computed(()=>Array.from(new Set(projectedEvents.value.map(e=>String(e.locationName||'').trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b)));
const outsideLocations=computed(()=>locations.value.filter(isOutsideMumbai));
const filteredEvents=computed(()=>projectedEvents.value.filter(event=>{const loc=event.locationName||'';if(locationFilter.value==='ALL')return true;if(locationFilter.value==='MUMBAI')return isMumbaiArea(loc);if(locationFilter.value==='OUTSIDE')return isOutsideMumbai(loc);return loc===locationFilter.value;}));
const displayEvents=computed(()=>{let previousOdometerEvent=null;return filteredEvents.value.map((event,index)=>{let distanceKm=null;if(event.odometer!==null&&event.odometer!==undefined&&previousOdometerEvent){const delta=Number(event.odometer)-Number(previousOdometerEvent.odometer);if(Number.isFinite(delta)&&delta>=0)distanceKm=delta;}if(event.odometer!==null&&event.odometer!==undefined)previousOdometerEvent=event;return {...event,distanceKm,hasConnector:index<filteredEvents.value.length-1};});});
const dayGroups=computed(()=>{const map=new Map();for(const event of displayEvents.value){const key=dayKey(event.occurredAt);if(!map.has(key))map.set(key,{key,date:event.occurredAt,events:[]});map.get(key).events.push(event);}return [...map.values()].sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));});
const monthGroups=computed(()=>{const map=new Map();for(const event of displayEvents.value){const key=monthKey(event.occurredAt);if(!map.has(key))map.set(key,{key,date:event.occurredAt,events:[],distanceKm:0,destinations:new Set(),business:0,personal:0});const group=map.get(key);group.events.push(event);if(event.distanceKm!==null)group.distanceKm+=event.distanceKm;if(event.locationName)group.destinations.add(event.locationName);if(event.scope==='BUSINESS')group.business++;if(event.scope==='PERSONAL')group.personal++;}return [...map.values()].sort((a,b)=>Date.parse(a.date)-Date.parse(b.date)).map(g=>({...g,destinations:[...g.destinations].sort()}));});
const selectedDestinationSummary=computed(()=>outstationSummary.value.destinations);
const selectedMonthlyGroups=computed(()=>{const map=new Map();for(const event of projectedEvents.value){const area=isMumbaiArea(event.locationName)?'MUMBAI':isOutsideMumbai(event.locationName)?'OUTSIDE':'UNKNOWN';if(longTermMode.value==='MUMBAI'&&area!=='MUMBAI')continue;if(longTermMode.value==='OUTSTATION'&&area!=='OUTSIDE')continue;const key=monthKey(event.occurredAt);if(!map.has(key))map.set(key,{key,date:event.occurredAt,trips:0,events:0});const group=map.get(key);group.events++;if(isTrip(event))group.trips++;}return [...map.values()].sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));});
const selectedLongTermJourneys=computed(()=>longTermMode.value==='OUTSTATION'?outstationSummary.value.journeys:[]);
const filterLabel=computed(()=>locationFilter.value==='ALL'?'All Locations':locationFilter.value==='MUMBAI'?'Mumbai Area':locationFilter.value==='OUTSIDE'?'Outside Mumbai':locationFilter.value);
</script>

<template>
 <div class="kfe-timeline-view" :data-horizon="horizon">
  <div class="kfe-timeline-toolbar">
   <div><span class="kfe-timeline-toolbar-label">Location</span><strong>{{horizon==='Day'?'Journey history':horizon==='Week'?'Weekly journey overview':'Journey history & trends'}}</strong></div>
   <div class="kfe-location-filter">
    <button type="button" class="kfe-location-trigger" :aria-expanded="locationMenuOpen" @click="locationMenuOpen=!locationMenuOpen"><span aria-hidden="true">📍</span><span>{{filterLabel}}</span><span class="kfe-location-chevron" aria-hidden="true">⌄</span></button>
    <div v-if="locationMenuOpen" class="kfe-location-menu" role="menu">
     <div class="kfe-location-menu-section">ALL</div><button type="button" :class="{'is-selected':locationFilter==='ALL'}" @click="selectLocation('ALL')">All Locations</button>
     <div class="kfe-location-menu-section">JOURNEY AREA</div><button type="button" :class="{'is-selected':locationFilter==='MUMBAI'}" @click="selectLocation('MUMBAI')">📍 Mumbai Area</button><button type="button" :class="{'is-selected':locationFilter==='OUTSIDE'}" @click="selectLocation('OUTSIDE')">🧭 Outside Mumbai</button>
     <template v-if="outsideLocations.length"><div class="kfe-location-menu-section">OUTSIDE-MUMBAI LOCATIONS</div><button v-for="location in outsideLocations" :key="location" type="button" :class="{'is-selected':locationFilter===location}" @click="selectLocation(location)">📍 {{location}}</button></template>
    </div>
   </div>
  </div>

  <template v-if="horizon==='Day'">
   <div v-if="displayEvents.length" class="kfe-journey-timeline">
    <div v-for="(event,index) in displayEvents" :key="event.id || `${event.type}:${event.occurredAt}:${index}`" class="kfe-journey-item">
     <div class="kfe-journey-rail" aria-hidden="true"><span class="kfe-journey-dot">{{iconFor(event)}}</span><span v-if="index<displayEvents.length-1" class="kfe-journey-line"></span></div>
     <div class="kfe-journey-content"><div class="kfe-journey-time">{{timeLabel(event.occurredAt)}}</div><article class="kfe-journey-card"><div class="kfe-journey-card-heading"><div><strong>{{eventLabel(event)}}</strong><span v-if="displayScope(event)" class="kfe-scope-badge">{{displayScope(event)}}</span></div></div><div v-if="event.locationName" class="kfe-journey-location"><span aria-hidden="true">📍</span><span>{{event.locationName}}</span><span v-if="event.gpsAvailable" class="kfe-gps-badge">GPS</span></div><p v-if="event.description" class="kfe-journey-description">{{event.description}}</p><div v-if="event.amount!==null" class="kfe-journey-value">₹ {{Number(event.amount).toFixed(2)}}</div></article><div v-if="event.distanceKm!==null" class="kfe-journey-distance"><span class="kfe-distance-arrow">↓</span><strong>{{event.distanceKm.toLocaleString()}} km</strong><span>journey distance</span></div></div>
    </div>
   </div>
  </template>

  <template v-else-if="horizon==='Week'">
   <div v-if="dayGroups.length" class="kfe-week-timeline">
    <section v-for="group in dayGroups" :key="group.key" class="kfe-week-day-card">
     <header class="kfe-week-day-heading"><div><strong>{{dateLabel(group.date)}}</strong><span>{{group.events.length}} {{group.events.length===1?'event':'events'}}</span></div><span>{{group.events.filter(e=>isTrip(e)).length}} trips</span></header>
     <div class="kfe-week-events">
      <div v-for="event in group.events" :key="event.id || `${event.type}:${event.occurredAt}`" class="kfe-week-event"><span class="kfe-week-event-icon" aria-hidden="true">{{iconFor(event)}}</span><div class="kfe-week-event-main"><div><strong>{{eventLabel(event)}}</strong><span v-if="displayScope(event)" class="kfe-scope-badge">{{displayScope(event)}}</span></div><span class="kfe-week-event-meta">{{timeLabel(event.occurredAt)}}<template v-if="event.locationName"> · {{event.locationName}}</template></span></div><span v-if="event.distanceKm!==null" class="kfe-week-event-distance">{{event.distanceKm.toLocaleString()}} km</span></div>
     </div>
    </section>
   </div>
  </template>

  <template v-else>
   <div v-if="displayEvents.length" class="kfe-longterm">
    <div class="kfe-longterm-summary">
     <div><span>Active days</span><strong>{{activitySummary.activeDays}}</strong></div>
     <button type="button" class="kfe-longterm-summary-card" :class="{'is-selected':longTermMode==='ALL'}" @click="selectLongTermMode('ALL')"><span>Trips</span><strong>{{activitySummary.trips}}</strong></button>
     <button type="button" class="kfe-longterm-summary-card" :class="{'is-selected':longTermMode==='OUTSTATION'}" @click="selectLongTermMode('OUTSTATION')"><span>Outstation journeys</span><strong>{{activitySummary.outstationJourneys}}</strong></button>
     <div><span>Recorded distance</span><strong>{{displayEvents.reduce((sum,e)=>sum+(e.distanceKm||0),0).toLocaleString()}} km</strong></div>
    </div>

    <div class="kfe-longterm-split">
     <button type="button" class="kfe-longterm-activity-card" :class="{'is-selected':longTermMode==='MUMBAI'}" @click="selectLongTermMode('MUMBAI')"><span>Mumbai</span><strong>{{activitySummary.mumbaiTrips}} trips</strong><small>Tap to view Mumbai activity</small></button>
     <button type="button" class="kfe-longterm-activity-card" :class="{'is-selected':longTermMode==='OUTSTATION'}" @click="selectLongTermMode('OUTSTATION')"><span>Outstation</span><strong>{{activitySummary.outstationJourneys}} journeys</strong><small>Tap to view destinations & journeys</small></button>
    </div>

    <template v-if="longTermMode==='OUTSTATION'">
     <section v-if="selectedDestinationSummary.length" class="kfe-longterm-detail-card">
      <header><div><span>OUTSTATION DESTINATIONS</span><h2>Top outstation destinations</h2></div><strong>{{outstationSummary.count}} journeys</strong></header>
      <div class="kfe-destination-rank"><button v-for="destination in selectedDestinationSummary" :key="destination.name" type="button" @click="selectLocation(destination.name)"><span>{{destination.name}}</span><strong>{{destination.count}}</strong></button></div>
     </section>
     <section v-if="selectedLongTermJourneys.length" class="kfe-outstation-journeys">
      <article v-for="(journey,index) in selectedLongTermJourneys" :key="journey.id" class="kfe-outstation-journey-card">
       <header><div><span>OUTSTATION JOURNEY #{{index+1}}</span><h2>{{journey.origin}} → {{journey.destination}} → Mumbai</h2></div><small>{{dateLabel(journey.startedAt)}}</small></header>
       <div class="kfe-outstation-events"><div v-for="(event,eventIndex) in journey.events" :key="event.id || `${journey.id}:${eventIndex}`" class="kfe-outstation-event"><span class="kfe-outstation-event-icon">{{eventIndex===journey.events.length-1&&isMumbaiArea(event.locationName)?'↩️':iconFor(event)}}</span><span>{{eventIndex===journey.events.length-1&&isMumbaiArea(event.locationName)?'Return':eventLabel(event)}}</span><small v-if="event.locationName">{{event.locationName}}</small></div></div>
      </article>
     </section>
    </template>

    <template v-else-if="longTermMode==='MUMBAI'">
     <section class="kfe-longterm-detail-card"><header><div><span>MUMBAI ACTIVITY</span><h2>Mumbai trip activity</h2></div><strong>{{activitySummary.mumbaiTrips}} trips</strong></header><div class="kfe-longterm-month-list"><div v-for="group in selectedMonthlyGroups" :key="group.key"><span>{{monthLabel(group.date)}}</span><strong>{{group.trips}} trips</strong></div></div></section>
    </template>

    <div v-else class="kfe-longterm-groups"><section v-for="group in monthGroups" :key="group.key" class="kfe-longterm-month"><header><div><span>Period</span><h2>{{monthLabel(group.date)}}</h2></div><strong>{{group.events.length}} events</strong></header><div class="kfe-longterm-metrics"><span>{{group.events.filter(e=>isTrip(e)).length}} trips</span><span>{{group.distanceKm.toLocaleString()}} km</span><span>{{group.business}} business</span><span>{{group.personal}} personal</span></div><div v-if="group.destinations.length" class="kfe-destination-list"><span v-for="destination in group.destinations" :key="destination">📍 {{destination}}</span></div></section></div>
   </div>
  </template>
  <KfeStatePanel v-if="!displayEvents.length" state="empty" :title="`No ${horizon.toLowerCase()} events`" :message="locationFilter==='ALL'?'Authoritative KFE events will appear here when available.':'No events match this location filter.'" />
 </div>
</template>
