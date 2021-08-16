<template>
  <pending-activation />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'Activation',
  setup() {
    useMeta({
      title: 'Rotki: Account activation',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: '',
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

<style lang="scss">
@import '~assets/css/main';
</style>
