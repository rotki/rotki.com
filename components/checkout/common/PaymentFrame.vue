<template>
  <page wide>
    <div :class="$style.content">
      <checkout-title>Payment Details</checkout-title>

      <checkout-description>
        <div :class="$style.description">
          <span :class="$style.text">Payments are safely processed with</span>
          <braintree-icon :class="$style.braintree" />
        </div>
      </checkout-description>
      <loader v-if="loading" :class="$style.loader" />
      <slot v-else />
    </div>
  </page>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'PaymentFrame',
  props: {
    loading: {
      required: true,
      type: Boolean,
    },
  },
})
</script>

<style lang="scss" module>
.loader {
  min-height: 400px;
}

.braintree {
  @apply ml-1;

  width: 120px;
}

.text {
  @apply pt-0.5;
}

.description {
  @apply flex flex-row;
}

.content {
  padding: 0;
}
</style>
