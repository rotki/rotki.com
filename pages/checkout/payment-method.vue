<template>
  <payment-method-page />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, noIndex } from '~/utils/metadata'

export default defineComponent({
  name: 'PaymentMethod',
  middleware: ['maintenance', 'pending-payment', 'subscriber'],
  setup() {
    useMeta({
      title: 'select payment method | rotki',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Select how to pay for your rotki premium subscription',
        },
        noIndex(),
      ],
      ...commonAttrs(),
    })
  },
  head: {},
})
</script>
