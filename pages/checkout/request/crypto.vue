<template>
  <crypto-request-page />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, noIndex } from '~/utils/metadata'
import { useAutoLogout } from '~/composables/autologout'

export default defineComponent({
  name: 'Crypto',
  middleware: [
    'maintenance',
    'authentication',
    'subscriber',
    'pending-payment',
  ],
  setup() {
    useMeta({
      title: 'pay with crypto | rotki',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content:
            'Create a request to pay with Crypto for your rotki premium subscription',
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
