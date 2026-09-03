<script setup>
import { computed, ref } from 'vue';
import KfeStatePanel from './KfeStatePanel.vue';

const props = defineProps({
  online: { type: Boolean, default: true },
  performance: { type: Object, default: null },
});

const expanded = ref(null);
const historyOpen = ref(false);

const money = (value) => value == null ? '—' : `₹${(Number(value) / 100).toFixed(2)}`;
const number = (value, suffix = '') => value == null ? '—' : `${Number(value).toFixed(suffix ? 1 : 0)}${suffix}`;
const valueState = (value) => value == null ? 'unavailable' : 'actual';

const core = computed(() => [
  { key: 'revenue', label: 'Revenue', value: money(props.performance?.revenuePaise), state: valueState(props.performance?.revenuePaise) },
  { key: 'runningCost', label: 'Running Cost', value: money(props.performance?.runningCostPaise), state: valueState(props.performance?.runningCostPaise) },
  { key: 'balance', label: 'Balance', value: money(props.performance?.balancePaise), state: valueState(props.performance?.balancePaise) },
]);

const containers = computed(() => [
  { key: 'businessKm', group: 'Performance', title: 'Business KM', value: number(props.performance?.businessKm, ' km'), supporting: props.performance?.businessKm == null ? 'Authoritative work data required.' : 'Business use only.' },
  { key: 'revenuePerKm', group: 'Performance', title: 'Revenue / KM', value: money(props.performance?.revenuePerKmPaise), supporting: 'Derived from business revenue and business KM.' },
  { key: 'runningCostPerKm', group: 'Cost', title: 'Running Cost / KM', value: money(props.performance?.runningCostPerKmPaise), supporting: 'Uses authoritative running-cost allocation only.' },
  { key: 'workTime', group: 'Time', title: 'Work Time', value: number(props.performance?.workSeconds) === '—' ? '—' : number(props.performance?.workSeconds / 3600, ' h'), supporting: 'Accumulated work time from Work.' },
  { key: 'todayTarget', group: 'Intelligence', title: "Today's Target", value: money(props.performance?.todayTargetPaise), supporting: 'Target is separate from ERP accounting.' },
  { key: 'trajectory', group: 'Intelligence', title: 'Trajectory', value: props.performance?.trajectory ?? '—', supporting: props.performance?.trajectoryReason ?? 'Trajectory requires sufficient authoritative data.' },
]);

const brief = computed(() => props.performance?.brief ?? 'Today’s position will become understandable as authoritative activity is recorded.');
const why = computed(() => props.performance?.why ?? 'No interpretation is manufactured from missing data.');

function toggle(key) { expanded.value = expanded.value === key ? null : key; }
</script>

