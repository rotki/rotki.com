<template>
  <impressum-content />
</template>

<script lang="ts">
import { getMetadata } from '@/utils/metadata'
import { defineComponent } from '@nuxtjs/composition-api'

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
