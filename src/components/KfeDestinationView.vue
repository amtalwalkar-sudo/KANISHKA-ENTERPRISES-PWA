<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  eyebrow: { type: String, default: 'KFE 2.0' },
})
</script>

<template>
  <section class="kfe-destination" :aria-labelledby="`destination-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`">
    <p class="kfe-eyebrow">{{ eyebrow }}</p>
    <h1 :id="`destination-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`">{{ title }}</h1>
    <p class="kfe-destination-subtitle">{{ subtitle }}</p>
    <slot />
  </section>
</template>
