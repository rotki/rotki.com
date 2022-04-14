<template>
  <terms-of-service />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, getMetadata } from '~/utils/metadata'
import { useRuntimeConfig } from '~/composables/utils'

const title = 'terms of service | rotki'
const description =
  'The terms and conditions outline the rules and regulations for the use of rotki.com Website and all services offered in the Premium Rotki subscription.'

export default defineComponent({
  name: 'TOS',
  setup() {
    const config = useRuntimeConfig()
    const baseUrl = config.baseUrl
    useMeta({
      title,
      meta: getMetadata(title, description, `${baseUrl}/tos`, baseUrl),
      ...commonAttrs(),
    })
  },
  head: {},
})
</script>

<style lang="scss">
@import '~assets/css/main';
</style>
