<template>
  <PasswordChanged />
</template>

<script setup lang="ts">
import { commonAttrs, noIndex } from '~/utils/metadata'

definePageMeta({
  middleware: 'maintenance',
})

useHead({
  title: 'password changed | rotki',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'The rotki account password changed with success',
    },
    noIndex(),
  ],
  ...commonAttrs(),
})
</script>

<style lang="scss">
@import '@/assets/css/main.scss';
</style>
