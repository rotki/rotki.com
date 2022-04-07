<template>
  <products-page />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, getMetadata } from '~/utils/metadata'

const title = 'premium subscription | rotki'
const description = 'Features included with a premium rotki subscription'

export default defineComponent({
  setup() {
    useMeta({
      title,
      meta: getMetadata(title, description, `${process.env.baseUrl}/products/`),
      ...commonAttrs(),
    })
  },
  head: {},
})
</script>
