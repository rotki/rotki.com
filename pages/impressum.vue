<template>
  <impressum-content />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, getMetadata } from '@/utils/metadata'
import { useRuntimeConfig } from '~/composables/utils'

const title = 'impressum | rotki'
const description = 'Impressum - DE'

export default defineComponent({
  name: 'Impressum',
  setup() {
    const config = useRuntimeConfig()
    const baseUrl = config.baseUrl
    useMeta({
      title,
      meta: getMetadata(title, description, `${baseUrl}/impressum/`, baseUrl),
      ...commonAttrs(),
    })
  },
  head: {},
})
</script>

<style lang="scss">
@import '~assets/css/media';
@import '~assets/css/main';
</style>
