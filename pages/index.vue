<template>
  <fragment>
    <Header />
    <hero @download="visible = true" />
    <features @download="visible = true" />
    <premium />
    <plans @download="visible = true" />
    <page-footer />
    <download-dialog v-if="visible" @dismiss="visible = false" />
  </fragment>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'
import { getMetadata } from '~/utils/metadata'

const description =
  'Rotki is an open source portfolio tracker, accounting and analytics tool that protects your privacy.'

const keywords = `portfolio,portfolio-tracking,cryptocurrency-portfolio-tracker,cryptocurrency,bitcoin,ethereum,
privacy,opensource,accounting,asset-management,taxes,tax-reporting`

export default defineComponent({
  data() {
    return {
      visible: false,
    }
  },
  head: () => {
    return {
      title: 'Rotki',
      meta: [
        {
          name: 'keywords',
          content: keywords,
        },
        ...getMetadata('Rotki', description, `${process.env.baseUrl}`),
      ],
      htmlAttrs: {
        class: 'page',
      },
      bodyAttrs: {
        class: 'body',
      },
    }
  },
  watch: {
    visible(visible: boolean) {
      document.body.style.overflowY = visible ? 'hidden' : 'auto'
    },
  },
})
</script>

<style lang="scss">
@import '~assets/css/main';
</style>
