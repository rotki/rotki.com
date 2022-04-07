<template>
  <password-reset />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, noIndex } from '~/utils/metadata'

export default defineComponent({
  middleware: 'maintenance',
  setup() {
    useMeta({
      title: 'password rest | rotki',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Reset your rotki password',
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
@import '~~/assets/css/main';
</style>
