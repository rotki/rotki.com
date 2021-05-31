<template>
  <terms-of-service />
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
  name: 'TOS',
  head: () => {
    return {
      title: 'Rotki: Terms of service',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content:
            'The terms and conditions outline the rules and regulations for the use of rotki.com Website and all services offered in the Premium Rotki subscription.',
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
