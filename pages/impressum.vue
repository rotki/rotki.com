<template>
  <impressum-content />
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'
import { getMetadata } from '@/utils/metadata'

const title = 'Rotki: Impressum'
const description = 'Impressum - DE'

export default defineComponent({
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
