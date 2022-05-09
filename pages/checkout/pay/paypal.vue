<template>
  <paypal-page />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, noIndex } from '~/utils/metadata'
import { useAutoLogout } from '~/composables/autologout'

export default defineComponent({
  name: 'Crypto',
  middleware: ['maintenance', 'authentication', 'subscriber'],
  setup() {
    useMeta({
      title: 'pay with paypal | rotki',
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
    useAutoLogout()
  },
  head: {},
})
</script>
