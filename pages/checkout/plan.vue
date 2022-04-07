<template>
  <plan-selection-page />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, noIndex } from '~/utils/metadata'

export default defineComponent({
  name: 'Plan',
  middleware: ['maintenance', 'pending-payment', 'subscriber'],
  setup() {
    useMeta({
      title: 'select premium plan | rotki',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Select your rotki premium plan',
        },
        noIndex(),
      ],
      ...commonAttrs(),
    })
  },
  head: {},
})
</script>
