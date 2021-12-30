<template>
  <payment-frame :loading="!token">
    <card-payment
      v-if="token"
      :plan="plan"
      :token="token"
      @pay="submit($event)"
    />
  </payment-frame>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'
import { setupBraintree } from '~/composables/braintree'

export default defineComponent({
  name: 'CardPage',
  middleware: ['subscription'],
  setup() {
    return setupBraintree()
  },
})
</script>

<style lang="scss" module>
.card {
  @apply absolute top-3.5 right-2;

  width: 24px;
  height: 24px;
}
</style>
