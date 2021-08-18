<template>
  <password-link-invalid />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, noIndex } from '~/utils/metadata'

export default defineComponent({
  setup() {
    useMeta({
      title: 'Rotki: Invalid recovery link',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'This password recovery link is not valid',
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
