<template>
  <privacy-policy-content />
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'
import { getMetadata } from '~/utils/metadata'

const title = 'Rotki: Privacy Policy'
const description =
  'Information for the website visitors regarding our policies with the collection, use, and disclosure of Personal Information regarding the service usage'

export default defineComponent({
  name: 'PrivacyPolicy',
  head: () => {
    return {
      title,
      meta: getMetadata(
        title,
        description,
        `${process.env.baseUrl}/privacy-policy/`
      ),
      htmlAttrs: {
        class: 'page',
      },
      bodyAttrs: {
        class: 'body',
      },
    }
  },
})
</script>

<style lang="scss">
@import '~assets/css/main';
</style>
