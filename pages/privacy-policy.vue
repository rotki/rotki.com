<template>
  <privacy-policy-content />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, getMetadata } from '~/utils/metadata'

const title = 'privacy policy | rotki'
const description =
  'Information for the website visitors regarding our policies with the collection, use, and disclosure of Personal Information regarding the service usage'

export default defineComponent({
  name: 'PrivacyPolicy',
  setup() {
    useMeta({
      title,
      meta: getMetadata(
        title,
        description,
        `${process.env.baseUrl}/privacy-policy/`
      ),
      ...commonAttrs(),
    })
  },
  head: {},
})
</script>

<style lang="scss">
@import '~assets/css/main';
</style>