<template>
  <section class="kfe-performance" aria-labelledby="performance-title">
    <div class="kfe-performance-heading">
      <div>
        <p class="kfe-eyebrow">Today’s Position</p>
        <h1 id="performance-title">Performance</h1>
        <p class="kfe-destination-subtitle">Performance + Financial — understand where today stands without creating a second version of the truth.</p>
      </div>
      <span v-if="performance?.asOf" class="kfe-performance-freshness">Updated {{ new Date(performance.asOf).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span>
    </div>

    <KfeStatePanel v-if="performance?.error" state="error" title="Performance unavailable" :message="performance.error" />

    <template v-else>
      <article class="kfe-performance-brief">
        <div>
          <span class="kfe-card-label">TODAY’S POSITION</span>
          <strong>{{ brief }}</strong>
          <p>{{ why }}</p>
        </div>
      </article>

      <section class="kfe-performance-core" aria-label="Core financial position">
        <button v-for="item in core" :key="item.key" type="button" class="kfe-performance-core-item" @click="toggle(item.key)">
          <span class="kfe-card-label">{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
          <small>{{ item.state === 'actual' ? 'Authoritative' : 'Unavailable' }}</small>
        </button>
      </section>

      <section class="kfe-performance-grid" aria-label="Performance details">
        <article v-for="item in containers" :key="item.key" class="kfe-performance-card">
          <button type="button" class="kfe-performance-card-button" @click="toggle(item.key)">
            <span><small>{{ item.group }}</small><strong>{{ item.title }}</strong></span>
            <b>{{ item.value }}</b>
          </button>
          <div v-if="expanded === item.key" class="kfe-performance-detail">
            <p>{{ item.supporting }}</p>
            <span>Tap again to collapse.</span>
          </div>
        </article>
      </section>

      <article class="kfe-performance-why">
        <div><span class="kfe-card-label">WHY</span><strong>{{ why }}</strong></div>
        <p>Interpretation is deterministic and follows authoritative calculations; missing inputs remain unavailable.</p>
      </article>

      <section class="kfe-performance-history">
        <button type="button" class="kfe-performance-history-toggle" @click="historyOpen=!historyOpen">
          <span>History & context</span><span>{{ historyOpen ? '−' : '+' }}</span>
        </button>
        <div v-if="historyOpen" class="kfe-performance-history-body">
          <p>Historical depth is available here without changing today’s current-position surface.</p>
          <p v-if="performance?.history?.length">{{ performance.history.length }} historical records available.</p>
          <p v-else>No historical comparison is available from the current authoritative data.</p>
        </div>
      </section>
    </template>

    <KfeStatePanel v-if="!props.online" state="offline" title="Offline — operational" message="Performance continues to use valid local authoritative data; unavailable inputs are not converted to zero." />
  </section>
</template>

<style scoped>
.kfe-performance{padding:4px 0 32px}.kfe-performance-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:20px}.kfe-performance-heading h1{margin:0;font-size:clamp(1.7rem,5vw,2.25rem);line-height:1.1}.kfe-performance-freshness{flex:none;color:var(--kfe-shell-muted);font-size:.72rem;padding-top:6px}.kfe-performance-brief{padding:20px;border:1px solid var(--kfe-shell-border);border-radius:18px;background:var(--kfe-shell-surface);margin-bottom:12px}.kfe-performance-brief strong{display:block;font-size:1.2rem;line-height:1.35}.kfe-performance-brief p{margin:8px 0 0;color:var(--kfe-shell-muted);line-height:1.45}.kfe-performance-core{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:16px}.kfe-performance-core-item{min-width:0;min-height:104px;padding:14px;border:1px solid var(--kfe-shell-border);border-radius:14px;background:var(--kfe-shell-surface);color:var(--kfe-shell-text);text-align:left;cursor:pointer}.kfe-performance-core-item strong{display:block;font-size:1.05rem}.kfe-performance-core-item small{display:block;margin-top:7px;color:var(--kfe-shell-muted);font-size:.68rem}.kfe-performance-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.kfe-performance-card{border:1px solid var(--kfe-shell-border);border-radius:15px;background:var(--kfe-shell-surface);overflow:hidden}.kfe-performance-card-button{width:100%;min-height:96px;padding:14px;display:flex;align-items:center;justify-content:space-between;gap:12px;border:0;background:transparent;color:var(--kfe-shell-text);text-align:left;cursor:pointer}.kfe-performance-card-button span{display:grid;gap:5px}.kfe-performance-card-button small{color:var(--kfe-shell-muted);font-size:.68rem;text-transform:uppercase;letter-spacing:.05em}.kfe-performance-card-button b{font-size:1rem;text-align:right}.kfe-performance-detail{padding:0 14px 14px;border-top:1px solid var(--kfe-shell-border);color:var(--kfe-shell-muted);font-size:.78rem;line-height:1.45}.kfe-performance-detail p{margin:12px 0 5px}.kfe-performance-detail span{font-size:.68rem}.kfe-performance-why{display:grid;gap:8px;margin-top:16px;padding:18px;border:1px solid var(--kfe-shell-border);border-radius:16px;background:var(--kfe-shell-surface-2)}.kfe-performance-why strong{font-size:.95rem;line-height:1.4}.kfe-performance-why p{margin:0;color:var(--kfe-shell-muted);font-size:.76rem;line-height:1.45}.kfe-performance-history{margin-top:16px;border:1px solid var(--kfe-shell-border);border-radius:14px;background:var(--kfe-shell-surface);overflow:hidden}.kfe-performance-history-toggle{width:100%;min-height:52px;padding:10px 14px;display:flex;align-items:center;justify-content:space-between;border:0;background:transparent;color:var(--kfe-shell-text);cursor:pointer}.kfe-performance-history-body{padding:12px 14px 16px;border-top:1px solid var(--kfe-shell-border);color:var(--kfe-shell-muted);font-size:.78rem;line-height:1.45}.kfe-performance-history-body p{margin:6px 0}@media(max-width:560px){.kfe-performance-core{grid-template-columns:1fr}.kfe-performance-grid{grid-template-columns:1fr}.kfe-performance-heading{display:block}.kfe-performance-freshness{display:block;margin-top:8px}}
</style>
