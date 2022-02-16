<template>
  <custom-checkbox id="refund" :value="value" @input="input">
    <span>
      I have read and agreed to the
      <nuxt-link :class="$style.link" target="_blank" to="/refund-policy">
        Refunds/Cancellation Policy
      </nuxt-link>
    </span>
  </custom-checkbox>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'AcceptRefundPolicy',
  props: {
    value: { required: true, type: Boolean },
  },
  emits: ['input'],
  setup(_, { emit }) {
    const input = (value: boolean) => emit('input', value)
    return { input }
  },
})
</script>

<style module lang="scss">
.link {
  @apply text-primary3;
}
</style>
