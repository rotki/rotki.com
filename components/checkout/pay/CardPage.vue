<template>
  <payment-frame :loading="!token" :step="step">
    <card-payment
      v-if="token"
      :plan="plan"
      :token="token"
      @pay="submit($event)"
      @update:pending="pending = $event"
    />
  </payment-frame>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'
import { useBraintree } from '~/composables/braintree'

export default defineComponent({
  name: 'CardPage',
  setup() {
    return useBraintree()
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
