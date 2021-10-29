<template>
  <plan-selection-page />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'Plan',
  setup() {
    useMeta({
      title: 'Rotki: Select premium plan',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Select your rotki premium plan',
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
