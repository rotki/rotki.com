<template>
  <PageContainer>
    <div class="mb-8">
      <SupportedExchanges />
      <SupportedDefi />
    </div>
  </PageContainer>
</template>
<script setup lang="ts">
import { commonAttrs, getMetadata } from '~/utils/metadata'

const title = 'supported exchanges and DeFi | rotki'
const description = 'Supported Exchanges and DeFi by Rotki'
const config = useRuntimeConfig()
const baseUrl = config.public.baseUrl

useHead({
  title,
  meta: getMetadata(title, description, `${baseUrl}/tos`, baseUrl),
  ...commonAttrs(),
})
</script>
