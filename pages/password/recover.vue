<template>
  <password-form />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs } from '~/utils/metadata'

export default defineComponent({
  middleware: 'maintenance',
  setup() {
    useMeta({
      title: 'password recovery | rotki',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Recover your rotki.com account password',
        },
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
