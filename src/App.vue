<script setup>
import AppLayout from '@/layouts/AppLayout.vue'
import BaseToast from '@/components/ui/BaseToast.vue'
import ReloadPrompt from '@/components/pwa/ReloadPrompt.vue'
</script>

<template>
  <AppLayout>
    <router-view />
    <BaseToast />
    <ReloadPrompt />
  </AppLayout>
</template>
