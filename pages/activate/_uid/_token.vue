<template>
  <activate />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, noIndex } from '~/utils/metadata'

export default defineComponent({
  setup() {
    useMeta({
      title: 'Rotki: Activate account',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Reset your rotki account',
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
