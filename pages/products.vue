<template>
  <login-page />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, getMetadata } from '~/utils/metadata'

const title = 'Rotki: Premium Subscription'
const description = 'Features included with a premium rotki subscription'

export default defineComponent({
  setup() {
    useMeta({
      title,
      meta: getMetadata(
        title,
        description,
        `${process.env.BASE_URL}/products/`
      ),
      ...commonAttrs(),
    })
  },
  head: {},
})
</script>

<style lang="scss">
@import '~assets/css/main';
</style>
