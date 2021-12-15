<template>
  <paypal-page />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, noIndex } from '~/utils/metadata'

export default defineComponent({
  name: 'Crypto',
  middleware: 'authentication',
  setup() {
    useMeta({
      title: 'Rotki: Premium Pay with Paypal',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Pay with Paypal for your rotki premium subscription',
        },
        noIndex(),
      ],
      ...commonAttrs(),
    })
  },
  head: {},
})
</script>
