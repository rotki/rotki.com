<template>
  <div :class="$style.content">
    <div :class="$style.methods">
      <payment-method-item selected>
        <ethereum-icon />
        <template #label> Ethereum </template>
      </payment-method-item>
      <payment-method-item>
        <bitcoin-icon />
        <template #label> Bitcoin </template>
      </payment-method-item>
      <payment-method-item>
        <dai-icon />
        <template #label> DAI </template>
      </payment-method-item>
      <payment-method-item>
        <card-icon />
        <template #label>Card</template>
      </payment-method-item>
      <payment-method-item>
        <paypal-icon />
        <template #label>Paypal</template>
      </payment-method-item>
    </div>
    <div :class="$style.continue">
      <selection-button selected @click="next">
        Continue to Checkout
      </selection-button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'PaymentMethodSelection',
  setup() {
    const next = () => {}

    return {
      next,
    }
  },
})
</script>

<style lang="scss" module>
.content {
  padding: 0;
}

.methods {
  @apply flex flex-row;

  > * {
    margin-left: 23px;
    margin-right: 23px;
  }
}

.continue {
  @apply flex flex-row justify-center mt-9;

  & > button {
    width: 187px;
  }
}
</style>
