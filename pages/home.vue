<template>
  <overview />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs } from '~/utils/metadata'

export default defineComponent({
  name: 'Home',
  middleware: ['maintenance', 'authentication'],
  setup() {
    useMeta({
      title: 'account | rotki',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Manage your rotki premium account',
        },
      ],
      ...commonAttrs(),
    })
  },
  head: {},
})
</script>

<style lang="scss">
@import '~assets/css/media';
@import '~assets/css/main';
</style>
