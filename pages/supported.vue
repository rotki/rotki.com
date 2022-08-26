<template>
  <page>
    <div class="mb-8">
      <supported-exchanges />
      <supported-defi />
    </div>
  </page>
</template>
<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { useRuntimeConfig } from '~/composables/utils'
import { commonAttrs, getMetadata } from '~/utils/metadata'

const title = 'supported exchanges and DeFi | rotki'
const description = 'Supported Exchanges and DeFi by Rotki'

export default defineComponent({
  name: 'Supported',
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
