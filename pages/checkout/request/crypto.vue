<template>
  <CryptoRequestPage />
</template>

<script setup lang="ts">
import { commonAttrs, noIndex } from '~/utils/metadata'

definePageMeta({
  middleware: [
    'maintenance',
    'authentication',
    'subscriber',
    'pending-payment',
  ],
})

useHead({
  title: 'pay with crypto | rotki',
  meta: [
    {
      key: 'description',
      name: 'description',
      content:
        'Create a request to pay with Crypto for your rotki premium subscription',
    },
    noIndex(),
  ],
  ...commonAttrs(),
})
useAutoLogout()
</script>
