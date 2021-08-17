<template>
  <account-activated />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, noIndex } from '~/utils/metadata'

export default defineComponent({
  name: 'Activated',
  setup() {
    useMeta({
      title: 'Rotki: Account successfully activated',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: '',
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
@import '~assets/css/main';
</style>
