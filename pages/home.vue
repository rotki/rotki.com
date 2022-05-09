<template>
  <overview />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, noIndex } from '~/utils/metadata'
import { useAutoLogout } from '~/composables/autologout'

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
        noIndex(),
      ],
      ...commonAttrs(),
    })
    useAutoLogout()
  },
  head: {},
})
</script>

<style lang="scss">
@import '~assets/css/media';
@import '~assets/css/main';
</style>
