<template>
  <fragment>
    <Header landing />
    <hero @download="visible = true" />
    <features @download="visible = true" />
    <premium />
    <plans @download="visible = true" />
    <page-footer landing />
    <download-dialog v-if="visible" @dismiss="visible = false" />
  </fragment>
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, getMetadata } from '~/utils/metadata'
import { setupOverflow } from '~/composables/overflow'
import { useRuntimeConfig } from '~/composables/utils'

const description =
  'rotki is an open source portfolio tracker, accounting and analytics tool that protects your privacy.'

const keywords = `portfolio,portfolio-tracking,cryptocurrency-portfolio-tracker,cryptocurrency,bitcoin,ethereum,
privacy,opensource,accounting,asset-management,taxes,tax-reporting`

export default defineComponent({
  name: 'Index',
  setup() {
    const config = useRuntimeConfig()
    const baseUrl = config.baseUrl
    useMeta({
      title: 'rotki',
      meta: [
        {
          name: 'keywords',
          content: keywords,
        },
        ...getMetadata('rotki', description, baseUrl, baseUrl),
      ],
      ...commonAttrs(),
    })
    return setupOverflow()
  },
  head: {},
})
</script>

<style lang="scss">
@import '~assets/css/main';
</style>
