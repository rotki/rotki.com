<template>
  <plan-selection-page />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, noIndex } from '~/utils/metadata'

export default defineComponent({
  name: 'Plan',
  middleware: ['pending-payment'],
  setup() {
    useMeta({
      title: 'Rotki: Select premium plan',
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
