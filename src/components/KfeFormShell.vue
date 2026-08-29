<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps({
  draftKey: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  initialValue: { type: Object, default: () => ({}) },
  saving: { type: Boolean, default: false },
  valid: { type: Boolean, default: true },
});

const emit = defineEmits(['save', 'discard', 'change']);
const value = ref({ ...props.initialValue });
const hasDraft = ref(false);
let timer = null;

const storageKey = computed(() => `kfe:draft:${props.draftKey}`);

function loadDraft() {
  try {
    const raw = globalThis.localStorage?.getItem(storageKey.value);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      value.value = { ...props.initialValue, ...parsed };
      hasDraft.value = true;
    }
  } catch (_) {}
}

function persistDraft() {
  try {
    globalThis.localStorage?.setItem(storageKey.value, JSON.stringify(value.value));
    hasDraft.value = true;
  } catch (_) {}
}

function clearDraft() {
  try { globalThis.localStorage?.removeItem(storageKey.value); } catch (_) {}
  hasDraft.value = false;
}

function onSubmit() {
  if (props.saving || !props.valid) return;
  emit('save', { ...value.value });
}

function discard() {
  clearDraft();
  value.value = { ...props.initialValue };
  emit('discard');
}

watch(value, (next) => {
  emit('change', { ...next });
  clearTimeout(timer);
  timer = setTimeout(persistDraft, 250);
}, { deep: true });

onMounted(loadDraft);
onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <form class="kfe-form-shell" @submit.prevent="onSubmit">
    <header class="kfe-form-heading">
      <div>
        <p class="kfe-eyebrow">KFE 2.0</p>
        <h1>{{ title }}</h1>
        <p v-if="subtitle" class="kfe-destination-subtitle">{{ subtitle }}</p>
      </div>
      <span v-if="hasDraft" class="kfe-draft-badge">Unsaved draft</span>
    </header>

    <div class="kfe-form-body">
      <slot :value="value" />
    </div>

    <footer class="kfe-form-actions">
      <button v-if="hasDraft" type="button" class="kfe-secondary-action" :disabled="saving" @click="discard">Discard draft</button>
      <button type="submit" class="kfe-primary-action" :disabled="saving || !valid">
        <span v-if="saving">Saving…</span>
        <span v-else>Save</span>
      </button>
    </footer>
  </form>
</template>
