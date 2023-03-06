<template>
  <PasswordReset />
</template>

<script setup lang="ts">
import { commonAttrs, noIndex } from '~/utils/metadata'

definePageMeta({
  middleware: 'maintenance',
})

useHead({
  title: 'reset password | rotki',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'Reset your rotki password',
    },
    noIndex(),
  ],
  ...commonAttrs(),
})
</script>

<style lang="scss">
@import '@/assets/css/main.scss';
</style>
