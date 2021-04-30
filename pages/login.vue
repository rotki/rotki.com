<template>
  <login-form />
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  head: () => {
    return {
      title: 'Rotki: Login',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Manage your rotki premium account',
        },
      ],
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
