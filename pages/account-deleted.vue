<template>
  <account-deleted-page />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, noIndex } from '~/utils/metadata'

export default defineComponent({
  name: 'AccountDeleted',
  setup() {
    useMeta({
      title: 'account deleted | rotki',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Your account has been successfully deleted',
        },
        noIndex(),
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
