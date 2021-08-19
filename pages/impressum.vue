<template>
  <impressum-content />
</template>

<script>
import Vue from 'vue'
import { getMetadata } from '@/utils/metadata'

const title = 'Rotki: Impressum'
const description = 'Impressum - DE'

export default Vue.extend({
  head: () => {
    return {
      title,
      meta: getMetadata(
        title,
        description,
        `${process.env.baseUrl}/impressum/`
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
@import '~assets/css/media';
@import '~assets/css/main';
</style>
