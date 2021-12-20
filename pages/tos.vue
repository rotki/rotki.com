<template>
  <terms-of-service />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, getMetadata } from '~/utils/metadata'

const title = 'Rotki: Terms of service'
const description =
  'The terms and conditions outline the rules and regulations for the use of rotki.com Website and all services offered in the Premium Rotki subscription.'

export default defineComponent({
  name: 'TOS',
  setup() {
    useMeta({
      title,
      meta: getMetadata(title, description, process.env.baseUrl + '/tos'),
      ...commonAttrs(),
    })
  },
  head: {},
})
</script>

<style lang="scss">
@import '~assets/css/main';
</style>
