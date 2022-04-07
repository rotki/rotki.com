<template>
  <crypto-page />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, noIndex } from '~/utils/metadata'

export default defineComponent({
  name: 'Crypto',
  middleware: ['maintenance', 'authentication', 'subscriber'],
  setup() {
    useMeta({
      title: 'pay with crypto | rotki',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Pay with Crypto for your rotki premium subscription',
        },
        noIndex(),
      ],
      ...commonAttrs(),
    })
  },
  head: {},
})
</script>
