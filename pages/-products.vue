<template>
  <shop />
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'Products',
  head: () => {
    return {
      title: 'Rotki: Premium Subscription',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Purchase a premium rotki subscription',
        },
      ],
      htmlAttrs: {
        class: 'page',
      },
      bodyAttrs: {
        class: 'body',
      },
    }
  },
})
</script>
