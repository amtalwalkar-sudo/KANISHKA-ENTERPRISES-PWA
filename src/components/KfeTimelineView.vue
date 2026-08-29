<script setup>
import { computed } from 'vue';
import KfeStatePanel from './KfeStatePanel.vue';
import { projectTimeline } from '../../js/ui/timeline.js';

const props = defineProps({
  horizon: { type: String, default: 'Today' },
  events: { type: Array, default: () => [] },
});

const projectedEvents = computed(() => projectTimeline(props.events));
</script>

<template>
  <div class="kfe-timeline-view" :data-horizon="horizon">
    <div v-if="projectedEvents.length" class="kfe-timeline-list">
      <article v-for="event in projectedEvents" :key="event.id || `${event.type}:${event.occurredAt}`" class="kfe-timeline-event">
        <div class="kfe-timeline-event-time">{{ event.occurredAt || 'Time unavailable' }}</div>
        <div class="kfe-timeline-event-body">
          <strong>{{ event.type }}</strong>
          <span v-if="event.description">{{ event.description }}</span>
          <small v-if="event.amount !== null">₹ {{ event.amount }}</small>
          <small v-if="event.odometer !== null">Odometer {{ event.odometer }}</small>
          <small v-if="event.locationName">{{ event.locationName }}</small>
        </div>
      </article>
    </div>
    <KfeStatePanel v-else state="empty" :title="`No ${horizon.toLowerCase()} events`" message="Authoritative KFE events will appear here when available." />
  </div>
</template>
