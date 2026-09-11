<script setup>
import { ref } from 'vue'

const appVersion = ref('v1.0-stable')
</script>

<template>
  <div style="padding: 12px; max-width: 600px; margin: 0 auto; box-sizing: border-box;">
    <header style="margin-bottom: 16px;">
      <h1 style="font-size: 1.25rem; font-weight: bold; color: #0f172a; margin: 0;">Admin Control Panel</h1>
      <p style="font-size: 0.8rem; color: #64748b; margin: 0;">System status & administrative settings</p>
    </header>

    <div style="background: white; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <h2 style="font-size: 1rem; font-weight: bold; color: #1e293b; margin: 0 0 8px 0;">System Information</h2>
      <p style="font-size: 0.85rem; color: #475569; margin: 0;">App Baseline: <strong>{{ appVersion }}</strong></p>
      <p style="font-size: 0.85rem; color: #475569; margin: 4px 0 0 0;">Database: <strong>IndexedDB (kanishka_pwa_db)</strong></p>
    </div>
  </div>
</template>
