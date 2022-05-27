<template>
  <card-page />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, noIndex } from '~/utils/metadata'
import { useAutoLogout } from '~/composables/autologout'
import { beforeRouteEnter, beforeRouteLeave } from '~/utils/csp-guard'

export default defineComponent({
  name: 'Card',
  beforeRouteEnter,
  beforeRouteLeave,
  middleware: ['maintenance', 'authentication', 'subscriber'],
  setup() {
    useMeta({
      title: 'pay with credit card | rotki',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Pay with Credit Card for your rotki premium subscription',
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
