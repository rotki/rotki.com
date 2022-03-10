<template>
  <impressum-content />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, getMetadata } from '@/utils/metadata'

const title = 'Rotki: Impressum'
const description = 'Impressum - DE'

export default defineComponent({
  name: 'Impressum',
  setup() {
    useMeta({
      title,
      meta: getMetadata(
        title,
        description,
        `${process.env.baseUrl}/impressum/`
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
