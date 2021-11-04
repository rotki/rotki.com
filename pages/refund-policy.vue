<template>
  <page>
    <template #title> Rotki Refund and Cancellation Policy </template>

    Rotki has features that can be used in a daily basis to assist users with
    assets, portfolio management and analytics. But one of the main features is
    assistance with tax reporting, which is something that is used infrequently.
    Due to this nature of Rotki
    <strong>subscription refunds are not allowed</strong>. You can at any time
    cancel your subscription and from that point on no more payments will be
    made.
  </page>
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, getMetadata } from '~/utils/metadata'

const title = 'Rotki: Refund Policy'
const description = 'Rotki Refund and Cancellation Policy'
export default defineComponent({
  setup() {
    useMeta({
      title,
      meta: getMetadata(
        title,
        description,
        `${process.env.baseUrl}/refund-policy/`
      ),
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
