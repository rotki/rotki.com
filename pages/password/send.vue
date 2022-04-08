<template>
  <password-link-send />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, noIndex } from '~/utils/metadata'

export default defineComponent({
  setup() {
    useMeta({
      title: 'recovery e-mail send | rotki',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'The password recovery link has been send to your address',
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
