<template>
  <password-form />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs, noIndex } from '~/utils/metadata'

export default defineComponent({
  middleware: 'maintenance',
  setup() {
    useMeta({
      title: 'Rotki: Recover password',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Recover your rotki.com account password',
        },
        noIndex(),
      ],
      ...commonAttrs(),
    })
  },
  head: {},
})
</script>

<style lang="scss">
@import '~~/assets/css/main';
</style>
