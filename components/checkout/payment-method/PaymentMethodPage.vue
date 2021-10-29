<template>
  <page wide>
    <template #title> Select a Payment method </template>
    <payment-method-selection />
  </page>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'PaymentMethodPage',
})
</script>

<style lang="scss" module>
.methods {
  padding: 0;
}
</style>
