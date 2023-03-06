<template>
  <PasswordForm />
</template>

<script setup lang="ts">
import { commonAttrs } from '~/utils/metadata'

definePageMeta({
  middleware: 'maintenance',
})

useHead({
  title: 'password recovery | rotki',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'Recover your rotki.com account password',
    },
  ],
  ...commonAttrs(),
})
</script>

<style lang="scss">
@import '@/assets/css/main.scss';
</style>
