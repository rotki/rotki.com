<template>
  <terms-of-service />
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'
import { getMetadata } from '~/utils/metadata'

const title = 'Rotki: Terms of service'
const description =
  'The terms and conditions outline the rules and regulations for the use of rotki.com Website and all services offered in the Premium Rotki subscription.'

export default defineComponent({
  name: 'TOS',
  head: () => {
    return {
      title,
      meta: getMetadata(title, description, process.env.baseUrl + '/tos'),
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
