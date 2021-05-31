<template>
  <shop />
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
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
