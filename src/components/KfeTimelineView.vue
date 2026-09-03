<script setup>
import { computed } from 'vue';
import KfeStatePanel from './KfeStatePanel.vue';
import { projectTimeline } from '../../js/ui/timeline.js';
const props=defineProps({horizon:{type:String,default:'Day'},events:{type:Array,default:()=>[]}});
const projectedEvents=computed(()=>projectTimeline(props.events));
function timeLabel(value){if(!value)return 'Time unavailable';const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}):'Time unavailable';}
function dateLabel(value){if(!value)return '';const d=new Date(value);return Number.isFinite(d.getTime())?d.toLocaleDateString([], {day:'numeric',month:'short',year:'numeric'}):'Date unavailable';}
</script>
<template>
 <div class="kfe-timeline-view" :data-horizon="horizon">
  <div v-if="projectedEvents.length" class="kfe-timeline-list">
   <article v-for="event in projectedEvents" :key="event.id || `${event.type}:${event.occurredAt}`" class="kfe-timeline-event">
    <div class="kfe-timeline-event-time"><span v-if="horizon!=='Day'">{{ dateLabel(event.occurredAt) }} · </span>{{ timeLabel(event.occurredAt) }}</div>
    <div class="kfe-timeline-event-body">
     <strong>{{ event.type }}</strong>
     <span v-if="event.scope">{{ event.scope==='PERSONAL'?'Personal':'Business' }}</span>
     <span v-if="event.description">{{ event.description }}</span>
     <small v-if="event.amount !== null">₹ {{ Number(event.amount).toFixed(2) }}</small>
     <small v-if="event.odometer !== null">Odometer {{ event.odometer }}</small>
     <small v-if="event.locationName">{{ event.locationName }}</small>
     <small v-if="event.gpsAvailable">GPS captured</small>
    </div>
   </article>
  </div>
  <KfeStatePanel v-else state="empty" :title="`No ${horizon.toLowerCase()} events`" message="Authoritative KFE events will appear here when available." />
 </div>
</template>
