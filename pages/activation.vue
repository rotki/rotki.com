<template>
  <pending-activation />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, noIndex } from '~/utils/metadata'

export default defineComponent({
  name: 'Activation',
  setup() {
    useMeta({
      title: 'account activation | rotki',
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
