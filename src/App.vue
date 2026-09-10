<script setup>
import AppLayout from '@/layouts/AppLayout.vue'
import BaseToast from '@/components/ui/BaseToast.vue'
</script>

<template>
  <AppLayout>
    <router-view />
    <BaseToast />
  </AppLayout>
</template>
