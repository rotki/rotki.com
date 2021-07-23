<template>
  <login-form />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'

export default defineComponent({
  setup() {
    useMeta({
      title: 'Rotki: Login',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Manage your rotki premium account',
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
