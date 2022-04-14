<template>
  <activate />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, noIndex } from '~/utils/metadata'

export default defineComponent({
  setup() {
    useMeta({
      title: 'activate account | rotki',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Activate your new account',
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
@import '~/assets/css/main';
</style>
