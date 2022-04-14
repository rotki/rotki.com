<template>
  <login-page />
</template>

<script lang="ts">
import { defineComponent, useMeta } from '@nuxtjs/composition-api'
import { useMainStore } from '~/store'
import { commonAttrs } from '~/utils/metadata'

export default defineComponent({
  name: 'Login',
  beforeRouteEnter: (_to, _from, next) => {
    const store = useMainStore()
    if (store.account) {
      next('/home')
    } else {
      next()
    }
  },
  middleware: 'maintenance',
  setup() {
    useMeta({
      title: 'login | rotki',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Manage your rotki premium account',
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
