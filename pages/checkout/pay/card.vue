<template>
  <card-page />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, noIndex } from '~/utils/metadata'

export default defineComponent({
  name: 'Card',
  middleware: ['authentication', 'subscriber'],
  setup() {
    useMeta({
      title: 'Rotki: Premium Pay with Credit Card',
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
  },
  head: {},
})
</script>
