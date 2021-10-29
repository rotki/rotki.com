<template>
  <payment-method-page />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'PaymentMethod',
  setup() {
    useMeta({
      title: 'Rotki: Select payment method',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Select how to pay for your rotki premium subscription',
        },
      ],
      htmlAttrs: {
        class: 'page',
      },
      bodyAttrs: {
        class: 'body',
      },
    })
  },
  head: {},
})
</script>
