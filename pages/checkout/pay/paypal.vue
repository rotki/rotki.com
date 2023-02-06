<template>
  <PaypalPage />
</template>

<script setup lang="ts">
import { commonAttrs, noIndex } from '~/utils/metadata'

definePageMeta({
  middleware: ['maintenance', 'authentication', 'subscriber', 'csp'],
})

useHead({
  title: 'pay with paypal | rotki',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'Pay with Paypal for your rotki premium subscription',
    },
    noIndex(),
  ],
  ...commonAttrs(),
})

useAutoLogout()

onBeforeRouteLeave((to, _from, next) => {
  next(false)
  window.location.href = to.fullPath
})
</script>
