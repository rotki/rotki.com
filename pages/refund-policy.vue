<template>
  <PageContainer>
    <template #title> Rotki Refund and Cancellation Policy </template>
    Rotki has features that can be used in a daily basis to assist users with
    assets, portfolio management and analytics. But one of the main features is
    assistance with tax reporting, which is something that is used infrequently.
    Due to this nature of Rotki subscription
    <strong>refunds are not allowed</strong>. You can at any time cancel your
    subscription and from that point on no more payments will be made.
  </PageContainer>
</template>

<script setup lang="ts">
import { commonAttrs, getMetadata } from '~/utils/metadata'

const title = 'refund policy | rotki'
const description = 'Rotki Refund and Cancellation Policy'

const config = useRuntimeConfig()
const baseUrl = config.public.baseUrl

useHead({
  title,
  meta: getMetadata(title, description, `${baseUrl}/refund-policy/`, baseUrl),
  ...commonAttrs(),
})
</script>

<style lang="scss">
@import '@/assets/css/media.scss';
@import '@/assets/css/main.scss';
</style>
