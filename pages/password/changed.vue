<template>
  <password-changed />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, noIndex } from '~/utils/metadata'

export default defineComponent({
  setup() {
    useMeta({
      title: 'password changed | rotki',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'The rotki account password changed with success',
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
