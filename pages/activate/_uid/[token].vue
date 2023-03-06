<template>
  <AccountActivate />
</template>

<script setup lang="ts">
import { commonAttrs, noIndex } from '~/utils/metadata'

definePageMeta({
  middleware: 'maintenance',
})

useHead({
  title: 'activate account | rotki',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'Activate your new account',
    },
    noIndex(),
  ],
  ...commonAttrs(),
})
</script>

<style lang="scss">
@import '@/assets/css/main.scss';
</style>
