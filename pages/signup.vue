<template>
  <signup-form />
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  head: () => {
    return {
      title: 'Rotki: Signup',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Create a new rotki premium account',
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

<style lang="scss">
@import '~assets/css/main';
</style>
