<template>
  <password-form />
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  head: () => {
    return {
      title: 'Rotki: Reset Password',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Reset your rotki password',
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
