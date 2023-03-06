<template>
  <LoginPage />
</template>

<script setup lang="ts">
import { commonAttrs } from '~/utils/metadata'

definePageMeta({
  middleware: ['maintenance', 'authenticated'],
})

useHead({
  title: 'login | rotki',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'Manage your rotki premium account',
    },
  ],
  ...commonAttrs(),
})
</script>

<style lang="scss">
@import '@/assets/css/main.scss';
</style>
