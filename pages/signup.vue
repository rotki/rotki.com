<template>
  <signup-form />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { commonAttrs } from '~/utils/metadata'

export default defineComponent({
  name: 'Signup',
  middleware: 'maintenance',
  setup() {
    useMeta({
      title: 'signup | rotki',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Create a new rotki premium account',
        },
      ],
      ...commonAttrs(),
    })
  },
  head: {},
})
</script>

<style lang="scss">
@import '~assets/css/main';
</style>
